const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// Draw shapes
ctx.fillStyle = "blue";
ctx.fillRect(50, 50, 150, 100);

ctx.beginPath();
ctx.arc(300, 150, 50, 0, 2 * Math.PI);
ctx.fillStyle = "green";
ctx.fill();
ctx.stroke();

ctx.beginPath();
ctx.moveTo(100, 250);
ctx.lineTo(400, 250);
ctx.strokeStyle = "red";
ctx.lineWidth = 3;
ctx.stroke();

ctx.font = "30px Arial";
ctx.fillStyle = "purple";
ctx.fillText("Hello Canvas", 100, 400);

let x = 0;
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "orange";
  ctx.fillRect(x, 200, 50, 50);
  x += 1;
  if (x > canvas.width) x = 0;
  requestAnimationFrame(animate);
}

animate();
