// utils/drawHand.js

export const drawHand = (predictions, ctx) => {
  if (predictions.length > 0) {
    const canvasWidth = ctx.canvas.width;
    ctx.fillStyle = "blue"; // Set the fill style once
    predictions.forEach((prediction) => {
      const landmarks = prediction.landmarks;
      landmarks.forEach(([x, y]) => {
        // Flip the X-coordinate to match the mirrored webcam
        const mirroredX = canvasWidth - x;
        ctx.beginPath();
        ctx.arc(mirroredX, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  }
};
