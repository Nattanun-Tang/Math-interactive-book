(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const P_DEG_MAX = 4;
  const Q_DEG_LONG = 2;
  const Q_DEG_SYNTH = 1;

  const state = {
    method: "long",
    step: 0,
    maxStep: 0,
    plan: null,
    synthMeta: null
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

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function parseCoeff(raw) {
    const text = String(raw ?? "").trim();
    if (text === "" || text === "-" || text === "+") return { ok: true, value: 0 };
    if (!/^[+-]?\d+$/.test(text)) return { ok: false, value: 0 };
    const n = Number(text);
    if (!Number.isInteger(n)) return { ok: false, value: 0 };
    return { ok: true, value: n };
  }

  function sanitizeCoeffInput(input) {
    const before = input.value;
    let next = before.replace(/[eE.].*$/, "");
    next = next.replace(/[^\d+-]/g, "");
    next = next.replace(/(?!^)[+-]/g, "");
    if (next !== before) input.value = next;
  }

  function readPoly(which, maxDeg) {
    const coeffs = [];
    const invalidHint = t()?.ui?.invalidCoeff || "";
    for (let deg = maxDeg; deg >= 0; deg -= 1) {
      const el = $(`#${which}${deg}`);
      if (!el || el.classList.contains("div-coeff--disabled")) {
        coeffs.push(0);
        continue;
      }
      const parsed = parseCoeff(el.value);
      coeffs.push(parsed.ok ? parsed.value : 0);
      el.classList.toggle("div-coeff--invalid", !parsed.ok);
      el.setAttribute("aria-invalid", parsed.ok ? "false" : "true");
      if (!parsed.ok && invalidHint) el.title = invalidHint;
      else el.removeAttribute("title");
    }
    return coeffs;
  }

  function degree(coeffs) {
    for (let i = 0; i < coeffs.length; i += 1) {
      if (coeffs[i] !== 0) return coeffs.length - 1 - i;
    }
    return -1;
  }

  function trimLeading(coeffs) {
    let i = 0;
    while (i < coeffs.length - 1 && coeffs[i] === 0) i += 1;
    return coeffs.slice(i);
  }

  function padToDegree(coeffs, maxDeg) {
    const out = Array(maxDeg + 1).fill(0);
    const src = trimLeading(coeffs);
    const start = maxDeg + 1 - src.length;
    for (let i = 0; i < src.length; i += 1) out[start + i] = src[i];
    return out;
  }

  function termLatex(coeff, deg, { showZero = false, forceSign = false } = {}) {
    if (coeff === 0) {
      if (!showZero) return "";
      const z = deg === 0 ? "0" : deg === 1 ? "0x" : `0x^{${deg}}`;
      return forceSign ? `+ ${z}` : z;
    }
    const abs = Math.abs(coeff);
    let body;
    if (deg === 0) body = String(abs);
    else if (abs === 1) body = deg === 1 ? "x" : `x^{${deg}}`;
    else body = deg === 1 ? `${abs}x` : `${abs}x^{${deg}}`;
    if (forceSign) return coeff < 0 ? `- ${body}` : `+ ${body}`;
    return coeff < 0 ? `-${body}` : body;
  }

  function polyLatex(coeffs) {
    const trimmed = trimLeading(coeffs);
    const maxDeg = trimmed.length - 1;
    const parts = [];
    for (let i = 0; i < trimmed.length; i += 1) {
      const c = trimmed[i];
      if (c === 0) continue;
      parts.push(termLatex(c, maxDeg - i, { forceSign: parts.length > 0 }));
    }
    return parts.length ? parts.join(" ") : "0";
  }

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) {
      const tmp = y;
      y = x % y;
      x = tmp;
    }
    return x || 1;
  }

  function rat(n, d = 1) {
    if (d < 0) {
      n = -n;
      d = -d;
    }
    if (n === 0) return { n: 0, d: 1 };
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
  }

  function ratZeros(n) {
    return Array.from({ length: n }, () => rat(0));
  }

  function ratAdd(a, b) {
    return rat(a.n * b.d + b.n * a.d, a.d * b.d);
  }

  function ratSub(a, b) {
    return rat(a.n * b.d - b.n * a.d, a.d * b.d);
  }

  function ratMul(a, b) {
    return rat(a.n * b.n, a.d * b.d);
  }

  function ratDiv(a, b) {
    if (b.n === 0) return rat(0);
    return rat(a.n * b.d, a.d * b.n);
  }

  function ratIsZero(a) {
    return a.n === 0;
  }

  function ratLatex(r, { forceSign = false } = {}) {
    if (r.n === 0) return forceSign ? "+ 0" : "0";
    const neg = r.n < 0;
    const absN = Math.abs(r.n);
    const body = r.d === 1 ? String(absN) : `\\dfrac{${absN}}{${r.d}}`;
    if (forceSign) return neg ? `- ${body}` : `+ ${body}`;
    return neg ? `-${body}` : body;
  }

  function ratTermLatex(r, deg, { showZero = false, forceSign = false } = {}) {
    if (ratIsZero(r)) {
      if (!showZero) return "";
      const z = deg === 0 ? "0" : deg === 1 ? "0x" : `0x^{${deg}}`;
      return forceSign ? `+ ${z}` : z;
    }
    const neg = r.n < 0;
    const absN = Math.abs(r.n);
    let coeffBody;
    if (r.d === 1) {
      coeffBody = absN === 1 && deg > 0 ? "" : String(absN);
    } else {
      coeffBody = `\\dfrac{${absN}}{${r.d}}`;
    }
    let body;
    if (deg === 0) body = coeffBody || "1";
    else if (deg === 1) body = `${coeffBody}x`;
    else body = `${coeffBody}x^{${deg}}`;
    if (forceSign) return neg ? `- ${body}` : `+ ${body}`;
    return neg ? `-${body}` : body;
  }

  function ratPolyLatex(rats, maxDeg) {
    const parts = [];
    for (let i = 0; i < rats.length; i += 1) {
      const deg = maxDeg - i;
      if (ratIsZero(rats[i])) continue;
      parts.push(ratTermLatex(rats[i], deg, { forceSign: parts.length > 0 }));
    }
    return parts.length ? parts.join(" ") : "0";
  }

  /** Remainder as summand: one term → no parens; multiple → +(…). */
  function remSummandLatex(rats, maxDeg) {
    const terms = rats.filter((r) => !ratIsZero(r));
    const tex = ratPolyLatex(rats, Math.max(0, maxDeg));
    if (terms.length <= 1) {
      if (terms.length === 1 && terms[0].n < 0) return ` ${tex}`;
      return ` + ${tex}`;
    }
    return ` + (${tex})`;
  }

  function remConstSummandLatex(r) {
    const tex = ratLatex(r);
    if (r.n < 0) return ` ${tex}`;
    return ` + ${tex}`;
  }

  function toRats(coeffs) {
    return coeffs.map((c) => rat(c));
  }

  function degreeRats(rats) {
    for (let i = 0; i < rats.length; i += 1) {
      if (!ratIsZero(rats[i])) return rats.length - 1 - i;
    }
    return -1;
  }

  function trimLeadingRats(rats) {
    let i = 0;
    while (i < rats.length - 1 && ratIsZero(rats[i])) i += 1;
    return rats.slice(i).map((r) => ({ ...r }));
  }

  function padRats(rats, maxDeg) {
    const out = ratZeros(maxDeg + 1);
    const trimmed = trimLeadingRats(rats);
    const d = degreeRats(trimmed);
    if (d < 0) return out;
    const start = maxDeg - d;
    for (let i = 0; i < trimmed.length; i += 1) out[start + i] = { ...trimmed[i] };
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
    const divideLabel = $("#divideLabel");
    if (divideLabel) {
      divideLabel.innerHTML = c.ui?.divideLabel || "หารพหุนาม $P(x)$ ด้วย $Q(x)$";
      renderMath(divideLabel);
    }
    const methodLabel = $("#methodLabel");
    if (methodLabel) methodLabel.textContent = c.ui?.methodLabel || "เลือกวิธีการหาร";
    $$('input[name="method"]').forEach((input) => {
      const span = input.parentElement?.querySelector("span");
      if (!span) return;
      if (input.value === "long") span.textContent = c.ui?.methodLong || "หารยาว";
      if (input.value === "synth") span.textContent = c.ui?.methodSynth || "หารสังเคราะห์";
    });
    const prev = $("#prevBtn");
    const next = $("#nextBtn");
    const all = $("#allBtn");
    if (prev) prev.textContent = c.ui?.prev || "ก่อนหน้า";
    if (next) next.textContent = c.ui?.next || "ถัดไป";
    if (all) all.textContent = c.ui?.all || "ทั้งหมด";
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

  function updateMethodInputs() {
    const q2 = $("#q2");
    if (!q2) return;
    if (state.method === "synth") {
      q2.value = "";
      q2.classList.add("div-coeff--disabled");
      q2.setAttribute("disabled", "");
      q2.setAttribute("tabindex", "-1");
    } else {
      q2.classList.remove("div-coeff--disabled");
      q2.removeAttribute("disabled");
      q2.removeAttribute("tabindex");
    }
  }

  function updatePreviews() {
    const p = readPoly("p", P_DEG_MAX);
    const qMax = state.method === "synth" ? Q_DEG_SYNTH : Q_DEG_LONG;
    const q = readPoly("q", qMax);
    const pEl = $("#pPreview");
    const qEl = $("#qPreview");
    if (pEl) pEl.innerHTML = katexHtml(`P(x) = ${polyLatex(p)}`);
    if (qEl) qEl.innerHTML = katexHtml(`Q(x) = ${polyLatex(q)}`);
  }

  function validate(p, q) {
    const ui = t()?.ui || {};
    const degP = degree(p);
    const degQ = degree(q);
    if (degQ < 0) return { ok: false, msg: ui.errQZero || "Q(x) ≠ 0" };
    if (state.method === "synth" && degQ !== 1) {
      return { ok: false, msg: ui.errSynthDeg || "synthetic needs deg 1" };
    }
    if (state.method === "long" && degQ > 2) {
      return { ok: false, msg: ui.errLongDeg || "long max deg 2" };
    }
    if (degP < degQ) return { ok: false, msg: ui.errDeg || "deg P < deg Q" };
    return { ok: true };
  }

  function buildLongPlan(pCoeffs, qCoeffs) {
    const degP = degree(pCoeffs);
    const degQ = degree(qCoeffs);
    const p = toRats(padToDegree(pCoeffs, degP));
    const q = toRats(trimLeading(qCoeffs));
    const quotDeg = degP - degQ;
    const quotient = ratZeros(quotDeg + 1);
    const iterations = [];

    let current = p.map((r) => ({ ...r }));

    for (let k = 0; k <= quotDeg; k += 1) {
      const qTermDeg = quotDeg - k;
      const qTerm = ratDiv(current[0], q[0]);
      quotient[k] = qTerm;

      const productLen = qTermDeg + degQ + 1;
      const product = ratZeros(productLen);
      for (let i = 0; i < q.length; i += 1) {
        const deg = degQ - i + qTermDeg;
        product[productLen - 1 - deg] = ratMul(q[i], qTerm);
      }

      const workDeg = Math.max(degreeRats(current), qTermDeg + degQ);
      const curPad = padRats(current, workDeg);
      const prodPad = padRats(product, workDeg);
      const diff = curPad.map((r, i) => ratSub(r, prodPad[i]));
      let next = trimLeadingRats(diff);
      if (k < quotDeg) {
        const needDeg = qTermDeg - 1 + degQ;
        if (needDeg >= 0 && degreeRats(next) < needDeg) next = padRats(next, needDeg);
      }

      iterations.push({
        qTerm,
        qTermDeg,
        product: prodPad,
        workDeg,
        diff,
        after: next
      });
      current = next;
    }

    const rem = current;
    return {
      type: "long",
      degP,
      degQ,
      p: padToDegree(pCoeffs, degP),
      q: trimLeading(qCoeffs),
      quotient,
      quotDeg,
      iterations,
      rem,
      remDeg: degreeRats(rem),
      remIsZero: rem.every(ratIsZero)
    };
  }

  function buildSynthPlan(pCoeffs, qCoeffs) {
    const q = trimLeading(qCoeffs);
    const a = q[0];
    const b = q[1];
    const lead = rat(a);
    const root = rat(-b, a);
    const degP = degree(pCoeffs);
    const coeffs = padToDegree(pCoeffs, degP).map((c) => rat(c));
    const n = coeffs.length;
    const bottom = Array(n).fill(null);
    const products = Array(n).fill(null);
    bottom[0] = { ...coeffs[0] };
    for (let i = 1; i < n; i += 1) {
      products[i] = ratMul(root, bottom[i - 1]);
      bottom[i] = ratAdd(coeffs[i], products[i]);
    }
    // Tableau is for (x − r); U(x) for ax+b is that quotient scaled by 1/a.
    const quotRats = bottom.slice(0, n - 1).map((r) => ratDiv(r, lead));
    return {
      type: "synth",
      degP,
      root,
      rootInt: root.d === 1 ? root.n : null,
      coeffs,
      products,
      bottom,
      quotRats,
      quotDeg: degP - 1,
      rem: bottom[n - 1],
      remIsZero: ratIsZero(bottom[n - 1]),
      p: padToDegree(pCoeffs, degP),
      q
    };
  }

  function buildPlan() {
    const p = readPoly("p", P_DEG_MAX);
    const qMax = state.method === "synth" ? Q_DEG_SYNTH : Q_DEG_LONG;
    const q = readPoly("q", qMax);
    const check = validate(p, q);
    if (!check.ok) return { type: "error", msg: check.msg };
    return state.method === "long" ? buildLongPlan(p, q) : buildSynthPlan(p, q);
  }

  function maxStepFor(plan) {
    if (!plan || plan.type === "error") return 0;
    if (plan.type === "long") return 1 + plan.iterations.length;
    return plan.coeffs.length + 2;
  }

  function cellHtml(tex, empty = false) {
    if (empty || tex === "" || tex == null) {
      return `<span class="ldiv__cell ldiv__cell--empty">0</span>`;
    }
    return `<span class="ldiv__cell">${katexHtml(tex)}</span>`;
  }

  function ratCell(r, deg, { forceSign = false } = {}) {
    if (r == null) return cellHtml("", true);
    return cellHtml(ratTermLatex(r, deg, { showZero: true, forceSign }), false);
  }

  function colStyle(nCols) {
    return `grid-template-columns: repeat(${nCols}, minmax(4.2em, auto));`;
  }

  function renderLong(plan, step) {
    if (step <= 0) {
      return { body: `<p class="div-work__hint">${escapeHtml(t()?.ui?.hint || "")}</p>`, conclusion: "" };
    }

    const degP = plan.degP;
    const nCols = degP + 1;
    const colDegs = Array.from({ length: nCols }, (_, i) => degP - i);
    const showIters = Math.min(Math.max(step - 1, 0), plan.iterations.length);
    const showConclusion = step >= maxStepFor(plan);

    const quotCells = colDegs.map((deg) => {
      const idx = plan.quotDeg - deg;
      if (idx < 0 || idx >= plan.quotient.length || idx >= showIters) return cellHtml("", true);
      return cellHtml(ratTermLatex(plan.quotient[idx], deg, { forceSign: idx > 0 }));
    });

    const dividendCells = plan.p.map((c, i) =>
      cellHtml(termLatex(c, degP - i, { showZero: true, forceSign: i > 0 }))
    );

    let rowsHtml = `<div class="ldiv__row ldiv__row--dividend" style="${colStyle(nCols)}">${dividendCells.join("")}</div>`;

    for (let i = 0; i < showIters; i += 1) {
      const it = plan.iterations[i];
      const prodStartDeg = it.qTermDeg + plan.degQ;
      const prodEndDeg = it.qTermDeg;
      const isFinalIter = i === plan.iterations.length - 1;

      const prodCells = colDegs.map((deg) => {
        if (deg > prodStartDeg || deg < prodEndDeg) return cellHtml("", true);
        const idx = it.workDeg - deg;
        return ratCell(it.product[idx], deg, { forceSign: deg !== prodStartDeg });
      });

      rowsHtml += `
        <div class="ldiv__row ldiv__row--prod" style="${colStyle(nCols)}">${prodCells.join("")}</div>
        <div class="ldiv__rule" aria-hidden="true"></div>
      `;

      const afterPad = padRats(it.diff, degP);
      const lead = degreeRats(it.diff);
      const minD = isFinalIter ? 0 : Math.max(0, it.qTermDeg - 1);

      const afterCells = colDegs.map((deg, ci) => {
        const r = afterPad[ci];
        if (isFinalIter) {
          if (lead < 0) return deg === 0 ? cellHtml("0") : cellHtml("", true);
          if (deg > lead) return cellHtml("", true);
          return ratCell(r, deg, { forceSign: deg !== lead });
        }
        if (lead < 0) {
          if (deg < minD) return cellHtml("", true);
          return ratCell(r, deg, { forceSign: deg !== minD });
        }
        if (deg > lead || deg < minD) return cellHtml("", true);
        return ratCell(r, deg, { forceSign: deg !== lead });
      });

      rowsHtml += `<div class="ldiv__row${isFinalIter ? " ldiv__row--rem" : ""}" style="${colStyle(nCols)}">${afterCells.join("")}</div>`;

      if (isFinalIter) {
        rowsHtml += `<div class="ldiv__double" aria-hidden="true"></div>`;
      }
    }

    const body = `
      <div class="ldiv">
        <svg class="ldiv__svg" aria-hidden="true"></svg>
        <div class="ldiv__quot-row" style="${colStyle(nCols)}">${quotCells.join("")}</div>
        <div class="ldiv__main">
          <div class="ldiv__divisor">${katexHtml(polyLatex(plan.q))}</div>
          <div class="ldiv__gutter" aria-hidden="true"></div>
          <div class="ldiv__work">
            ${rowsHtml}
          </div>
        </div>
      </div>
    `;

    let conclusion = "";
    if (showConclusion) {
      const ui = t()?.ui || {};
      const pTex = polyLatex(plan.p);
      const qTex = polyLatex(plan.q);
      const uTex = ratPolyLatex(plan.quotient, plan.quotDeg);
      const eq = plan.remIsZero
        ? `${pTex} = (${qTex})(${uTex})`
        : `${pTex} = (${qTex})(${uTex})${remSummandLatex(plan.rem, plan.remDeg)}`;
      conclusion = `<span class="therefore">${escapeHtml(ui.therefore || "ดังนั้น")}</span>${katexHtml(eq)}`;
    }

    return { body, conclusion };
  }

  function renderSynth(plan, step) {
    if (step <= 0) {
      return { body: `<p class="div-work__hint">${escapeHtml(t()?.ui?.hint || "")}</p>`, conclusion: "" };
    }

    const n = plan.coeffs.length;
    const showBringDown = step >= 2;
    const showConclusion = step >= maxStepFor(plan);
    const revealed = showConclusion ? n - 1 : Math.max(0, Math.min(n - 1, step - 2));
    // Always reserve mid row so the short-division mark stays the same height as later steps.
    const midRow = 2;
    const gapRow = 3;
    const botRow = 4;
    const doubleRow = 5;

    const cell = (col, row, html, extraClass = "") =>
      `<span class="synth__cell${extraClass ? ` ${extraClass}` : ""}" data-col="${col}" data-row="${row}" style="grid-column:${col + 1};grid-row:${row === "top" ? 1 : row === "mid" ? midRow : botRow}">${html}</span>`;

    const topCells = plan.coeffs
      .map((r, i) => cell(i, "top", `<span class="synth__val">${katexHtml(ratLatex(r))}</span>`))
      .join("");

    const midCells = plan.coeffs
      .map((_, i) => {
        if (i === 0 || i > revealed) return cell(i, "mid", "");
        const val = `<span class="synth__val">${katexHtml(ratLatex(plan.products[i]))}<span class="synth__plus">+</span></span>`;
        return cell(i, "mid", val, "synth__cell--plus");
      })
      .join("");

    const botCells = plan.coeffs
      .map((_, i) => {
        if (!showBringDown) return cell(i, "bot", "");
        if (i === 0) return cell(i, "bot", `<span class="synth__val">${katexHtml(ratLatex(plan.bottom[0]))}</span>`);
        if (i > revealed) return cell(i, "bot", "");
        return cell(i, "bot", `<span class="synth__val">${katexHtml(ratLatex(plan.bottom[i]))}</span>`);
      })
      .join("");

    const rootTex = plan.rootInt != null ? String(plan.rootInt) : ratLatex(plan.root);

    const body = `
      <div class="synth" id="synthStage">
        <svg class="synth__svg" id="synthSvg" aria-hidden="true"></svg>
        <div class="synth__layout">
          <div class="synth__left"><div class="synth__root">${katexHtml(rootTex)}</div></div>
          <div class="synth__gutter" aria-hidden="true"></div>
          <div class="synth__table" id="synthTable" style="grid-template-columns: repeat(${n}, minmax(2.8em, max-content));">
            ${topCells}
            ${midCells}
            <div class="synth__rule-gap" id="synthRuleGap" style="grid-column:1/-1;grid-row:${gapRow}" aria-hidden="true"></div>
            ${botCells}
            ${showConclusion ? `<div class="synth__double" style="grid-column:1/-1;grid-row:${doubleRow}"></div>` : ""}
          </div>
        </div>
      </div>
    `;

    let conclusion = "";
    if (showConclusion) {
      const ui = t()?.ui || {};
      const pTex = polyLatex(plan.p);
      const qTex = polyLatex(plan.q);
      const uTex = ratPolyLatex(plan.quotRats, plan.quotDeg);
      const eq = plan.remIsZero
        ? `${pTex} = (${qTex})(${uTex})`
        : `${pTex} = (${qTex})(${uTex})${remConstSummandLatex(plan.rem)}`;
      conclusion = `<span class="therefore">${escapeHtml(ui.therefore || "ดังนั้น")}</span>${katexHtml(eq)}`;
    }

    return { body, conclusion, synthMeta: { step, revealed, showBringDown, showConclusion, n } };
  }

  function equalizeSynthColumns(stage, n) {
    const table = stage.querySelector("#synthTable");
    if (!table || !n) return;
    // Equal column width from the widest digit/fraction; + sits in the column-gap.
    let max = 0;
    table.querySelectorAll(".synth__val").forEach((val) => {
      const num = val.querySelector(".katex") || val;
      max = Math.max(max, num.getBoundingClientRect().width);
    });
    const colW = Math.max(Math.ceil(max + 2), 40);
    table.style.gridTemplateColumns = `repeat(${n}, ${colW}px)`;
  }

  /** Keep + just right of mid value, and clear of a wider top-row number/fraction. */
  function placeSynthPluses(stage) {
    stage.querySelectorAll(".synth__cell--plus").forEach((cell) => {
      const plus = cell.querySelector(".synth__plus");
      const val = cell.querySelector(".synth__val");
      if (!plus || !val) return;
      const topVal = stage.querySelector(`[data-col="${cell.dataset.col}"][data-row="top"] .synth__val`);
      const valR = val.getBoundingClientRect().right;
      const topR = topVal ? topVal.getBoundingClientRect().right : valR;
      const clearPx = Math.max(0, topR - valR) + 5;
      plus.style.marginLeft = `${clearPx}px`;
    });
  }

  function drawSynthSvg(meta) {
    const stage = $("#synthStage");
    const svg = $("#synthSvg");
    if (!stage || !svg || !meta) return;

    equalizeSynthColumns(stage, meta.n);
    placeSynthPluses(stage);

    const stageRect = stage.getBoundingClientRect();
    const width = Math.max(1, stage.offsetWidth);
    const height = Math.max(1, stage.offsetHeight);
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const rel = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: r.left - stageRect.left + r.width / 2,
        y: r.top - stageRect.top + r.height / 2,
        top: r.top - stageRect.top,
        bottom: r.bottom - stageRect.top,
        left: r.left - stageRect.left,
        right: r.right - stageRect.left,
        width: r.width,
        height: r.height
      };
    };

    const rootEl = stage.querySelector(".synth__root");
    const gutter = stage.querySelector(".synth__gutter");
    const ruleGap = stage.querySelector("#synthRuleGap");
    const topCells = [...stage.querySelectorAll('[data-row="top"]')];
    const lastTop = topCells.length ? rel(topCells[topCells.length - 1]) : null;
    const firstTop = topCells.length ? rel(topCells[0]) : null;
    const topBox = firstTop
      ? {
          top: Math.min(...topCells.map((c) => rel(c).top)),
          bottom: Math.max(...topCells.map((c) => rel(c).bottom))
        }
      : null;
    const gapBox = rel(ruleGap);
    const gutterBox = rel(gutter);

    if (!topBox || !gapBox || !gutterBox || !firstTop || !lastTop) {
      svg.innerHTML = "";
      return;
    }

    // Slide13: ")" curve only spans the block above the rule, joined to the horizontal bar.
    const yTop = topBox.top - 2;
    const yLine = gapBox.top + gapBox.height / 2;
    const xLeft = gutterBox.left + 2;
    const xRight = gutterBox.right - 1;
    const midY = yTop + (yLine - yTop) * 0.5;
    const curve = [
      `M ${xLeft.toFixed(1)} ${yTop.toFixed(1)}`,
      `C ${xRight.toFixed(1)} ${(yTop + (midY - yTop) * 0.35).toFixed(1)}`,
      `${xRight.toFixed(1)} ${(yLine - (yLine - midY) * 0.35).toFixed(1)}`,
      `${xLeft.toFixed(1)} ${yLine.toFixed(1)}`
    ].join(" ");
    const barEnd = lastTop.right + 10;
    const bar = `M ${xLeft.toFixed(1)} ${yLine.toFixed(1)} L ${barEnd.toFixed(1)} ${yLine.toFixed(1)}`;

    // Keep root level with the top coefficient row (Slide9–13), not the mid products.
    if (rootEl) {
      const rootH = rootEl.getBoundingClientRect().height;
      const leftBox = rel(stage.querySelector(".synth__left"));
      if (leftBox) {
        rootEl.style.marginTop = `${Math.max(0, firstTop.y - leftBox.top - rootH / 2)}px`;
      }
    }

    const defs = `<defs>
      <marker id="synthArrowHead" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M1.5 1.5 L8 5 L1.5 8.5" fill="none" stroke="#111" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
      </marker>
    </defs>`;

    const frame = [
      `<path class="synth__frame" d="${curve}" />`,
      `<path class="synth__frame" d="${bar}" />`
    ];

    const arrows = [];
    const { revealed, showBringDown, showConclusion } = meta;
    const arrowPath = (d) =>
      `<path class="synth__arrow" marker-end="url(#synthArrowHead)" d="${d}" />`;

    if (!showConclusion) {
      if (showBringDown && revealed === 0) {
        const top0 = rel(stage.querySelector('[data-col="0"][data-row="top"]'));
        const bot0 = rel(stage.querySelector('[data-col="0"][data-row="bot"]'));
        if (top0 && bot0) {
          arrows.push(
            arrowPath(
              `M ${top0.x.toFixed(1)} ${(top0.bottom + 2).toFixed(1)} L ${top0.x.toFixed(1)} ${(bot0.top - 3).toFixed(1)}`
            )
          );
        }
      } else if (revealed >= 1) {
        const rootBox = rel(rootEl);
        const botPrev = rel(stage.querySelector(`[data-col="${revealed - 1}"][data-row="bot"]`));
        const mid = rel(stage.querySelector(`[data-col="${revealed}"][data-row="mid"]`));
        if (rootBox && botPrev) {
          arrows.push(
            arrowPath(
              `M ${(rootBox.right + 3).toFixed(1)} ${rootBox.y.toFixed(1)} L ${(botPrev.x - 2).toFixed(1)} ${(botPrev.top + 2).toFixed(1)}`
            )
          );
        }
        if (botPrev && mid) {
          arrows.push(
            arrowPath(
              `M ${(botPrev.x + 4).toFixed(1)} ${(botPrev.top - 1).toFixed(1)} L ${(mid.left + mid.width * 0.2).toFixed(1)} ${(mid.y + 2).toFixed(1)}`
            )
          );
        }
      }
    }

    svg.innerHTML = defs + frame.join("") + arrows.join("");
  }

  function cellContentRect(cell) {
    const content = cell.querySelector(".katex") || cell;
    return content.getBoundingClientRect();
  }

  function visibleCells(row) {
    return [...row.querySelectorAll(".ldiv__cell:not(.ldiv__cell--empty)")];
  }

  function contentSpan(cells) {
    if (!cells.length) return null;
    let left = Infinity;
    let right = -Infinity;
    cells.forEach((cell) => {
      const r = cellContentRect(cell);
      left = Math.min(left, r.left);
      right = Math.max(right, r.right);
    });
    if (!Number.isFinite(left) || right <= left) return null;
    return { left, right };
  }

  function placeRule(rule, span, originLeft, pad = 2) {
    if (!rule || !span) {
      if (rule) rule.style.visibility = "hidden";
      return;
    }
    rule.style.visibility = "visible";
    rule.style.marginLeft = `${Math.max(0, span.left - originLeft - pad)}px`;
    rule.style.width = `${Math.max(10, span.right - span.left + pad * 2)}px`;
  }

  function alignLongRules(ldiv) {
    const work = ldiv.querySelector(".ldiv__work");
    if (!work) return;
    const originLeft = work.getBoundingClientRect().left;

    work.querySelectorAll(".ldiv__rule").forEach((rule) => {
      const row = rule.previousElementSibling;
      if (!row?.classList.contains("ldiv__row--prod")) {
        rule.style.visibility = "hidden";
        return;
      }
      placeRule(rule, contentSpan(visibleCells(row)), originLeft, 3);
    });

    const dbl = work.querySelector(".ldiv__double");
    if (dbl) {
      const remRow = dbl.previousElementSibling;
      placeRule(dbl, remRow ? contentSpan(visibleCells(remRow)) : null, originLeft, 2);
    }
  }

  function drawLongSvg(ldiv) {
    const svg = ldiv.querySelector(".ldiv__svg");
    const gutter = ldiv.querySelector(".ldiv__gutter");
    const work = ldiv.querySelector(".ldiv__work");
    const dividend = ldiv.querySelector(".ldiv__row--dividend");
    if (!svg || !gutter || !work || !dividend) return;

    const root = ldiv.getBoundingClientRect();
    const width = Math.max(1, ldiv.offsetWidth);
    const height = Math.max(1, ldiv.offsetHeight);
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const g = gutter.getBoundingClientRect();
    const w = work.getBoundingClientRect();
    const d = dividend.getBoundingClientRect();
    const dividendSpan = contentSpan(visibleCells(dividend));

    const barY = Math.max(1, d.top - root.top - 4);
    const yBot = d.bottom - root.top + 2;
    const xLeft = g.left - root.left + 2;
    const xRight = g.right - root.left - 1;
    // Top bar ends with the dividend polynomial (Slide6), not the stretched card width.
    const barEnd = dividendSpan
      ? dividendSpan.right - root.left + 6
      : w.right - root.left;

    // Slide6: curved ")" beside the dividend, joined to the top bar.
    const mid = barY + (yBot - barY) * 0.5;
    const curve = [
      `M ${xLeft.toFixed(1)} ${barY.toFixed(1)}`,
      `C ${xRight.toFixed(1)} ${(barY + (mid - barY) * 0.35).toFixed(1)}`,
      `${xRight.toFixed(1)} ${(yBot - (yBot - mid) * 0.35).toFixed(1)}`,
      `${xLeft.toFixed(1)} ${yBot.toFixed(1)}`
    ].join(" ");
    const bar = `M ${xLeft.toFixed(1)} ${barY.toFixed(1)} L ${barEnd.toFixed(1)} ${barY.toFixed(1)}`;

    svg.innerHTML = [
      `<path d="${curve}" fill="none" stroke="#111" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" />`,
      `<path d="${bar}" fill="none" stroke="#111" stroke-width="2.25" stroke-linecap="butt" />`
    ].join("");
  }

  function alignLongDivision() {
    const ldiv = $(".ldiv");
    if (!ldiv) return;
    const divisor = ldiv.querySelector(".ldiv__divisor");
    const gutter = ldiv.querySelector(".ldiv__gutter");
    if (!divisor) return;
    const gap = 4;
    const left =
      divisor.getBoundingClientRect().width +
      (gutter?.getBoundingClientRect().width || 18) +
      gap;
    ldiv.style.setProperty("--ldiv-left", `${left}px`);
    alignLongRules(ldiv);
    drawLongSvg(ldiv);
  }

  function updateNav() {
    const prev = $("#prevBtn");
    const next = $("#nextBtn");
    const all = $("#allBtn");
    if (prev) prev.disabled = state.step <= 0;
    if (next) next.disabled = state.step >= state.maxStep;
    if (all) all.disabled = state.maxStep <= 0;
  }

  function renderWork() {
    const body = $("#workBody");
    const concl = $("#workConclusion");
    if (!body || !concl) return;

    const plan = state.plan;
    if (!plan || plan.type === "error") {
      body.innerHTML = plan?.msg
        ? `<p class="div-work__error">${plan.msg}</p>`
        : `<p class="div-work__hint">${escapeHtml(t()?.ui?.hint || "")}</p>`;
      renderMath(body);
      concl.innerHTML = "";
      state.maxStep = 0;
      state.step = 0;
      state.synthMeta = null;
      updateNav();
      return;
    }

    state.maxStep = maxStepFor(plan);
    if (state.step > state.maxStep) state.step = state.maxStep;

    const result = plan.type === "long" ? renderLong(plan, state.step) : renderSynth(plan, state.step);
    body.innerHTML = result.body;
    concl.innerHTML = result.conclusion || "";
    state.synthMeta = result.synthMeta || null;
    updateNav();

    requestAnimationFrame(() => {
      alignLongDivision();
      if (state.synthMeta) drawSynthSvg(state.synthMeta);
    });
  }

  function updateAll() {
    updateMethodInputs();
    updatePreviews();
    state.plan = buildPlan();
    renderWork();
  }

  function resetStepAndUpdate() {
    state.step = 0;
    updateAll();
  }

  function openInfo() {
    const ui = t()?.ui || {};
    const modal = $("#infoModal");
    const title = $("#infoTitle");
    const body = $("#infoBody");
    if (!modal || !title || !body) return;
    title.textContent = ui.infoTitle || "";
    body.innerHTML = (ui.infoBody || []).map((line) => `<p>${line}</p>`).join("");
    renderMath(body);
    modal.removeAttribute("hidden");
    $("#infoCloseBtn")?.focus();
  }

  function closeInfo() {
    $("#infoModal")?.setAttribute("hidden", "");
    $("#infoBtn")?.focus();
  }

  function bind() {
    $("#startButton")?.addEventListener("click", showApp);

    $$(".div-coeff").forEach((input) => {
      input.addEventListener("input", () => {
        sanitizeCoeffInput(input);
        resetStepAndUpdate();
      });
      input.addEventListener("change", resetStepAndUpdate);
    });

    $$('input[name="method"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        if (!radio.checked) return;
        state.method = radio.value;
        resetStepAndUpdate();
      });
    });

    $("#prevBtn")?.addEventListener("click", () => {
      if (state.step > 0) {
        state.step -= 1;
        renderWork();
      }
    });

    $("#nextBtn")?.addEventListener("click", () => {
      if (state.step < state.maxStep) {
        state.step += 1;
        renderWork();
      }
    });

    $("#allBtn")?.addEventListener("click", () => {
      state.step = state.maxStep;
      renderWork();
    });

    $("#workReset")?.addEventListener("click", () => {
      state.step = 0;
      renderWork();
    });

    $("#infoBtn")?.addEventListener("click", openInfo);
    $("#infoCloseBtn")?.addEventListener("click", closeInfo);
    $("#infoModal")?.addEventListener("click", (e) => {
      if (e.target?.dataset?.close) closeInfo();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#infoModal")?.hasAttribute("hidden")) closeInfo();
    });

    window.addEventListener("resize", () => {
      alignLongDivision();
      if (state.synthMeta) drawSynthSvg(state.synthMeta);
    });
  }

  function init() {
    applyLandingContent();
    applyAppChrome();
    bind();
    updateMethodInputs();
    updatePreviews();
    renderMath(document.body);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
