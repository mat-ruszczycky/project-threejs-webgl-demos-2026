import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function initControls(camera, renderer) {
  const controls = new OrbitControls(camera, renderer.domElement);

  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  // Limit vertical rotation so it doesn't go underground
  controls.maxPolarAngle = Math.PI / 2 - 0.1;
  controls.minPolarAngle = 0.1;

  controls.enableZoom = true;
  controls.enablePan = false;

  return controls;
}
