import Stats from "three/addons/libs/stats.module.js";
import { Pane } from "tweakpane";

export function initDebugger(world) {
  const pane = new Pane({ title: "Debugger" });

  pane.addBinding(world.state, "paused").on("change", ({ value }) => {
    document.body.classList.toggle("paused", value);
  });

  const nav = pane.addFolder({ title: "Navigation" });
  nav.addButton({ title: "Home" }).on("click", () => (location.href = "../"));

  nav
    .addButton({ title: "ThreeJS Docs" })
    .on("click", () => window.open("https://threejs.org/docs/", "_blank"));

  nav
    .addButton({ title: "RAPIER Docs" })
    .on("click", () =>
      window.open(
        "https://rapier.rs/docs/user_guides/javascript/getting_started_js",
        "_blank"
      )
    );

  const stats = ["fps", "ms", "mb"].map((_, i) => {
    const s = new Stats();
    s.showPanel(i);
    s.dom.style.cssText = `position:absolute;top:${i * 48}px;left:0;`;
    document.body.appendChild(s.dom);
    return s;
  });

  return {
    begin: () => stats.forEach((s) => s.begin()),
    end: () => stats.forEach((s) => s.end()),
  };
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
