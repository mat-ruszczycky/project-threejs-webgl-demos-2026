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
  togglePause() {
    document.body.classList.toggle("paused", this.paused);
  },
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
    .addBinding(GameState, "paused", { label: "Paused" })
    .on("change", () => GameState.togglePause());

  // Navigation folder
  const navPane = pane.addFolder({ title: "Navigation" });
  navPane.addButton({ title: "Home" }).on("click", () => {
    window.location.href = "../";
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

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  // Controls
  const controls = new OrbitControls(camera, canvas);

  // Responsive
  window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  return { renderer, scene, camera, controls };
}

const World = initWorld();

// -------------------------
// OBJECTS
// -------------------------
function initObjects(scene) {
  // Example object
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 0.5, 0);
  scene.add(cube);

  return [
    {
      mesh: cube,
      update: (delta) => {
        // Example animation
        cube.rotation.y += delta * 0.5;
      },
    },
  ];
}

const objects = initObjects(World.scene);

// -------------------------
// PHYSICS
// -------------------------
// Placeholder for Rapier or any physics integration
function updatePhysics(delta) {
  // physicsWorld.step(delta);
}

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

  updatePhysics(delta);

  objects.forEach((obj) => obj.update?.(delta));

  World.controls.update();
  World.renderer.render(World.scene, World.camera);

  Debugger.endStats();
}

requestAnimationFrame(render);
