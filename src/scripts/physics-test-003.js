import "../styles/app.scss";
import * as THREE from "three";
import World from "./core/world";
import { initRenderer, initScene, initCamera } from "./core/renderer";
import { initLights, createBallMesh } from "./core/objects";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  initPhysics,
  createGround,
  createBall,
  updateBallControls,
  stepPhysics,
  postPhysicsUpdate,
} from "./core/physics";
import bindInput from "./core/input";
import { bindResize } from "./core/events";
import initDebugger from "./core/debug";

function initControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);

  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  // Limit vertical rotation so it doesn't go underground
  controls.maxPolarAngle = Math.PI / 2 - 0.1;
  controls.minPolarAngle = 0.1;

  controls.enableZoom = true;
  controls.enablePan = false;

  return controls;
}

// APP
const App = async () => {
  World.renderer = initRenderer();
  World.scene = initScene();
  World.camera = initCamera();
  World.controls = initControls(World.camera, World.renderer);
  World.debug = initDebugger(World);

  initLights(World.scene);

  const physics = await initPhysics();
  World.physics.rapier = physics.RAPIER;
  World.physics.world = physics.world;

  World.objects.ball = createBallMesh();
  World.scene.add(World.objects.ball);

  World.physics.ball = createBall(
    physics.RAPIER,
    physics.world,
    World.objects.ball.geometry.parameters.radius
  );

  createGround(physics.RAPIER, physics.world);

  bindInput(World);
  bindResize(World.camera, World.renderer);

  animate();
};

const animate = () => {
  requestAnimationFrame(animate);

  World.debug.begin();
  World.time.delta = World.time.clock.getDelta();

  if (!World.state.paused) {
    updateBallControls(World);
    stepPhysics(World);
    postPhysicsUpdate(World);

    World.renderer.render(World.scene, World.camera);
  }

  World.debug.end();
};

App();
