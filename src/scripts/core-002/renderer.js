import * as THREE from "three";

export function initRenderer() {
  const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#webgl"),
    antialias: true,
    powerPreference: "high-performance",
  });

  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  return renderer;
}

export function initScene() {
  const bg = new THREE.Color(0x1a1a1a);
  const scene = new THREE.Scene();
  scene.background = bg;
  scene.fog = new THREE.Fog(bg, 1, 30);

  scene.add(new THREE.GridHelper(250, 100));
  scene.add(new THREE.AxesHelper(5));

  return scene;
}

export function initCamera() {
  const camera = new THREE.PerspectiveCamera(
    75,
    innerWidth / innerHeight,
    0.1,
    100
  );

  camera.position.set(6, 6, 6);
  return camera;
}
