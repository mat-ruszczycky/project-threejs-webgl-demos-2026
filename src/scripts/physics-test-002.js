/**
  1. Styles
  2. Libraries
  3. World (Global State)
  4. Three.js Core
  5. Physics (Rapier)
     - Init
     - Objects
     - Step
  6. Input
  7. Debug
  8. Bindings
  9. Main Loop
 10. App Bootstrap
 */

/*
 /world.js
/physics.js
/input.js
/render.js
/debug.js
/app.js

 */

// -------------------------
// STYLES
// -------------------------
import "../styles/app.scss";

// -------------------------
// LIBS
// -------------------------
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";
import { Pane } from "tweakpane";

// -------------------------
// WORLD (GLOBAL STATE)
// -------------------------
const World = {
  state: { paused: false },

  input: {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  },

  time: {
    clock: new THREE.Clock(),
    delta: 0,
    accumulator: 0,
    fixedStep: 1 / 60,
    maxSubSteps: 5,
  },

  physics: {
    rapier: null,
    world: null,
    ball: null,
  },

  objects: {},
};

// -------------------------
// THREE CORE
// -------------------------
function initRenderer() {
  const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#webgl"),
    antialias: false,
    powerPreference: "high-performance",
  });

  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(0.25);
  return renderer;
}

function initScene() {
  const bg = new THREE.Color(0x1a1a1a);
  const scene = new THREE.Scene();
  scene.background = bg;
  scene.fog = new THREE.Fog(bg, 1, 30);

  scene.add(new THREE.GridHelper(250, 100));
  scene.add(new THREE.AxesHelper(5));

  return scene;
}

function initCamera() {
  const camera = new THREE.PerspectiveCamera(
    75,
    innerWidth / innerHeight,
    0.1,
    100
  );
  return camera;
}

function initControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enabled = false;
  return controls;
}

function initLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  scene.add(new THREE.DirectionalLight(0xffffff, 1));
}

function createBallMesh(radius = 0.5) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    new THREE.MeshStandardMaterial({ roughness: 0.7 })
  );
  mesh.position.y = 6;
  return mesh;
}

// -------------------------
// PHYSICS (RAPIER)
// -------------------------
async function initPhysics() {
  const RAPIER = await import("@dimforge/rapier3d");
  // await RAPIER.init();

  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  return { RAPIER, world };
}

function createGround(RAPIER, world) {
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(125, 0.1, 125)
      .setFriction(0.8)
      .setRestitution(0.15)
  );
}

function createBall(RAPIER, world, radius, startY = 6) {
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, startY, 0)
      .setGravityScale(5, true)
      .setLinearDamping(0.5)
      .setCanSleep(true)
  );

  world.createCollider(
    RAPIER.ColliderDesc.ball(radius).setFriction(0.6).setRestitution(0.96),
    body
  );

  return body;
}

function updateBallControls(world) {
  const body = world.physics.ball;
  if (!body) return;

  const dir = { x: 0, y: 0, z: 0 };
  const force = 0.2;

  if (world.input.forward) dir.z -= force;
  if (world.input.backward) dir.z += force;
  if (world.input.left) dir.x -= force;
  if (world.input.right) dir.x += force;

  if (world.input.jump) {
    dir.y += 5;
    world.input.jump = false;
  }

  if (dir.x || dir.y || dir.z) {
    body.applyImpulse(dir, true);
  }
}

function stepPhysics(world) {
  const t = world.time;
  t.accumulator += t.delta;

  let steps = 0;
  while (t.accumulator >= t.fixedStep && steps < t.maxSubSteps) {
    world.physics.world.step();
    t.accumulator -= t.fixedStep;
    steps++;
  }
}

function syncBallAndCamera(world) {
  const body = world.physics.ball;
  const mesh = world.objects.ball;
  const cam = world.camera;

  const pos = body.translation();

  if (pos.y < -10) {
    body.setTranslation({ x: 6, y: 10, z: 6 }, true);
    world.time.accumulator = 0;
    return;
  }

  mesh.position.set(pos.x, pos.y, pos.z);
  cam.position.set(pos.x + 6, 6, pos.z + 6);
  cam.lookAt(pos.x, pos.y, pos.z);
}

// -------------------------
// INPUT
// -------------------------
function bindInput(world) {
  const map = {
    KeyW: "forward",
    KeyS: "backward",
    KeyA: "left",
    KeyD: "right",
    Space: "jump",
  };

  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape") {
      world.state.paused = !world.state.paused;
      document.body.classList.toggle("paused", world.state.paused);
      return;
    }

    if (!world.state.paused && map[e.code]) {
      world.input[map[e.code]] = true;
    }
  });

  window.addEventListener("keyup", (e) => {
    if (map[e.code]) world.input[map[e.code]] = false;
  });
}

// -------------------------
// DEBUG
// -------------------------
import { initDebugger } from "./core/debug";

// -------------------------
// BINDINGS
// -------------------------
function bindResize(camera, renderer) {
  window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}

// -------------------------
// MAIN LOOP
// -------------------------
function animate() {
  requestAnimationFrame(animate);

  World.debug.begin();
  World.time.delta = World.time.clock.getDelta();

  if (!World.state.paused) {
    updateBallControls(World);
    stepPhysics(World);
    syncBallAndCamera(World);
    World.renderer.render(World.scene, World.camera);
  }

  World.debug.end();
}

// -------------------------
// APP BOOTSTRAP
// -------------------------
async function App() {
  World.renderer = initRenderer();
  World.scene = initScene();
  World.camera = initCamera();
  World.controls = initControls(World.camera, World.renderer);
  World.debug = initDebugger(World);

  initLights(World.scene);

  const physics = await initPhysics();
  World.physics.rapier = physics.RAPIER;
  World.physics.world = physics.world;

  createGround(physics.RAPIER, physics.world);

  World.objects.ball = createBallMesh();
  World.scene.add(World.objects.ball);

  World.physics.ball = createBall(
    physics.RAPIER,
    physics.world,
    World.objects.ball.geometry.parameters.radius
  );

  bindInput(World);
  bindResize(World.camera, World.renderer);

  animate();
}

App();
