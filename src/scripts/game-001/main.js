// -------------------------
// STYLE(S)
// -------------------------
import "./../../styles/app.scss";

// -------------------------
// APP
// -------------------------
import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { Pane } from "tweakpane";

// -------------------------
// CORE - ECS
// -------------------------
const createEntity = () => self.crypto.randomUUID();

const Components = {
  Mesh: new Map(),
  Physics: new Map(),
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

// -------------------------
// CORE - DEBUG
// -------------------------
// Tweakplane - https://github.com/cocopon/tweakpane
const PARAMS = {
  paused: false,
};
const pane = new Pane({ title: "Debugger" });

pane.addBinding(PARAMS, "paused", { label: "Paused" }).on("change", (ev) => {
  togglePause();
});

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

// -------------------------
// CORE - THREE
// -------------------------
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

scene.add(camera);

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
scene.add(new THREE.DirectionalLight());

// -------------------------
// CORE - PHYSICS
// -------------------------
const Rapier = await import("@dimforge/rapier3d");
const world = new Rapier.World({ x: 0, y: -30, z: 0 });

world.createCollider(
  Rapier.ColliderDesc.cuboid(125, 0.1, 125).setFriction(0.8).setRestitution(0.2)
);

// -------------------------
// CORE - GAME STATE(S) (PAUSE)
// -------------------------
const GameState = {
  paused: false,
};

const togglePause = () => {
  GameState.paused = !GameState.paused;
  document.body.classList.toggle("paused", GameState.paused);
};

// -------------------------
// CORE - RAW INPUT
// -------------------------
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

// -------------------------
// ENTITY: PLAYER
// -------------------------
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

mesh.position.y = 6;
scene.add(mesh);
Components.Mesh.set(player, mesh);

const body = world.createRigidBody(
  Rapier.RigidBodyDesc.dynamic().setTranslation(0, 6, 0).setLinearDamping(0.5)
);

world.createCollider(
  Rapier.ColliderDesc.ball(0.5).setFriction(0.6).setRestitution(0.2),
  body
);

Components.Physics.set(player, body);

// -------------------------
// SYSTEMS
// -------------------------
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

const MovementSystem = () => {
  if (GameState.paused) return;

  for (const e of query(Components.Input, Components.Physics)) {
    const input = Components.Input.get(e);
    const body = Components.Physics.get(e);
    const impulse = { x: 0, y: 0, z: 0 };

    if (input.forward) impulse.z -= 1;
    if (input.backward) impulse.z += 1;
    if (input.left) impulse.x -= 1;
    if (input.right) impulse.x += 1;
    if (input.jump) impulse.y += 7;

    if (impulse.x || impulse.y || impulse.z) {
      body.applyImpulse(impulse, true);
    }
  }
};

const PhysicsSystem = () => {
  if (GameState.paused) return;
  world.step();
};

const RenderSystem = () => {
  for (const e of query(Components.Mesh, Components.Physics)) {
    const mesh = Components.Mesh.get(e);
    const body = Components.Physics.get(e);
    const pos = body.translation();

    mesh.position.set(pos.x, pos.y, pos.z);

    if (Components.Player.has(e)) {
      camera.position.set(pos.x + 6, 6, pos.z + 6);
      camera.lookAt(pos.x, pos.y, pos.z);
    }

    if (pos.y < -10) {
      body.setTranslation({ x: 0, y: 10, z: 0 }, true);
    }
  }

  renderer.render(scene, camera);
};

// -------------------------
// RENDER LOOP
// -------------------------
const render = () => {
  requestAnimationFrame(render);

  if (GameState.paused) return;

  beginStats();
  InputSystem();
  MovementSystem();
  PhysicsSystem();
  RenderSystem();
  endStats();
};

requestAnimationFrame(render);
window.comps = Components;
