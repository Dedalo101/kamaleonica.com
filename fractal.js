const canvas = document.getElementById('fractalCanvas');
const gl = canvas.getContext('webgl');

let width = 0;
let height = 0;
let startTime = performance.now();
let mouseX = 0.5;
let mouseY = 0.5;
let mandalaState = 0;

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
uniform float u_state;

vec3 palette(float t) {
  vec3 a = vec3(1.0, 0.0, 0.66);
  vec3 b = vec3(0.07, 0.73, 0.78);
  vec3 c = vec3(0.83, 0.69, 0.14);
  vec3 d = vec3(0.31, 0.13, 0.48);
  float w = smoothstep(0.0, 1.0, t);
  return mix(mix(a, b, fract(t * 2.0)), mix(c, d, fract(t * 1.0)), w) * (0.8 + 0.2 * sin(t * 12.0));
}

float stripes(vec2 p, float frequency) {
  float angle = atan(p.y, p.x);
  float value = abs(sin((p.x + p.y * 0.4) * frequency + angle * 3.0));
  return smoothstep(0.38, 0.42, value);
}

float overlapCircle(vec2 p, float radius, float width) {
  return smoothstep(radius + width, radius, length(p));
}

float mandalaShape(vec2 uv, float a, float r, float time, float state) {
  float shape = 0.0;
  if (state < 0.5) {
    float rings = sin(r * 20.0 - time * 4.0 + sin(a * 8.0 + time * 1.8) * 0.4);
    float petals = abs(sin(a * 6.0 + time * 1.5 + r * 3.0));
    shape = smoothstep(0.18, 0.15, abs(petals - 0.35) * 0.9 + rings * 0.25);
  } else if (state < 1.5) {
    float spiral = sin(r * 15.0 - time * 3.6 + a * 7.0);
    float petals = abs(cos(a * 8.0 + r * 4.0 - time * 2.2));
    shape = smoothstep(0.24, 0.20, petals * 0.8 + spiral * 0.4 + overlapCircle(uv, 0.18, 0.02));
  } else if (state < 2.5) {
    float star = abs(cos(a * 10.0) * cos(r * 7.0 + time * 1.1));
    float grid = abs(sin((uv.x + uv.y) * 10.0 + time * 1.8)) * 0.35;
    shape = smoothstep(0.22, 0.18, star * 0.85 + grid);
  } else {
    float petals = abs(sin(a * 12.0 + r * 5.0 - time * 2.5));
    float halo = smoothstep(0.40, 0.36, abs(sin(a * 16.0 + time * 2.0)) + r * 0.78);
    shape = smoothstep(0.20, 0.16, petals * 0.7 + halo * 0.5 + overlapCircle(uv, 0.12, 0.01));
  }
  return clamp(shape, 0.0, 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  float time = u_time * 0.0008;
  vec2 mouse = (u_mouse - 0.5) * 2.0;
  float r = length(uv);
  float a = atan(uv.y, uv.x);
  float state = floor(mod(u_state, 4.0) + 0.5);

  vec3 colorA = palette(r * 1.1 + time);
  vec3 colorB = palette(a * 0.16 + 0.25 + time);
  vec3 colorC = palette(0.5 + sin(time * 1.25) * 0.2);

  vec3 base = mix(colorA, colorB, 0.45 + 0.45 * sin(time * 1.3));
  vec3 glow = mix(colorC, vec3(1.0, 0.8, 0.45), smoothstep(0.7, 0.4, r));

  float mandala = mandalaShape(uv, a, r, time, state);
  float aura = smoothstep(0.56, 0.50, abs(sin(a * 8.0 + time * 1.2)) + r * 0.8);

  vec3 color = mix(base * 0.24, glow, mandala * 0.92 + 0.08);
  color += vec3(0.10, 0.06, 0.18) * (1.0 - r);
  color += vec3(0.18, 0.04, 0.28) * aura * 0.28;
  color += vec3(0.12, 0.06, 0.18) * mandala * 0.22;
  color *= 1.0 - smoothstep(0.92, 1.0, r);

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
  const stateLocation = gl.getUniformLocation(program, 'u_state');

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
    gl.uniform1f(stateLocation, mandalaState);

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

canvas.addEventListener('click', () => {
  mandalaState = (mandalaState + 1) % 4;
});

canvas.addEventListener('touchend', () => {
  mandalaState = (mandalaState + 1) % 4;
});

resizeCanvas();
