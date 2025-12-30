// STYLE(S)
// -------------------------
import "./../../styles/app.scss";

// APP
// -------------------------
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/addons/libs/stats.module.js";
import GUI from "lil-gui";
import { strToU8 } from "three/examples/jsm/libs/fflate.module.js";

import("@dimforge/rapier3d").then((RAPIER) => {
  // GLOBAL(S)
  // -------------------------
  let lastTime = performance.now();
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
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
  const stats = new Stats();
  document.body.appendChild(stats.dom);

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

  // HELPERS
  // -------------------------
  const grid = new THREE.GridHelper(1000, 500, 0xeeeeee, 0x666666);
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
    const dir = { x: 0, y: 0, z: 0 };
    const value = 0.1;

    switch (e.key) {
      case "w":
        dir.z = -value;
        break;

      case "s":
        dir.z = value;
        break;
        a;

      case "a":
        dir.x = -value;
        break;

      case "d":
        dir.x = value;
        break;

      case " ":
        dir.y = value * 5;
        break;

      default:
        break;
    }

    rigidBody.applyImpulse({ x: dir.x, y: dir.y, z: dir.z }, true);
  });

  // RAPIER
  // https://rapier.rs/docs/user_guides/javascript/getting_started_js
  // -------------------------
  let gravity = { x: 0.0, y: -9.81, z: 0.0 };
  let world = new RAPIER.World(gravity);

  // Ground
  // -------------------------
  let groundColliderDesc = RAPIER.ColliderDesc.cuboid(125.0, 0.1, 125.0)
    .setRestitution(0.2)
    .setFriction(0.8);

  world.createCollider(groundColliderDesc);

  // Rigid body
  // -------------------------
  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(0.0, sphere.position.y, 0.0)
    .setLinearDamping(0.5)
    .setCanSleep(true);

  let rigidBody = world.createRigidBody(rigidBodyDesc);

  // Collider
  // -------------------------
  let colliderDesc = RAPIER.ColliderDesc.ball(0.25)
    .setRestitution(0.96)
    .setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Average)
    .setFriction(0.6);

  world.createCollider(colliderDesc, rigidBody);

  // Render
  // -------------------------
  function render(now) {
    let delta = (now - lastTime) / 1000;
    lastTime = now;

    delta = Math.min(delta, 0.1);

    world.step();

    let position = rigidBody.translation();

    sphere.position.set(position.x, position.y, position.z);

    camera.position.set(position.x + 6, 6, position.z + 6);
    camera.lookAt(position.x, position.y, position.z);

    renderer.render(scene, camera);

    stats.update();

    requestAnimationFrame(render);
  }

  render();
});
