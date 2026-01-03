// STYLE(S)
// -------------------------
import "./../styles/app.scss";

// APP
// -------------------------
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";
import GUI from "lil-gui";
import { Pane } from "tweakpane";

// GLOBAL(S)
// -------------------------
let isPaused = false;
let lastTime = performance.now();
let delta = 0;

// DEBUG
// -----------------------------------------------------
// Lil GUI - https://github.com/georgealways/lil-gui
// const gui = new GUI();
// gui.title("Debugger");
// gui.close();

// Tweakplane - https://github.com/cocopon/tweakpane
const pane = new Pane({ title: "Debugger" });

// Stats - https://github.com/mrdoob/stats.js
const createStat = (panelType = 0, topPosition = "0px") => {
  const stat = new Stats();

  stat.showPanel(panelType);
  stat.dom.style.cssText = `position:absolute;top:${topPosition};left:0;`;
  document.body.appendChild(stat.dom);

  return stat;
};

const statFPS = createStat(0, "0px");
const statMS = createStat(1, "48px");
const statMB = createStat(2, "96px");

const beginStats = () => {
  statFPS.begin();
  statMS.begin();
  statMB.begin();
};

const endStats = () => {
  statFPS.end();
  statMS.end();
  statMB.end();
};

// RENDERER
// -------------------------
const canvas = document.querySelector("#webgl");
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  powerPreference: "high-performance",
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x1a1a1a);

// SCENE(S)
// -------------------------
const scene = new THREE.Scene();

// HELPER(S)
// -------------------------
const grid = new THREE.GridHelper(100, 75, 0xeeeeee, 0x666666);
scene.add(grid);

const axis = new THREE.AxesHelper(5.5);
scene.add(axis);

// OBJECT(S)
// -------------------------
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 32, 32),
  new THREE.MeshStandardMaterial({ roughness: 0.7 })
);

sphere.position.y = sphere.geometry.parameters.radius;
scene.add(sphere);

// LIGHT(S)
// -------------------------
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// CAMERA(S)
// -------------------------
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 5;
scene.add(camera);

// CONTROL(S)
// -------------------------
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = false;

// HANDLER(S)
// -------------------------
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// KEYBOARD INPUT
// -------------------------
window.addEventListener("keydown", (e) => {
  if (isPaused && e.key !== "Escape") return;

  switch (e.key) {
    case "Escape":
      togglePause();
      break;
  }
});

// PAUSE
// -------------------------
function togglePause() {
  isPaused = !isPaused;
  document.body.classList.toggle("paused", isPaused);

  if (!isPaused) {
    lastTime = performance.now();
    accumulator = 0;
    inputState.jump = false;
    inputState.src = null;
  }
}

// RENDER LOOP
// -------------------------
function render(now) {
  requestAnimationFrame(render);
  beginStats();

  if (isPaused) {
    lastTime = now;
    endStats();
    return;
  }

  // Delta Time Pattern
  delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  controls.update();

  renderer.render(scene, camera);

  endStats();
}

requestAnimationFrame(render);
