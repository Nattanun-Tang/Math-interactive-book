(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const DEG_MAX = 3;
  const P_COLORS = ["#c8e6c9", "#f5c6cb", "#b2ebf2", "#ffe0b2"];
  const Q_COLORS = ["#ce93d8", "#90caf9", "#fff59d", "#a5d6a7"];

  const state = {
    operation: null,
    selectedPair: null
  };

  function t() {
    return window.CONTENT?.th;
  }

  function katexHtml(tex, displayMode = false) {
    if (typeof katex?.renderToString === "function") {
      try {
        return katex.renderToString(tex, { throwOnError: false, displayMode });
      } catch {
        /* fall through */
      }
    }
    return `<span class="katex-fallback">${escapeHtml(tex)}</span>`;
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

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function parseCoeff(raw) {
    const text = String(raw ?? "").trim();
    if (text === "" || text === "-" || text === "+") return { ok: true, value: 0, empty: true };
    if (!/^[+-]?\d+$/.test(text)) return { ok: false, value: 0 };
    const n = Number(text);
    if (!Number.isInteger(n)) return { ok: false, value: 0 };
    return { ok: true, value: n };
  }

  function sanitizeCoeffInput(input) {
    const before = input.value;
    // Drop from first decimal/exponent onward so "1.5" → "1", not "15"
    let next = before.replace(/[eE.].*$/, "");
    next = next.replace(/[^\d+-]/g, "");
    next = next.replace(/(?!^)[+-]/g, "");
    if (next !== before) input.value = next;
  }

  function readPoly(which) {
    const coeffs = [];
    const invalidHint = t()?.ui?.invalidCoeff || "";
    for (let deg = DEG_MAX; deg >= 0; deg -= 1) {
      const el = $(`#${which}${deg}`);
      const parsed = parseCoeff(el?.value ?? "0");
      coeffs.push(parsed.ok ? parsed.value : 0);
      if (el) {
        el.classList.toggle("poly-coeff--invalid", !parsed.ok);
        el.setAttribute("aria-invalid", parsed.ok ? "false" : "true");
        if (!parsed.ok && invalidHint) el.title = invalidHint;
        else el.removeAttribute("title");
      }
    }
    return coeffs;
  }

  function degree(coeffs) {
    for (let i = 0; i < coeffs.length; i += 1) {
      if (coeffs[i] !== 0) return DEG_MAX - i;
    }
    return null;
  }

  function termLatex(coeff, deg, { showZero = false, forceSign = false } = {}) {
    if (coeff === 0) {
      if (!showZero) return "";
      const z = deg === 0 ? "0" : deg === 1 ? "0x" : `0x^{${deg}}`;
      return forceSign ? `+ ${z}` : z;
    }
    const abs = Math.abs(coeff);
    let body;
    if (deg === 0) {
      body = String(abs);
    } else if (abs === 1) {
      body = deg === 1 ? "x" : `x^{${deg}}`;
    } else {
      body = deg === 1 ? `${abs}x` : `${abs}x^{${deg}}`;
    }
    if (forceSign) {
      return coeff < 0 ? `- ${body}` : `+ ${body}`;
    }
    return coeff < 0 ? `-${body}` : body;
  }

  function polyLatex(coeffs) {
    const maxDeg = coeffs.length - 1;
    const parts = [];
    for (let i = 0; i < coeffs.length; i += 1) {
      const c = coeffs[i];
      if (c === 0) continue;
      parts.push(termLatex(c, maxDeg - i, { forceSign: parts.length > 0 }));
    }
    return parts.length ? parts.join(" ") : "0";
  }

  function nonZeroTerms(coeffs) {
    const terms = [];
    for (let i = 0; i < coeffs.length; i += 1) {
      if (coeffs[i] === 0) continue;
      terms.push({ coeff: coeffs[i], deg: DEG_MAX - i });
    }
    return terms;
  }

  function addPolys(a, b) {
    return a.map((v, i) => v + b[i]);
  }

  function subPolys(a, b) {
    return a.map((v, i) => v - b[i]);
  }

  function mulPolys(a, b) {
    const out = Array(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i += 1) {
      for (let j = 0; j < b.length; j += 1) {
        out[i + j] += a[i] * b[j];
      }
    }
    return out;
  }

  function applyLandingContent() {
    const c = t();
    if (!c) return;
    const eyebrow = $("#landingEyebrow");
    const title = $("#landingTitle");
    const start = $("#startButton");
    if (eyebrow) eyebrow.textContent = c.landing?.eyebrow || "";
    if (title) title.textContent = c.landing?.title || "";
    if (start) start.textContent = c.landing?.start || "เริ่ม";
  }

  function applyAppChrome() {
    const c = t();
    if (!c) return;
    const title = $("#appTitle");
    if (title) title.textContent = c.app?.title || c.landing?.title || "";
    const defineLabel = $("#defineLabel");
    if (defineLabel) defineLabel.textContent = c.ui?.defineLabel || "กำหนดพหุนาม";
    const opsLabel = $("#opsLabel");
    if (opsLabel) opsLabel.textContent = c.ui?.opsLabel || "เลือกการดำเนินการเพื่อศึกษา";
  }

  function showApp() {
    const landing = $("#landingPage");
    const app = $("#appPage");
    landing?.classList.remove("view--active");
    landing?.setAttribute("hidden", "");
    app?.removeAttribute("hidden");
    app?.classList.add("view--active");
    $("#appTitle")?.focus();
    updateAll();
  }

  function updatePreviews() {
    const p = readPoly("p");
    const q = readPoly("q");
    const pEl = $("#pPreview");
    const qEl = $("#qPreview");
    if (pEl) pEl.innerHTML = katexHtml(`P(x) = ${polyLatex(p)}`);
    if (qEl) qEl.innerHTML = katexHtml(`Q(x) = ${polyLatex(q)}`);
  }

  function buildVertical(top, bottom, opSymbol, result) {
    const row = (coeffs) =>
      coeffs
        .map((c, i) => {
          const deg = DEG_MAX - i;
          return `<span class="vcalc__term">${katexHtml(
            termLatex(c, deg, { showZero: true, forceSign: i > 0 })
          )}</span>`;
        })
        .join("");

    return `
      <div class="vcalc">
        <div class="vcalc__stack">
          <div class="vcalc__pair">
            <div class="vcalc__row">${row(top)}</div>
            <div class="vcalc__row">${row(bottom)}</div>
            <span class="vcalc__side-op">${katexHtml(opSymbol)}</span>
          </div>
          <div class="vcalc__rule" aria-hidden="true"></div>
          <div class="vcalc__row vcalc__row--ans">${row(result)}</div>
          <div class="vcalc__double" aria-hidden="true"></div>
        </div>
      </div>
    `;
  }

  function renderAddSub(p, q, op) {
    const ui = t()?.ui || {};
    const isAdd = op === "add";
    const result = isAdd ? addPolys(p, q) : subPolys(p, q);
    const symbol = isAdd ? "+" : "-";
    const left = `P(x) ${symbol} Q(x)`;
    const setup = `${left} = \\bigl(${polyLatex(p)}\\bigr) ${symbol} \\bigl(${polyLatex(q)}\\bigr)`;

    return `
      <div class="work-line work-line--setup">${katexHtml(setup)}</div>
      ${buildVertical(p, q, symbol, result)}
      <div class="work-line work-line--therefore">
        <span class="work-line__therefore">${escapeHtml(ui.therefore || "ดังนั้น")}</span>
        ${katexHtml(`${left} = ${polyLatex(result)}`)}
      </div>
      <div class="work-note">${isAdd ? ui.noteAdd || "" : ui.noteSub || ""}</div>
    `;
  }

  function makePolyChips(terms, colors, prefix, activeIdx = null) {
    const bits = [];
    terms.forEach((term, i) => {
      const color = colors[i % colors.length];
      if (i > 0) {
        bits.push(`<span class="term-join">${term.coeff < 0 ? "" : "+"}</span>`);
      }
      const tex = termLatex(term.coeff, term.deg);
      const active = activeIdx === i ? " is-source" : "";
      bits.push(
        `<span class="term-chip${active}" id="${prefix}-term-${i}" data-side="${prefix}" data-idx="${i}" style="--chip-bg:${color}">${katexHtml(
          tex
        )}</span>`
      );
    });
    return bits.join("");
  }

  function productValue(a, b) {
    return { coeff: a.coeff * b.coeff, deg: a.deg + b.deg };
  }

  function renderMul(p, q) {
    const ui = t()?.ui || {};
    const pTerms = nonZeroTerms(p);
    const qTerms = nonZeroTerms(q);
    const product = mulPolys(p, q);

    if (!pTerms.length || !qTerms.length) {
      return `
        <div class="work-line work-line--setup">
          ${katexHtml(`P(x) \\cdot Q(x) = \\bigl(${polyLatex(p)}\\bigr)\\bigl(${polyLatex(q)}\\bigr) = 0`)}
        </div>
        <div class="work-line work-line--therefore">
          <span class="work-line__therefore">${escapeHtml(ui.therefore || "ดังนั้น")}</span>
          ${katexHtml("P(x) \\cdot Q(x) = 0")}
        </div>
        <div class="work-note">${ui.noteZero || ui.noteMul || ""}</div>
      `;
    }

    const pairs = [];
    pTerms.forEach((pt, pi) => {
      qTerms.forEach((qt, qi) => {
        pairs.push({ pt, qt, pi, qi, key: `${pi}-${qi}` });
      });
    });

    const pairCount = pairs.length;
    const dense = pairCount > 8;
    let activePi = null;
    let activeQi = null;
    if (state.selectedPair) {
      const [ps, qs] = state.selectedPair.split("-");
      activePi = Number(ps);
      activeQi = Number(qs);
    }

    const setupInner = `
      <span class="mul-paren">(</span>${makePolyChips(pTerms, P_COLORS, "p", activePi)}<span class="mul-paren">)</span><span class="mul-paren">(</span>${makePolyChips(
      qTerms,
      Q_COLORS,
      "q",
      activeQi
    )}<span class="mul-paren">)</span>
    `;

    const expansion = pairs
      .map((pair, idx) => {
        const pColor = P_COLORS[pair.pi % P_COLORS.length];
        const qColor = Q_COLORS[pair.qi % Q_COLORS.length];
        const active = state.selectedPair === pair.key ? " is-active" : "";
        const join = idx > 0 ? `<span class="pair-join">+</span>` : "";
        return `${join}<button type="button" class="pair-chip${active}${
          dense ? " pair-chip--dense" : ""
        }" data-pair="${pair.key}" data-pi="${pair.pi}" data-qi="${pair.qi}" aria-pressed="${
          state.selectedPair === pair.key ? "true" : "false"
        }">
          <span class="pair-chip__a" style="--chip-bg:${pColor}">${katexHtml(
          `(${termLatex(pair.pt.coeff, pair.pt.deg)})`
        )}</span><span class="pair-chip__b" style="--chip-bg:${qColor}">${katexHtml(
          `(${termLatex(pair.qt.coeff, pair.qt.deg)})`
        )}</span>
        </button>`;
      })
      .join("");

    const expandedTerms = pairs.map((pair) => productValue(pair.pt, pair.qt));
    const expandedLatex = expandedTerms
      .map((term, i) => termLatex(term.coeff, term.deg, { forceSign: i > 0 }))
      .join(" ");

    const maxDeg = product.length - 1;
    const groups = [];
    for (let deg = maxDeg; deg >= 0; deg -= 1) {
      const matching = expandedTerms.filter((term) => term.deg === deg && term.coeff !== 0);
      if (!matching.length) continue;
      if (matching.length === 1) {
        groups.push(termLatex(matching[0].coeff, deg, { forceSign: groups.length > 0 }));
      } else {
        const insides = matching
          .map((term, i) => {
            if (i === 0) return String(term.coeff);
            return term.coeff < 0 ? `- ${Math.abs(term.coeff)}` : `+ ${term.coeff}`;
          })
          .join(" ");
        const body =
          deg === 0 ? `(${insides})` : deg === 1 ? `(${insides})x` : `(${insides})x^{${deg}}`;
        groups.push(groups.length === 0 ? body : `+ ${body}`);
      }
    }
    const groupedLatex = groups.length ? groups.join(" ") : "0";
    const finalLatex = polyLatex(product);
    const degP = degree(p);
    const degQ = degree(q);
    const note = degP === null || degQ === null ? ui.noteZero : ui.noteMul;

    return `
      <div class="mul-stage" data-pair-count="${pairCount}">
        <div class="work-line work-line--setup mul-line1">
          <span class="mul-setup-label">${katexHtml("P(x) \\cdot Q(x) =")}</span>
          <div class="mul-line1__expr" id="mulLine1">
            ${setupInner}
            <svg class="mul-arrows" id="mulArrows" aria-hidden="true"></svg>
          </div>
        </div>
        <div class="work-line work-line--expand mul-line2">
          <span class="mul-eq">${katexHtml("=")}</span>
          <div class="mul-pairs ${dense ? "mul-pairs--dense" : ""}" id="mulPairs" role="group" aria-label="${escapeHtml(
      ui.pickPairHint || ""
    )}">
            ${expansion}
          </div>
        </div>
        <p class="mul-hint">${escapeHtml(ui.pickPairHint || "")}</p>
        <div class="work-line">${katexHtml(`= ${expandedLatex}`)}</div>
        <div class="work-line">${katexHtml(`= ${groupedLatex}`)}</div>
        <div class="work-line">${katexHtml(`= ${finalLatex}`)}</div>
        <div class="work-line work-line--therefore">
          <span class="work-line__therefore">${escapeHtml(ui.therefore || "ดังนั้น")}</span>
          ${katexHtml(`P(x) \\cdot Q(x) = ${finalLatex}`)}
        </div>
        <div class="work-note">${note || ""}</div>
      </div>
    `;
  }

  function drawMulArrow() {
    const svg = $("#mulArrows");
    const line1 = $("#mulLine1");
    if (!svg || !line1) return;
    svg.innerHTML = "";
    if (!state.selectedPair) return;

    const [piStr, qiStr] = state.selectedPair.split("-");
    const pChip = $(`#p-term-${piStr}`);
    const qChip = $(`#q-term-${qiStr}`);
    if (!pChip || !qChip) return;

    const box = line1.getBoundingClientRect();
    const a = pChip.getBoundingClientRect();
    const b = qChip.getBoundingClientRect();

    /* Keep the arc clear of term chips (start/end below boxes, deeper curve). */
    const clearBelow = 10;
    const curveDepth = 44;
    const x1 = a.left + a.width / 2 - box.left;
    const y1 = a.bottom - box.top + clearBelow;
    const x2 = b.left + b.width / 2 - box.left;
    const y2 = b.bottom - box.top + clearBelow;
    const midY = Math.max(y1, y2) + curveDepth;
    const path = `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${midY} ${x2} ${y2}`;

    const height = Math.max(box.height, midY + 12);
    svg.setAttribute("width", String(Math.ceil(box.width)));
    svg.setAttribute("height", String(Math.ceil(height)));
    svg.style.width = `${box.width}px`;
    svg.style.height = `${height}px`;

    svg.innerHTML = `
      <defs>
        <marker id="mulArrowHead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#1e88e5"></path>
        </marker>
      </defs>
      <path d="${path}" fill="none" stroke="#1e88e5" stroke-width="2.5" marker-end="url(#mulArrowHead)"></path>
    `;
  }

  /** Align vertical calc so its left edge matches the first \bigl( after "=". */
  function alignVcalcToOpenParen() {
    const setup = $(".work-line--setup");
    const vcalc = $(".vcalc");
    if (!vcalc) return;
    if (!setup) {
      vcalc.style.paddingLeft = "";
      return;
    }

    const equals = Array.from(setup.querySelectorAll(".mrel")).find(
      (el) => el.textContent.trim() === "="
    );
    const openParen = Array.from(setup.querySelectorAll(".mopen")).find((el) => {
      if (!el.textContent.includes("(")) return false;
      if (!equals) return true;
      return (equals.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    });
    if (!openParen) {
      vcalc.style.paddingLeft = "";
      return;
    }

    const offset = openParen.getBoundingClientRect().left - setup.getBoundingClientRect().left;
    vcalc.style.paddingLeft = `${Math.max(0, Math.round(offset))}px`;
  }

  function scheduleWorkLayout() {
    requestAnimationFrame(() => {
      alignVcalcToOpenParen();
      fitVcalcRulesToConstant();
      drawMulArrow();
    });
  }

  /** Size underline/double-line to end at the constant (c) digits, not empty column space.
   *  Place the side +/− two character spaces after the last digit. */
  function fitVcalcRulesToConstant() {
    const stack = $(".vcalc__stack");
    const rules = $$(".vcalc__rule, .vcalc__double");
    const sideOp = $(".vcalc__side-op");
    const pair = $(".vcalc__pair");

    if (!stack || !rules.length) {
      rules.forEach((el) => {
        el.style.width = "";
        el.style.marginRight = "";
        el.style.alignSelf = "";
      });
      if (sideOp) {
        sideOp.style.left = "";
        sideOp.style.right = "";
        sideOp.style.marginLeft = "";
      }
      return;
    }

    const stackLeft = stack.getBoundingClientRect().left;
    let end = 0;

    $$(".vcalc__row", stack).forEach((row) => {
      const terms = $$(".vcalc__term", row);
      const cTerm = terms[terms.length - 1];
      if (!cTerm) return;
      const content = cTerm.querySelector(".katex") || cTerm;
      end = Math.max(end, content.getBoundingClientRect().right - stackLeft);
    });

    if (end <= 0) return;

    const width = `${Math.ceil(end)}px`;
    rules.forEach((el) => {
      el.style.width = width;
      el.style.marginRight = "0";
      el.style.alignSelf = "flex-start";
    });

    if (sideOp && pair) {
      const pairLeft = pair.getBoundingClientRect().left;
      const opLeft = Math.ceil(end - (pairLeft - stackLeft));
      sideOp.style.left = `${opLeft}px`;
      sideOp.style.right = "auto";
      sideOp.style.marginLeft = "2ch";
    }
  }

  function renderWork() {
    const p = readPoly("p");
    const q = readPoly("q");
    const body = $("#workBody");
    if (!body) return;

    if (!state.operation) {
      state.selectedPair = null;
      body.innerHTML = "";
      return;
    }

    if (state.operation === "mul") {
      body.innerHTML = renderMul(p, q);
    } else {
      state.selectedPair = null;
      body.innerHTML = renderAddSub(p, q, state.operation);
    }

    renderMath(body);
    scheduleWorkLayout();
  }

  function updateAll() {
    updatePreviews();
    renderWork();
  }

  function bindCoeffInputs() {
    $$(".poly-coeff").forEach((input) => {
      input.addEventListener("input", () => {
        sanitizeCoeffInput(input);
        state.selectedPair = null;
        updateAll();
      });
      input.addEventListener("blur", () => {
        const parsed = parseCoeff(input.value);
        if (!parsed.ok || parsed.empty) {
          input.value = "0";
        } else {
          input.value = String(parsed.value);
        }
        updateAll();
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") input.blur();
      });
    });
  }

  function bindOps() {
    $$('input[name="operation"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        if (!radio.checked) return;
        state.operation = radio.value;
        state.selectedPair = null;
        updateAll();
      });
    });
  }

  function bindWorkClicks() {
    $("#workBody")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".pair-chip");
      if (!btn) return;
      const key = btn.getAttribute("data-pair");
      state.selectedPair = state.selectedPair === key ? null : key;
      renderWork();
    });
  }

  function bindResize() {
    window.addEventListener("resize", () => {
      alignVcalcToOpenParen();
      fitVcalcRulesToConstant();
      drawMulArrow();
    });
  }

  function init() {
    applyLandingContent();
    applyAppChrome();

    $("#startButton")?.addEventListener("click", showApp);

    bindCoeffInputs();
    bindOps();
    bindWorkClicks();
    bindResize();

    renderMath(document.body);

    if (document.fonts?.ready) {
      document.fonts.ready.then(scheduleWorkLayout);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
