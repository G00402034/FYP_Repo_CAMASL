import os
import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import Optional
from pydantic import BaseModel
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
import logging
import base64


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request path: {request.url.path}, Method: {request.method}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

# Initialize MediaPipe
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.5
)

# Model configuration
MODEL_PATH = "C:/Users/sean1/OneDrive - Atlantic TU/Year 4/PROJ ENGINEERING/asl-recogntion-app_Presentation/public/model/best_asl_model.h5"
IMAGE_SIZE = (224, 224)

# Verify model file exists
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

# Load model with error handling
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    raise RuntimeError(f"Failed to load model: {e}")

# ASL class labels
ASL_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
               'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
               'W', 'X', 'Y', 'Z']

# Pydantic model for JSON payload
class PredictRequest(BaseModel):
    image: str
    target_sign: Optional[str] = None

def extract_hand_region(image):
    try:
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb_image)

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                h, w = image.shape[:2]
                x_coords = [lm.x * w for lm in hand_landmarks.landmark]
                y_coords = [lm.y * h for lm in hand_landmarks.landmark]

                hand_size = max(max(x_coords) - min(x_coords), max(y_coords) - min(y_coords))
                padding = int(0.3 * hand_size)

                x_min = max(0, int(min(x_coords)) - padding)
                x_max = min(w, int(max(x_coords)) + padding)
                y_min = max(0, int(min(y_coords)) - padding)
                y_max = min(h, int(max(y_coords)) + padding)

                hand_region = image[y_min:y_max, x_min:x_max]

                if hand_region.shape[0] < 50 or hand_region.shape[1] < 50:
                    logger.warning("Hand region too small")
                    return None

                return hand_region
        logger.info("No hand landmarks detected")
        return None
    except Exception as e:
        logger.error(f"Error in extract_hand_region: {e}")
        raise

@app.post("/predict")
async def predict_asl(request: PredictRequest):
    try:
        # Decode base64 image
        image_data = base64.b64decode(request.image)
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame is None:
            logger.error("Failed to decode image")
            raise ValueError("Invalid image data")

        # Process frame
        hand_region = extract_hand_region(frame)
        if hand_region is None:
            logger.info("Returning no hand detected response")
            return {
                "predictedSign": "No hand detected",
                "confidence": 0,
                "isCorrect": False
            }

        # Prepare image for model
        resized = cv2.resize(hand_region, IMAGE_SIZE, interpolation=cv2.INTER_CUBIC)
        rgb_image = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        normalized = preprocess_input(rgb_image)

        input_tensor = np.expand_dims(normalized, axis=0)

        # Get prediction
        predictions = model.predict(input_tensor, verbose=0)[0]
        predicted_class = np.argmax(predictions)
        predicted_letter = ASL_LETTERS[predicted_class]
        confidence = float(predictions[predicted_class])

        # Calculate correctness
        confidence_threshold = 0.1
        is_correct = False
        if request.target_sign:
            is_correct = (predicted_letter.upper() == request.target_sign.upper() and
                         confidence >= confidence_threshold)

        logger.info(f"Prediction: {predicted_letter}, Confidence: {confidence}, IsCorrect: {is_correct}")
        return {
            "predictedSign": predicted_letter,
            "confidence": confidence,
            "isCorrect": is_correct,
            "threshold": confidence_threshold
        }
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)