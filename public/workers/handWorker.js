importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs'); // Import TensorFlow.js

if (typeof tf !== 'undefined') {
  postMessage({ status: 'tfVersion', version: tf.version });
} else {
  console.error('TensorFlow.js is not loaded properly in the worker!');
  postMessage({ status: 'workerError', error: 'TensorFlow.js not loaded' });
}

let model;

// Global error handling 
self.addEventListener('error', (event) => {
  console.error("Worker error:", event.message);
  postMessage({ status: 'workerError', error: event.message });
});

self.addEventListener('unhandledrejection', (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  postMessage({ status: 'workerError', error: event.reason });
});

async function loadModel() {
  try {
    console.log("Starting to load model...");

    
    const modelLoadTimeout = setTimeout(() => {
      postMessage({ status: 'modelError', error: 'Model loading took too long' });
    }, 60000); // Timeout after 60 seconds

    
    const modelPath = '/model/model.json';
    console.log(`Attempting to load model from ${modelPath}`);

    const response = await fetch(modelPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch model JSON. Status: ${response.status}`);
    }
    const modelJson = await response.json();
    console.log("Model JSON loaded:", modelJson);

    // Manually load the weight files 
    const weightPaths = [
      '/model/group1-shard1of4.bin',
      '/model/group1-shard2of4.bin',
      '/model/group1-shard3of4.bin',
      '/model/group1-shard4of4.bin',
    ];

    for (let path of weightPaths) {
      console.log(`Attempting to load weight file: ${path}`);
      const weightResponse = await fetch(path);
      if (weightResponse.ok) {
        console.log(`Weight file ${path} loaded successfully.`);
      } else {
        console.error(`Error loading weight file ${path}. Status: ${weightResponse.status}`);
      }
    }

    console.log("Attempting to load model using TensorFlow.js...");
    model = await tf.loadGraphModel(modelPath); 

    if (model) {
      console.log("Model loaded successfully.");
    } else {
      throw new Error("Model is null or undefined after loading.");
    }

    clearTimeout(modelLoadTimeout); 
    postMessage({ status: 'modelLoaded' });

  } catch (error) {
    console.error("Model load error:", error);
    postMessage({ status: 'modelError', error: error.message });
  }
}

onmessage = (e) => {
  const data = e.data;

  if (data.command === 'predict' && model) {
    predictGesture(data.imageBitmap);
  } else if (data.command === 'loadModel' && !model) {
    console.log("Model not loaded. Loading model now...");
    loadModel();
  } else if (data.command === 'predict' && !model) {
    postMessage({ status: 'modelError', error: 'Model is not loaded yet' });
  }
};

async function predictGesture(imageBitmap) {
  try {
    if (!imageBitmap) {
      throw new Error("No image bitmap received for prediction.");
    }

    console.log("Preprocessing the image...");
    // Preprocess the image
    const tensor = tf.browser.fromPixels(imageBitmap).resizeNearestNeighbor([224, 224]).toFloat().expandDims();

    console.log("Making prediction...");
    // Make the prediction
    const prediction = await model.predict(tensor).data();
    console.log("Prediction made successfully:", prediction);

    // Send prediction result back to the main thread
    postMessage({ predictedSign: prediction });
  } catch (error) {
    console.error("Prediction error:", error);
    postMessage({ status: 'predictionError', error: error.message });
  }
}
