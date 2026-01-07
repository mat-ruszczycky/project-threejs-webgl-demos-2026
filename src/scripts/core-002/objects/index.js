import * as THREE from "three";
import vertexShader from "./../shaders/debug-floor/vert.glsl";
import fragmentShader from "./../shaders/debug-floor/frag.glsl";

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
  const GRID_SIZE = 2;
  const fogUniforms = THREE.UniformsUtils.merge([THREE.UniformsLib["fog"]]);
  return new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      // wireframe: true,
      vertexShader: vertexShader,
      transparent: true,
      fog: true,
      fragmentShader: fragmentShader,
      uniforms: {
        ...fogUniforms,
        uColor: { value: new THREE.Color(0x666666) },
        uLineColor: { value: new THREE.Color(1.0, 1.0, 1.0) },
        uGridFrequency: { value: GRID_SIZE },
        uLineWidth: { value: 0.005 },
        uInnerPatternLineColor: { value: new THREE.Color("lightblue") },
        uInnerPatternCount: { value: 5.0 },
        uInnerPatternWidth: { value: 0.1 },
        uInnerPatternOffset: { value: new THREE.Vector2(0.505, 0.505) },
      },
    })
  );
}
