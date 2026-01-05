function bindInput(world) {
  const map = {
    KeyW: "forward",
    KeyS: "backward",
    KeyA: "left",
    KeyD: "right",
    Space: "jump",
  };

  window.addEventListener("keydown", (e) => {
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
    if (map[e.code]) world.input[map[e.code]] = false;
  });
}

export default bindInput;
