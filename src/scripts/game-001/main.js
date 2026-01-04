// -------------------------
// STYLE(S)
// -------------------------
import "./../../styles/app.scss";

// -------------------------
// LIB(S)
// -------------------------
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";
import { Pane } from "tweakpane";

// -------------------------
// GAME STATE
// -------------------------
const GameState = {
  paused: false,
};

const togglePause = () => {
  GameState.paused = !GameState.paused;
  document.body.classList.toggle("paused", GameState.paused);
};

// -------------------------
// DEBUGGER
// -------------------------
function initDebugger() {
  // Tweakpane
  const pane = new Pane({ title: "Debugger" });

  // States folder
  const statesPane = pane.addFolder({ title: "States" });
  statesPane
    .addBinding(
      {
        paused: false,
      },
      "paused",
      { label: "Paused" }
    )
    .on("change", () => {
      togglePause();
    });

  // Navigation folder
  const navPane = pane.addFolder({ title: "Navigation" });
  navPane.addButton({ title: "Home" }).on("click", () => {
    window.location.href = "../";
  });

  navPane.addButton({ title: "3JS Docs" }).on("click", () => {
    window.open("https://threejs.org/docs/", "_blank");
  });

  // Stats
  const statPanels = [
    { id: "fps", top: 0 },
    { id: "ms", top: 48 },
    { id: "mb", top: 96 },
  ];

  const stats = statPanels.map(({ id, top }) => {
    const stat = new Stats();
    const panelMap = { fps: 0, ms: 1, mb: 2 };
    stat.showPanel(panelMap[id]);
    stat.dom.style.cssText = `position:absolute;top:${top}px;left:0;`;
    document.body.appendChild(stat.dom);
    return stat;
  });

  return {
    beginStats: () => stats.forEach((s) => s.begin()),
    endStats: () => stats.forEach((s) => s.end()),
  };
}

const Debugger = initDebugger();

// -------------------------
// WORLD SETUP
// -------------------------
function initWorld() {
  const canvas = document.querySelector("#webgl");

  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  // Scene
  const clearColor = new THREE.Color(0x1a1a1a);
  const scene = new THREE.Scene();
  scene.background = clearColor;
  scene.fog = new THREE.Fog(clearColor, 1, 30);

  // Helpers
  scene.add(new THREE.GridHelper(250, 100));
  scene.add(new THREE.AxesHelper(5));

  // Camera
  const camera = new THREE.PerspectiveCamera(
    75,
    innerWidth / innerHeight,
    0.1,
    100
  );
  camera.position.set(6, 6, 6);
  camera.lookAt(0, 0, 0);
  scene.add(camera);

  // Controls
  const controls = new OrbitControls(camera, canvas);

  return { renderer, scene, camera, controls };
}

const World = initWorld();

// -------------------------
// OBJECTS
// -------------------------
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 32, 32),
  new THREE.MeshStandardMaterial({ roughness: 0.7 })
);

sphere.position.y = sphere.geometry.parameters.radius;

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);

World.scene.add(
  sphere,
  directionalLight,
  new THREE.AmbientLight(0xffffff, 0.5)
);

// -------------------------
// PHYSICS
// -------------------------

// -------------------------
// INPUT
// -------------------------
const RawInput = {
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

  if (e.key === "w") RawInput.forward = true;
  if (e.key === "s") RawInput.backward = true;
  if (e.key === "a") RawInput.left = true;
  if (e.key === "d") RawInput.right = true;
  if (e.key === " ") RawInput.jump = true;
});

window.addEventListener("keyup", (e) => {
  if (GameState.paused) return;

  if (e.key === "w") RawInput.forward = false;
  if (e.key === "s") RawInput.backward = false;
  if (e.key === "a") RawInput.left = false;
  if (e.key === "d") RawInput.right = false;
});

window.addEventListener("resize", () => {
  World.camera.aspect = innerWidth / innerHeight;
  World.camera.updateProjectionMatrix();
  World.renderer.setSize(innerWidth, innerHeight);
});

// -------------------------
// MAIN LOOP
// -------------------------
let lastTime = 0;

function render(time) {
  requestAnimationFrame(render);
  const delta = (time - lastTime) / 1000;
  lastTime = time;

  if (GameState.paused) return;

  Debugger.beginStats();

  World.controls.update();
  World.renderer.render(World.scene, World.camera);

  Debugger.endStats();
}

requestAnimationFrame(render);
