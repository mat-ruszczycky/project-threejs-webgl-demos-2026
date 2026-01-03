// STYLE(S)
// -------------------------
import "./../styles/app.scss";

// APP
// -------------------------
import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import GUI from "lil-gui";

import("@dimforge/rapier3d").then((RAPIER) => {
  // GLOBAL(S)
  // -------------------------
  let isPaused = false;
  let lastTime = performance.now();
  let delta = 0;
  let accumulator = 0;

  const FIXED_TIMESTEP = 1 / 60;
  const MAX_SUBSTEPS = 5;

  // INPUT STATE
  // -------------------------
  const inputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    src: null,
  };

  // DEBUG
  // -------------------------
  const gui = new GUI();
  gui.title("Debugger");
  gui.close();

  const statsFPS = new Stats();
  statsFPS.showPanel(0);
  statsFPS.dom.style.cssText = "position:absolute;top:0;left:0;";
  document.body.appendChild(statsFPS.dom);

  const statsMS = new Stats();
  statsMS.showPanel(1);
  statsMS.dom.style.cssText = "position:absolute;top:48px;left:0;";
  document.body.appendChild(statsMS.dom);

  const statsMB = new Stats();
  statsMB.showPanel(2);
  statsMB.dom.style.cssText = "position:absolute;top:96px;left:0;";
  document.body.appendChild(statsMB.dom);

  // RENDERER
  // -------------------------
  const canvas = document.querySelector("#webgl");
  const clearColor = new THREE.Color(0x1a1a1a);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(clearColor);

  // SCENE
  // -------------------------
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(clearColor, 1, 30);

  // HELPERS
  // -------------------------
  scene.add(new THREE.GridHelper(250, 100, 0xeeeeee, 0x666666));
  scene.add(new THREE.AxesHelper(5.5));

  // OBJECTS
  // -------------------------
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    new THREE.MeshStandardMaterial({ roughness: 0.7 })
  );

  sphere.position.y = 6;
  scene.add(sphere);

  // LIGHTS
  // -------------------------
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  scene.add(new THREE.DirectionalLight());

  // CAMERA
  // -------------------------
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  scene.add(camera);

  // RESIZE
  // -------------------------
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  // KEYBOARD INPUT
  // -------------------------
  window.addEventListener("keydown", (e) => {
    if (isPaused && e.key !== "Escape") return;

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
        inputState.src = "keypad";
        break;
      case "Escape":
        togglePause();
        break;
    }
  });

  window.addEventListener("keyup", () => {
    inputState.forward = false;
    inputState.backward = false;
    inputState.left = false;
    inputState.right = false;
    inputState.jump = false;
  });

  // GAMEPAD INPUT
  // -------------------------
  const updateGamepadInput = () => {
    if (isPaused) return;

    const gp = navigator.getGamepads()?.[0];
    if (!gp) return;

    inputState.forward = gp.buttons[12]?.pressed || gp.axes[1] < -0.5;
    inputState.backward = gp.buttons[13]?.pressed || gp.axes[1] > 0.5;
    inputState.left = gp.buttons[14]?.pressed || gp.axes[0] < -0.5;
    inputState.right = gp.buttons[15]?.pressed || gp.axes[0] > 0.5;
    inputState.jump = gp.buttons[0]?.pressed;
    inputState.src = "gamepad";
  };

  // PHYSICS (RAPIER)
  // -------------------------
  const world = new RAPIER.World({ x: 0, y: -30, z: 0 });
  const eventQueue = new RAPIER.EventQueue(true);
  world.timestep = FIXED_TIMESTEP;

  world.createCollider(
    RAPIER.ColliderDesc.cuboid(125, 0.1, 125)
      .setFriction(0.8)
      .setRestitution(0.2)
  );

  const rigidBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, sphere.position.y, 0)
      .setLinearDamping(0.5)
      .setCanSleep(true)
  );

  world.createCollider(
    RAPIER.ColliderDesc.ball(sphere.geometry.parameters.radius)
      .setFriction(0.6)
      .setRestitution(0.96),
    rigidBody
  );

  // PAUSE
  // -------------------------
  function togglePause() {
    isPaused = !isPaused;
    document.body.classList.toggle("paused", isPaused);

    if (!isPaused) {
      lastTime = performance.now();
      accumulator = 0;
      inputState.jump = false;
      inputState.src = null;
    }
  }

  // RENDER LOOP
  // -------------------------
  function render(now) {
    requestAnimationFrame(render);

    statsFPS.begin();
    statsMS.begin();
    statsMB.begin();

    if (isPaused) {
      lastTime = now;
      statsFPS.end();
      statsMS.end();
      statsMB.end();
      return;
    }

    delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    updateGamepadInput();

    const dir = { x: 0, y: 0, z: 0 };
    const force = 1;

    if (inputState.forward) dir.z -= force;
    if (inputState.backward) dir.z += force;
    if (inputState.left) dir.x -= force;
    if (inputState.right) dir.x += force;

    if (inputState.jump) {
      dir.y += force * (inputState.src === "keypad" ? 7 : 0.7);
      inputState.jump = false;
      inputState.src = null;
    }

    if (dir.x || dir.y || dir.z) {
      rigidBody.applyImpulse(dir, true);
    }

    accumulator += delta;
    let steps = 0;

    while (accumulator >= FIXED_TIMESTEP && steps < MAX_SUBSTEPS) {
      world.step(eventQueue);
      accumulator -= FIXED_TIMESTEP;
      steps++;
    }

    let pos = rigidBody.translation();

    if (pos.y <= -10) {
      rigidBody.setTranslation({ x: 6, y: 10, z: 6 }, true);
      accumulator = 0;
      pos = rigidBody.translation();
    }

    sphere.position.set(pos.x, pos.y, pos.z);
    camera.position.set(pos.x + 6, 6, pos.z + 6);
    camera.lookAt(pos.x, pos.y, pos.z);

    renderer.render(scene, camera);

    statsFPS.end();
    statsMS.end();
    statsMB.end();
  }

  // START
  // -------------------------
  lastTime = performance.now();
  requestAnimationFrame(render);
});
