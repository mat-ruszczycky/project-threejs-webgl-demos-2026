// Styles
import "../styles/app.scss";

// Imports
import { World } from "./core-002/world";
import { bindInput, updateGamepadInput } from "./core-002/input";
import { bindResize } from "./core-002/events";
import { initDebugger } from "./core-002/debug";
import { initRenderer, initScene, initCamera } from "./core-002/renderer";
import {
  createLights,
  createBallMesh,
  createBoxMesh,
} from "./core-002/objects";
import { initControls } from "./core-002/controls";
import {
  initPhysics,
  createGround,
  createBall,
  updatePhysics,
} from "./core-002/physics";

// App: Bootstrap
const App = async () => {
  World.debug = initDebugger(World);

  const physics = await initPhysics();
  World.physics.rapier = physics.RAPIER;
  World.physics.world = physics.world;

  World.renderer = initRenderer();
  World.scene = initScene();
  World.camera = initCamera();
  World.controls = initControls(World.camera, World.renderer);

  World.objects.ball = createBallMesh();
  World.physics.ball = createBall(
    World.physics.rapier,
    World.physics.world,
    World.objects.ball.geometry.parameters.radius
  );

  World.scene.add(World.objects.ball);

  World.objects.box = createBoxMesh();
  World.objects.box.position.y = 0.75;
  World.scene.add(World.objects.box);

  createGround(World.physics.rapier, World.physics.world);
  createLights(World.scene);

  bindInput(World);
  bindResize(World.camera, World.renderer);

  animate();
};

// App: Main Loop
const animate = () => {
  if (!World.renderer || !World.scene) return;

  World.debug.begin();
  World.time.delta = World.time.clock.getDelta();

  if (!World.state.paused) {
    updateGamepadInput();
    updatePhysics(World);
    World.renderer.render(World.scene, World.camera);
  }

  World.debug.end();
  requestAnimationFrame(animate);
};

App();
