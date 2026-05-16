const canvas = document.getElementById('fractalCanvas');
const gl = canvas.getContext('webgl');

let width = 0;
let height = 0;
let startTime = performance.now();
let mouseX = 0.5;
let mouseY = 0.5;

const vertexSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const fragmentSource = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

vec3 palette(float t) {
  vec3 a = vec3(1.0, 0.0, 0.66);
  vec3 b = vec3(0.07, 0.73, 0.78);
  vec3 c = vec3(0.83, 0.69, 0.14);
  vec3 d = vec3(0.31, 0.13, 0.48);
  vec3 e = vec3(0.95, 0.55, 0.90);
  float w = smoothstep(0.0, 1.0, t);
  return mix(mix(a, b, fract(t * 2.0)), mix(c, d, fract(t * 1.0)), w) * (0.8 + 0.2 * sin(t * 12.0));
}

float ring(float r, float width, float intensity) {
  return smoothstep(width + intensity, width, abs(r - width));
}

float stripes(vec2 p, float frequency) {
  float angle = atan(p.y, p.x);
  float value = abs(sin((p.x + p.y * 0.4) * frequency + angle * 3.0));
  return smoothstep(0.38, 0.42, value);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  float time = u_time * 0.0008;
  vec2 mouse = (u_mouse - 0.5) * 2.0;
  float r = length(uv);
  float a = atan(uv.y, uv.x);

  float rings = sin(r * 20.0 - time * 4.0 + sin(a * 8.0 + time * 1.8) * 0.4);
  float petals = abs(sin(a * 6.0 + time * 1.5 + r * 3.0));
  float pulse = 0.5 + 0.5 * sin(time * 2.0 + r * 6.0);
  float dome = smoothstep(0.75, 0.72, r + 0.08 * sin(time + a * 4.0));
  float core = smoothstep(0.18, 0.16, r);
  float zebra = stripes(uv + vec2(sin(time * 0.5), cos(time * 0.3)) * 0.12, 24.0);

  vec3 colorA = palette(r * 1.2 + time);
  vec3 colorB = palette(a * 0.14 + 0.2 + time);
  vec3 colorC = palette(pulse + 0.4);

  vec3 base = mix(colorA, colorB, 0.5 + 0.5 * sin(time * 1.3));
  vec3 glow = mix(colorC, vec3(1.0, 0.7, 0.2), dome);

  float mandala = smoothstep(0.18, 0.15, abs(petals - 0.35) * 0.9 + rings * 0.25);
  float aura = smoothstep(0.54, 0.50, abs(sin(a * 8.0 + time * 1.2)) + r * 0.8);

  vec3 color = mix(base * 0.26, glow, dome * 0.8 + 0.2);
  color += vec3(0.12, 0.08, 0.18) * (1.0 - r);
  color += vec3(0.22, 0.06, 0.35) * aura * 0.28;
  color = mix(color, vec3(1.0, 0.9, 0.74), mandala * 0.18);
  color += zebra * 0.08;
  color *= 1.0 - smoothstep(0.9, 1.0, r);

  gl_FragColor = vec4(color, 1.0);
}`;

function resizeCanvas() {
  width = canvas.width = window.innerWidth;
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  height = canvas.height = Math.floor(vh);
  if (gl) {
    gl.viewport(0, 0, width, height);
  }
}

if (!gl) {
  console.warn('WebGL not supported, background animation will be simplified.');
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(width * 0.5, height * 0.4, 0, width * 0.5, height * 0.4, Math.max(width, height) * 0.7);
  gradient.addColorStop(0, 'rgba(255, 0, 170, 0.18)');
  gradient.addColorStop(1, 'rgba(9, 2, 15, 0.92)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
} else {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentSource);
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(fragmentShader));
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
  }

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
  const timeLocation = gl.getUniformLocation(program, 'u_time');
  const mouseLocation = gl.getUniformLocation(program, 'u_mouse');

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  function render() {
    const now = performance.now();
    const t = now - startTime;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(resolutionLocation, width, height);
    gl.uniform1f(timeLocation, t);
    gl.uniform2f(mouseLocation, mouseX * width, (1.0 - mouseY) * height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

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

resizeCanvas();
