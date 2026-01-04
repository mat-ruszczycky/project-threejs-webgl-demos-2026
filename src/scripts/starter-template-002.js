// -------------------------
// STYLE(S)
// -------------------------
import "./../styles/app.scss";

// -------------------------
// LIB(S)
// -------------------------
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";
import { Pane } from "tweakpane";

// -------------------------
// WORLD
// -------------------------
const World = {
  state: {
    paused: false,
  },

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
// DEBUGGER
// -------------------------
function createDebugger(world) {
  const pane = new Pane({ title: "Debugger" });

  pane
    .addBinding(world.state, "paused", { label: "Paused" })
    .on("change", ({ value }) => {
      document.body.classList.toggle("paused", value);
    });

  const nav = pane.addFolder({ title: "Navigation" });
  nav.addButton({ title: "Home" }).on("click", () => {
    window.location.href = "../";
  });
  nav.addButton({ title: "3JS Docs" }).on("click", () => {
    window.open("https://threejs.org/docs/", "_blank");
  });

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
// THREE SETUP
// -------------------------
function createRenderer() {
  const canvas = document.querySelector("#webgl");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });

  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  return renderer;
}

function createScene() {
  const color = new THREE.Color(0x1a1a1a);
  const scene = new THREE.Scene();
  scene.background = color;
  scene.fog = new THREE.Fog(color, 1, 30);

  if (import.meta.env.DEV) {
    scene.add(new THREE.GridHelper(250, 100));
    scene.add(new THREE.AxesHelper(5));
  }

  return scene;
}

function createCamera() {
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

function createControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  return controls;
}

// -------------------------
// INPUT
// -------------------------
function bindInput(world) {
  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape") {
      world.state.paused = !world.state.paused;
      document.body.classList.toggle("paused", world.state.paused);
      return;
    }

    if (world.state.paused) return;

    if (e.code === "KeyW") world.input.forward = true;
    if (e.code === "KeyS") world.input.backward = true;
    if (e.code === "KeyA") world.input.left = true;
    if (e.code === "KeyD") world.input.right = true;
    if (e.code === "Space") world.input.jump = true;
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "KeyW") world.input.forward = false;
    if (e.code === "KeyS") world.input.backward = false;
    if (e.code === "KeyA") world.input.left = false;
    if (e.code === "KeyD") world.input.right = false;
    if (e.code === "Space") world.input.jump = false;
  });
}

// -------------------------
// RESIZE
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
function update(world) {
  // physics, movement, AI go here
}

function draw(world) {
  world.controls.update();
  world.renderer.render(world.scene, world.camera);
}

function animate() {
  requestAnimationFrame(animate);

  World.debug.begin();
  World.time.delta = World.time.clock.getDelta();

  if (!World.state.paused) {
    update(World);
    draw(World);
  }

  World.debug.end();
}

// -------------------------
// OBJECTS
// -------------------------

// -------------------------
// INIT
// -------------------------
World.renderer = createRenderer();
World.scene = createScene();
World.camera = createCamera();
World.controls = createControls(World.camera, World.renderer);
World.debug = createDebugger(World);

bindInput(World);
bindResize(World.camera, World.renderer);

requestAnimationFrame(animate);
