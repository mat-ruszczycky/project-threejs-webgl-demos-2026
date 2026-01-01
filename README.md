# ThreeJS WebGL Demos 2026

A 2026 minimal demo setup for building 3D scenes with Three.js.

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
