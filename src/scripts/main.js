// STYLE(S)
// -------------------------
import "./../styles/app.scss";

// APP
// -------------------------
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";
import GUI from "lil-gui";

// GLOBAL(S)
// -------------------------
let lastTime = performance.now();
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// DEBUG
// -------------------------
// Lil GUI - https://github.com/georgealways/lil-gui
// Tweakplane - https://github.com/cocopon/tweakpane
// Stats - https://github.com/mrdoob/stats.js
// FPS : Frames rendered in the last second (The higher the number the better)
// MS  : Milliseconds needed to render a frame (The lower the number the better)
// MB  : MBytes of allocated memory (Run Chrome with --enable-precise-memory-info)
const gui = new GUI();
const stats = new Stats();
document.body.appendChild(stats.dom);

// RENDERER
// -------------------------
const canvas = document.querySelector("#webgl");
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x1a1a1a);

// SCENE(S)
// -------------------------
const scene = new THREE.Scene();

// HELPER(S)
// -------------------------
const grid = new THREE.GridHelper(10, 20, 0xeeeeee, 0x666666);
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
  sizes.width / sizes.height,
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
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// RENDER LOOP
// -------------------------
function render(now) {
  let delta = (now - lastTime) / 1000;
  lastTime = now;

  delta = Math.min(delta, 0.1);

  controls.update();

  renderer.render(scene, camera);
  stats.update();

  requestAnimationFrame(render);
}

render();
