// Import TensorFlow.js and its WebGL backend.
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

// Set the backend to WebGL and then load the model.
tf.setBackend("webgl")
  .then(() => {
    console.log("Worker: TF backend set to WebGL");
    // Construct an absolute URL for the model.
    const modelURL = self.location.origin + "/model/model.json";
    return tf.loadLayersModel(modelURL);
  })
  .then((loadedModel) => {
    self.model = loadedModel;
    console.log("Worker: Model loaded");
    // Optionally, warm up the model:
    tf.tidy(() => {
      const dummy = tf.zeros([1, 224, 224, 3]);
      loadedModel.predict(dummy);
    });
    // Notify the main thread that the model is ready.
    self.postMessage({ status: "modelLoaded" });
  })
  .catch((err) => {
    console.error("Worker: Error loading model:", err);
    self.postMessage({ status: "modelError", error: err.message });
  });

// Listen for messages from the main thread.
self.addEventListener("message", async (e) => {
  if (e.data.command === "predict") {
    if (!self.model) {
      self.postMessage({ predictedSign: "Unknown", status: "notReady" });
      return;
    }
    try {
      const imageBitmap = e.data.imageBitmap;
      // Preprocess the image: convert ImageBitmap to a tensor, resize, normalize.
      const imgTensor = tf.browser.fromPixels(imageBitmap)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(255.0)
        .expandDims(); // Shape: [1, 224, 224, 3]
      
      const predictions = self.model.predict(imgTensor);
      const predictionsArray = predictions.dataSync();
      const predictedIndex = predictionsArray.indexOf(Math.max(...predictionsArray));
      const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
      const predictedSign = labels[predictedIndex] || "Unknown";
      
      console.log("Worker: Computed sign:", predictedSign);
      self.postMessage({ predictedSign });
      
      tf.dispose([imgTensor, predictions]);
    } catch (err) {
      console.error("Worker: Prediction error:", err);
      self.postMessage({ status: "predictError", error: err.message });
    }
  }
});
