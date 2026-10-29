(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const state = {
    mode: "learn",
    learnIndex: 0,
    typeIndex: 0,
    problem: null,
    round1Done: false,
    revealed: false,
    feedback: null,
    usedRoots: [],
    snapshot1: null,
    snapshot2: null,
    round2Coeffs: null
  };

  function t() {
    return window.CONTENT?.th;
  }

  function examples() {
    return t()?.examples || [];
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

  /* ---------- rationals ---------- */
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

  function ratAdd(a, b) {
    return rat(a.n * b.d + b.n * a.d, a.d * b.d);
  }

  function ratMul(a, b) {
    return rat(a.n * b.n, a.d * b.d);
  }

  function ratEq(a, b) {
    return a.n === b.n && a.d === b.d;
  }

  function ratIsZero(a) {
    return a.n === 0;
  }

  function ratLatex(r) {
    if (r.n === 0) return "0";
    const neg = r.n < 0;
    const absN = Math.abs(r.n);
    const body = r.d === 1 ? String(absN) : `\\dfrac{${absN}}{${r.d}}`;
    return neg ? `-${body}` : body;
  }

  function parseNumber(raw) {
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

  function sanitizeNumberInput(input) {
    const before = input.value;
    let next = before.replace(/[eE.]/g, "");
    next = next.replace(/[^\d+\-/]/g, "");
    // keep only first slash
    const slash = next.indexOf("/");
    if (slash !== -1) {
      next = next.slice(0, slash + 1) + next.slice(slash + 1).replace(/\//g, "");
    }
    // signs only at starts of numerator/denominator
    next = next.replace(/(?!^)[+-]/g, (ch, i) => (next[i - 1] === "/" ? ch : ""));
    if (next !== before) input.value = next;
  }

  /* ---------- polynomial helpers ---------- */
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
    const parts = [];
    const maxDeg = coeffs.length - 1;
    for (let i = 0; i < coeffs.length; i += 1) {
      const c = coeffs[i];
      if (c === 0) continue;
      parts.push(termLatex(c, maxDeg - i, { forceSign: parts.length > 0 }));
    }
    return parts.length ? parts.join(" ") : "0";
  }

  function mulPoly(a, b) {
    const out = Array(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i += 1) {
      for (let j = 0; j < b.length; j += 1) {
        out[i + j] += a[i] * b[j];
      }
    }
    return out;
  }

  function linear(p, q) {
    // px - q
    return [p, -q];
  }

  function synthDivide(coeffs, root) {
    const n = coeffs.length;
    const bottom = Array(n);
    const products = Array(n).fill(null);
    bottom[0] = { ...coeffs[0] };
    for (let i = 1; i < n; i += 1) {
      products[i] = ratMul(root, bottom[i - 1]);
      bottom[i] = ratAdd(coeffs[i], products[i]);
    }
    return {
      products,
      bottom,
      quotient: bottom.slice(0, n - 1),
      rem: bottom[n - 1],
      remIsZero: ratIsZero(bottom[n - 1])
    };
  }

  function intCoeffs(rats) {
    return rats.map((r) => {
      if (r.d !== 1) return null;
      return r.n;
    });
  }

  function toRats(coeffs) {
    return coeffs.map((c) => (typeof c === "number" ? rat(c) : { ...c }));
  }

  function factorQuadratic(a, b, c) {
    // Find integers p,q,r,s: (px - q)(rx - s) = pr x² - (ps+qr)x + qs
    // so pr=a, qs=c, ps+qr = -b
    if (a === 0) return null;
    const leadPairs = factorPairs(a);
    const constPairs = factorPairs(c === 0 ? 0 : c);
    for (const [p, r] of leadPairs) {
      for (const [q, s] of constPairs) {
        if (p * s + q * r === -b) {
          return [
            { p, q },
            { p: r, q: s }
          ];
        }
        if (p * (-s) + (-q) * r === -b) {
          return [
            { p, q: -q },
            { p: r, q: -s }
          ];
        }
      }
    }
    return null;
  }

  function factorPairs(n) {
    if (n === 0) return [[1, 0], [-1, 0]];
    const out = [];
    const abs = Math.abs(n);
    for (let i = 1; i <= abs; i += 1) {
      if (abs % i === 0) {
        const j = abs / i;
        out.push([i, (n < 0 ? -j : j)]);
        out.push([-i, (n < 0 ? j : -j)]);
        if (i !== j) {
          out.push([j, (n < 0 ? -i : i)]);
          out.push([-j, (n < 0 ? i : -i)]);
        }
      }
    }
    return out;
  }

  function linearLatex(p, q) {
    // px - q
    if (p === 1 && q === 0) return "x";
    if (p === 1) return q > 0 ? `x - ${q}` : `x + ${-q}`;
    if (p === -1) {
      if (q === 0) return "-x";
      return q > 0 ? `-x - ${q}` : `-x + ${-q}`;
    }
    if (q === 0) return `${p}x`;
    return q > 0 ? `${p}x - ${q}` : `${p}x + ${-q}`;
  }

  function factorsLatex(factors) {
    return factors.map((f) => `(${linearLatex(f.p, f.q)})`).join("");
  }

  function termLatexRat(r, deg, { forceSign = false } = {}) {
    if (ratIsZero(r)) return "";
    const neg = r.n < 0;
    const absN = Math.abs(r.n);
    let coeffBody;
    if (r.d === 1) coeffBody = absN === 1 && deg > 0 ? "" : String(absN);
    else coeffBody = `\\dfrac{${absN}}{${r.d}}`;
    let body;
    if (deg === 0) body = coeffBody || "1";
    else if (deg === 1) body = `${coeffBody}x`;
    else body = `${coeffBody}x^{${deg}}`;
    if (forceSign) return neg ? `- ${body}` : `+ ${body}`;
    return neg ? `-${body}` : body;
  }

  function completeFactorization(coeffs, rootsUsed) {
    // coeffs: integer array high→low
    // rootsUsed: rat[] successful synthetic roots in order
    let current = toRats(coeffs);
    const linearFactors = [];
    for (const root of rootsUsed) {
      const div = synthDivide(current, root);
      if (!div.remIsZero) return null;
      // integer root r → (x - r); fraction n/d → (d x - n)
      if (root.d === 1) {
        linearFactors.push({ p: 1, q: root.n });
      } else {
        linearFactors.push({ p: root.d, q: root.n });
      }
      current = div.quotient;
    }
    const ints = intCoeffs(current);
    if (!ints || ints.some((v) => v == null)) {
      const deg = current.length - 1;
      const mid = current
        .map((r, i) => {
          if (ratIsZero(r)) return "";
          return termLatexRat(r, deg - i, { forceSign: true });
        })
        .filter(Boolean);
      const poly = mid.join(" ").replace(/^\+ /, "");
      const tex = `${factorsLatex(linearFactors)}(${poly})`;
      return { mid: tex, final: tex };
    }
    if (ints.length === 1) {
      const k = ints[0];
      const tex = k === 1 ? factorsLatex(linearFactors) : `${k}${factorsLatex(linearFactors)}`;
      return { mid: tex, final: tex };
    }
    if (ints.length === 2) {
      const [a, b] = ints;
      linearFactors.push({ p: a, q: -b });
      const tex = factorsLatex(linearFactors);
      return { mid: tex, final: tex };
    }
    if (ints.length === 3) {
      const [a, b, c] = ints;
      const midTex = `${factorsLatex(linearFactors)}(${polyLatex(ints)})`;
      const fq = factorQuadratic(a, b, c);
      if (!fq) return { mid: midTex, final: midTex };
      return { mid: midTex, final: factorsLatex([...linearFactors, ...fq]) };
    }
    const tex = `${factorsLatex(linearFactors)}(${polyLatex(ints)})`;
    return { mid: tex, final: tex };
  }

  /* ---------- random problem generation ---------- */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pickDistinct(pool, count) {
    const arr = [...pool];
    const out = [];
    while (out.length < count && arr.length) {
      const i = randInt(0, arr.length - 1);
      out.push(arr.splice(i, 1)[0]);
    }
    return out;
  }

  function buildType1() {
    // (x-a)(x-b)(x-c)
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const [a, b, c] = pickDistinct([-4, -3, -2, -1, 1, 2, 3, 4], 3);
      if (a == null) continue;
      const poly = mulPoly(mulPoly(linear(1, a), linear(1, b)), linear(1, c));
      const constant = poly[poly.length - 1];
      if (Math.abs(constant) > 12) continue;
      return {
        type: 1,
        poly,
        roots: [rat(a), rat(b)],
        factors: [
          { p: 1, q: a },
          { p: 1, q: b },
          { p: 1, q: c }
        ],
        roundsNeeded: 1
      };
    }
    return {
      type: 1,
      poly: mulPoly(mulPoly(linear(1, 1), linear(1, 2)), linear(1, -3)),
      roots: [rat(1), rat(2)],
      factors: [
        { p: 1, q: 1 },
        { p: 1, q: 2 },
        { p: 1, q: -3 }
      ],
      roundsNeeded: 1
    };
  }

  function buildType2() {
    // (x-a)(x-b)(cx-d)
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const [a, b] = pickDistinct([-4, -3, -2, -1, 1, 2, 3, 4], 2);
      const cLead = pickDistinct([1, 2, 3], 1)[0];
      const d = pickDistinct([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].filter((x) => x !== 0), 1)[0];
      if (gcd(cLead, Math.abs(d)) !== 1) continue;
      // avoid reducing to (x-r)
      if (d % cLead === 0) continue;
      const poly = mulPoly(mulPoly(linear(1, a), linear(1, b)), linear(cLead, d));
      const constant = poly[poly.length - 1];
      if (Math.abs(cLead) > 12 || Math.abs(constant) > 12) continue;
      return {
        type: 2,
        poly,
        roots: [rat(a), rat(b)],
        factors: [
          { p: 1, q: a },
          { p: 1, q: b },
          { p: cLead, q: d }
        ],
        roundsNeeded: 1
      };
    }
    return {
      type: 2,
      poly: mulPoly(mulPoly(linear(1, 1), linear(1, -2)), linear(2, 3)),
      roots: [rat(1), rat(-2)],
      factors: [
        { p: 1, q: 1 },
        { p: 1, q: -2 },
        { p: 2, q: 3 }
      ],
      roundsNeeded: 1
    };
  }

  function buildType3() {
    // (x-a)(x-b)(x-c)(x-d)
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const vals = pickDistinct([-3, -2, -1, 1, 2, 3], 4);
      if (vals.length < 4) continue;
      const [a, b, c, d] = vals;
      const poly = mulPoly(
        mulPoly(mulPoly(linear(1, a), linear(1, b)), linear(1, c)),
        linear(1, d)
      );
      const constant = poly[poly.length - 1];
      const lead = poly[0];
      if (Math.abs(lead) > 12 || Math.abs(constant) > 12) continue;
      return {
        type: 3,
        poly,
        roots: [rat(a), rat(b)],
        factors: [
          { p: 1, q: a },
          { p: 1, q: b },
          { p: 1, q: c },
          { p: 1, q: d }
        ],
        roundsNeeded: 2
      };
    }
    return {
      type: 3,
      poly: mulPoly(
        mulPoly(mulPoly(linear(1, 1), linear(1, -1)), linear(1, 2)),
        linear(1, -2)
      ),
      roots: [rat(1), rat(-1)],
      factors: [
        { p: 1, q: 1 },
        { p: 1, q: -1 },
        { p: 1, q: 2 },
        { p: 1, q: -2 }
      ],
      roundsNeeded: 2
    };
  }

  function buildType4() {
    // (x-a)(x-b)(cx-d)(ex-f)
    for (let attempt = 0; attempt < 150; attempt += 1) {
      const [a, b] = pickDistinct([-3, -2, -1, 1, 2, 3], 2);
      const cLead = pickDistinct([1, 2, 3], 1)[0];
      const eLead = pickDistinct([1, 2, 3], 1)[0];
      if (cLead * eLead > 12) continue;
      const d = pickDistinct([-4, -3, -2, -1, 1, 2, 3, 4], 1)[0];
      const f = pickDistinct([-4, -3, -2, -1, 1, 2, 3, 4].filter((x) => x !== d), 1)[0];
      if (gcd(cLead, Math.abs(d)) !== 1) continue;
      if (gcd(eLead, Math.abs(f)) !== 1) continue;
      if (d % cLead === 0 || f % eLead === 0) continue;
      const poly = mulPoly(
        mulPoly(mulPoly(linear(1, a), linear(1, b)), linear(cLead, d)),
        linear(eLead, f)
      );
      const constant = poly[poly.length - 1];
      const lead = poly[0];
      if (Math.abs(lead) > 12 || Math.abs(constant) > 12) continue;
      return {
        type: 4,
        poly,
        roots: [rat(a), rat(b)],
        factors: [
          { p: 1, q: a },
          { p: 1, q: b },
          { p: cLead, q: d },
          { p: eLead, q: f }
        ],
        roundsNeeded: 2
      };
    }
    return {
      type: 4,
      poly: mulPoly(
        mulPoly(mulPoly(linear(1, 1), linear(1, -1)), linear(2, 1)),
        linear(3, 2)
      ),
      roots: [rat(1), rat(-1)],
      factors: [
        { p: 1, q: 1 },
        { p: 1, q: -1 },
        { p: 2, q: 1 },
        { p: 3, q: 2 }
      ],
      roundsNeeded: 2
    };
  }

  const builders = [buildType1, buildType2, buildType3, buildType4];

  function nextProblem() {
    const builder = builders[state.typeIndex % builders.length];
    state.typeIndex = (state.typeIndex + 1) % builders.length;
    const problem = builder();
    problem.polyTex = polyLatex(problem.poly);
    // mid/final use synthetic-root order so expanded factors match the mid step
    const rootsForDisplay = problem.roots.slice(0, problem.roundsNeeded);
    const cf = completeFactorization(problem.poly, rootsForDisplay);
    problem.midTex = cf ? cf.mid : factorsLatex(problem.factors);
    problem.finalTex = cf ? cf.final : factorsLatex(problem.factors);
    return problem;
  }

  /* ---------- synthetic division rendering ---------- */
  function numDisplay(n) {
    if (typeof n === "number") return katexHtml(String(n));
    return katexHtml(ratLatex(n));
  }

  function renderLearnSynth(round, uid) {
    const coeffs = round.coeffs;
    const products = round.products;
    const bottom = round.bottom;
    const n = coeffs.length;
    const midRow = 2;
    const gapRow = 3;
    const botRow = 4;
    const doubleRow = 5;

    const cell = (col, row, html) =>
      `<span class="synth__cell" data-col="${col}" data-row="${row}" style="grid-column:${col + 1};grid-row:${row === "top" ? 1 : row === "mid" ? midRow : botRow}">${html}</span>`;

    const topCells = coeffs
      .map((c, i) => cell(i, "top", `<span class="synth__val">${numDisplay(c)}</span>`))
      .join("");

    const midCells = coeffs
      .map((_, i) => {
        if (i === 0) return cell(i, "mid", "");
        return cell(i, "mid", `<span class="synth__val">${numDisplay(products[i - 1])}</span>`);
      })
      .join("");

    const botCells = bottom
      .map((c, i) => cell(i, "bot", `<span class="synth__val">${numDisplay(c)}</span>`))
      .join("");

    return `
      <div class="synth" id="${uid}" data-n="${n}">
        <svg class="synth__svg" aria-hidden="true"></svg>
        <div class="synth__layout">
          <div class="synth__left"><div class="synth__root">${numDisplay(round.root)}</div></div>
          <div class="synth__gutter" aria-hidden="true"></div>
          <div class="synth__table" style="grid-template-columns: repeat(${n}, minmax(2.8em, max-content));">
            ${topCells}
            ${midCells}
            <div class="synth__rule-gap" style="grid-column:1/-1;grid-row:${gapRow}" aria-hidden="true"></div>
            ${botCells}
            <div class="synth__double" style="grid-column:1/-1;grid-row:${doubleRow}"></div>
          </div>
        </div>
      </div>
    `;
  }

  function measureSynthColWidth(stage) {
    const table = stage.querySelector(".synth__table");
    if (!table) return 0;
    let max = 0;
    table.querySelectorAll(".synth__val").forEach((val) => {
      const num = val.querySelector(".katex") || val.querySelector(".synth-input") || val;
      max = Math.max(max, num.getBoundingClientRect().width);
    });
    table.querySelectorAll(".synth-input").forEach((inp) => {
      max = Math.max(max, inp.getBoundingClientRect().width);
    });
    return Math.max(Math.ceil(max + 2), 56);
  }

  function measureSynthRootWidth(stage) {
    const root = stage.querySelector(".synth__root");
    if (!root) return 0;
    const num = root.querySelector(".katex") || root.querySelector(".synth-input") || root;
    return Math.ceil(num.getBoundingClientRect().width);
  }

  function equalizeAndDrawFrame(stage, colW, rootW) {
    if (!stage) return;
    const table = stage.querySelector(".synth__table");
    const svg = stage.querySelector(".synth__svg");
    const n = Number(stage.dataset.n || 0);
    if (!table || !svg || !n) return;

    const widthPx = colW || measureSynthColWidth(stage);
    table.style.gridTemplateColumns = `repeat(${n}, ${widthPx}px)`;

    const rootEl = stage.querySelector(".synth__root");
    if (rootEl && rootW) {
      rootEl.style.minWidth = `${rootW}px`;
    }

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
        top: r.top - stageRect.top,
        bottom: r.bottom - stageRect.top,
        left: r.left - stageRect.left,
        right: r.right - stageRect.left,
        y: r.top - stageRect.top + r.height / 2
      };
    };

    const gutter = stage.querySelector(".synth__gutter");
    const ruleGap = stage.querySelector(".synth__rule-gap");
    const topCells = [...stage.querySelectorAll('[data-row="top"]')];
    if (!topCells.length || !gutter || !ruleGap) {
      svg.innerHTML = "";
      return;
    }
    const firstTop = rel(topCells[0]);
    const lastTop = rel(topCells[topCells.length - 1]);
    const topBox = {
      top: Math.min(...topCells.map((c) => rel(c).top)),
      bottom: Math.max(...topCells.map((c) => rel(c).bottom))
    };
    const gapBox = rel(ruleGap);
    const gutterBox = rel(gutter);

    const yTop = topBox.top - 2;
    const yLine = gapBox.top + (gapBox.bottom - gapBox.top) / 2;
    const xLeft = gutterBox.left + 2;
    const xRight = gutterBox.right - 1;
    const midY = yTop + (yLine - yTop) * 0.5;
    const curve = [
      `M ${xLeft.toFixed(1)} ${yTop.toFixed(1)}`,
      `C ${xRight.toFixed(1)} ${(yTop + (midY - yTop) * 0.35).toFixed(1)}`,
      `${xRight.toFixed(1)} ${(yLine - (yLine - midY) * 0.35).toFixed(1)}`,
      `${xLeft.toFixed(1)} ${yLine.toFixed(1)}`
    ].join(" ");
    const bar = `M ${xLeft.toFixed(1)} ${yLine.toFixed(1)} L ${(lastTop.right + 10).toFixed(1)} ${yLine.toFixed(1)}`;

    if (rootEl) {
      const rootH = rootEl.getBoundingClientRect().height;
      const leftBox = rel(stage.querySelector(".synth__left"));
      if (leftBox) {
        rootEl.style.marginTop = `${Math.max(0, firstTop.y - leftBox.top - rootH / 2)}px`;
      }
    }

    svg.innerHTML = `<path class="synth__frame" d="${curve}" /><path class="synth__frame" d="${bar}" />`;
  }

  function drawAllSynth() {
    // Skip synths inside [hidden] panels so mode switches / resize don't
    // measure zero-size tables from the inactive mode.
    const stages = $$(".synth").filter((stage) => !stage.closest("[hidden]"));
    if (!stages.length) return;
    // Shared column / root width so stacked rounds (and every ข้อ) line up.
    const colW = Math.max(...stages.map(measureSynthColWidth));
    const rootW = Math.max(...stages.map(measureSynthRootWidth), 28);
    stages.forEach((stage) => equalizeAndDrawFrame(stage, colW, rootW));
  }

  /* ---------- learn mode ---------- */
  function renderPager() {
    const ui = t()?.ui || {};
    const total = examples().length;
    const n = state.learnIndex + 1;
    $("#pagerLabel").textContent = (ui.pagerLabel || "ข้อ {n}/{total}")
      .replace("{n}", String(n))
      .replace("{total}", String(total));
    const dots = $("#pagerDots");
    dots.innerHTML = "";
    for (let i = 0; i < total; i += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `pager__dot${i === state.learnIndex ? " pager__dot--active" : ""}`;
      btn.setAttribute("aria-label", `ข้อ ${i + 1}`);
      if (i === state.learnIndex) btn.setAttribute("aria-current", "true");
      else btn.removeAttribute("aria-current");
      btn.addEventListener("click", () => {
        state.learnIndex = i;
        renderLearn();
      });
      dots.appendChild(btn);
    }
    $("#pagerPrev").disabled = state.learnIndex <= 0;
    $("#pagerNext").disabled = state.learnIndex >= total - 1;
  }

  function renderLearn() {
    const list = examples();
    if (state.learnIndex >= list.length) {
      state.learnIndex = Math.max(0, list.length - 1);
    }
    const ex = list[state.learnIndex];
    const ui = t()?.ui || {};
    const body = $("#learnBody");
    if (!ex || !body) return;

    renderPager();

    const prep = (ex.prep || []).map((line) => `<li>${line}</li>`).join("");
    const synthHtml = ex.rounds
      .map((round, i) => renderLearnSynth(round, `learnSynth${i}`))
      .join("");

    body.innerHTML = `
      <p class="prompt-line">${escapeHtml(ui.promptPrefix || "แยกตัวประกอบพหุนาม")} $${ex.polyTex}$</p>
      <p class="method-line">${escapeHtml(ui.methodLabel || "วิธีทำ")}</p>
      <ul class="prep-list">${prep}</ul>
      <p class="choose-line">${escapeHtml(ui.chooseRoot || "")}</p>
      <div class="synth-stack">${synthHtml}</div>
      <p class="result-line"><span class="result-line__label">${escapeHtml(ui.willGet || "จะได้")}</span> $${ex.polyTex} = ${ex.mid}$</p>
      <p class="result-line"><span class="result-line__label">${escapeHtml(ui.therefore || "ดังนั้น")}</span> $${ex.polyTex} = ${ex.final}$</p>
    `;
    renderMath(body);
    requestAnimationFrame(() => requestAnimationFrame(drawAllSynth));
  }

  /* ---------- test mode interactive synth ---------- */
  function inputHtml(name, opts = {}) {
    const { value = "", locked = false, aria = "" } = opts;
    const ro = locked ? "readonly" : "";
    const lockedCls = locked ? " synth-input--locked" : "";
    return `<input class="synth-input${lockedCls}" type="text" inputmode="text" name="${name}" value="${escapeHtml(value)}" ${ro} maxlength="8" aria-label="${escapeHtml(aria)}" autocomplete="off">`;
  }

  function renderInteractiveSynth(coeffs, roundId, options = {}) {
    const {
      locked = false,
      filled = null,
      showRoot = true
    } = options;
    const n = coeffs.length;
    const midRow = 2;
    const gapRow = 3;
    const botRow = 4;
    const doubleRow = 5;
    const rootVal = filled?.root ?? "";
    const products = filled?.products || [];
    const bottom = filled?.bottom || [];

    const cell = (col, row, html) =>
      `<span class="synth__cell" data-col="${col}" data-row="${row}" style="grid-column:${col + 1};grid-row:${row === "top" ? 1 : row === "mid" ? midRow : botRow}">${html}</span>`;

    const topCells = coeffs
      .map((c, i) =>
        cell(i, "top", `<span class="synth__val coeff-fixed">${katexHtml(String(c))}</span>`)
      )
      .join("");

    const midCells = coeffs
      .map((_, i) => {
        if (i === 0) return cell(i, "mid", "");
        const v = products[i - 1] ?? "";
        return cell(
          i,
          "mid",
          `<span class="synth__val">${inputHtml(`${roundId}-mid-${i}`, {
            value: v,
            locked,
            aria: `ผลคูณคอลัมน์ ${i + 1}`
          })}</span>`
        );
      })
      .join("");

    const botCells = coeffs
      .map((_, i) => {
        const v = bottom[i] ?? "";
        return cell(
          i,
          "bot",
          `<span class="synth__val">${inputHtml(`${roundId}-bot-${i}`, {
            value: v,
            locked,
            aria: `ผลบวกคอลัมน์ ${i + 1}`
          })}</span>`
        );
      })
      .join("");

    const rootHtml = showRoot
      ? inputHtml(`${roundId}-root`, {
          value: rootVal,
          locked,
          aria: "ตัวเลขที่ใช้หารสังเคราะห์"
        })
      : "";

    return `
      <div class="synth synth--interactive" id="synth-${roundId}" data-n="${n}" data-round="${roundId}">
        <svg class="synth__svg" aria-hidden="true"></svg>
        <div class="synth__layout">
          <div class="synth__left"><div class="synth__root">${rootHtml}</div></div>
          <div class="synth__gutter" aria-hidden="true"></div>
          <div class="synth__table" style="grid-template-columns: repeat(${n}, minmax(3.2em, max-content));">
            ${topCells}
            ${midCells}
            <div class="synth__rule-gap" style="grid-column:1/-1;grid-row:${gapRow}" aria-hidden="true"></div>
            ${botCells}
            <div class="synth__double" style="grid-column:1/-1;grid-row:${doubleRow}"></div>
          </div>
        </div>
      </div>
    `;
  }

  function ratToInput(r) {
    if (!r) return "";
    return r.d === 1 ? String(r.n) : `${r.n}/${r.d}`;
  }

  function snapshotFromExpected(coeffs, root) {
    const expected = synthDivide(toRats(coeffs), root);
    return {
      root: ratToInput(root),
      products: expected.products.slice(1).map(ratToInput),
      bottom: expected.bottom.map(ratToInput)
    };
  }

  function readRoundInputs(roundId, n) {
    const rootEl = document.querySelector(`[name="${roundId}-root"]`);
    const rootParsed = parseNumber(rootEl?.value);
    const products = [];
    const bottom = [];
    // Root must parse successfully (also guards synthDivide). Mid/bot blanks
    // clear allFilled; invalid mid/bot tokens still count as filled so the
    // mismatch message is shown instead of the empty prompt.
    let allFilled = rootParsed.ok;

    for (let i = 1; i < n; i += 1) {
      const el = document.querySelector(`[name="${roundId}-mid-${i}"]`);
      const p = parseNumber(el?.value);
      if (p.empty) allFilled = false;
      products.push(p.ok ? p.value : null);
    }
    for (let i = 0; i < n; i += 1) {
      const el = document.querySelector(`[name="${roundId}-bot-${i}"]`);
      const p = parseNumber(el?.value);
      if (p.empty) allFilled = false;
      bottom.push(p.ok ? p.value : null);
    }

    return {
      root: rootParsed.ok ? rootParsed.value : null,
      products,
      bottom,
      allFilled
    };
  }

  function markRound(roundId, n, verdict) {
    // verdict: { rootOk, midOk[], botOk[] } or null to clear
    const set = (name, ok) => {
      const el = document.querySelector(`[name="${name}"]`);
      if (!el || el.readOnly) return;
      el.classList.remove("synth-input--ok", "synth-input--bad");
      if (ok === true) el.classList.add("synth-input--ok");
      if (ok === false) el.classList.add("synth-input--bad");
    };
    if (!verdict) {
      $$(`[name^="${roundId}-"]`).forEach((el) => {
        el.classList.remove("synth-input--ok", "synth-input--bad");
      });
      return;
    }
    set(`${roundId}-root`, verdict.rootOk);
    for (let i = 1; i < n; i += 1) set(`${roundId}-mid-${i}`, verdict.midOk[i - 1]);
    for (let i = 0; i < n; i += 1) set(`${roundId}-bot-${i}`, verdict.botOk[i]);
  }

  function validateRound(coeffs, roundId) {
    const n = coeffs.length;
    const read = readRoundInputs(roundId, n);
    const ui = t()?.ui || {};
    if (!read.allFilled) {
      return { ok: false, reason: "empty", message: ui.fillAll };
    }
    const expected = synthDivide(toRats(coeffs), read.root);
    const midOk = [];
    const botOk = [];
    let allMatch = true;
    for (let i = 1; i < n; i += 1) {
      const got = read.products[i - 1];
      const ok = got != null && ratEq(got, expected.products[i]);
      midOk.push(ok);
      if (!ok) allMatch = false;
    }
    for (let i = 0; i < n; i += 1) {
      const got = read.bottom[i];
      const ok = got != null && ratEq(got, expected.bottom[i]);
      botOk.push(ok);
      if (!ok) allMatch = false;
    }
    const remOk = expected.remIsZero;
    markRound(roundId, n, {
      rootOk: remOk && allMatch,
      midOk,
      botOk
    });
    if (!allMatch) {
      return { ok: false, reason: "mismatch", message: ui.incorrect, root: read.root };
    }
    if (!remOk) {
      return { ok: false, reason: "remainder", message: ui.remNotZero, root: read.root };
    }
    return {
      ok: true,
      root: read.root,
      quotient: expected.quotient.map((r) => r.n),
      expected
    };
  }

  function setFeedback(kind, message) {
    const el = $("#testFeedback");
    if (!el) return;
    if (!message) {
      el.hidden = true;
      el.textContent = "";
      el.className = "test-feedback";
      return;
    }
    el.hidden = false;
    el.textContent = message;
    el.className = `test-feedback test-feedback--${kind || "info"}`;
  }

  function renderTest() {
    const ui = t()?.ui || {};
    const body = $("#testBody");
    const problem = state.problem;
    if (!body || !problem) return;

    const needTwo = problem.roundsNeeded === 2;
    const q1 = problem.poly;
    const round2Coeffs = state.round2Coeffs;
    const filled1 = state.snapshot1;
    const filled2 = state.snapshot2;
    const showResult = state.revealed || state.feedback?.complete;

    const promptEl = $("#testPrompt");
    if (promptEl) {
      promptEl.innerHTML = `${escapeHtml(ui.promptPrefix || "แยกตัวประกอบพหุนาม")} $${problem.polyTex}$`;
      renderMath(promptEl);
    }

    let html = `
      <p class="method-line">${escapeHtml(ui.methodLabel || "วิธีทำ")} ${escapeHtml(ui.synthLabel || "หารสังเคราะห์")}</p>
    `;

    if (needTwo) {
      html += `<p class="round-title">${(ui.roundLabel || "รอบที่ {n}").replace("{n}", "1")}</p>`;
    }
    html += renderInteractiveSynth(q1, "r1", {
      locked: state.round1Done || state.revealed,
      filled: filled1
    });

    if (needTwo) {
      const locked2 = !state.round1Done && !state.revealed;
      html += `
        <div class="round-block${locked2 ? " round-block--locked" : ""}" id="round2Block">
          <p class="round-title">${(ui.roundLabel || "รอบที่ {n}").replace("{n}", "2")}</p>
          ${
            round2Coeffs
              ? renderInteractiveSynth(round2Coeffs, "r2", {
                  locked: state.revealed || !!state.feedback?.complete,
                  filled: filled2
                })
              : `<p class="choose-line">${escapeHtml(
                  state.round1Done ? ui.round1Ok || "" : ui.round2Locked || ""
                )}</p>`
          }
        </div>
      `;
    }

    if (showResult) {
      const mid = problem.midTex;
      const final = problem.finalTex;
      html += `
        <p class="result-line" id="resultMid"><span class="result-line__label">${escapeHtml(ui.willGet || "จะได้")}</span> $${problem.polyTex} = ${mid}$</p>
        <p class="result-line" id="resultFinal"><span class="result-line__label">${escapeHtml(ui.therefore || "ดังนั้น")}</span> $${problem.polyTex} = ${final}$</p>
      `;
    } else {
      html += `
        <p class="result-line" id="resultMid"><span class="result-line__label">${escapeHtml(ui.willGet || "จะได้")}</span> $${problem.polyTex} =$</p>
        <p class="result-line" id="resultFinal"><span class="result-line__label">${escapeHtml(ui.therefore || "ดังนั้น")}</span> $${problem.polyTex} =$</p>
      `;
    }

    body.innerHTML = html;
    renderMath(body);
    bindTestInputs(body);
    requestAnimationFrame(() => requestAnimationFrame(drawAllSynth));

    if (state.feedback?.message) {
      setFeedback(state.feedback.kind, state.feedback.message);
    } else {
      setFeedback(null, null);
    }
  }

  function bindTestInputs(root) {
    $$(".synth-input", root).forEach((input) => {
      input.addEventListener("input", () => {
        sanitizeNumberInput(input);
        input.classList.remove("synth-input--ok", "synth-input--bad");
        if (state.feedback && !state.revealed) {
          state.feedback = null;
          setFeedback(null, null);
        }
      });
    });
  }

  function applyFactorResult(problem, roots) {
    const cf = completeFactorization(problem.poly, roots);
    if (cf) {
      problem.midTex = cf.mid;
      problem.finalTex = cf.final;
      return;
    }
    problem.finalTex = factorsLatex(problem.factors);
    problem.midTex = problem.finalTex;
  }

  function checkTest() {
    const ui = t()?.ui || {};
    const problem = state.problem;
    if (!problem || state.revealed || state.feedback?.complete) return;

    const needTwo = problem.roundsNeeded === 2;

    if (!state.round1Done) {
      const result = validateRound(problem.poly, "r1");
      if (!result.ok) {
        state.feedback = { kind: "bad", message: result.message || ui.incorrect };
        setFeedback("bad", state.feedback.message);
        return;
      }
      state.usedRoots = [result.root];
      state.snapshot1 = snapshotFromExpected(problem.poly, result.root);
      state.round1Done = true;

      if (!needTwo) {
        applyFactorResult(problem, [result.root]);
        state.feedback = {
          kind: "ok",
          message: ui.allOk || "ถูกต้อง",
          complete: true
        };
        renderTest();
        return;
      }

      const qRats = result.expected.quotient;
      if (qRats.some((r) => r.d !== 1)) {
        state.feedback = { kind: "bad", message: ui.incorrect };
        state.round1Done = false;
        state.snapshot1 = null;
        state.usedRoots = [];
        setFeedback("bad", state.feedback.message);
        return;
      }
      state.round2Coeffs = qRats.map((r) => r.n);
      state.snapshot2 = null;
      state.feedback = { kind: "ok", message: ui.round1Ok || "รอบที่ 1 ถูกต้องแล้ว" };
      renderTest();
      return;
    }

    // round 2
    if (!state.round2Coeffs) return;
    const result2 = validateRound(state.round2Coeffs, "r2");
    if (!result2.ok) {
      state.feedback = { kind: "bad", message: result2.message || ui.incorrect };
      setFeedback("bad", state.feedback.message);
      return;
    }
    state.usedRoots = [state.usedRoots[0], result2.root];
    state.snapshot2 = snapshotFromExpected(state.round2Coeffs, result2.root);
    applyFactorResult(problem, state.usedRoots);
    state.feedback = {
      kind: "ok",
      message: ui.allOk || "ถูกต้อง",
      complete: true
    };
    renderTest();
  }

  function revealTest() {
    const ui = t()?.ui || {};
    const problem = state.problem;
    if (!problem) return;
    const root1 = problem.roots[0];
    state.revealed = true;
    state.round1Done = true;
    state.usedRoots = problem.roots.slice(0, problem.roundsNeeded);
    state.snapshot1 = snapshotFromExpected(problem.poly, root1);
    if (problem.roundsNeeded === 2) {
      const div = synthDivide(toRats(problem.poly), root1);
      state.round2Coeffs = div.quotient.map((r) => r.n);
      state.snapshot2 = snapshotFromExpected(state.round2Coeffs, problem.roots[1]);
    }
    applyFactorResult(problem, state.usedRoots);
    state.feedback = { kind: "info", message: ui.revealed || "เฉลย", complete: true };
    renderTest();
  }

  function clearTestProgress() {
    state.round1Done = false;
    state.revealed = false;
    state.feedback = null;
    state.usedRoots = [];
    state.snapshot1 = null;
    state.snapshot2 = null;
    state.round2Coeffs = null;
  }

  function resetTestInputs() {
    clearTestProgress();
    renderTest();
  }

  function randomize() {
    state.problem = nextProblem();
    clearTestProgress();
    renderTest();
  }

  /* ---------- mode / modal / bootstrap ---------- */
  function setMode(mode) {
    state.mode = mode;
    const learnBtn = $("#modeLearnBtn");
    const testBtn = $("#modeTestBtn");
    learnBtn.classList.toggle("mode-btn--active", mode === "learn");
    testBtn.classList.toggle("mode-btn--active", mode === "test");
    learnBtn.setAttribute("aria-pressed", mode === "learn" ? "true" : "false");
    testBtn.setAttribute("aria-pressed", mode === "test" ? "true" : "false");
    $("#learnPanel").hidden = mode !== "learn";
    $("#testPanel").hidden = mode !== "test";
    if (mode === "learn") renderLearn();
    else {
      if (!state.problem) randomize();
      else renderTest();
    }
  }

  function openInfo() {
    const ui = t()?.ui || {};
    const formulas = t()?.formulas || [];
    $("#infoTitle").textContent = ui.infoTitle || "สูตรการแยกตัวประกอบ";
    $("#infoBody").innerHTML = formulas
      .map((f) => {
        if (typeof f === "string") return `<p class="formula-item">${f}</p>`;
        const nameHtml = `<span class="formula-item__name">${f.name || ""}</span>`;
        return `<p class="formula-item">${nameHtml}<span class="formula-item__tex">${f.tex}</span></p>`;
      })
      .join("");
    renderMath($("#infoBody"));
    $("#infoModal").hidden = false;
    $("#infoCloseBtn").focus();
  }

  function closeInfo() {
    $("#infoModal").hidden = true;
    $("#infoBtn")?.focus();
  }

  function applyContent() {
    const c = t();
    if (!c) return;
    $("#landingEyebrow").textContent = c.landing.eyebrow;
    $("#landingTitle").textContent = c.landing.title;
    $("#startButton").textContent = c.landing.start;
    $("#appTitle").textContent = c.app.title;
    document.title = `${c.app.title} | Interactive Mathematics`;
    $("#modeLabel").textContent = c.ui.modeLabel;
    $("#modeLearnBtn").textContent = c.ui.modeLearn;
    $("#modeTestBtn").textContent = c.ui.modeTest;
    $("#randomBtn").textContent = c.ui.random;
    $("#checkBtn").textContent = c.ui.check;
    $("#revealBtn").textContent = c.ui.reveal;
    $("#testReset").setAttribute("aria-label", c.ui.reset);
    $("#testReset").setAttribute("title", c.ui.reset);
    $("#infoBtn").setAttribute("aria-label", c.ui.infoAria);
    $("#infoBtn").setAttribute("title", c.ui.infoAria);
  }

  function showApp() {
    $("#landingPage").hidden = true;
    $("#landingPage").classList.remove("view--active");
    $("#appPage").hidden = false;
    $("#appPage").classList.add("view--active");
    $("#appTitle").focus?.();
    setMode(state.mode);
  }

  function bootstrap() {
    applyContent();
    $("#startButton").addEventListener("click", showApp);
    $("#modeLearnBtn").addEventListener("click", () => setMode("learn"));
    $("#modeTestBtn").addEventListener("click", () => setMode("test"));
    $("#pagerPrev").addEventListener("click", () => {
      if (state.learnIndex > 0) {
        state.learnIndex -= 1;
        renderLearn();
      }
    });
    $("#pagerNext").addEventListener("click", () => {
      const last = examples().length - 1;
      if (state.learnIndex < last) {
        state.learnIndex += 1;
        renderLearn();
      }
    });
    $("#infoBtn").addEventListener("click", openInfo);
    $("#infoCloseBtn").addEventListener("click", closeInfo);
    $("#infoModal").addEventListener("click", (e) => {
      if (e.target?.dataset?.close) closeInfo();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#infoModal").hidden) closeInfo();
    });
    $("#randomBtn").addEventListener("click", randomize);
    $("#testReset").addEventListener("click", resetTestInputs);
    $("#checkBtn").addEventListener("click", checkTest);
    $("#revealBtn").addEventListener("click", revealTest);
    window.addEventListener("resize", () => {
      requestAnimationFrame(drawAllSynth);
    });
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
