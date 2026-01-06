import { World } from "./world";

export function bindInput(world) {
  const map = {
    KeyW: "forward",
    KeyS: "backward",
    KeyA: "left",
    KeyD: "right",
    Space: "jump",
  };

  window.addEventListener("keydown", (e) => {
    world.keyDown = true;
    if (e.code === "Escape") {
      world.state.paused = !world.state.paused;
      document.body.classList.toggle("paused", world.state.paused);
      return;
    }

    if (!world.state.paused && map[e.code]) {
      world.input[map[e.code]] = true;
    }
  });

  window.addEventListener("keyup", (e) => {
    world.keyDown = false;
    if (map[e.code]) world.input[map[e.code]] = false;
  });
}

export const updateGamepadInput = () => {
  if (World.state.paused) return;

  const gp = navigator.getGamepads()?.[0];
  if (!gp) return;

  World.input.forward = gp.buttons[12]?.pressed || gp.axes[1] < -0.5;
  World.input.backward = gp.buttons[13]?.pressed || gp.axes[1] > 0.5;
  World.input.left = gp.buttons[14]?.pressed || gp.axes[0] < -0.5;
  World.input.right = gp.buttons[15]?.pressed || gp.axes[0] > 0.5;
  World.input.jump = gp.buttons[0]?.pressed;
  World.input.src = "gamepad";
};
