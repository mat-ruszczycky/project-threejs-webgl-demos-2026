// STYLE(S)
// -------------------------
import "./../../styles/app.scss";

// APP
// -------------------------
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";
import GUI from "lil-gui";
import { Pane } from "tweakpane";

// =========================
// CORE - ECS
// =========================
let nextEntityId = 0;
const createEntity = () => nextEntityId++;

const Components = {
  Mesh: new Map(),
  Input: new Map(),
  Player: new Set(),
};

const getEntities = (component) => {
  if (component instanceof Map) return component.keys();
  if (component instanceof Set) return component.values();
  throw new Error("Invalid component");
};

const query = (...components) => {
  const [first, ...rest] = components;
  const result = [];

  for (const e of getEntities(first)) {
    let ok = true;

    for (const c of rest) {
      if (c instanceof Map && !c.has(e)) ok = false;
      if (c instanceof Set && !c.has(e)) ok = false;
    }

    if (ok) result.push(e);
  }

  return result;
};

// =========================
// CORE - DEBUG
// =========================
// Lil GUI - https://github.com/georgealways/lil-gui
// const gui = new GUI();
// gui.title("Debugger");
// gui.close();

// Tweakplane - https://github.com/cocopon/tweakpane
const pane = new Pane({ title: "Debugger" });

const createStat = (panelID = "fps", styles = "top:0px;left:0;") => {
  const panelMap = { fps: 0, ms: 1, mb: 2 };
  const panelType = panelMap[panelID];
  const stat = new Stats();

  stat.showPanel(panelType);
  stat.dom.style.cssText = `position:absolute;${styles}`;
  document.body.appendChild(stat.dom);

  return stat;
};

const statFPS = createStat("fps", "top:0px;left:0;");
const statMS = createStat("ms", "top:48px;left:0;");
const statMB = createStat("mb", "top:96px;left:0;");

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

// =========================
// CORE - THREE
// =========================
const canvas = document.querySelector("#webgl");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

const clearColor = new THREE.Color(0x1a1a1a);

const scene = new THREE.Scene();
scene.background = clearColor;
scene.fog = new THREE.Fog(clearColor, 1, 30);

scene.add(new THREE.GridHelper(250, 100));
scene.add(new THREE.AxesHelper(5));

const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  100
);

camera.position.set(6, 6, 6);
camera.lookAt(0, 0, 0);

scene.add(camera);

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
scene.add(new THREE.DirectionalLight());

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = false;

// =========================
// CORE - GAME STATE(S) (PAUSE)
// =========================
const GameState = {
  paused: false,
};

const togglePause = () => {
  GameState.paused = !GameState.paused;
  document.body.classList.toggle("paused", GameState.paused);
};

// =========================
// CORE - RAW INPUT
// =========================
const rawInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
};

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    togglePause();
    return;
  }

  if (GameState.paused) return;

  if (e.key === "w") rawInput.forward = true;
  if (e.key === "s") rawInput.backward = true;
  if (e.key === "a") rawInput.left = true;
  if (e.key === "d") rawInput.right = true;
  if (e.key === " ") rawInput.jump = true;
});

window.addEventListener("keyup", (e) => {
  if (GameState.paused) return;

  if (e.key === "w") rawInput.forward = false;
  if (e.key === "s") rawInput.backward = false;
  if (e.key === "a") rawInput.left = false;
  if (e.key === "d") rawInput.right = false;
});

// =========================
// ENTITY: PLAYER
// =========================
const player = createEntity();
Components.Player.add(player);

Components.Input.set(player, {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
});

const mesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 32, 32),
  new THREE.MeshStandardMaterial({ roughness: 0.6 })
);

mesh.position.y = 0.5;
scene.add(mesh);
Components.Mesh.set(player, mesh);

// =========================
// SYSTEMS
// =========================
const InputSystem = () => {
  if (GameState.paused) return;

  for (const e of Components.Input.keys()) {
    const input = Components.Input.get(e);
    input.forward = rawInput.forward;
    input.backward = rawInput.backward;
    input.left = rawInput.left;
    input.right = rawInput.right;
    input.jump = rawInput.jump;
  }

  rawInput.jump = false;
};

const RenderSystem = () => {
  controls.update();
  renderer.render(scene, camera);
};

// =========================
// RENDER LOOP
// =========================
const render = () => {
  requestAnimationFrame(render);
  beginStats();

  InputSystem();
  RenderSystem();

  endStats();
};

requestAnimationFrame(render);
