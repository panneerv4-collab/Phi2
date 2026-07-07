/* ==========================================================================
   PhiAcademy — script.js
   Renders the notebook-style math card from URL query parameters.
   The page itself is static and non-interactive: edit the query string
   (or the fallback defaults below) to change what's shown.

   URL PARAMETER API (see README.md for the full reference table):
     topic     — eyebrow tag, e.g. "Calculus · Limits"
     title     — big headline, e.g. "The Squeeze Theorem"
     problem   — the problem / given statement
     steps     — solution steps, separated by the pipe character  |
     formula   — key formula or result (wrap the important bit in **double
                 asterisks** to render it under the highlighter, e.g.
                 "So **lim f(x) = 4**")
     answer    — final answer text, circled in red pen
     hashtags  — space separated hashtags, e.g. "#calculus #mathhelp"
     handle    — social handle shown bottom-left, defaults to @phiacademy
     cardno    — small page-number style label, e.g. "014"
     theme     — "navy" | "emerald" | "plum"
     embed     — "1" renders the card at native 1080x1350px with no
                 scaling — this is the mode ScreenshotOne should use.
   ========================================================================== */

(function () {
  "use strict";

  const DEFAULT_DATA = {
    topic: "Calculus · Limits",
    title: "The Squeeze Theorem",
    problem: "Evaluate lim(x→0) of x² · sin(1/x)",
    steps: [
      "Note that sin(1/x) is bounded: −1 ≤ sin(1/x) ≤ 1 for all x ≠ 0.",
      "Multiply every part by x² (which is ≥ 0): −x² ≤ x²sin(1/x) ≤ x².",
      "Take the limit of the outer functions as x → 0: both go to 0.",
      "Since the middle is squeezed between two functions → 0, it → 0 too."
    ],
    formula: "So **lim(x→0) x²sin(1/x) = 0**",
    answer: "L = 0",
    hashtags: "#calculus #limits #mathtutor #studygram #apcalc",
    handle: "@phiacademy",
    cardno: "014",
    theme: "navy"
  };

  const STEP_DELIM = "|";

  function qs() {
    return new URLSearchParams(window.location.search);
  }

  function paramsToData(params) {
    const data = Object.assign({}, DEFAULT_DATA);
    if (params.has("topic")) data.topic = params.get("topic");
    if (params.has("title")) data.title = params.get("title");
    if (params.has("problem")) data.problem = params.get("problem");
    if (params.has("steps")) {
      data.steps = params
        .get("steps")
        .split(STEP_DELIM)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (params.has("formula")) data.formula = params.get("formula");
    if (params.has("answer")) data.answer = params.get("answer");
    if (params.has("hashtags")) data.hashtags = params.get("hashtags");
    if (params.has("handle")) data.handle = params.get("handle");
    if (params.has("cardno")) data.cardno = params.get("cardno");
    if (params.has("theme")) data.theme = params.get("theme");
    return data;
  }

  /** Renders **bold** markup inside plain text as <span class="hl"> (highlighter). */
  function renderInlineHighlight(text) {
    const escaped = escapeHtml(text);
    return escaped.replace(/\*\*(.+?)\*\*/g, '<span class="hl">$1</span>');
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function drawAnswerCircle(svgEl) {
    // A hand-wobbled ellipse path in a 0-100 viewBox; preserveAspectRatio="none"
    // lets it stretch to whatever the answer box's actual size is, so it
    // always looks hand-drawn regardless of how long the answer text is.
    const wobble = () => (Math.random() * 6 - 3).toFixed(1);
    const pts = [
      [8, 50], [14, 14], [50, 4], [86, 12],
      [95, 50], [88, 90], [50, 97], [10, 86], [8, 50]
    ].map(([x, y]) => [
      (x + parseFloat(wobble())).toFixed(1),
      (y + parseFloat(wobble())).toFixed(1)
    ]);
    let d = `M ${pts[0][0]} ${pts[0][1]} `;
    for (let i = 1; i < pts.length; i++) {
      d += `Q ${pts[i - 1][0]} ${pts[i - 1][1]} ${pts[i][0]} ${pts[i][1]} `;
    }
    svgEl.setAttribute("viewBox", "0 0 100 100");
    svgEl.setAttribute("preserveAspectRatio", "none");
    svgEl.innerHTML = `<path d="${d}" />`;
  }

  function render(data, root) {
    root = root || document;
    const card = root.querySelector(".card");
    if (!card) return;

    card.classList.remove("theme-navy", "theme-emerald", "theme-plum");
    card.classList.add("theme-" + (data.theme || "navy"));

    setText(root, ".js-topic", data.topic);
    setText(root, ".js-title", data.title);
    setText(root, ".js-problem", data.problem);
    setText(root, ".js-handle", data.handle);
    setText(root, ".js-hashtags", data.hashtags);
    setText(root, ".js-cardno", "No. " + data.cardno);

    const stepsEl = root.querySelector(".js-steps");
    if (stepsEl) {
      stepsEl.innerHTML = "";
      data.steps.forEach((step) => {
        const li = document.createElement("li");
        li.innerHTML = renderInlineHighlight(step);
        stepsEl.appendChild(li);
      });
    }

    const formulaEl = root.querySelector(".js-formula");
    if (formulaEl) formulaEl.innerHTML = renderInlineHighlight(data.formula);

    setText(root, ".js-answer", data.answer);

    const svg = root.querySelector(".js-answer-circle");
    if (svg) drawAnswerCircle(svg);
  }

  function setText(root, selector, value) {
    const el = root.querySelector(selector);
    if (el) el.textContent = value;
  }

  function fitStage() {
    const stage = document.querySelector(".stage");
    const wrap = document.querySelector(".stage-wrap");
    if (!stage || !wrap || document.body.classList.contains("embed")) return;
    const availW = wrap.clientWidth - 48;
    const availH = wrap.clientHeight - 48;
    const scale = Math.min(availW / 1080, availH / 1350, 1);
    stage.style.transform = `scale(${scale})`;
    stage.style.width = 1080 * scale + "px";
    stage.style.height = 1350 * scale + "px";
  }

  function init() {
    const params = qs();
    const data = paramsToData(params);

    if (params.get("embed") === "1") {
      document.body.classList.add("embed");
    }

    render(data);
    fitStage();
    window.addEventListener("resize", fitStage);
  }

  document.addEventListener("DOMContentLoaded", init);

  // Exposed in case another page wants to render a card programmatically.
  window.PhiAcademy = { render, paramsToData, qs };
})();
