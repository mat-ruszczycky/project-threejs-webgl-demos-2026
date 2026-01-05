import * as THREE from "three";

export function createLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  scene.add(new THREE.DirectionalLight(0xffffff, 1));
}

export function createBallMesh(radius = 0.5) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    new THREE.MeshStandardMaterial({ roughness: 0.7 })
  );

  return mesh;
}
