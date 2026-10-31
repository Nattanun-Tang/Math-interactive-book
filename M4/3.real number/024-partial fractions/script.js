(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const state = {
    mode: "bridge",
    typeId: "distinctLinear",
    learnIndex: 0,
    stepVisible: 1,
    setupSelected: new Set(),
    setupBankOrder: null,
    solveValues: {},
    bridgeExample: 0,
    bridgeDir: "combine",
    bridgeCoeffs: {},
    testIndex: 0,
    testProblem: null,
    testSetup: new Set(),
    testBankOrder: null,
    testValues: {},
    feedback: null,
    revealed: false
  };

  function t() {
    return window.CONTENT?.th;
  }

  function ui() {
    return t()?.ui || {};
  }

  function types() {
    return t()?.types || [];
  }

  function learnList() {
    return t()?.examples?.[state.typeId] || [];
  }

  function testPool() {
    return t()?.testPool?.[state.typeId] || [];
  }

  function currentLearn() {
    return learnList()[state.learnIndex] || null;
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
    fitBridgeMath(root);
  }

  /** Shrink bridge-walk KaTeX so the full expression stays visible without a scrollbar. */
  function fitBridgeMath(root = document.body) {
    const blocks = root.querySelectorAll
      ? root.querySelectorAll(".bridge-walk__math")
      : [];
    blocks.forEach((el) => {
      const katexEl = el.querySelector(".katex");
      if (!katexEl) return;
      katexEl.style.fontSize = "";
      katexEl.style.transform = "";
      const cs = getComputedStyle(el);
      const pad =
        (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const available = el.clientWidth - pad;
      if (available <= 0) return;
      let size = parseFloat(getComputedStyle(katexEl).fontSize) || 30;
      for (let i = 0; i < 10 && katexEl.scrollWidth > available + 1; i += 1) {
        size *= available / katexEl.scrollWidth;
        katexEl.style.fontSize = `${Math.max(18, size)}px`;
      }
    });
  }

  /** Stack LHS=RHS rows so the "=" column aligns (KaTeX aligned). */
  function toAlignedEqTex(lines) {
    const rows = (lines || [])
      .map((line) => String(line || "").trim())
      .filter(Boolean)
      .map((line) => {
        const i = line.indexOf("=");
        if (i === -1) return line;
        return `${line.slice(0, i).trim()} &= ${line.slice(i + 1).trim()}`;
      });
    if (!rows.length) return "";
    if (rows.length === 1 && !rows[0].includes("&=")) return rows[0];
    return `\\begin{aligned}${rows.join(" \\\\ ")}\\end{aligned}`;
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
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
  }

  function parseNumberInput(raw) {
    const text = String(raw ?? "").trim().replace(/\s+/g, "");
    if (text === "" || text === "-" || text === "+" || text === "/" || text === "-/") {
      return { ok: false, empty: true, value: null };
    }
    const m = text.match(/^([+-]?\d+)(?:\/([+-]?\d+))?$/);
    if (!m) return { ok: false, empty: false, value: null };
    const n = Number(m[1]);
    const d = m[2] == null ? 1 : Number(m[2]);
    if (!Number.isInteger(n) || !Number.isInteger(d) || d === 0) {
      return { ok: false, empty: false, value: null };
    }
    return { ok: true, empty: false, value: rat(n, d) };
  }

  function canonicalAnswerStrings(want) {
    if (!want) return [];
    const { n, d } = want;
    const forms = new Set([`${n}`, `${n}/${d}`]);
    if (n < 0) {
      forms.add(`-${-n}`);
      forms.add(`-${-n}/${d}`);
    } else {
      forms.add(`+${n}`);
      forms.add(`+${n}/${d}`);
    }
    return [...forms];
  }

  /** empty | incomplete | ok | bad — do not mark incomplete typing as wrong */
  function solveInputStatus(raw, want) {
    const text = String(raw ?? "").trim().replace(/\s+/g, "");
    if (text === "") return "empty";
    const parsed = parseNumberInput(text);
    if (parsed.ok && want && ratEq(parsed.value, want)) return "ok";
    if (parsed.empty) return "incomplete";
    if (/^[+-]?\d+\/[+-]?$/.test(text)) return "incomplete";
    // Fully parsed wrong value (e.g. -5 when answer is -5/2) counts as bad
    if (parsed.ok) return "bad";
    if (want && canonicalAnswerStrings(want).some((form) => form.startsWith(text))) {
      return "incomplete";
    }
    return "bad";
  }

  function answerToRat(answer) {
    if (typeof answer === "number") {
      if (!Number.isFinite(answer)) return null;
      if (Number.isInteger(answer)) return rat(answer, 1);
      const s = String(answer);
      return parseNumberInput(s).value;
    }
    if (typeof answer === "string") return parseNumberInput(answer).value;
    if (answer && typeof answer === "object" && "n" in answer) {
      return rat(answer.n, answer.d || 1);
    }
    return null;
  }

  function ratEq(a, b) {
    if (!a || !b) return false;
    return a.n === b.n && a.d === b.d;
  }

  function ratPlain(r) {
    if (!r) return "";
    if (r.d === 1) return String(r.n);
    return `${r.n}/${r.d}`;
  }

  function ratTex(r) {
    if (!r) return "0";
    if (r.d === 1) return String(r.n);
    if (r.n < 0) return `-\\dfrac{${-r.n}}{${r.d}}`;
    return `\\dfrac{${r.n}}{${r.d}}`;
  }

  function sanitizeNumberInput(input) {
    const before = input.value;
    let next = before.replace(/[eE.]/g, "");
    next = next.replace(/[^\d+\-/]/g, "");
    const slash = next.indexOf("/");
    if (slash !== -1) {
      next = next.slice(0, slash + 1) + next.slice(slash + 1).replace(/\//g, "");
    }
    next = next.replace(/(?!^)[+-]/g, (ch, i) => (next[i - 1] === "/" ? ch : ""));
    if (next !== before) input.value = next;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function bankIds(bank) {
    return (bank || []).map((b) => b.id);
  }

  function sameIdSet(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    const set = new Set(a);
    return b.every((id) => set.has(id));
  }

  function orderedBank(bank, orderIds) {
    if (!bank?.length) return [];
    if (!orderIds?.length) return bank;
    const byId = new Map(bank.map((b) => [b.id, b]));
    return orderIds.map((id) => byId.get(id)).filter(Boolean);
  }

  /** Stable shuffled display order for setup chips (correct/incorrect mixed). */
  function displaySetupBank(bank, orderProp) {
    const ids = bankIds(bank);
    if (!sameIdSet(state[orderProp], ids)) {
      state[orderProp] = shuffle(ids);
    }
    return orderedBank(bank, state[orderProp]);
  }

  function correctSetupIds(bank) {
    return new Set((bank || []).filter((b) => b.correct).map((b) => b.id));
  }

  function setsEqual(a, b) {
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  }

  function isSetupComplete(bank, selected) {
    return setsEqual(correctSetupIds(bank), selected);
  }

  function isSetupPartialOk(bank, selected) {
    if (!selected.size) return false;
    const correct = correctSetupIds(bank);
    if (selected.size >= correct.size) return false;
    for (const id of selected) {
      if (!correct.has(id)) return false;
    }
    return true;
  }

  function hasSetupMistake(bank, selected) {
    const correct = correctSetupIds(bank);
    for (const id of selected) {
      if (!correct.has(id)) return true;
    }
    return false;
  }

  function formPreviewTex(bank, selected) {
    const chosen = (bank || []).filter((b) => selected.has(b.id));
    if (!chosen.length) return "";
    const letters = "ABCDEFGH";
    return chosen
      .map((b, i) => `\\dfrac{${letters[i]}}{${b.tex}}`)
      .join("+");
  }

  function polyCombineTex(dens, coeffs) {
    /* Symbolic combine for distinct linear dens: A/(x-a)+B/(x-b) */
    if (dens.length !== 2) return null;
    const [d0, d1] = dens;
    const A = coeffs[0] || rat(0);
    const B = coeffs[1] || rat(0);
    /* Numerator = A*d1 + B*d0 — only expand for simple dens like x, x±k */
    const parseDen = (den) => {
      if (den === "x") return { a: 1, b: 0 }; // 1*x + 0
      const m = den.match(/^x([+-]\d+)$/);
      if (m) return { a: 1, b: Number(m[1]) };
      const m2 = den.match(/^\(x([+-]\d+)\)$/);
      if (m2) return { a: 1, b: Number(m2[1]) };
      return null;
    };
    const p0 = parseDen(d0);
    const p1 = parseDen(d1);
    if (!p0 || !p1) return null;

    /* A*(x+b1) + B*(x+b0) = (A+B)x + (A*b1 + B*b0) */
    const cx = rat(A.n * p1.a * B.d + B.n * p0.a * A.d, A.d * B.d);
    const c0 = rat(A.n * p1.b * B.d + B.n * p0.b * A.d, A.d * B.d);
    const numTex = formatLinearTex(cx, c0);
    const lcdNice = dens
      .map((d) => {
        if (d === "x") return "x";
        if (/^x[+-]/.test(d)) return `(${d})`;
        return d.startsWith("(") ? d : `(${d})`;
      })
      .join("");
    return `\\dfrac{${numTex}}{${lcdNice}}`;
  }

  function formatLinearTex(cx, c0) {
    const parts = [];
    if (cx.n !== 0) {
      if (cx.d === 1 && Math.abs(cx.n) === 1) {
        parts.push(cx.n < 0 ? "-x" : "x");
      } else if (cx.d === 1) {
        parts.push(`${cx.n}x`);
      } else {
        parts.push(`${ratTex(cx)}x`);
      }
    }
    if (c0.n !== 0) {
      const abs = rat(Math.abs(c0.n), c0.d);
      const piece = ratTex(abs);
      if (!parts.length) {
        parts.push(c0.n < 0 ? `-${piece}` : piece);
      } else {
        parts.push(c0.n < 0 ? `-${piece}` : `+${piece}`);
      }
    }
    if (!parts.length) return "0";
    return parts.join("");
  }

  function partsTex(dens, coeffs) {
    return dens
      .map((d, i) => {
        const r = coeffs[i] || rat(0);
        const den = niceDen(d);
        if (i === 0) return `\\dfrac{${ratTex(r)}}{${den}}`;
        if (r.n < 0) return `-\\dfrac{${ratTex(rat(-r.n, r.d))}}{${den}}`;
        return `+\\dfrac{${ratTex(r)}}{${den}}`;
      })
      .join("");
  }

  function niceDen(d) {
    if (d === "x") return "x";
    if (/^x[+-]/.test(d)) return `(${d})`;
    return d.startsWith("(") ? d : `(${d})`;
  }

  function lcdProductTex(dens) {
    return dens.map(niceDen).join("");
  }

  /** Coefficient times a linear factor for LCD rewrite, e.g. 2(x+1) or -(x) */
  function scaledFactorTex(coeff, factorRaw) {
    const r = coeff || rat(0);
    const factor = factorRaw === "x" ? "x" : `(${factorRaw.replace(/^\(|\)$/g, "")})`;
    if (r.n === 0) return { negative: false, core: "0" };
    const abs = rat(Math.abs(r.n), r.d);
    const unit = abs.d === 1 && abs.n === 1;
    const core = unit ? factor : `${ratTex(abs)}${factor}`;
    return { negative: r.n < 0, core };
  }

  function joinScaledFactors(items) {
    const alive = items.filter((it) => it && it.core !== "0");
    if (!alive.length) return "0";
    return alive
      .map((it, i) => {
        if (i === 0) return it.negative ? `-${it.core}` : it.core;
        return it.negative ? `-${it.core}` : `+${it.core}`;
      })
      .join("");
  }

  function fractionWithScaledNum(scaled, lcd) {
    if (!scaled || scaled.core === "0") return `\\dfrac{0}{${lcd}}`;
    const body = `\\dfrac{${scaled.core}}{${lcd}}`;
    return scaled.negative ? `-${body}` : body;
  }

  function bridgeCombineWalk(ex, coeffs) {
    const u = ui();
    const [d0, d1] = ex.dens;
    const A = coeffs[0] || rat(0);
    const B = coeffs[1] || rat(0);
    const lcd = ex.lcdTex || lcdProductTex(ex.dens);
    const parts = partsTex(ex.dens, coeffs);
    const combined = polyCombineTex(ex.dens, coeffs) || `\\dfrac{?}{${lcd}}`;
    /* A/d0 = A*d1 / lcd , B/d1 = B*d0 / lcd */
    const sA = scaledFactorTex(A, d1);
    const sB = scaledFactorTex(B, d0);
    const first = fractionWithScaledNum(sA, lcd);
    const secondRaw = fractionWithScaledNum(sB, lcd);
    const second = secondRaw.startsWith("-") ? secondRaw : `+${secondRaw}`;
    const numJoined = joinScaledFactors([sA, sB]);

    return [
      { label: u.bridgeStepStartParts, tex: parts },
      { label: `${u.bridgeStepLcd}: $${lcd}$`, tex: null },
      { label: u.bridgeStepRewrite, tex: `${first}${second}` },
      { label: u.bridgeStepAdd, tex: `\\dfrac{${numJoined}}{${lcd}}` },
      { label: u.bridgeStepResult, tex: combined }
    ];
  }

  function bridgeDecomposeWalk(ex, coeffs) {
    const u = ui();
    const lcd = ex.lcdTex || lcdProductTex(ex.dens);
    const parts = partsTex(ex.dens, coeffs);
    const combined = polyCombineTex(ex.dens, coeffs) || `\\dfrac{?}{${lcd}}`;
    const goal = ex.dens
      .map((d, i) => {
        const lab = ex.labels[i] || "?";
        const den = niceDen(d);
        return i === 0 ? `\\dfrac{${lab}}{${den}}` : `+\\dfrac{${lab}}{${den}}`;
      })
      .join("");
    return [
      { label: u.bridgeStepStartCombined, tex: combined },
      { label: u.bridgeStepGoal, tex: goal },
      { label: u.bridgeStepFound, tex: parts }
    ];
  }

  /* ---------- landing / shell ---------- */
  function applyLandingCopy() {
    const landing = t()?.landing;
    if (!landing) return;
    const eyebrow = $("#landingEyebrow");
    const title = $("#landingTitle");
    const start = $("#startButton");
    if (eyebrow) eyebrow.textContent = landing.eyebrow;
    if (title) title.textContent = landing.title;
    if (start) start.textContent = landing.start;
    const appTitle = $("#appTitle");
    if (appTitle) appTitle.textContent = t()?.app?.title || landing.title;
  }

  function showApp() {
    const landing = $("#landingPage");
    const app = $("#appPage");
    if (landing) {
      landing.classList.remove("view--active");
      landing.hidden = true;
    }
    if (app) {
      app.hidden = false;
      app.classList.add("view--active");
      $("#appTitle")?.focus();
    }
    render();
  }

  function fillTypeSelect() {
    const select = $("#typeSelect");
    if (!select) return;
    const list = types();
    if (list.length && !list.some((tp) => tp.id === state.typeId)) {
      state.typeId = list[0].id;
    }
    select.innerHTML = list
      .map(
        (tp) =>
          `<option value="${escapeHtml(tp.id)}"${tp.id === state.typeId ? " selected" : ""}>${escapeHtml(
            tp.label
          )}</option>`
      )
      .join("");
  }

  function setMode(mode) {
    state.mode = mode;
    if (mode === "learn") {
      state.stepVisible = 1;
      state.setupSelected = new Set();
      state.setupBankOrder = null;
      state.solveValues = {};
    }
    if (mode === "test") {
      if (!state.testProblem) loadTestAt(state.testIndex);
    }
    render();
  }

  function setType(typeId) {
    state.typeId = typeId;
    state.learnIndex = 0;
    state.testIndex = 0;
    state.testProblem = null;
    state.stepVisible = 1;
    state.setupSelected = new Set();
    state.setupBankOrder = null;
    state.solveValues = {};
    if (state.mode === "test") loadTestAt(0);
    render();
  }

  /* ---------- bridge ---------- */
  function bridgeExample() {
    return t()?.bridge?.examples?.[state.bridgeExample] || null;
  }

  function ensureBridgeCoeffs() {
    const ex = bridgeExample();
    if (!ex) return;
    if (!Object.keys(state.bridgeCoeffs).length) {
      state.bridgeCoeffs = {};
      ex.defaults.forEach((v, i) => {
        state.bridgeCoeffs[i] = answerToRat(v) || rat(v, 1);
      });
    }
  }

  function renderBridge() {
    const body = $("#bridgeBody");
    if (!body) return;
    ensureBridgeCoeffs();
    const examples = t()?.bridge?.examples || [];
    const ex = bridgeExample();
    const u = ui();
    if (!ex) {
      body.innerHTML = "";
      return;
    }

    const coeffs = ex.labels.map((_, i) => state.bridgeCoeffs[i] || rat(0));
    const combined = polyCombineTex(ex.dens, coeffs) || `\\dfrac{?}{${ex.lcdTex}}`;
    const parts = partsTex(ex.dens, coeffs);
    const combineFirst = state.bridgeDir === "combine";
    const walk = combineFirst ? bridgeCombineWalk(ex, coeffs) : bridgeDecomposeWalk(ex, coeffs);
    const walkTitle = combineFirst ? u.combineWalkTitle : u.decomposeWalkTitle;
    const takeaway = combineFirst ? u.bridgeTakeawayCombine : u.bridgeTakeawayDecompose;

    const coeffFields = ex.labels
      .map((lab, i) => {
        const val = ratPlain(coeffs[i]);
        return `<div class="coeff-field">
          <label for="bridgeCoeff${i}">$${lab}=$</label>
          <input id="bridgeCoeff${i}" class="coeff-input" data-bridge-coeff="${i}" type="text" inputmode="text" value="${escapeHtml(
          val
        )}" maxlength="10" autocomplete="off">
        </div>`;
      })
      .join("");

    const walkSteps = walk
      .map((step, i) => {
        const math = step.tex ? `<p class="bridge-walk__math live-math">$${step.tex}$</p>` : "";
        return `<li class="bridge-walk__step">
          <p class="bridge-walk__label"><span class="bridge-walk__num">${i + 1}</span>${step.label}</p>
          ${math}
        </li>`;
      })
      .join("");

    body.innerHTML = `
      <div class="bridge-intro">
        <p class="bridge-lead">${u.bridgeLead || ""}</p>
      </div>
      <div class="bridge-controls">
        <div class="dir-toggle" role="group" aria-label="ทิศทาง">
          <button type="button" class="dir-btn${combineFirst ? " dir-btn--active" : ""}" data-dir="combine">${u.combine}</button>
          <button type="button" class="dir-btn${!combineFirst ? " dir-btn--active" : ""}" data-dir="decompose">${u.decompose}</button>
        </div>
        <label class="visually-hidden" for="bridgeExampleSelect">ตัวอย่างที่</label>
        <select id="bridgeExampleSelect" class="bridge-example-select">
          ${examples
            .map((e, i) => {
              const label = e.title
                ? `ตัวอย่างที่ ${i + 1}: ${e.title}`
                : `ตัวอย่างที่ ${i + 1}`;
              return `<option value="${i}"${i === state.bridgeExample ? " selected" : ""}>${escapeHtml(
                label
              )}</option>`;
            })
            .join("")}
        </select>
      </div>
      <div class="coeff-row">
        <span class="coeff-row__hint">ปรับค่าสัมประสิทธิ์:</span>
        ${coeffFields}
      </div>
      <figure class="bridge-diagram" aria-label="ความสัมพันธ์ระหว่างการรวมและการแยก">
        <div class="bridge-pane bridge-pane--parts${combineFirst ? " bridge-pane--source" : " bridge-pane--target"}">
          <p class="bridge-pane__label">${u.partsLabel}</p>
          <p class="live-math live-math--parts">$${parts}$</p>
          <p class="bridge-pane__caption">${u.partsCaption || ""}</p>
        </div>
        <div class="bridge-diagram__link" aria-hidden="true">
          <span class="bridge-flow${combineFirst ? " bridge-flow--active" : ""}">${u.arrowCombine || "รวม →"}</span>
          <span class="bridge-flow-mid">⇄</span>
          <span class="bridge-flow${!combineFirst ? " bridge-flow--active" : ""}">${u.arrowDecompose || "← แยก"}</span>
        </div>
        <div class="bridge-pane bridge-pane--combined${!combineFirst ? " bridge-pane--source" : " bridge-pane--target"}">
          <p class="bridge-pane__label">${u.combinedLabel}</p>
          <p class="live-math live-math--combined">$${combined}$</p>
          <p class="bridge-pane__caption">${u.combinedCaption || ""}</p>
        </div>
      </figure>
      <section class="bridge-walk" aria-label="${escapeHtml(walkTitle || "")}">
        <h2 class="bridge-walk__title">${walkTitle || ""}</h2>
        <ol class="bridge-walk__steps">${walkSteps}</ol>
        <p class="bridge-walk__takeaway">${takeaway || ""}</p>
      </section>
    `;
    renderMath(body);
  }

  /* ---------- learn ---------- */
  function resetLearnInteractive() {
    state.setupSelected = new Set();
    state.setupBankOrder = null;
    state.solveValues = {};
  }

  function stepGateOk(problem, visible) {
    const steps = problem?.steps || [];
    for (let i = 0; i < visible; i += 1) {
      const step = steps[i];
      if (!step) continue;
      if (step.type === "setup" && !isSetupComplete(step.bank, state.setupSelected)) {
        return false;
      }
      if (step.type === "solve" && !areSolveCorrect(step.unknowns, state.solveValues)) {
        return false;
      }
    }
    return true;
  }

  function areSolveCorrect(unknowns, values) {
    return (unknowns || []).every((u) => {
      const got = parseNumberInput(values[u.key] ?? "").value;
      const want = answerToRat(u.answer);
      return ratEq(got, want);
    });
  }

  function renderSetupUI(step, selected, interactive, orderProp = "setupBankOrder") {
    const bank = step.bank || [];
    const chips = displaySetupBank(bank, orderProp)
      .map((b) => {
        const on = selected.has(b.id);
        return `<button type="button" class="setup-chip${on ? " setup-chip--on" : ""}" data-setup-id="${escapeHtml(
          b.id
        )}" ${interactive ? "" : "disabled"}>${katexHtml(b.tex)}</button>`;
      })
      .join("");
    const preview = formPreviewTex(bank, selected);
    const complete = isSetupComplete(bank, selected);
    let status = "";
    if (complete) {
      status = `<p class="setup-status setup-status--ok">${escapeHtml(ui().setupOk)}</p>`;
    } else if (hasSetupMistake(bank, selected)) {
      status = `<p class="setup-status setup-status--bad">${escapeHtml(step.wrongNote || ui().setupWrong)}</p>`;
    } else if (isSetupPartialOk(bank, selected)) {
      status = `<p class="setup-status setup-status--hint">${escapeHtml(ui().setupIncomplete)}</p>`;
    }
    return `
      <div class="setup-panel" data-setup-root="1">
        <p class="cancel-hint step-note">${escapeHtml(ui().setupHint)}</p>
        <div class="setup-bank">${chips}</div>
        ${
          preview
            ? `<p class="setup-preview step-eq">$${preview}$</p>`
            : ""
        }
        ${status}
      </div>
    `;
  }

  function renderSolveUI(step, values, interactive, showMarks) {
    const fields = (step.unknowns || [])
      .map((u) => {
        const raw = values[u.key] ?? "";
        let cls = "coeff-input";
        if (showMarks) {
          const status = solveInputStatus(raw, answerToRat(u.answer));
          if (status === "ok") cls += " coeff-input--ok";
          else if (status === "bad") cls += " coeff-input--bad";
        }
        return `<div class="coeff-field">
          <label for="solve_${u.key}">$${u.key}=$</label>
          <input id="solve_${u.key}" class="${cls}" data-solve-key="${escapeHtml(
          u.key
        )}" type="text" inputmode="text" value="${escapeHtml(raw)}" maxlength="10" autocomplete="off" ${
          interactive ? "" : "readonly"
        }>
        </div>`;
      })
      .join("");
    return `
      <div class="solve-grid" data-solve-root="1">${fields}</div>
      ${step.hintTex && areSolveCorrect(step.unknowns, values) ? `<p class="step-note">${step.hintTex}</p>` : ""}
      ${!areSolveCorrect(step.unknowns, values) ? `<p class="step-note">${escapeHtml(ui().coeffHint)}</p>` : ""}
    `;
  }

  function renderLearnStep(step, index, visible) {
    const isCurrent = index === visible - 1;
    const dim = index < visible - 1 ? " step-block--dim" : "";
    const title = step.title
      ? `<p class="step-title">${escapeHtml(step.title)}</p>`
      : "";

    if (step.type === "show") {
      return `<div class="step-block${dim}">
        ${title}
        <p class="step-eq">$${step.tex}$</p>
        ${step.note ? `<p class="step-note">${step.note}</p>` : ""}
      </div>`;
    }

    if (step.type === "setup") {
      return `<div class="step-block${dim}" data-learn-setup="${index}">
        ${title}
        ${renderSetupUI(step, state.setupSelected, isCurrent, "setupBankOrder")}
      </div>`;
    }

    if (step.type === "clear") {
      const aligned = toAlignedEqTex(step.lines || []);
      const eqHtml = aligned.includes("\\begin{aligned}")
        ? `$$${aligned}$$`
        : aligned
          ? `$${aligned}$`
          : "";
      return `<div class="step-block${dim}">
        ${title}
        ${eqHtml ? `<div class="step-eq">${eqHtml}</div>` : ""}
        ${step.note ? `<p class="step-note">${step.note}</p>` : ""}
      </div>`;
    }

    if (step.type === "match") {
      const eqs = (step.equations || [])
        .map((e) => `<li><strong>${e.label}:</strong> $${e.tex}$</li>`)
        .join("");
      return `<div class="step-block${dim}">
        ${title}
        <p class="step-eq">$${step.expandTex}$</p>
        <ul class="match-list">${eqs}</ul>
        ${step.note ? `<p class="step-note">${step.note}</p>` : ""}
      </div>`;
    }

    if (step.type === "solve") {
      return `<div class="step-block${dim}" data-learn-solve="${index}">
        ${title}
        ${renderSolveUI(step, state.solveValues, isCurrent, true)}
      </div>`;
    }

    if (step.type === "result") {
      return `<div class="step-block${dim}">
        ${title}
        <p class="result-line"><span class="result-line__label">${escapeHtml(
          ui().therefore || "ดังนั้น"
        )}</span> $${step.tex}$</p>
        ${step.note ? `<p class="step-note">${step.note}</p>` : ""}
        ${step.whenTex ? `<p class="step-note">เมื่อ $${step.whenTex}$</p>` : ""}
      </div>`;
    }

    return "";
  }

  function renderLearn() {
    const list = learnList();
    if (list.length && state.learnIndex >= list.length) state.learnIndex = 0;
    const problem = currentLearn();
    const promptEl = $("#learnPrompt");
    const body = $("#learnBody");
    updatePager(list.length);

    if (!problem) {
      if (promptEl) promptEl.textContent = "";
      if (body) body.innerHTML = "";
      return;
    }

    if (promptEl) {
      promptEl.innerHTML = `${escapeHtml(problem.prompt)} $${problem.promptTex}$`;
    }

    const steps = problem.steps || [];
    const visible = Math.min(state.stepVisible, steps.length);
    if (body) {
      body.innerHTML = steps
        .slice(0, visible)
        .map((step, i) => renderLearnStep(step, i, visible))
        .join("");
      renderMath(body);
      if (promptEl) renderMath(promptEl);
    }

    const prevBtn = $("#prevBtn");
    const nextBtn = $("#nextBtn");
    if (prevBtn) prevBtn.disabled = visible <= 1;
    if (nextBtn) {
      const atEnd = visible >= steps.length;
      const blocked = !stepGateOk(problem, visible);
      nextBtn.disabled = atEnd || blocked;
    }
  }

  function formatPagerLabel(index, total) {
    return (ui().pagerLabel || "ข้อ {n}/{total}")
      .replace("{n}", String(total ? index + 1 : 0))
      .replace("{total}", String(total));
  }

  function updatePager(total) {
    const label = $("#pagerLabel");
    const dots = $("#pagerDots");
    const prev = $("#pagerPrev");
    const next = $("#pagerNext");
    if (label) label.textContent = formatPagerLabel(state.learnIndex, total);
    if (dots) {
      dots.innerHTML = Array.from({ length: total }, (_, i) => {
        const active = i === state.learnIndex ? " pager__dot--active" : "";
        const current = i === state.learnIndex ? ' aria-current="true"' : "";
        return `<button type="button" class="pager__dot${active}" data-page="${i}" aria-label="ข้อ ${i + 1}"${current}></button>`;
      }).join("");
    }
    if (prev) prev.disabled = total <= 0 || state.learnIndex <= 0;
    if (next) next.disabled = total <= 0 || state.learnIndex >= total - 1;
  }

  /* ---------- test ---------- */
  function updateTestPager() {
    const pool = testPool();
    if (pool.length && state.testIndex >= pool.length) state.testIndex = 0;
    const label = $("#testPagerLabel");
    if (label) label.textContent = formatPagerLabel(state.testIndex, pool.length);
    const dots = $("#testPagerDots");
    if (dots) {
      dots.innerHTML = pool
        .map((_, i) => {
          const active = i === state.testIndex ? " pager__dot--active" : "";
          const current = i === state.testIndex ? ' aria-current="true"' : "";
          return `<button type="button" class="pager__dot${active}" data-index="${i}" aria-label="ข้อ ${i + 1}"${current}></button>`;
        })
        .join("");
    }
    const prev = $("#testPagerPrev");
    const next = $("#testPagerNext");
    if (prev) prev.disabled = !pool.length || state.testIndex <= 0;
    if (next) next.disabled = !pool.length || state.testIndex >= pool.length - 1;
  }

  function loadTestAt(index) {
    const pool = testPool();
    if (!pool.length) {
      state.testProblem = null;
      state.testIndex = 0;
      return;
    }
    const i = Math.max(0, Math.min(index, pool.length - 1));
    state.testIndex = i;
    state.testProblem = pool[i];
    state.testSetup = new Set();
    state.testBankOrder = null;
    state.testValues = {};
    state.feedback = null;
    state.revealed = false;
  }

  function pickRandomTest() {
    const pool = testPool();
    if (!pool.length) {
      state.testProblem = null;
      state.testIndex = 0;
      return;
    }
    let i = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && i === state.testIndex) {
      i = (i + 1) % pool.length;
    }
    loadTestAt(i);
  }

  function resetTest() {
    state.testSetup = new Set();
    state.testBankOrder = null;
    state.testValues = {};
    state.feedback = null;
    state.revealed = false;
  }

  function renderTest() {
    updateTestPager();
    const problem = state.testProblem;
    const promptEl = $("#testPrompt");
    const body = $("#testBody");
    const feedback = $("#testFeedback");

    if (!problem) {
      if (promptEl) promptEl.textContent = "";
      if (body) body.innerHTML = "";
      if (feedback) {
        feedback.hidden = true;
        feedback.textContent = "";
        feedback.className = "test-feedback";
      }
      return;
    }

    if (promptEl) {
      promptEl.innerHTML = `${escapeHtml(problem.prompt)} $${problem.promptTex}$`;
      renderMath(promptEl);
    }

    const setupStep = {
      bank: problem.bank,
      wrongNote: ui().setupWrong
    };
    const solveStep = { unknowns: problem.unknowns };

    let revealHtml = "";
    if (state.revealed) {
      revealHtml = `<div class="reveal-box">
        <p class="step-note">${escapeHtml(ui().revealed)}</p>
        <p class="step-eq">$${problem.formTex}$</p>
        <p class="step-eq">$${problem.unknowns
          .map((u) => `${u.key}=${ratPlain(answerToRat(u.answer))}`)
          .join(",\\;")}$</p>
      </div>`;
    }

    const showSummary =
      state.feedback?.kind === "ok" &&
      (state.revealed || areSolveCorrect(problem.unknowns, state.testValues));
    const summaryHtml = showSummary
      ? `<p class="result-line"><span class="result-line__label">${escapeHtml(
          ui().therefore || "ดังนั้น"
        )}</span> $${problem.promptTex}=${problem.answerTex}$</p>`
      : "";

    if (body) {
      body.innerHTML = `
        ${renderSetupUI(setupStep, state.testSetup, !state.revealed, "testBankOrder")}
        ${
          isSetupComplete(problem.bank, state.testSetup)
            ? renderSolveUI(solveStep, state.testValues, !state.revealed, !!state.feedback || state.revealed)
            : `<p class="step-note">${escapeHtml(ui().fillSetup)}</p>`
        }
        ${revealHtml}
        ${summaryHtml}
      `;
      renderMath(body);
    }

    if (feedback) {
      if (state.feedback) {
        feedback.hidden = false;
        feedback.textContent = state.feedback.text;
        feedback.className = `test-feedback test-feedback--${state.feedback.kind}`;
      } else {
        feedback.hidden = true;
        feedback.textContent = "";
      }
    }
  }

  function checkTest() {
    const problem = state.testProblem;
    if (!problem) return;
    if (!isSetupComplete(problem.bank, state.testSetup)) {
      state.feedback = { text: ui().fillSetup, kind: "bad" };
      state.revealed = false;
      renderTest();
      return;
    }
    const missing = problem.unknowns.some((u) => {
      const p = parseNumberInput(state.testValues[u.key] ?? "");
      return p.empty;
    });
    if (missing) {
      state.feedback = { text: ui().fillCoeffs, kind: "bad" };
      renderTest();
      return;
    }
    const ok = areSolveCorrect(problem.unknowns, state.testValues);
    state.feedback = ok
      ? { text: ui().allOk, kind: "ok" }
      : { text: ui().incorrect, kind: "bad" };
    renderTest();
  }

  function revealTest() {
    const problem = state.testProblem;
    if (!problem) return;
    state.revealed = true;
    state.testSetup = correctSetupIds(problem.bank);
    state.testValues = {};
    problem.unknowns.forEach((u) => {
      state.testValues[u.key] = ratPlain(answerToRat(u.answer));
    });
    state.feedback = { text: ui().revealed, kind: "ok" };
    renderTest();
  }

  /* ---------- render ---------- */
  function render() {
    const bridgePanel = $("#bridgePanel");
    const learnPanel = $("#learnPanel");
    const testPanel = $("#testPanel");
    const typeBar = $("#typeBar");

    $$(".mode-btn").forEach((btn) => {
      const active = btn.dataset.mode === state.mode;
      btn.classList.toggle("mode-btn--active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    if (typeBar) typeBar.hidden = state.mode === "bridge";
    if (bridgePanel) bridgePanel.hidden = state.mode !== "bridge";
    if (learnPanel) learnPanel.hidden = state.mode !== "learn";
    if (testPanel) testPanel.hidden = state.mode !== "test";

    if (state.mode === "bridge") renderBridge();
    else if (state.mode === "learn") renderLearn();
    else renderTest();
  }

  /* ---------- events ---------- */
  function bind() {
    $("#startButton")?.addEventListener("click", showApp);

    $$(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => setMode(btn.dataset.mode));
    });

    $("#typeSelect")?.addEventListener("change", (e) => {
      setType(e.target.value);
    });

    $("#pagerPrev")?.addEventListener("click", () => {
      if (state.learnIndex <= 0) return;
      state.learnIndex -= 1;
      state.stepVisible = 1;
      resetLearnInteractive();
      renderLearn();
    });

    $("#pagerNext")?.addEventListener("click", () => {
      const total = learnList().length;
      if (state.learnIndex >= total - 1) return;
      state.learnIndex += 1;
      state.stepVisible = 1;
      resetLearnInteractive();
      renderLearn();
    });

    $("#pagerDots")?.addEventListener("click", (e) => {
      const dot = e.target.closest("[data-page]");
      if (!dot) return;
      state.learnIndex = Number(dot.dataset.page);
      state.stepVisible = 1;
      resetLearnInteractive();
      renderLearn();
    });

    $("#prevBtn")?.addEventListener("click", () => {
      if (state.stepVisible <= 1) return;
      state.stepVisible -= 1;
      renderLearn();
    });

    $("#nextBtn")?.addEventListener("click", () => {
      const problem = currentLearn();
      const steps = problem?.steps || [];
      if (state.stepVisible >= steps.length) return;
      if (!stepGateOk(problem, state.stepVisible)) return;
      state.stepVisible += 1;
      renderLearn();
    });

    $("#learnBody")?.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-setup-id]");
      if (!chip || chip.disabled) return;
      const id = chip.dataset.setupId;
      if (state.setupSelected.has(id)) state.setupSelected.delete(id);
      else state.setupSelected.add(id);
      renderLearn();
    });

    $("#learnBody")?.addEventListener("input", (e) => {
      const input = e.target.closest("[data-solve-key]");
      if (!input) return;
      sanitizeNumberInput(input);
      state.solveValues[input.dataset.solveKey] = input.value;
      const problem = currentLearn();
      const step = problem?.steps?.[state.stepVisible - 1];
      if (step?.type === "solve") {
        const u = step.unknowns.find((x) => x.key === input.dataset.solveKey);
        input.classList.remove("coeff-input--ok", "coeff-input--bad");
        if (u) {
          const status = solveInputStatus(input.value, answerToRat(u.answer));
          if (status === "ok") input.classList.add("coeff-input--ok");
          else if (status === "bad") input.classList.add("coeff-input--bad");
        }
      }
      const nextBtn = $("#nextBtn");
      if (nextBtn && problem) {
        const steps = problem.steps || [];
        const atEnd = state.stepVisible >= steps.length;
        nextBtn.disabled = atEnd || !stepGateOk(problem, state.stepVisible);
      }
    });

    $("#testBody")?.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-setup-id]");
      if (!chip || chip.disabled) return;
      const id = chip.dataset.setupId;
      if (state.testSetup.has(id)) state.testSetup.delete(id);
      else state.testSetup.add(id);
      state.feedback = null;
      state.revealed = false;
      renderTest();
    });

    $("#testBody")?.addEventListener("input", (e) => {
      const input = e.target.closest("[data-solve-key]");
      if (!input) return;
      sanitizeNumberInput(input);
      state.testValues[input.dataset.solveKey] = input.value;
      if (state.feedback) {
        state.feedback = null;
        const feedback = $("#testFeedback");
        if (feedback) {
          feedback.hidden = true;
          feedback.textContent = "";
          feedback.className = "test-feedback";
        }
      }
      input.classList.remove("coeff-input--ok", "coeff-input--bad");
    });

    $("#checkBtn")?.addEventListener("click", checkTest);
    $("#revealBtn")?.addEventListener("click", revealTest);
    $("#testPagerPrev")?.addEventListener("click", () => {
      if (state.testIndex > 0) {
        loadTestAt(state.testIndex - 1);
        renderTest();
      }
    });
    $("#testPagerNext")?.addEventListener("click", () => {
      if (state.testIndex < testPool().length - 1) {
        loadTestAt(state.testIndex + 1);
        renderTest();
      }
    });
    $("#testPagerDots")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".pager__dot");
      if (!btn) return;
      loadTestAt(Number(btn.dataset.index) || 0);
      renderTest();
    });
    $("#randomBtn")?.addEventListener("click", () => {
      pickRandomTest();
      renderTest();
    });
    $("#testReset")?.addEventListener("click", () => {
      resetTest();
      renderTest();
    });

    $("#bridgeBody")?.addEventListener("click", (e) => {
      const dirBtn = e.target.closest("[data-dir]");
      if (dirBtn) {
        state.bridgeDir = dirBtn.dataset.dir;
        renderBridge();
      }
    });

    $("#bridgeBody")?.addEventListener("change", (e) => {
      if (e.target.id === "bridgeExampleSelect") {
        state.bridgeExample = Number(e.target.value);
        state.bridgeCoeffs = {};
        renderBridge();
      }
    });

    $("#bridgeBody")?.addEventListener("input", (e) => {
      const input = e.target.closest("[data-bridge-coeff]");
      if (!input) return;
      sanitizeNumberInput(input);
      const idx = Number(input.dataset.bridgeCoeff);
      const parsed = parseNumberInput(input.value);
      if (parsed.ok) {
        state.bridgeCoeffs[idx] = parsed.value;
        const id = input.id;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        renderBridge();
        const again = document.getElementById(id);
        if (again) {
          again.focus();
          if (typeof start === "number" && typeof end === "number") {
            try {
              again.setSelectionRange(start, end);
            } catch {
              /* ignore */
            }
          }
        }
      }
    });

    let bridgeFitTimer = 0;
    window.addEventListener("resize", () => {
      window.clearTimeout(bridgeFitTimer);
      bridgeFitTimer = window.setTimeout(() => {
        if (state.mode === "bridge") fitBridgeMath($("#bridgeBody") || document.body);
      }, 80);
    });
  }

  function applyUiLabels() {
    const u = ui();
    const setText = (id, value) => {
      const el = $(id);
      if (el && value) el.textContent = value;
    };
    setText("#modeLabel", u.mode || "โหมด");
    setText("#modeBridgeBtn", u.bridge || "หลักการ");
    setText("#modeLearnBtn", u.learn || "ศึกษา");
    setText("#modeTestBtn", u.test || "ทดสอบ");
    setText("#typeLabel", u.typeLabel || "ประเภทโจทย์");
    setText("#prevBtn", u.prev || "ก่อนหน้า");
    setText("#nextBtn", u.next || "ถัดไป");
    setText("#checkBtn", u.check || "ตรวจสอบ");
    setText("#revealBtn", u.reveal || "เฉลย");
    setText("#randomBtn", u.random || "สุ่มโจทย์");
    const reset = $("#testReset");
    if (reset) {
      const label = u.reset || "ล้าง";
      reset.setAttribute("aria-label", label);
      reset.setAttribute("title", label);
    }
    const appTitle = t()?.app?.title;
    if (appTitle) document.title = `${appTitle} | Interactive Mathematics`;
  }

  function init() {
    applyLandingCopy();
    applyUiLabels();
    fillTypeSelect();
    ensureBridgeCoeffs();
    bind();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
