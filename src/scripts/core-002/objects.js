import * as THREE from "three";

export function createLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  scene.add(new THREE.DirectionalLight(0xffffff, 1));
}

export function createBallMesh(radius = 0.5) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 10, 10),
    new THREE.MeshStandardMaterial({ roughness: 0.7, wireframe: true })
  );
}

export function createBoxMesh(dims = { w: 9, h: 1.5, d: 9 }) {
  const { w, h, d } = dims;
  return new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ roughness: 0.7, wireframe: false })
  );
}
