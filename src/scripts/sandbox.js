import "./../styles/app.scss";
import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import GUI from "lil-gui";

import("@dimforge/rapier3d").then((RAPIER) => {
  // =========================
  // ECS STRUCTURE
  // =========================
  const Entities = [];
  const Components = {
    Mesh: new Map(),
    Physics: new Map(),
    Input: new Map(),
  };

  // =========================
  // DEBUGGER / STATS
  // =========================
  const debuggerGUI = new GUI();
  debuggerGUI.title("Debugger");
  debuggerGUI.close();

  const createStatsPanel = (panel, top) => {
    const stats = new Stats();
    stats.showPanel(panel);
    stats.dom.style.cssText = `position:absolute;top:${top}px;left:0;`;
    document.body.appendChild(stats.dom);
    return stats;
  };

  const statsFPS = createStatsPanel(0, 0);
  const statsMS = createStatsPanel(1, 48);
  const statsMB = createStatsPanel(2, 96);

  // =========================
  // RENDERER / SCENE
  // =========================
  const canvas = document.querySelector("#webgl");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  const clearColor = new THREE.Color(0x1a1a1a);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(clearColor);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(clearColor, 1, 30);
  scene.add(new THREE.GridHelper(250, 100, 0xeeeeee, 0x666666));
  scene.add(new THREE.AxesHelper(5.5));

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  scene.add(camera);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  // =========================
  // INPUT SYSTEM
  // =========================
  const InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    src: null,
    isPaused: false,
  };

  window.addEventListener("keydown", (e) => {
    if (InputState.isPaused && e.key !== "Escape") return;
    switch (e.key) {
      case "w":
        InputState.forward = true;
        break;
      case "s":
        InputState.backward = true;
        break;
      case "a":
        InputState.left = true;
        break;
      case "d":
        InputState.right = true;
        break;
      case " ":
        InputState.jump = true;
        InputState.src = "keypad";
        break;
      case "Escape":
        togglePause();
        break;
    }
  });

  window.addEventListener("keyup", () => {
    InputState.forward = false;
    InputState.backward = false;
    InputState.left = false;
    InputState.right = false;
    InputState.jump = false;
  });

  const updateGamepad = () => {
    if (InputState.isPaused) return;
    const gp = navigator.getGamepads()?.[0];
    if (!gp) return;

    InputState.forward = gp.buttons[12]?.pressed || gp.axes[1] < -0.5;
    InputState.backward = gp.buttons[13]?.pressed || gp.axes[1] > 0.5;
    InputState.left = gp.buttons[14]?.pressed || gp.axes[0] < -0.5;
    InputState.right = gp.buttons[15]?.pressed || gp.axes[0] > 0.5;
    InputState.jump = gp.buttons[0]?.pressed;
    InputState.src = "gamepad";
  };

  const togglePause = () => {
    InputState.isPaused = !InputState.isPaused;
    document.body.classList.toggle("paused", InputState.isPaused);
  };

  // =========================
  // PHYSICS SYSTEM
  // =========================
  const FIXED_TIMESTEP = 1 / 60;
  const MAX_SUBSTEPS = 5;
  let accumulator = 0;

  const world = new RAPIER.World({ x: 0, y: -30, z: 0 });
  world.timestep = FIXED_TIMESTEP;
  const eventQueue = new RAPIER.EventQueue(true);

  // Ground
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(125, 0.1, 125)
      .setFriction(0.8)
      .setRestitution(0.2)
  );

  // Create sphere entity
  const sphereEntity = Entities.length;
  Entities.push(sphereEntity);

  const sphereMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    new THREE.MeshStandardMaterial({ roughness: 0.7 })
  );

  sphereMesh.position.y = 6;
  scene.add(sphereMesh);
  Components.Mesh.set(sphereEntity, sphereMesh);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  scene.add(new THREE.DirectionalLight());

  const sphereBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(0, 6, 0)
      .setLinearDamping(0.5)
      .setCanSleep(true)
  );
  world.createCollider(
    RAPIER.ColliderDesc.ball(0.5).setFriction(0.6).setRestitution(0.96),
    sphereBody
  );
  Components.Physics.set(sphereEntity, sphereBody);

  // =========================
  // SYSTEMS
  // =========================
  const InputSystem = () => {
    updateGamepad();
  };

  const PhysicsSystem = (delta) => {
    accumulator += delta;
    let steps = 0;
    while (accumulator >= FIXED_TIMESTEP && steps < MAX_SUBSTEPS) {
      world.step(eventQueue);
      accumulator -= FIXED_TIMESTEP;
      steps++;
    }
  };

  const MovementSystem = () => {
    const dir = { x: 0, y: 0, z: 0 };
    const force = 1;

    if (InputState.forward) dir.z -= force;
    if (InputState.backward) dir.z += force;
    if (InputState.left) dir.x -= force;
    if (InputState.right) dir.x += force;

    if (InputState.jump) {
      dir.y += force * (InputState.src === "keypad" ? 7 : 0.7);
      InputState.jump = false;
      InputState.src = null;
    }

    const body = Components.Physics.get(sphereEntity);
    if (dir.x || dir.y || dir.z) body.applyImpulse(dir, true);
  };

  const RenderSystem = () => {
    const pos = Components.Physics.get(sphereEntity).translation();
    if (pos.y <= -10)
      Components.Physics.get(sphereEntity).setTranslation(
        { x: 6, y: 10, z: 6 },
        true
      );

    const mesh = Components.Mesh.get(sphereEntity);
    mesh.position.set(pos.x, pos.y, pos.z);

    camera.position.set(pos.x + 6, 6, pos.z + 6);
    camera.lookAt(pos.x, pos.y, pos.z);

    renderer.render(scene, camera);
  };

  // =========================
  // MAIN LOOP
  // =========================
  let lastTime = performance.now();

  const loop = (now) => {
    requestAnimationFrame(loop);

    statsFPS.begin();
    statsMS.begin();
    statsMB.begin();

    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    if (!InputState.isPaused) {
      InputSystem();
      MovementSystem();
      PhysicsSystem(delta);
      RenderSystem();
    }

    statsFPS.end();
    statsMS.end();
    statsMB.end();
  };

  requestAnimationFrame(loop);
});
