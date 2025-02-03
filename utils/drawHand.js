export const drawHand = (predictions, ctx) => {
    if (predictions.length > 0) {
      predictions.forEach((prediction) => {
        const landmarks = prediction.landmarks;
  
        // Flip hand tracking horizontally to match the mirrored webcam
        const canvasWidth = ctx.canvas.width;
  
        for (let i = 0; i < landmarks.length; i++) {
          const [x, y] = landmarks[i];
  
          // Mirror X-coordinate by subtracting from canvas width
          const mirroredX = canvasWidth - x;
  
          ctx.beginPath();
          ctx.arc(mirroredX, y, 5, 0, 3 * Math.PI);
          ctx.fillStyle = "red";
          ctx.fill();
        }
      });
    }
  };
  