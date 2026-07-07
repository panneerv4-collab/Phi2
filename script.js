/* ==========================================================================
   PhiAcademy — script.js
   Renders the notebook-style math card from either:
     1) form input (interactive editor, index.html), or
     2) URL query parameters (automation mode, used by n8n + ScreenshotOne)

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
     embed     — "1" hides the editor chrome, renders the card at native
                 1080x1350px with no scaling — this is the mode ScreenshotOne
                 should use.
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

  /** Builds a shareable/automation URL from the current form state. */
  function buildShareURL(data) {
    const params = new URLSearchParams();
    params.set("topic", data.topic);
    params.set("title", data.title);
    params.set("problem", data.problem);
    params.set("steps", data.steps.join(STEP_DELIM));
    params.set("formula", data.formula);
    params.set("answer", data.answer);
    params.set("hashtags", data.hashtags);
    params.set("handle", data.handle);
    params.set("cardno", data.cardno);
    params.set("theme", data.theme);
    params.set("embed", "1");
    const base = window.location.origin + window.location.pathname.replace(/index\.html$/, "");
    return base + "templates/mathematics-card.html?" + params.toString();
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

  function collectFormData(form) {
    const fd = new FormData(form);
    return {
      topic: fd.get("topic") || "",
      title: fd.get("title") || "",
      problem: fd.get("problem") || "",
      steps: (fd.get("steps") || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      formula: fd.get("formula") || "",
      answer: fd.get("answer") || "",
      hashtags: fd.get("hashtags") || "",
      handle: fd.get("handle") || "",
      cardno: fd.get("cardno") || "",
      theme: fd.get("theme") || "navy"
    };
  }

  function populateForm(form, data) {
    form.elements["topic"].value = data.topic;
    form.elements["title"].value = data.title;
    form.elements["problem"].value = data.problem;
    form.elements["steps"].value = data.steps.join("\n");
    form.elements["formula"].value = data.formula;
    form.elements["answer"].value = data.answer;
    form.elements["hashtags"].value = data.hashtags;
    form.elements["handle"].value = data.handle;
    form.elements["cardno"].value = data.cardno;
    form.elements["theme"].value = data.theme;
  }

  function init() {
    const params = qs();
    const initialData = paramsToData(params);

    if (params.get("embed") === "1") {
      document.body.classList.add("embed");
    }

    render(initialData);
    fitStage();
    window.addEventListener("resize", fitStage);

    const form = document.getElementById("card-form");
    if (!form) return; // automation/embed pages have no form

    populateForm(form, initialData);
    document
      .querySelectorAll('.theme-swatches button[data-theme="' + initialData.theme + '"]')
      .forEach((b) => b.classList.add("active"));

    form.addEventListener("input", () => {
      render(collectFormData(form));
    });

    document.querySelectorAll(".theme-swatches button").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".theme-swatches button")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        form.elements["theme"].value = btn.dataset.theme;
        render(collectFormData(form));
      });
    });

    document.getElementById("btn-randomize").addEventListener("click", () => {
      populateForm(form, SAMPLES[Math.floor(Math.random() * SAMPLES.length)]);
      document
        .querySelectorAll(".theme-swatches button")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(
          '.theme-swatches button[data-theme="' + form.elements["theme"].value + '"]'
        )
        .forEach((b) => b.classList.add("active"));
      render(collectFormData(form));
    });

    document.getElementById("btn-share").addEventListener("click", () => {
      const url = buildShareURL(collectFormData(form));
      const out = document.getElementById("url-out");
      out.textContent = url;
      out.style.display = "block";
      if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
    });

    document.getElementById("btn-json").addEventListener("click", () => {
      const data = collectFormData(form);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "phiacademy-card-data.json";
      a.click();
    });
  }

  const SAMPLES = [
    DEFAULT_DATA,
    {
      topic: "Algebra II · Quadratics",
      title: "Completing the Square",
      problem: "Solve x² + 6x + 5 = 0 by completing the square.",
      steps: [
        "Move the constant: x² + 6x = −5.",
        "Halve the linear coefficient (6→3), square it (9), add to both sides: x² + 6x + 9 = 4.",
        "Factor the perfect square: (x + 3)² = 4.",
        "Take the square root of both sides: x + 3 = ±2."
      ],
      formula: "So **x = −1 or x = −5**",
      answer: "x = −1, −5",
      hashtags: "#algebra #quadratics #mathhelp #sat #actprep",
      handle: "@phiacademy",
      cardno: "022",
      theme: "emerald"
    },
    {
      topic: "Geometry · Triangles",
      title: "The Pythagorean Theorem",
      problem: "A ladder 13 ft long leans on a wall. Its base is 5 ft from the wall. How high up the wall does it reach?",
      steps: [
        "The ladder, wall, and ground form a right triangle: hypotenuse c = 13, leg a = 5.",
        "Apply a² + b² = c²: 5² + b² = 13².",
        "Simplify: 25 + b² = 169, so b² = 144.",
        "Take the square root: b = 12."
      ],
      formula: "So the ladder reaches **12 ft** up the wall",
      answer: "h = 12 ft",
      hashtags: "#geometry #pythagoreantheorem #mathclass #stem",
      handle: "@phiacademy",
      cardno: "031",
      theme: "plum"
    }
  ];

  document.addEventListener("DOMContentLoaded", init);

  // Exposed for the standalone automation template (templates/mathematics-card.html)
  window.PhiAcademy = { render, paramsToData, qs };
})();
