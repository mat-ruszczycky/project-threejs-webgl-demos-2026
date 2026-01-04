/**
  1. Styles
  2. Libraries
  3. World (Global State)
  4. Three.js Core
     - Renderer
     - Scene
     - Camera
     - Controls
  5. Physics (Rapier)
     - World Init
     - Character Controller
  6. Input
  7. Debug / Dev Tools
  8. Binding/Handlers
     - Resize
  9. Main Loop
 10. App Bootstrap
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
  },
};

// -------------------------
// THREE CORE
// -------------------------
function initRenderer() {
  const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#webgl"),
    antialias: true,
    powerPreference: "high-performance",
  });

  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  return renderer;
}

function initScene() {
  const bg = new THREE.Color(0x1a1a1a);
  const scene = new THREE.Scene();

  scene.background = bg;
  scene.fog = new THREE.Fog(bg, 1, 30);

  if (import.meta.env.DEV) {
    scene.add(new THREE.GridHelper(250, 100));
    scene.add(new THREE.AxesHelper(5));
  }

  return scene;
}

function initCamera() {
  const camera = new THREE.PerspectiveCamera(
    75,
    innerWidth / innerHeight,
    0.1,
    100
  );

  camera.position.set(6, 6, 6);
  camera.lookAt(0, 0, 0);
  return camera;
}

function initControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  return controls;
}

// -------------------------
// PHYSICS
// -------------------------
const RAPIER = await import("@dimforge/rapier3d");

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
function initDebugger(world) {
  const pane = new Pane({ title: "Debugger" });

  pane.addBinding(world.state, "paused").on("change", ({ value }) => {
    document.body.classList.toggle("paused", value);
  });

  const nav = pane.addFolder({ title: "Navigation" });
  nav.addButton({ title: "Home" }).on("click", () => (location.href = "../"));

  nav
    .addButton({ title: "ThreeJS Docs" })
    .on("click", () => window.open("https://threejs.org/docs/", "_blank"));

  nav
    .addButton({ title: "RAPIER Docs" })
    .on("click", () =>
      window.open(
        "https://rapier.rs/docs/user_guides/javascript/getting_started_js",
        "_blank"
      )
    );

  const stats = ["fps", "ms", "mb"].map((_, i) => {
    const s = new Stats();
    s.showPanel(i);
    s.dom.style.cssText = `position:absolute;top:${i * 48}px;left:0;`;
    document.body.appendChild(s.dom);
    return s;
  });

  return {
    begin: () => stats.forEach((s) => s.begin()),
    end: () => stats.forEach((s) => s.end()),
  };
}

// -------------------------
// BINDING/HANDLERS
// -------------------------
function bindResize(camera, renderer) {
  window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}

// -------------------------
// LOOP
// -------------------------
function animate() {
  requestAnimationFrame(animate);

  World.debug.begin();
  World.time.delta = World.time.clock.getDelta();

  if (!World.state.paused) {
    World.controls.update();
    World.renderer.render(World.scene, World.camera);
  }

  World.debug.end();
}

// -------------------------
// APP
// -------------------------
async function App() {
  World.renderer = initRenderer();
  World.scene = initScene();
  World.camera = initCamera();
  World.controls = initControls(World.camera, World.renderer);
  World.debug = initDebugger(World);

  bindInput(World);
  bindResize(World.camera, World.renderer);

  animate();
}

App();
