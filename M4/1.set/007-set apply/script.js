(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const GEO = {
    vb: { w: 760, h: 640 },
    universe: { x: 48, y: 40, w: 664, h: 560, rx: 18 },
    two: {
      A: { cx: 270, cy: 320, r: 175 },
      B: { cx: 490, cy: 320, r: 175 },
      labelAngles: { A: -90, B: -90 },
      letters: {
        a: { x: 205, y: 320 },
        b: { x: 380, y: 320 },
        c: { x: 555, y: 320 }
      }
    },
    three: {
      A: { cx: 300, cy: 250, r: 158 },
      B: { cx: 460, cy: 250, r: 158 },
      C: { cx: 380, cy: 380, r: 158 },
      labelAngles: { A: -135, B: -45, C: 90 },
      letters: {
        a: { x: 235, y: 200 },
        b: { x: 380, y: 195 },
        c: { x: 525, y: 200 },
        d: { x: 275, y: 355 },
        e: { x: 380, y: 305 },
        f: { x: 485, y: 355 },
        g: { x: 380, y: 470 }
      }
    }
  };

  const LABEL_OUTSIDE_GAP = 30;
  const MATH_LABEL_BOX = { w: 64, h: 52 };
  const LETTER_LABEL_BOX = { w: 72, h: 58 };
  const SHADE = "#c9b6e8";

  const UNION_REGIONS = {
    2: ["onlyA", "ab", "onlyB"],
    3: ["onlyA", "onlyB", "onlyC", "ab", "ac", "bc", "abc"]
  };

  const CARD_REGIONS = {
    2: {
      nA: ["onlyA", "ab"],
      nB: ["ab", "onlyB"],
      nAB: ["ab"]
    },
    3: {
      nA: ["onlyA", "ab", "ac", "abc"],
      nB: ["ab", "onlyB", "bc", "abc"],
      nC: ["ac", "bc", "onlyC", "abc"],
      nAB: ["ab", "abc"],
      nBC: ["bc", "abc"],
      nAC: ["ac", "abc"],
      nABC: ["abc"]
    }
  };

  const PROOFS = {
    2: [
      null,
      {
        lines: [
          {
            num: 1,
            cards: [
              { id: "nA", latex: "n(A)" },
              { id: "nB", latex: "n(B)" }
            ],
            joiner: "+",
            rhs: "(a + b) + (b + c)"
          }
        ],
        footer: {
          kind: "step",
          n: 1,
          latex: "n(A) + n(B) = a + 2b + c"
        }
      },
      {
        lines: [
          {
            num: 1,
            cards: [
              { id: "nA", latex: "n(A)" },
              { id: "nB", latex: "n(B)" }
            ],
            joiner: "+",
            rhs: "(a + b) + (b + c)"
          },
          {
            num: 2,
            cards: [{ id: "nAB", latex: "n(A \\cap B)" }],
            joiner: "+",
            rhs: "b"
          }
        ],
        footer: {
          kind: "step",
          n: 2,
          latex: "n(A) + n(B) - n(A \\cap B) = a + b + c"
        }
      },
      {
        lines: [
          {
            num: 1,
            cards: [
              { id: "nA", latex: "n(A)" },
              { id: "nB", latex: "n(B)" }
            ],
            joiner: "+",
            rhs: "(a + b) + (b + c)"
          },
          {
            num: 2,
            cards: [{ id: "nAB", latex: "n(A \\cap B)" }],
            joiner: "+",
            rhs: "b"
          }
        ],
        footer: {
          kind: "summary",
          latex: "n(A \\cup B) = n(A) + n(B) - n(A \\cap B)"
        }
      }
    ],
    3: [
      null,
      {
        lines: [
          {
            num: 1,
            cards: [
              { id: "nA", latex: "n(A)" },
              { id: "nB", latex: "n(B)" },
              { id: "nC", latex: "n(C)" }
            ],
            joiner: "+",
            expand: "(a + b + d + e) + (b + c + e + f) + (d + e + f + g)"
          }
        ],
        footer: {
          kind: "step",
          n: 1,
          latex: "n(A) + n(B) + n(C) = a + 2b + c + 2d + 3e + 2f + g"
        }
      },
      {
        lines: [
          {
            num: 1,
            cards: [
              { id: "nA", latex: "n(A)" },
              { id: "nB", latex: "n(B)" },
              { id: "nC", latex: "n(C)" }
            ],
            joiner: "+",
            expand: "(a + b + d + e) + (b + c + e + f) + (d + e + f + g)"
          },
          {
            num: 2,
            cards: [
              { id: "nAB", latex: "n(A \\cap B)" },
              { id: "nBC", latex: "n(B \\cap C)" },
              { id: "nAC", latex: "n(A \\cap C)" }
            ],
            joiner: "+",
            expand: "(b + e) + (e + f) + (d + e)"
          }
        ],
        footer: {
          kind: "step",
          n: 2,
          latex:
            "n(A) + n(B) + n(C) - n(A \\cap B) - n(B \\cap C) - n(A \\cap C) = a + b + c + d + f + g",
          eqBreak: true
        }
      },
      {
        lines: [
          {
            num: 1,
            cards: [
              { id: "nA", latex: "n(A)" },
              { id: "nB", latex: "n(B)" },
              { id: "nC", latex: "n(C)" }
            ],
            joiner: "+",
            expand: "(a + b + d + e) + (b + c + e + f) + (d + e + f + g)"
          },
          {
            num: 2,
            cards: [
              { id: "nAB", latex: "n(A \\cap B)" },
              { id: "nBC", latex: "n(B \\cap C)" },
              { id: "nAC", latex: "n(A \\cap C)" }
            ],
            joiner: "+",
            expand: "(b + e) + (e + f) + (d + e)"
          },
          {
            num: 3,
            cards: [{ id: "nABC", latex: "n(A \\cap B \\cap C)" }],
            joiner: "+",
            rhs: "e"
          }
        ],
        footer: {
          kind: "step",
          n: 3,
          latex:
            "n(A) + n(B) + n(C) - n(A \\cap B) - n(B \\cap C) - n(A \\cap C) + n(A \\cap B \\cap C) = a + b + c + d + e + f + g",
          eqBreak: true
        }
      },
      {
        lines: [
          {
            num: 1,
            cards: [
              { id: "nA", latex: "n(A)" },
              { id: "nB", latex: "n(B)" },
              { id: "nC", latex: "n(C)" }
            ],
            joiner: "+",
            expand: "(a + b + d + e) + (b + c + e + f) + (d + e + f + g)"
          },
          {
            num: 2,
            cards: [
              { id: "nAB", latex: "n(A \\cap B)" },
              { id: "nBC", latex: "n(B \\cap C)" },
              { id: "nAC", latex: "n(A \\cap C)" }
            ],
            joiner: "+",
            expand: "(b + e) + (e + f) + (d + e)"
          },
          {
            num: 3,
            cards: [{ id: "nABC", latex: "n(A \\cap B \\cap C)" }],
            joiner: "+",
            rhs: "e"
          }
        ],
        footer: {
          kind: "summary",
          latex:
            "n(A \\cup B \\cup C) = n(A) + n(B) + n(C) - n(A \\cap B) - n(B \\cap C) - n(A \\cap C) + n(A \\cap B \\cap C)",
          rhsContinue: "n(A \\cap B \\cap C)"
        }
      }
    ]
  };

  const state = {
    sets: 2,
    step: 0,
    selectedCard: null
  };

  function t() {
    return window.CONTENT?.th;
  }

  function katexHtml(latex, displayMode = false) {
    if (typeof katex === "undefined" || typeof katex.renderToString !== "function") {
      return latex;
    }
    return katex.renderToString(latex, {
      throwOnError: false,
      output: "html",
      displayMode
    });
  }

  function renderMath(root = document.body) {
    if (typeof renderMathInElement !== "function") return;
    renderMathInElement(root, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false
    });
  }

  function clipCircle(id, circle) {
    return `<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><circle cx="${circle.cx}" cy="${circle.cy}" r="${circle.r}"/></clipPath>`;
  }

  function holeMask(id, circle) {
    const u = GEO.universe;
    return `<mask id="${id}" maskUnits="userSpaceOnUse"><rect x="${u.x}" y="${u.y}" width="${u.w}" height="${u.h}" fill="white"/><circle cx="${circle.cx}" cy="${circle.cy}" r="${circle.r}" fill="black"/></mask>`;
  }

  function wrapAttrs(ids, attr, inner) {
    return ids.reduceRight((html, id) => `<g ${attr}="url(#${id})">${html}</g>`, inner);
  }

  function isSummaryStep() {
    return currentProof()?.footer?.kind === "summary";
  }

  function shadedSet() {
    if (isSummaryStep()) {
      return new Set(UNION_REGIONS[state.sets] || []);
    }
    if (!state.selectedCard) return new Set();
    const map = CARD_REGIONS[state.sets] || {};
    return new Set(map[state.selectedCard] || []);
  }

  function regionFill(id) {
    return shadedSet().has(id) ? SHADE : "transparent";
  }

  function regionPaint(id, clipIds, maskIds) {
    const u = GEO.universe;
    const inner = `<rect data-fill="${id}" x="${u.x}" y="${u.y}" width="${u.w}" height="${u.h}" fill="${regionFill(id)}"/>`;
    const masked = wrapAttrs(maskIds, "mask", inner);
    return `<g pointer-events="none">${wrapAttrs(["clipU", ...clipIds], "clip-path", masked)}</g>`;
  }

  function circleEl(c) {
    return `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="none" stroke="#2f3b4a" stroke-width="4" pointer-events="none"/>`;
  }

  function labelOutsideCircle(circle, angleDeg, gap = LABEL_OUTSIDE_GAP) {
    const u = GEO.universe;
    const rad = (angleDeg * Math.PI) / 180;
    let x = circle.cx + Math.cos(rad) * (circle.r + gap);
    let y = circle.cy + Math.sin(rad) * (circle.r + gap);
    const margin = 26;
    x = Math.min(Math.max(x, u.x + margin), u.x + u.w - margin);
    y = Math.min(Math.max(y, u.y + margin), u.y + u.h - margin);

    const dx = x - circle.cx;
    const dy = y - circle.cy;
    const dist = Math.hypot(dx, dy);
    const minDist = circle.r + Math.min(gap, 26);
    if (dist > 0 && dist < minDist) {
      const scale = minDist / dist;
      x = circle.cx + dx * scale;
      y = circle.cy + dy * scale;
      x = Math.min(Math.max(x, u.x + margin), u.x + u.w - margin);
      y = Math.min(Math.max(y, u.y + margin), u.y + u.h - margin);
    }

    return { x, y };
  }

  function mathLabel(x, y, latex, cls = "venn-math", box = MATH_LABEL_BOX) {
    const { w, h } = box;
    return `<foreignObject class="${cls}" x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" pointer-events="none"><div xmlns="http://www.w3.org/1999/xhtml" class="venn-math-label">${katexHtml(latex)}</div></foreignObject>`;
  }

  function setLabels(geo) {
    return Object.entries(geo.labelAngles)
      .map(([name, angle]) => {
        const pos = labelOutsideCircle(geo[name], angle);
        return mathLabel(pos.x, pos.y, name, "venn-set-label");
      })
      .join("");
  }

  function letterLabels(geo) {
    return Object.entries(geo.letters)
      .map(([name, pos]) => mathLabel(pos.x, pos.y, name, "venn-letter", LETTER_LABEL_BOX))
      .join("");
  }

  function buildSvg() {
    const u = GEO.universe;
    const defs = [
      `<clipPath id="clipU" clipPathUnits="userSpaceOnUse"><rect x="${u.x}" y="${u.y}" width="${u.w}" height="${u.h}" rx="${u.rx}"/></clipPath>`
    ];

    let regions = "";
    let outlines = "";
    let labels = "";

    if (state.sets === 2) {
      const A = GEO.two.A;
      const B = GEO.two.B;
      defs.push(clipCircle("clipA", A), clipCircle("clipB", B));
      defs.push(holeMask("maskNotA", A), holeMask("maskNotB", B));
      regions =
        regionPaint("onlyA", ["clipA"], ["maskNotB"]) +
        regionPaint("onlyB", ["clipB"], ["maskNotA"]) +
        regionPaint("ab", ["clipA", "clipB"], []);
      outlines = circleEl(A) + circleEl(B);
      labels = setLabels(GEO.two) + letterLabels(GEO.two);
    } else {
      const A = GEO.three.A;
      const B = GEO.three.B;
      const C = GEO.three.C;
      defs.push(clipCircle("clipA", A), clipCircle("clipB", B), clipCircle("clipC", C));
      defs.push(holeMask("maskNotA", A), holeMask("maskNotB", B), holeMask("maskNotC", C));
      regions =
        regionPaint("onlyA", ["clipA"], ["maskNotB", "maskNotC"]) +
        regionPaint("onlyB", ["clipB"], ["maskNotA", "maskNotC"]) +
        regionPaint("onlyC", ["clipC"], ["maskNotA", "maskNotB"]) +
        regionPaint("ab", ["clipA", "clipB"], ["maskNotC"]) +
        regionPaint("ac", ["clipA", "clipC"], ["maskNotB"]) +
        regionPaint("bc", ["clipB", "clipC"], ["maskNotA"]) +
        regionPaint("abc", ["clipA", "clipB", "clipC"], []);
      outlines = circleEl(A) + circleEl(B) + circleEl(C);
      labels = setLabels(GEO.three) + letterLabels(GEO.three);
    }

    return `<svg viewBox="0 0 ${GEO.vb.w} ${GEO.vb.h}" role="img" aria-label="แผนภาพเวนน์"><defs>${defs.join("")}</defs><rect x="${u.x}" y="${u.y}" width="${u.w}" height="${u.h}" rx="${u.rx}" fill="#ffffff" stroke="#5e6b78" stroke-width="3"/>${regions}${outlines}${labels}</svg>`;
  }

  function applyShading() {
    const active = shadedSet();
    $$("[data-fill]").forEach((rect) => {
      const id = rect.getAttribute("data-fill");
      rect.setAttribute("fill", active.has(id) ? SHADE : "transparent");
    });
  }

  function maxStep() {
    return PROOFS[state.sets].length - 1;
  }

  function currentProof() {
    return PROOFS[state.sets][state.step] || null;
  }

  function buildLineHtml(line) {
    const cards = line.cards
      .map((card, index) => {
        const joiner =
          index > 0
            ? `<span class="proof-joiner" aria-hidden="true">${line.joiner}</span>`
            : "";
        const selected = state.selectedCard === card.id ? " is-selected" : "";
        return `${joiner}<button type="button" class="proof-card${selected}" data-card="${card.id}" aria-pressed="${
          state.selectedCard === card.id ? "true" : "false"
        }">${katexHtml(card.latex)}</button>`;
      })
      .join("");

    let after = "";
    if (line.rhs) {
      after = `<span class="proof-eq">=</span><span class="proof-rhs">${katexHtml(line.rhs)}</span>`;
    }

    const expand = line.expand
      ? `<div class="proof-expand"><span class="proof-eq">=</span><span class="proof-rhs">${katexHtml(
          line.expand
        )}</span></div>`
      : "";

    return `<div class="proof-line" data-line="${line.num}">
      <span class="proof-num">${line.num}.</span>
      <div class="proof-line__body">
        <div class="proof-line__row">${cards}${after}</div>
        ${expand}
      </div>
    </div>`;
  }

  function renderProofSteps() {
    const mount = $("#proofSteps");
    const proof = currentProof();
    if (!proof) {
      mount.innerHTML = "";
      return;
    }
    mount.innerHTML = proof.lines.map(buildLineHtml).join("");
  }

  function footerMathHtml(footer) {
    if (footer.rhsContinue) {
      const term = footer.rhsContinue;
      const marker = `+ ${term}`;
      const head = footer.latex.endsWith(marker)
        ? footer.latex.slice(0, -term.length).trimEnd()
        : footer.latex;
      const eqParts = footer.latex.split(/\s*=\s*/);
      const indent = eqParts.length >= 2 ? `${eqParts[0]} ={}` : "";
      return `<div class="step-summary__eq-line">${katexHtml(head)}</div>
        <div class="step-summary__eq-line step-summary__eq-line--continue">
          <span class="step-summary__indent" aria-hidden="true">${katexHtml(indent)}</span>
          ${katexHtml(term)}
        </div>`;
    }
    if (!footer.eqBreak) return katexHtml(footer.latex);
    const parts = footer.latex.split(/\s*=\s*/);
    if (parts.length < 2) return katexHtml(footer.latex);
    const [lhs, ...rhsParts] = parts;
    const rhs = rhsParts.join(" = ");
    return `<div class="step-summary__eq-line">${katexHtml(lhs)}</div>
      <div class="step-summary__eq-line"><span class="proof-eq">=</span> ${katexHtml(rhs)}</div>`;
  }

  function renderFooter() {
    const mount = $("#stepSummary");
    const proof = currentProof();
    if (!proof) {
      mount.innerHTML = "";
      mount.classList.remove("has-content");
      return;
    }

    const ui = t()?.ui;
    if (!ui) return;

    mount.classList.add("has-content");
    if (proof.footer.kind === "summary") {
      mount.innerHTML = `<p class="step-summary__title">${ui.summary}</p>
        <div class="step-summary__math">${footerMathHtml(proof.footer)}</div>`;
    } else {
      mount.innerHTML = `<p class="step-summary__title">${ui.stepPrefix} ${proof.footer.n}</p>
        <div class="step-summary__math">${footerMathHtml(proof.footer)}</div>`;
    }
  }

  function renderIntro() {
    const el = $("#proofIntro");
    const html = t()?.intro?.[state.sets];
    if (!el || html == null) return;
    el.innerHTML = html;
    renderMath(el);
  }

  function renderUnionFormula() {
    const el = $("#unionFormula");
    const latex = t()?.unionFormula?.[state.sets];
    if (!el || latex == null) return;
    el.innerHTML = katexHtml(latex);
  }

  function renderVenn() {
    $("#vennMount").innerHTML = buildSvg();
  }

  function updateButtons() {
    const prevBtn = $("#prevBtn");
    const nextBtn = $("#nextBtn");
    const atStart = state.step <= 1;
    const atEnd = state.step >= maxStep();
    const idle = state.step === 0;

    prevBtn.disabled = idle || atStart;
    nextBtn.disabled = idle || atEnd;
  }

  function syncShell() {
    const layout = $("#appLayout");
    layout.dataset.sets = String(state.sets);
    layout.dataset.step = String(state.step);
  }

  function renderAll() {
    syncShell();
    renderIntro();
    renderVenn();
    renderUnionFormula();
    renderProofSteps();
    renderFooter();
    updateButtons();
    const scroller = $(".proof-steps-scroll");
    if (scroller) scroller.scrollTop = 0;
  }

  function setSets(n) {
    if (state.sets === n) return;
    state.sets = n;
    state.step = 0;
    state.selectedCard = null;
    $$(".segmented__btn").forEach((btn) => {
      const active = Number(btn.dataset.sets) === n;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-checked", active ? "true" : "false");
    });
    renderAll();
  }

  function goProve() {
    state.step = 1;
    state.selectedCard = null;
    renderAll();
  }

  function goPrev() {
    if (state.step <= 1) return;
    state.step -= 1;
    state.selectedCard = null;
    renderAll();
  }

  function goNext() {
    if (state.step === 0 || state.step >= maxStep()) return;
    state.step += 1;
    state.selectedCard = null;
    renderAll();
  }

  function selectCard(cardId) {
    // Summary step always shades the full union; card toggles would only confuse.
    if (!cardId || isSummaryStep()) return;
    state.selectedCard = state.selectedCard === cardId ? null : cardId;
    $$(".proof-card").forEach((btn) => {
      const on = btn.dataset.card === state.selectedCard;
      btn.classList.toggle("is-selected", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    applyShading();
    if (!state.selectedCard) return;
    const selected = $(`.proof-card[data-card="${CSS.escape(state.selectedCard)}"]`);
    selected?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function applyContent() {
    const c = t();
    if (!c) return;
    $("#landingEyebrow").textContent = c.landing.eyebrow;
    $("#landingTitle").textContent = c.landing.title;
    $("#startButton").textContent = c.landing.start;
    $("#appTitle").textContent = c.app.title;
    $("#setCountLabel").innerHTML = `<strong>${c.ui.setCount}</strong>`;
    $$(".segmented__btn").forEach((btn) => {
      btn.textContent = Number(btn.dataset.sets) === 2 ? c.ui.set2 : c.ui.set3;
    });
    $("#proveBtn").textContent = c.ui.prove;
    $("#prevBtn").textContent = c.ui.prev;
    $("#nextBtn").textContent = c.ui.next;
  }

  function showApp() {
    $("#landingPage").hidden = true;
    $("#landingPage").classList.remove("view--active");
    $("#appPage").hidden = false;
    $("#appPage").classList.add("view--active");
    $("#appTitle").focus?.();
    renderAll();
  }

  function bootstrap() {
    applyContent();
    renderAll();

    $("#startButton").addEventListener("click", showApp);

    $$(".segmented__btn").forEach((btn) => {
      btn.addEventListener("click", () => setSets(Number(btn.dataset.sets)));
    });

    $("#proveBtn").addEventListener("click", goProve);
    $("#prevBtn").addEventListener("click", goPrev);
    $("#nextBtn").addEventListener("click", goNext);

    $("#proofSteps").addEventListener("click", (event) => {
      const card = event.target.closest(".proof-card");
      if (!card) return;
      selectCard(card.dataset.card);
    });
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
