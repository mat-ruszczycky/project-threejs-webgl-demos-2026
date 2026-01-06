import * as THREE from "three";

export const World = {
  state: { paused: false },

  input: {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  },

  time: {
    clock: new THREE.Clock(),
    delta: 0,
    accumulator: 0,
    fixedStep: 1 / 60,
    maxSubSteps: 5,
  },

  physics: {
    rapier: null,
    world: null,
    ball: null,
  },

  objects: {},
};
