# ThreeJS Demos 2026

A 2026 minimal demo repo for building with Three.js.

## Perfomance Notes

**Frames rendered in the last second**
This is how many images your computer managed to draw on the screen in one second.

- Higher = smoother motion
- Around **60** is what most screens aim for
- Low numbers = choppy, stuttery visuals

**Milliseconds needed to render a frame**
This is how long it takes to draw **one** of those images.

- Lower = faster and smoother
- About **16 ms per frame** ≈ 60 frames per second
- If this number goes up, performance goes down

**MBytes of allocated memory**
This is how much RAM the page/app is using.

- More memory = heavier load on your system
- Too much can slow things down or cause crashes
- Chrome needs that `--enable-precise-memory-info` flag to show accurate numbers instead of rough guesses

**TLDR:**

- High FPS + low milliseconds = good performance
- Low FPS + high milliseconds = something is struggling
- Memory keeps climbing = possible memory leak or inefficient code

## Game Controller Notes

| Index | PlayStation Button                       |
| ----: | ---------------------------------------- |
|     0 | ✕ (Cross)                                |
|     1 | ○ (Circle)                               |
|     2 | □ (Square)                               |
|     3 | △ (Triangle)                             |
|     4 | L1                                       |
|     5 | R1                                       |
|     6 | L2 (analog trigger)                      |
|     7 | R2 (analog trigger)                      |
|     8 | Share                                    |
|     9 | Options                                  |
|    10 | L3 (left stick press)                    |
|    11 | R3 (right stick press)                   |
|    12 | D-Pad Up                                 |
|    13 | D-Pad Down                               |
|    14 | D-Pad Left                               |
|    15 | D-Pad Right                              |
|    16 | PS (PlayStation button)                  |
|    17 | Touchpad press (DualShock 4 / DualSense) |

### Axes (gamepad.axes[index])

| Index | Control                           |
| ----: | --------------------------------- |
|     0 | Left stick X (-1 left → +1 right) |
|     1 | Left stick Y (-1 up → +1 down)    |
|     2 | Right stick X                     |
|     3 | Right stick Y                     |

## Time Management in Three.js

- Use `THREE.Clock` for most Three.js projects
- Use `requestAnimationFrame(time)` for engine-level control

---

### [THREE.Clock](https://threejs.org/docs/?q=Clock#Clock)

```js
const clock = new THREE.Clock();
const delta = clock.getDelta(); // seconds since last frame
```

**Why**

- Three.js–idiomatic and officially supported
- Returns time in seconds (no manual conversion)
- Integrates directly with `AnimationMixer`
- Handles pausing and first-frame timing safely
- Simpler and less error-prone timing

---

### requestAnimationFrame(time)

```js
let lastTime = 0;

function animate(time) {
  const delta = (time - lastTime) / 1000;
  lastTime = time;
}
```

**Why**

- Full control over time calculation
- Pattern in game engines
- Good for fixed timesteps, physics, and networking

---

### Fixed Timestep (Advanced)

```js
const FIXED_STEP = 1 / 60;
let accumulator = 0;
let lastTime = 0;

function animate(time) {
  requestAnimationFrame(animate);

  accumulator += (time - lastTime) / 1000;
  lastTime = time;

  while (accumulator >= FIXED_STEP) {
    update(FIXED_STEP);
    accumulator -= FIXED_STEP;
  }

  render();
}
```

**Why**

- Keeps simulation consistent regardless of frame rate
- Prevents physics instability at low or variable FPS
- Enables deterministic behavior (important for multiplayer and replays)

### Summary

- **Rendering:** variable frame rate is fine
- **Simulation / physics:** fixed timestep is preferred
- **Most Three.js apps:** `THREE.Clock` is the right default

## ECS Paradgim

- **Entities** = IDs
- **Components** = data only
- **Systems** = logic that operates on entities with certain components

Kills god-objects, scales cleanly, is faster, easier to refactor, and makes features like AI, multiplayer, and replays manageable instead of painful. **ECS keeps complexity under control as projects grow.**
