const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');

let width;
let height;
let time = 0;
let mouseX = 0.5;
let mouseY = 0.5;

const palette = ['#FF00AA', '#E91E63', '#D4AF37', '#13B9C8', '#4E217B', '#F7C57E'];

function resizeCanvas() {
  width = canvas.width = window.innerWidth;
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  height = canvas.height = Math.floor(vh);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resizeCanvas);
  window.visualViewport.addEventListener('scroll', resizeCanvas);
}

document.addEventListener('mousemove', (event) => {
  mouseX = event.clientX / width;
  mouseY = event.clientY / height;
});

document.addEventListener('touchmove', (event) => {
  if (event.touches.length > 0) {
    mouseX = event.touches[0].clientX / width;
    mouseY = event.touches[0].clientY / height;
  }
});

function drawGlow() {
  const gradient = ctx.createRadialGradient(width * 0.5, height * 0.35, 0, width * 0.5, height * 0.35, Math.max(width, height) * 0.7);
  gradient.addColorStop(0, 'rgba(255, 0, 170, 0.18)');
  gradient.addColorStop(0.35, 'rgba(19, 185, 200, 0.14)');
  gradient.addColorStop(0.75, 'rgba(212, 175, 55, 0.06)');
  gradient.addColorStop(1, 'rgba(9, 2, 15, 0.92)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawMandalaLayer(radius, count, lineWidth, opacity, hueOffset, twist) {
  const centerX = width / 2;
  const centerY = height / 2;
  const rotation = time * twist + mouseX * 0.8 - 0.4;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  ctx.strokeStyle = palette[hueOffset % palette.length];
  ctx.globalAlpha = opacity;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const petal = 1 + Math.sin(time * 0.5 + i) * 0.35;

    ctx.beginPath();
    ctx.moveTo(x * 0.45, y * 0.45);
    ctx.quadraticCurveTo(
      Math.cos(angle + 0.14) * radius * petal,
      Math.sin(angle + 0.14) * radius * petal,
      x,
      y
    );
    ctx.stroke();
  }

  ctx.restore();
}

function drawMandala() {
  const centerX = width / 2;
  const centerY = height / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.beginPath();
  ctx.arc(0, 0, 32 + Math.sin(time * 0.8) * 8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.fill();
  ctx.restore();

  drawMandalaLayer(90, 10, 1.6, 0.24, 0, 0.07);
  drawMandalaLayer(144, 14, 2.2, 0.22, 1, -0.05);
  drawMandalaLayer(210, 18, 2.8, 0.18, 2, 0.1);
  drawMandalaLayer(280, 22, 1.5, 0.14, 3, -0.06);
  drawMandalaLayer(350, 28, 1.1, 0.1, 4, 0.08);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([6, 14]);
  ctx.beginPath();
  ctx.arc(0, 0, 180, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawStripes() {
  const centerX = width / 2;
  const centerY = height / 2;
  const rings = 5;

  for (let ring = 0; ring < rings; ring++) {
    const radius = 120 + ring * 34;
    const slices = 16 + ring * 4;
    const alpha = 0.08 + ring * 0.02;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(time * 0.04 * (ring % 2 ? 1 : -1));
    ctx.strokeStyle = ring % 2 === 0 ? 'rgba(255, 0, 170, 0.18)' : 'rgba(19, 185, 200, 0.14)';
    ctx.lineWidth = 1.1;
    ctx.globalAlpha = alpha;

    for (let i = 0; i < slices; i++) {
      const angle = (i / slices) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        18 + Math.sin(time + ring) * 4,
        angle - 0.05,
        angle + 0.05
      );
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawDome() {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.24;
  const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius * 1.1);

  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
  gradient.addColorStop(0.35, 'rgba(255, 0, 170, 0.14)');
  gradient.addColorStop(0.72, 'rgba(19, 185, 200, 0.08)');
  gradient.addColorStop(1, 'rgba(14, 6, 28, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
}

function animate() {
  time += 0.014;

  ctx.clearRect(0, 0, width, height);
  drawGlow();
  drawDome();
  drawMandala();
  drawStripes();

  requestAnimationFrame(animate);
}

animate();
