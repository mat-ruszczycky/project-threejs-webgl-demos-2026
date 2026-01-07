// Styles
import "../styles/app.scss";

// Imports
import CORE from "./core-002";

// App: Bootstrap
const App = async () => {
  CORE.World.debug = CORE.initDebugger(CORE.World);

  const physics = await CORE.initPhysics();
  CORE.World.physics.rapier = physics.RAPIER;
  CORE.World.physics.world = physics.world;

  CORE.World.renderer = CORE.initRenderer();
  CORE.World.scene = CORE.initScene();
  CORE.World.camera = CORE.initCamera();
  CORE.World.controls = CORE.initControls(
    CORE.World.camera,
    CORE.World.renderer
  );

  CORE.World.objects.ball = CORE.createBallMesh();
  CORE.World.physics.ball = CORE.createBall(
    CORE.World.physics.rapier,
    CORE.World.physics.world,
    CORE.World.objects.ball.geometry.parameters.radius
  );

  CORE.World.scene.add(CORE.World.objects.ball);

  CORE.World.objects.box = CORE.createBoxMesh();
  CORE.World.objects.box.position.y = 0.75;
  CORE.World.scene.add(CORE.World.objects.box);

  CORE.createGround(CORE.World.physics.rapier, CORE.World.physics.world);
  CORE.createLights(CORE.World.scene);

  CORE.bindInput(CORE.World);
  CORE.bindResize(CORE.World.camera, CORE.World.renderer);

  animate();
};

// App: Main Loop
const animate = () => {
  if (!CORE.World.renderer || !CORE.World.scene) return;

  CORE.World.debug.begin();
  CORE.World.time.delta = CORE.World.time.clock.getDelta();
  CORE.World.time.elapsedTime = CORE.World.time.clock.getElapsedTime();

  if (!CORE.World.state.paused) {
    console.log("CORE.World.time.delta", CORE.World.time.delta);
    console.log("CORE.World.time.elapsedTime", CORE.World.time.elapsedTime);
    CORE.updateGamepadInput(CORE.World);
    CORE.updatePhysics(CORE.World);
    CORE.World.renderer.render(CORE.World.scene, CORE.World.camera);
  }

  CORE.World.debug.end();
  requestAnimationFrame(animate);
};

App();
