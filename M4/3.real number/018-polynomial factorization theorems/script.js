(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const P_DEG_MAX = 4;

  const state = {
    mode: "learn",
    theoremId: "remainder",
    step: 0,
    showAll: false,
    plan: null
  };

  function t() {
    return window.CONTENT?.th;
  }

  function theorems() {
    return t()?.theorems || [];
  }

  function currentTheorem() {
    return theorems().find((item) => item.id === state.theoremId) || theorems()[0] || null;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
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

  /** Render one equation row as LHS = RHS (aligned via CSS grid). */
  function eqLineHtml(line) {
    if (typeof line === "string") return `<p>${line}</p>`;
    const prefix = line.prefix
      ? `<span class="eq-prefix">${escapeHtml(line.prefix)}</span>`
      : `<span class="eq-prefix"></span>`;
    const lhs = line.lhs
      ? `<span class="eq-lhs">$${line.lhs}$</span>`
      : `<span class="eq-lhs"></span>`;
    return `<p class="eq-row">${prefix}${lhs}<span class="eq-eq">=</span><span class="eq-rhs">$${line.rhs || ""}$</span></p>`;
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
      if (!el) {
        coeffs.push(0);
        continue;
      }
      const parsed = parseCoeff(el.value);
      coeffs.push(parsed.ok ? parsed.value : 0);
      el.classList.toggle("coeff-input--invalid", !parsed.ok);
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

  function termLatex(coeff, deg, { forceSign = false } = {}) {
    if (coeff === 0) return "";
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
    if (d === 0) return { n: 0, d: 1 };
    if (d < 0) {
      n = -n;
      d = -d;
    }
    if (n === 0) return { n: 0, d: 1 };
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
  }

  function ratAdd(a, b) {
    return rat(a.n * b.d + b.n * a.d, a.d * b.d);
  }

  function ratMul(a, b) {
    return rat(a.n * b.n, a.d * b.d);
  }

  function ratPow(base, exp) {
    let out = rat(1);
    for (let i = 0; i < exp; i += 1) out = ratMul(out, base);
    return out;
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

  function ratParenLatex(r) {
    if (r.n === 0) return "\\left(0\\right)";
    const neg = r.n < 0;
    const absN = Math.abs(r.n);
    const body = r.d === 1 ? String(absN) : `\\dfrac{${absN}}{${r.d}}`;
    return `\\left(${neg ? "-" : ""}${body}\\right)`;
  }

  function applyLandingContent() {
    const c = t();
    if (!c) return;
    const eyebrow = $("#landingEyebrow");
    const title = $("#landingTitle");
    const start = $("#startButton");
    if (eyebrow) eyebrow.textContent = c.landing?.eyebrow || "";
    if (title) {
      title.innerHTML = escapeHtml(c.landing?.title || "").replaceAll("\n", "<br>");
    }
    if (start) start.textContent = c.landing?.start || "เริ่ม";
    const docTitle = (c.landing?.title || "Interactive").replaceAll("\n", "");
    document.title = `${docTitle} | Interactive Mathematics`;
  }

  function applyAppChrome() {
    const c = t();
    if (!c) return;
    const ui = c.ui || {};
    const title = $("#appTitle");
    if (title) title.textContent = c.app?.title || c.landing?.title || "";

    const modeLabel = $("#modeLabel");
    if (modeLabel) modeLabel.textContent = ui.modeLabel || "โหมด";
    const learnBtn = $("#modeLearnBtn");
    const testBtn = $("#modeTestBtn");
    if (learnBtn) learnBtn.textContent = ui.modeLearn || "ศึกษา";
    if (testBtn) testBtn.textContent = ui.modeTest || "ทดสอบ";

    const theoremLabel = $("#theoremLabel");
    if (theoremLabel) theoremLabel.textContent = ui.theoremLabel || "ทฤษฎีบท";

    const defineLabel = $("#defineLabel");
    if (defineLabel) defineLabel.textContent = ui.defineLabel || "กำหนดพหุนาม";
    const dividendName = $("#dividendName");
    if (dividendName) dividendName.textContent = ui.dividendLabel || "ตัวตั้ง";
    const divisorName = $("#divisorName");
    if (divisorName) divisorName.textContent = ui.divisorLabel || "ตัวหาร";

    const exampleTitle = $("#exampleTitle");
    if (exampleTitle) exampleTitle.textContent = ui.exampleLabel || "ตัวอย่าง";

    const prev = $("#prevBtn");
    const next = $("#nextBtn");
    const all = $("#allBtn");
    if (prev) prev.textContent = ui.prev || "ก่อนหน้า";
    if (next) next.textContent = ui.next || "ถัดไป";
    if (all) all.textContent = ui.all || "ทั้งหมด";

    const reset = $("#workReset");
    if (reset) {
      reset.setAttribute("aria-label", ui.reset || "รีเฟรช");
      reset.setAttribute("title", ui.reset || "รีเฟรช");
    }

    fillTheoremSelect();
  }

  function fillTheoremSelect() {
    const select = $("#theoremSelect");
    if (!select) return;
    const items = theorems();
    select.innerHTML = "";
    items.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item.id;
      opt.textContent = item.selectLabel;
      select.appendChild(opt);
    });
    if (!items.some((item) => item.id === state.theoremId) && items[0]) {
      state.theoremId = items[0].id;
    }
    select.value = state.theoremId;
  }

  function showApp() {
    const landing = $("#landingPage");
    const app = $("#appPage");
    landing?.classList.remove("view--active");
    landing?.setAttribute("hidden", "");
    app?.removeAttribute("hidden");
    app?.classList.add("view--active");
    $("#appTitle")?.focus();
    renderAll();
  }

  function setMode(mode) {
    state.mode = mode === "test" ? "test" : "learn";
    const learnBtn = $("#modeLearnBtn");
    const testBtn = $("#modeTestBtn");
    learnBtn?.classList.toggle("mode-btn--active", state.mode === "learn");
    testBtn?.classList.toggle("mode-btn--active", state.mode === "test");
    learnBtn?.setAttribute("aria-pressed", state.mode === "learn" ? "true" : "false");
    testBtn?.setAttribute("aria-pressed", state.mode === "test" ? "true" : "false");

    const learnPanel = $("#learnPanel");
    const testPanel = $("#testPanel");
    const theoremBar = $("#theoremBar");
    if (state.mode === "learn") {
      learnPanel?.removeAttribute("hidden");
      testPanel?.setAttribute("hidden", "");
      theoremBar?.removeAttribute("hidden");
    } else {
      learnPanel?.setAttribute("hidden", "");
      testPanel?.removeAttribute("hidden");
      theoremBar?.setAttribute("hidden", "");
      resetWork();
    }
  }

  function renderLearn() {
    const thm = currentTheorem();
    if (!thm) return;

    const theoryTitle = $("#theoryTitle");
    if (theoryTitle) theoryTitle.textContent = thm.title || "";

    const body = $("#theoremBody");
    if (body) {
      body.innerHTML = (thm.body || [])
        .map((para) => `<p>${para}</p>`)
        .join("");
      renderMath(body);
    }

    const prompt = $("#examplePrompt");
    if (prompt) {
      prompt.innerHTML = thm.example?.prompt || "";
      renderMath(prompt);
    }

    const lines = $("#exampleLines");
    if (lines) {
      lines.innerHTML = (thm.example?.lines || []).map(eqLineHtml).join("");
      renderMath(lines);
    }

    const conclusion = $("#exampleConclusion");
    if (conclusion) {
      conclusion.innerHTML = thm.example?.conclusion || "";
      renderMath(conclusion);
    }
  }

  function updatePreviews() {
    const p = readPoly("p", P_DEG_MAX);
    const q = readPoly("q", 1);
    const ui = t()?.ui || {};
    const pEl = $("#pPreview");
    const qEl = $("#qPreview");
    if (pEl) {
      pEl.innerHTML = `${escapeHtml(ui.dividendLabel || "ตัวตั้ง")} = ${katexHtml(polyLatex(p))}`;
    }
    if (qEl) {
      qEl.innerHTML = `${escapeHtml(ui.divisorLabel || "ตัวหาร")} = ${katexHtml(polyLatex(q))}`;
    }
  }

  function validate(p, q) {
    const ui = t()?.ui || {};
    if (degree(p) < 0) {
      return { ok: false, msg: ui.errDividendZero || "ตัวตั้งต้องไม่เป็นพหุนามศูนย์" };
    }
    if (q[0] === 0) {
      return { ok: false, msg: ui.errDivisorLead || "สัมประสิทธิ์ของ $x$ ในตัวหารต้องไม่เป็นศูนย์" };
    }
    if (degree(q) !== 1) {
      return { ok: false, msg: ui.errDivisorDeg || "ตัวหารต้องเป็นพหุนามดีกรี 1" };
    }
    return { ok: true };
  }

  function buildPlan(p, q) {
    const ui = t()?.ui || {};
    const a = q[0];
    const b = q[1];
    const root = rat(-b, a);
    const pTex = polyLatex(p);
    const qTex = polyLatex(q);
    const rootTex = ratLatex(root);
    const rootParen = ratParenLatex(root);

    const terms = [];
    const valueTerms = [];
    const maxDeg = p.length - 1;

    for (let i = 0; i < p.length; i += 1) {
      const coeff = p[i];
      if (coeff === 0) continue;
      const deg = maxDeg - i;
      const powered = ratPow(root, deg);
      const termVal = ratMul(rat(coeff), powered);
      valueTerms.push(termVal);

      const cAbs = Math.abs(coeff);
      let body;
      if (deg === 0) {
        body = String(cAbs);
      } else if (deg === 1) {
        body = cAbs === 1 ? rootParen : `${cAbs}${rootParen}`;
      } else {
        body = cAbs === 1 ? `${rootParen}^{${deg}}` : `${cAbs}${rootParen}^{${deg}}`;
      }

      let piece;
      if (terms.length === 0) {
        piece = coeff < 0 ? `-${body}` : body;
      } else {
        piece = coeff < 0 ? `- ${body}` : `+ ${body}`;
      }
      terms.push(piece);
    }

    const substTex = terms.join(" ");
    let total = rat(0);
    valueTerms.forEach((v) => {
      total = ratAdd(total, v);
    });

    const simplifiedParts = [];
    valueTerms.forEach((v, idx) => {
      simplifiedParts.push(ratLatex(v, { forceSign: idx > 0 }));
    });
    const simplifiedTex = simplifiedParts.join(" ");
    const resultTex = ratLatex(total);

    const lines = [
      { prefix: "ให้", lhs: "P(x)", rhs: pTex },
      { lhs: `P\\left(${rootTex}\\right)`, rhs: substTex },
      { rhs: simplifiedTex },
      { rhs: resultTex }
    ];

    const therefore = escapeHtml(ui.therefore || "ดังนั้น");
    let conclusion;
    if (ratIsZero(total)) {
      const isFactorOf = escapeHtml(ui.isFactorOf || "เป็นตัวประกอบของ");
      conclusion = `${therefore} $${qTex}$ ${isFactorOf} $${pTex}$`;
    } else {
      const remainderIs = escapeHtml(ui.remainderIs || "เศษเหลือ คือ");
      conclusion = `${therefore} ${remainderIs} $${resultTex}$`;
    }

    return {
      lines,
      conclusion,
      maxStep: lines.length + 1
    };
  }

  function rebuildPlan() {
    const p = readPoly("p", P_DEG_MAX);
    const q = readPoly("q", 1);
    const check = validate(p, q);
    if (!check.ok) {
      state.plan = { error: check.msg, lines: [], conclusion: "", maxStep: 0 };
      return;
    }
    state.plan = buildPlan(p, q);
  }

  function maxStep() {
    return state.plan?.maxStep || 0;
  }

  function updateButtons() {
    const prev = $("#prevBtn");
    const next = $("#nextBtn");
    const all = $("#allBtn");
    const hasPlan = Boolean(state.plan) && !state.plan.error && maxStep() > 0;
    if (prev) prev.disabled = !hasPlan || state.showAll || state.step <= 0;
    if (next) next.disabled = !hasPlan || state.showAll || state.step >= maxStep();
    if (all) {
      all.disabled = !hasPlan;
      all.setAttribute("aria-pressed", state.showAll ? "true" : "false");
    }
  }

  function renderWork() {
    const body = $("#workBody");
    if (!body) return;
    const ui = t()?.ui || {};

    if (!state.plan) {
      body.innerHTML = `<p class="work-hint">${escapeHtml(ui.hint || "")}</p>`;
      updateButtons();
      return;
    }

    if (state.plan.error) {
      body.innerHTML = `<p class="work-error">${escapeHtml(state.plan.error)}</p>`;
      renderMath(body);
      updateButtons();
      return;
    }

    const visibleCount = state.showAll
      ? state.plan.lines.length
      : Math.min(state.step, state.plan.lines.length);
    const showConclusion = state.showAll || state.step > state.plan.lines.length;

    if (visibleCount <= 0 && !showConclusion) {
      body.innerHTML = `<p class="work-hint">${escapeHtml(ui.hint || "")}</p>`;
      updateButtons();
      return;
    }

    const lineHtml = state.plan.lines
      .slice(0, visibleCount)
      .map(eqLineHtml)
      .join("");
    const conclHtml = showConclusion
      ? `<p class="work-conclusion">${state.plan.conclusion}</p>`
      : "";
    body.innerHTML = `<div class="work-steps">${lineHtml}</div>${conclHtml}`;
    renderMath(body);
    updateButtons();
  }

  function resetWork() {
    state.step = 0;
    state.showAll = false;
    rebuildPlan();
    updatePreviews();
    renderWork();
  }

  function goPrev() {
    if (state.showAll || state.step <= 0) return;
    state.step -= 1;
    renderWork();
  }

  function goNext() {
    if (state.showAll || state.step >= maxStep()) return;
    state.step += 1;
    renderWork();
  }

  function toggleAll() {
    if (!state.plan || state.plan.error || maxStep() <= 0) return;
    if (state.showAll) {
      state.showAll = false;
      state.step = 0;
    } else {
      state.showAll = true;
      state.step = maxStep();
    }
    renderWork();
  }

  function renderAll() {
    applyLandingContent();
    applyAppChrome();
    setMode(state.mode);
    if (state.mode === "learn") renderLearn();
    else {
      updatePreviews();
      rebuildPlan();
      renderWork();
    }
    renderMath($("#appLayout"));
  }

  function bindEvents() {
    $("#startButton")?.addEventListener("click", showApp);

    $("#modeLearnBtn")?.addEventListener("click", () => {
      setMode("learn");
      renderLearn();
    });
    $("#modeTestBtn")?.addEventListener("click", () => {
      setMode("test");
      renderMath($("#testPanel"));
    });

    $("#theoremSelect")?.addEventListener("change", (event) => {
      state.theoremId = event.target.value;
      renderLearn();
    });

    const onCoeffEdit = (input) => {
      sanitizeCoeffInput(input);
      state.step = 0;
      state.showAll = false;
      updatePreviews();
      rebuildPlan();
      renderWork();
    };
    $$(".coeff-input").forEach((input) => {
      input.addEventListener("input", () => onCoeffEdit(input));
      input.addEventListener("change", () => onCoeffEdit(input));
    });

    $("#prevBtn")?.addEventListener("click", goPrev);
    $("#nextBtn")?.addEventListener("click", goNext);
    $("#allBtn")?.addEventListener("click", toggleAll);
    $("#workReset")?.addEventListener("click", resetWork);
  }

  function init() {
    applyLandingContent();
    applyAppChrome();
    setMode("learn");
    renderLearn();
    updatePreviews();
    rebuildPlan();
    renderWork();
    bindEvents();
    renderMath(document.body);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
