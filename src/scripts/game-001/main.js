// STYLE(S)
// -------------------------
import "./../../styles/app.scss";

// APP
// -------------------------
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";
import { Pane } from "tweakpane";

// GLOBAL(S)
// -------------------------
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
const statsFPS = new Stats();
statsFPS.showPanel(0);
statsFPS.dom.style.cssText = "position:absolute;top:0px;left:0px;";
document.body.appendChild(statsFPS.dom);

const statsMS = new Stats();
statsMS.showPanel(1);
statsMS.dom.style.cssText = "position:absolute;top:48px;left:0;";
document.body.appendChild(statsMS.dom);

const statsMB = new Stats();
statsMB.showPanel(2);
statsMB.dom.style.cssText = "position:absolute;top:96px;left:0;";
document.body.appendChild(statsMB.dom);

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

// RENDER LOOP
// -------------------------
function render(now) {
  statsFPS.begin();
  statsMB.begin();
  statsMS.begin();

  // Delta Time Pattern
  delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  controls.update();

  renderer.render(scene, camera);

  statsFPS.end();
  statsMB.end();
  statsMS.end();

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
