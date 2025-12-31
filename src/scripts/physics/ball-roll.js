// STYLE(S)
// -------------------------
import "./../../styles/app.scss";

// APP
// -------------------------
import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import GUI from "lil-gui";

import("@dimforge/rapier3d").then((RAPIER) => {
  // GLOBAL(S)
  // -------------------------
  let lastTime = performance.now();
  let delta = 0;
  let accumulator = 0;
  const FIXED_TIMESTEP = 1 / 60; // 60 FPS physics updates
  const MAX_SUBSTEPS = 5; // Prevent spiral of death
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // INPUT STATE
  // -------------------------
  const inputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  };

  // DEBUG
  // Lil GUI - https://github.com/georgealways/lil-gui
  // Tweakplane - https://github.com/cocopon/tweakpane
  // Stats - https://github.com/mrdoob/stats.js
  // FPS : Frames rendered in the last second (The higher the number the better)
  // MS  : Milliseconds needed to render a frame (The lower the number the better)
  // MB  : MBytes of allocated memory (Run Chrome with --enable-precise-memory-info)
  // -------------------------
  const gui = new GUI();
  gui.title("Debugger");
  gui.close();

  const statsFPS = new Stats();
  statsFPS.showPanel(0);
  statsFPS.dom.style.cssText =
    "position:absolute;top:0px;left:0px;transform:scale(1.5);transform-origin:top left;";
  document.body.appendChild(statsFPS.dom);

  const statsMS = new Stats();
  statsMS.showPanel(1);
  statsMS.dom.style.cssText =
    "position:absolute;top:72px;left:0;transform:scale(1.5);transform-origin:top left;";
  document.body.appendChild(statsMS.dom);

  const statsMB = new Stats();
  statsMB.showPanel(2);
  statsMB.dom.style.cssText =
    "position:absolute;top:144px;left:0;transform:scale(1.5);transform-origin:top left;"; // 80px + 80px
  document.body.appendChild(statsMB.dom);

  // RENDERER
  // -------------------------
  const canvas = document.querySelector("#webgl");
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    powerPreference: "high-performance",
  });

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x1a1a1a);

  // SCENE
  // -------------------------
  const scene = new THREE.Scene();

  // HELPER(S)
  // -------------------------
  const grid = new THREE.GridHelper(250, 100, 0xeeeeee, 0x666666);
  scene.add(grid);

  const axis = new THREE.AxesHelper(5.5);
  scene.add(axis);

  // OBJECT(S)
  // -------------------------
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    new THREE.MeshStandardMaterial({ roughness: 0.7 })
  );

  sphere.position.y = 6.0;
  scene.add(sphere);

  // LIGHT(S)
  // -------------------------
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight();
  scene.add(dirLight);

  // CAMERA(S)
  // -------------------------
  const camera = new THREE.PerspectiveCamera(
    75,
    sizes.width / sizes.height,
    0.1,
    100
  );

  scene.add(camera);

  // HANDLER(S)
  // -------------------------
  window.addEventListener("resize", () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  window.addEventListener("keydown", (e) => {
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
        break;

      default:
        break;
    }
  });

  window.addEventListener("keyup", (e) => {
    inputState.forward = false;
    inputState.backward = false;
    inputState.left = false;
    inputState.right = false;
    inputState.jump = false;
  });

  // GAMEPAD INPUT
  // -------------------------
  const updateGamepadInput = () => {
    const gamepads = navigator.getGamepads();

    if (!gamepads || !gamepads[0]) {
      return;
    }

    const gp = gamepads[0];

    // D-pad or left stick
    inputState.forward = gp.buttons[12]?.pressed || gp.axes[1] < -0.5;
    inputState.backward = gp.buttons[13]?.pressed || gp.axes[1] > 0.5;
    inputState.left = gp.buttons[14]?.pressed || gp.axes[0] < -0.5;
    inputState.right = gp.buttons[15]?.pressed || gp.axes[0] > 0.5;
    inputState.jump = gp.buttons[0]?.pressed;
  };

  // PHYSIC(S) - RAPIER
  // https://rapier.rs/docs/user_guides/javascript/getting_started_js
  // -------------------------
  let gravity = { x: 0.0, y: -30, z: 0.0 };
  let world = new RAPIER.World(gravity);
  let eventQueue = new RAPIER.EventQueue(true);

  world.timestep = FIXED_TIMESTEP;

  let groundColliderDesc = RAPIER.ColliderDesc.cuboid(125.0, 0.1, 125.0)
    .setRestitution(0.2)
    .setFriction(0.8);

  world.createCollider(groundColliderDesc);

  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(0.0, sphere.position.y, 0.0)
    .setLinearDamping(0.5)
    .setCanSleep(true);

  let rigidBody = world.createRigidBody(rigidBodyDesc);

  let colliderDesc = RAPIER.ColliderDesc.ball(sphere.geometry.parameters.radius)
    .setRestitution(0.96)
    .setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Average)
    .setFriction(0.6);

  world.createCollider(colliderDesc, rigidBody);

  // Render
  function render(now) {
    statsFPS.begin();
    statsMB.begin();
    statsMS.begin();

    // Delta Time Pattern
    delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    updateGamepadInput();

    const dir = { x: 0, y: 0, z: 0 };
    const moveForce = 1;

    if (inputState.forward) dir.z -= moveForce;
    if (inputState.backward) dir.z += moveForce;
    if (inputState.left) dir.x -= moveForce;
    if (inputState.right) dir.x += moveForce;

    if (inputState.jump) {
      dir.y += moveForce * 2;
      inputState.jump = false;
    }

    if (dir.x !== 0 || dir.y !== 0 || dir.z !== 0) {
      rigidBody.applyImpulse(dir, true);
    }

    // Fixed Timestep Accumulator Pattern
    let steps = 0;
    accumulator += delta;

    while (accumulator >= FIXED_TIMESTEP && steps < MAX_SUBSTEPS) {
      world.step(eventQueue);
      accumulator -= FIXED_TIMESTEP;
      steps++;
    }

    let position = rigidBody.translation();

    if (position.y <= -10) {
      rigidBody.setTranslation({ x: 6, y: 10, z: 6 });
      position = rigidBody.translation();
    }

    sphere.position.set(position.x, position.y, position.z);
    camera.position.set(position.x + 6, 6, position.z + 6);
    camera.lookAt(position.x, position.y, position.z);

    renderer.render(scene, camera);

    statsFPS.end();
    statsMB.end();
    statsMS.end();

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
});
