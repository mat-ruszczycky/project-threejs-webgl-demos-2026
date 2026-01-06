// STYLE(S)
// -------------------------
import "./../styles/app.scss";

// APP
// -------------------------
import * as THREE from "three";

// GLOBAL(S)
// -------------------------
let isPaused = false;
let clock = new THREE.Clock();
let delta = 0;
let accumulator = 0;

const FIXED_TIMESTEP = 1 / 60;
const MAX_SUBSTEPS = 5;

// INPUT STATE
// -------------------------
const inputState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  src: null,
};

// CORE - DEBUG
// -------------------------
import { World } from "./core-001/world";
import { initDebugger } from "./core-001/debug";

const debug = initDebugger(World);

// RENDERER
// -------------------------
const canvas = document.querySelector("#webgl");
const clearColor = new THREE.Color(0x1a1a1a);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(clearColor);

// SCENE
// -------------------------
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(clearColor, 1, 30);

// HELPERS
// -------------------------
scene.add(new THREE.GridHelper(250, 100, 0xeeeeee, 0x666666));
scene.add(new THREE.AxesHelper(5.5));

// OBJECTS
// -------------------------
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 32, 32),
  new THREE.MeshStandardMaterial({ roughness: 0.7 })
);

sphere.position.y = 6;
scene.add(sphere);

// LIGHTS
// -------------------------
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
scene.add(new THREE.DirectionalLight());

// CAMERA
// -------------------------
const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  100
);
scene.add(camera);

// RESIZE
// -------------------------
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
});

// KEYBOARD INPUT
// -------------------------
addEventListener("keydown", (e) => {
  if (isPaused && e.key !== "Escape") return;

  switch (e.key) {
    case "w":
      inputState.forward = true;
      break;
    case "s":
      inputState.backward = true;
      break;
    case "a":
      inputState.left = true;
      break;
    case "d":
      inputState.right = true;
      break;
    case " ":
      inputState.jump = true;
      inputState.src = "keypad";
      break;
    case "Escape":
      togglePause();
      break;
  }
});

addEventListener("keyup", () => {
  inputState.forward = false;
  inputState.backward = false;
  inputState.left = false;
  inputState.right = false;
  inputState.jump = false;
});

// GAMEPAD INPUT
// -------------------------
const updateGamepadInput = () => {
  if (isPaused) return;

  const gp = navigator.getGamepads()?.[0];
  if (!gp) return;

  inputState.forward = gp.buttons[12]?.pressed || gp.axes[1] < -0.5;
  inputState.backward = gp.buttons[13]?.pressed || gp.axes[1] > 0.5;
  inputState.left = gp.buttons[14]?.pressed || gp.axes[0] < -0.5;
  inputState.right = gp.buttons[15]?.pressed || gp.axes[0] > 0.5;
  inputState.jump = gp.buttons[0]?.pressed;
  inputState.src = "gamepad";
};

// PHYSICS (Rapier)
// -------------------------
const Rapier = await import("@dimforge/rapier3d");
const world = new Rapier.World({ x: 0, y: -9.81, z: 0 });
const eventQueue = new Rapier.EventQueue(true);
world.timestep = FIXED_TIMESTEP;

// Ground
world.createCollider(
  Rapier.ColliderDesc.cuboid(125, 0.1, 125)
    .setFriction(0.8)
    .setRestitution(0.15)
);

// Sphere
const rigidBody = world.createRigidBody(
  Rapier.RigidBodyDesc.dynamic()
    .setGravityScale(5, true)
    .setTranslation(0, sphere.position.y, 0)
    .setLinearDamping(0.5)
    .setCanSleep(true)
);

world.createCollider(
  Rapier.ColliderDesc.ball(sphere.geometry.parameters.radius)
    .setFriction(0.6)
    .setRestitution(0.96),
  rigidBody
);

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
function animate(now) {
  requestAnimationFrame(animate);

  debug.begin();

  if (isPaused) {
    lastTime = now;
    debug.end();
    return;
  }

  const delta = clock.getDelta();

  updateGamepadInput();

  const dir = { x: 0, y: 0, z: 0 };
  const force = 0.2;

  if (inputState.forward) dir.z -= force;
  if (inputState.backward) dir.z += force;
  if (inputState.left) dir.x -= force;
  if (inputState.right) dir.x += force;

  if (inputState.jump) {
    dir.y += inputState.src === "keypad" ? 5 : 0.5;
    inputState.jump = false;
    inputState.src = null;
  }

  if (dir.x || dir.y || dir.z) {
    rigidBody.applyImpulse(dir, true);
  }

  accumulator += delta;
  let steps = 0;

  while (accumulator >= FIXED_TIMESTEP && steps < MAX_SUBSTEPS) {
    world.step(eventQueue);
    accumulator -= FIXED_TIMESTEP;
    steps++;
  }

  let pos = rigidBody.translation();

  if (pos.y <= -10) {
    rigidBody.setTranslation({ x: 6, y: 10, z: 6 }, true);
    accumulator = 0;
    pos = rigidBody.translation();
  }

  sphere.position.set(pos.x, pos.y, pos.z);
  camera.position.set(pos.x + 6, 6, pos.z + 6);
  camera.lookAt(pos.x, pos.y, pos.z);

  renderer.render(scene, camera);

  debug.end();
}

// START
// -------------------------
requestAnimationFrame(animate);
