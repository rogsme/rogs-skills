// Classic scripts work in Lavish's opaque-origin sandbox without CORS headers.
(() => {
  const mermaid = globalThis.mermaid;
  const diagrams = [...document.querySelectorAll(".mermaid")];
  const sources = diagrams.map((element) => element.textContent);
  const dark = window.matchMedia("(prefers-color-scheme: dark)");
  let running = false;

  async function render() {
    if (running) return;
    running = true;
    try {
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: dark.matches ? "dark" : "default", flowchart: { htmlLabels: false } });
      for (const [index, element] of diagrams.entries()) {
        if (element.style.display === "none") continue;
        element.removeAttribute("data-processed");
        element.textContent = sources[index];
        try { await mermaid.run({ nodes: [element], suppressErrors: false }); }
        catch {
          element.textContent = sources[index];
          const warning = document.createElement("p");
          warning.className = "review-warning";
          warning.textContent = "This diagram did not render. Its source is preserved above; ask the planner to repair it.";
          element.after(warning);
        }
      }
    } finally { running = false; }
  }

  dark.addEventListener("change", render);
  void render();
})();
