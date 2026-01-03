// -------------------------
// STYLE(S)
// -------------------------

import "./../../styles/app.scss";

// -------------------------
// LIB(S)
// -------------------------

import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { Pane } from "tweakpane";

// -----------------------------
// CORE - Entity management
// -----------------------------

// Tracks all live entities.
// Required for cleanup, debugging, and preventing leaks.
const Entities = new Set();

// Creates a new entity identifier.
const createEntity = () => {
  const id = self.crypto.randomUUID();
  Entities.add(id);
  return id;
};

// Destroys an entity and removes it from all component storage.
const destroyEntity = (entity) => {
  if (!Entities.has(entity)) return;

  Entities.delete(entity);

  for (const component of Object.values(Components)) {
    component.delete(entity);
  }
};

// -----------------------------
// CORE - Component storage
// -----------------------------

// Central registry for all component storage.
const Components = Object.freeze({
  Mesh: new Map(),
  Physics: new Map(),
  Input: new Map(),
  Player: new Set(),
});

// -----------------------------
// Component helpers
// -----------------------------

// Returns an iterator of entities contained in a component store.
const getEntities = (component) => {
  if (component instanceof Map) return component.keys();
  if (component instanceof Set) return component.values();
  throw new Error("Invalid component storage (expected Map or Set)");
};

// Checks whether a component store contains an entity.
const hasEntity = (component, entity) => {
  if (component instanceof Map || component instanceof Set) {
    return component.has(entity);
  }
  return false;
};

// Adds a component to an entity.
const addComponent = (component, entity, data) => {
  if (!Entities.has(entity)) {
    throw new Error("Cannot add component to non-existent entity");
  }

  if (component instanceof Map) {
    component.set(entity, data);
    return;
  }

  if (component instanceof Set) {
    component.add(entity);
    return;
  }

  throw new Error("Invalid component storage");
};

// Removes a component from an entity.
const removeComponent = (component, entity) => {
  component.delete(entity);
};

// -----------------------------
// Query system
// -----------------------------

// Finds entities that exist in *all* provided component stores.
const query = (...components) => {
  if (components.length === 0) return [];

  // Sort by size so we iterate the smallest set first
  const sorted = [...components].sort((a, b) => a.size - b.size);
  const [base, ...rest] = sorted;

  const result = [];

  for (const entity of getEntities(base)) {
    // Entity must exist in every remaining component store
    if (rest.every((c) => hasEntity(c, entity))) {
      result.push(entity);
    }
  }

  return result;
};

// -------------------------
// CORE - DEBUG (Tweakplane - https://github.com/cocopon/tweakpane)
// -------------------------

const PARAMS = {
  paused: false,
};

const pane = new Pane({ title: "Debugger" });

pane.addBinding(PARAMS, "paused", { label: "Paused" }).on("change", (e) => {
  togglePause();
});

const navPane = pane.addFolder({
  title: "Navigation",
});

navPane
  .addButton({
    title: "Home",
  })
  .on("click", (e) => {
    window.location.href = "../";
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
const world = new Rapier.World({ x: 0, y: -(9.81 * 2), z: 0 });

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
