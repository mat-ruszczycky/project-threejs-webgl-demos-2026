// -------------------------
// STYLES
// -------------------------
import "../styles/app.scss";

// -------------------------
// WORLD (GLOBAL STATE)
// -------------------------
import World from "./core/world";

// -------------------------
// RENDERER
// -------------------------
import { initRenderer, initScene, initCamera } from "./core/renderer";

// -------------------------
// OBJECTS
// -------------------------
import { initLights, createBallMesh } from "./core/objects";

// -------------------------
// PHYSICS (RAPIER)
// -------------------------
import {
  initPhysics,
  createGround,
  createBall,
  updateBallControls,
  stepPhysics,
  postPhysicsUpdate,
} from "./core/physics";

// -------------------------
// INPUT
// -------------------------
import bindInput from "./core/input";

// -------------------------
// EVENTS
// -------------------------
import { bindResize } from "./core/events";

// -------------------------
// DEBUG
// -------------------------
import initDebugger from "./core/debug";

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
    postPhysicsUpdate(World);
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
}

App();
