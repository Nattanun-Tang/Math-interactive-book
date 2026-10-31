(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /**
   * phase:
   *  needConstant | needLeading | pickRoot | synth |
   *  needConstant2 | needLeading2 | pickRoot2 | synth2 | done
   */
  const state = {
    problem: null,
    problemIndex: 0,
    phase: "needConstant",
    factors: [],
    kFactors: [],
    mFactors: [],
    constantConsumed: false,
    leadingConsumed: false,
    selectedValue: null,
    selectedKind: null,
    evalRoot: null,
    evalValue: null,
    rootsFound: [],
    displayedFactors: [],
    quotient: null,
    quotient2: null,
    synthLocked: false,
    synth2Locked: false,
    dragPayload: null
  };

  /** Cycle every 8 problems: deg3 monic ×2, deg4 monic ×2, deg3 non-monic ×2, deg4 non-monic ×2 */
  const PROBLEM_CYCLE = [
    { degree: 3, monic: true },
    { degree: 3, monic: true },
    { degree: 4, monic: true },
    { degree: 4, monic: true },
    { degree: 3, monic: false },
    { degree: 3, monic: false },
    { degree: 4, monic: false },
    { degree: 4, monic: false }
  ];

  function t() {
    return window.CONTENT?.th;
  }

  function ui() {
    return t()?.ui || {};
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

  function asRat(value) {
    if (value == null) return null;
    if (typeof value === "number") return rat(value);
    if (typeof value === "object" && value.n != null) return rat(value.n, value.d || 1);
    return null;
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

  function ratPlain(r) {
    if (r.d === 1) return String(r.n);
    return `${r.n}/${r.d}`;
  }

  function ratKey(r) {
    return `${r.n}/${r.d}`;
  }

  /* ---------- math helpers ---------- */
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

  function substPolyLatex(coeffs, root) {
    const maxDeg = coeffs.length - 1;
    const r = asRat(root);
    const v = `\\left(${ratLatex(r)}\\right)`;
    const parts = [];
    for (let i = 0; i < coeffs.length; i += 1) {
      const c = coeffs[i];
      if (c === 0) continue;
      const deg = maxDeg - i;
      const abs = Math.abs(c);
      let body;
      if (deg === 0) body = String(abs);
      else if (deg === 1) body = abs === 1 ? v : `${abs}${v}`;
      else body = abs === 1 ? `${v}^{${deg}}` : `${abs}${v}^{${deg}}`;
      if (!parts.length) parts.push(c < 0 ? `-${body}` : body);
      else parts.push(c < 0 ? `- ${body}` : `+ ${body}`);
    }
    return parts.length ? parts.join(" ") : "0";
  }

  function substTermValues(coeffs, root) {
    const maxDeg = coeffs.length - 1;
    const r = asRat(root);
    const values = [];
    for (let i = 0; i < coeffs.length; i += 1) {
      const c = coeffs[i];
      if (c === 0) continue;
      const deg = maxDeg - i;
      values.push(ratMul(rat(c), ratPow(r, deg)));
    }
    return values;
  }

  function signedSumLatex(values) {
    const parts = [];
    values.forEach((v) => {
      const r = asRat(v);
      const abs = rat(Math.abs(r.n), r.d);
      const body = ratLatex(abs);
      if (!parts.length) parts.push(r.n < 0 ? `-${body}` : body);
      else parts.push(r.n < 0 ? `- ${body}` : `+ ${body}`);
    });
    return parts.length ? parts.join(" ") : "0";
  }

  function linearFactorLatex(root) {
    const r = asRat(root);
    // Factor corresponding to root k/m is (m x - k)
    const m = r.d;
    const k = r.n;
    if (m === 1) {
      if (k === 0) return "x";
      if (k > 0) return `x - ${k}`;
      return `x + ${Math.abs(k)}`;
    }
    if (k === 0) return `${m}x`;
    if (k > 0) return `${m}x - ${k}`;
    return `${m}x + ${Math.abs(k)}`;
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

  function evalPoly(coeffs, root) {
    const r = asRat(root);
    return coeffs.reduce((acc, c) => ratAdd(ratMul(acc, r), rat(c)), rat(0));
  }

  function synthDivide(coeffs, root) {
    const r = asRat(root);
    const n = coeffs.length;
    const bottom = Array(n);
    const products = Array(n).fill(null);
    bottom[0] = rat(coeffs[0]);
    for (let i = 1; i < n; i += 1) {
      products[i] = ratMul(r, bottom[i - 1]);
      bottom[i] = ratAdd(rat(coeffs[i]), products[i]);
    }
    const rem = bottom[n - 1];
    return {
      products,
      bottom,
      quotientRats: bottom.slice(0, n - 1),
      rem,
      remIsZero: ratIsZero(rem)
    };
  }

  function quotientInts(div) {
    return div.quotientRats.map((x) => {
      if (x.d !== 1) throw new Error("non-integer quotient");
      return x.n;
    });
  }

  /** Rewrite (x - k/m) Q → (m x - k)(Q/m) when possible. */
  function absorbRootScale(quotient, root) {
    const r = asRat(root);
    if (r.d === 1) return { factor: linearFactorLatex(r), quot: quotient };
    if (quotient.every((c) => typeof c === "number" && c % r.d === 0)) {
      return {
        factor: linearFactorLatex(r),
        quot: quotient.map((c) => c / r.d)
      };
    }
    return {
      factor: `x - ${ratLatex(r)}`,
      quot: quotient
    };
  }

  function positiveDivisors(n) {
    const abs = Math.abs(n);
    const out = [];
    for (let i = 1; i <= abs; i += 1) {
      if (abs % i === 0) out.push(i);
    }
    return out;
  }

  function signedDivisors(n) {
    if (n === 0) return [0];
    const pos = positiveDivisors(n);
    const out = [];
    pos.forEach((d) => {
      out.push(d);
      out.push(-d);
    });
    return out;
  }

  function kmCandidates(constant, leading) {
    const ks = signedDivisors(constant);
    const ms = positiveDivisors(leading);
    const seen = new Set();
    const out = [];
    for (const k of ks) {
      for (const m of ms) {
        const r = rat(k, m);
        const key = ratKey(r);
        if (!seen.has(key)) {
          seen.add(key);
          out.push(r);
        }
      }
    }
    return out;
  }

  function pickDistinct(pool, count) {
    const bag = [...pool];
    const out = [];
    while (out.length < count && bag.length) {
      const i = Math.floor(Math.random() * bag.length);
      out.push(bag.splice(i, 1)[0]);
    }
    return out;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function linearPairLatex(lead, constTerm) {
    if (lead === 1 && constTerm === 0) return "x";
    if (lead === 1) {
      if (constTerm > 0) return `x + ${constTerm}`;
      if (constTerm < 0) return `x - ${Math.abs(constTerm)}`;
    }
    if (lead === -1) {
      if (constTerm === 0) return "-x";
      if (constTerm > 0) return `-x + ${constTerm}`;
      return `-x - ${Math.abs(constTerm)}`;
    }
    if (constTerm === 0) return `${lead}x`;
    if (constTerm > 0) return `${lead}x + ${constTerm}`;
    return `${lead}x - ${Math.abs(constTerm)}`;
  }

  function factorQuadraticInts(a, b, c) {
    const absA = Math.abs(a);
    // Prefer larger |p| first so e.g. 2x^2-4x → (2x)(x-2), not x(2x-4).
    const pCandidates = positiveDivisors(absA).slice().reverse();
    for (const p of pCandidates) {
      if (a % p !== 0) continue;
      const rLead = a / p;
      if (c === 0) {
        // (p x)(rLead x + s) with p*s = b
        if (p !== 0 && b % p === 0) {
          const s = b / p;
          return [linearPairLatex(p, 0), linearPairLatex(rLead, s)];
        }
        // (p x + q)(rLead x) with q*rLead = b
        if (rLead !== 0 && b % rLead === 0) {
          const q = b / rLead;
          return [linearPairLatex(p, q), linearPairLatex(rLead, 0)];
        }
        continue;
      }
      const absC = Math.abs(c);
      const qCandidates = [...positiveDivisors(absC), ...positiveDivisors(absC).map((x) => -x)];
      for (const q of qCandidates) {
        if (q === 0 || c % q !== 0) continue;
        const s = c / q;
        if (p * s + q * rLead === b) {
          return [linearPairLatex(p, q), linearPairLatex(rLead, s)];
        }
      }
    }
    return null;
  }

  /* ---------- problem generation ---------- */
  const MAX_CANDIDATES = 10;

  function synthCandidatesOk(constant, leading) {
    if (constant === 0) return false;
    if (Math.abs(leading) === 1) return signedDivisors(constant).length <= MAX_CANDIDATES;
    return kmCandidates(constant, leading).length <= MAX_CANDIDATES;
  }

  function allRoundPathsOk(poly, roots) {
    // After each possible first root, the absorbed quotient must stay workable for round 2.
    for (const root of roots) {
      const div = synthDivide(poly, root);
      if (!div.remIsZero) return false;
      let quot;
      try {
        quot = absorbRootScale(quotientInts(div), root).quot;
      } catch {
        return false;
      }
      const qLead = quot[0];
      const qConst = quot[quot.length - 1];
      if (!synthCandidatesOk(qConst, qLead)) return false;
    }
    return true;
  }

  function isMonicPoly(poly) {
    return Math.abs(poly[0]) === 1;
  }

  /** Build integer poly from rational roots via (d x - n) factors. */
  function assembleProblem(roots) {
    let poly = [1];
    roots.forEach((root) => {
      const r = asRat(root);
      poly = mulPoly(poly, [r.d, -r.n]);
    });
    const leading = poly[0];
    const constant = poly[poly.length - 1];
    if (!synthCandidatesOk(constant, leading)) return null;
    if (Math.abs(constant) > 48) return null;
    if (poly.some((c) => Math.abs(c) > 48)) return null;
    if (roots.length === 4 && !allRoundPathsOk(poly, roots)) return null;
    const hasFraction = roots.some((root) => asRat(root).d > 1);
    if (Math.abs(leading) > 1 && !hasFraction) return null;
    return {
      degree: roots.length,
      leading,
      roots: shuffle(roots.map((r) => asRat(r))),
      poly,
      polyTex: polyLatex(poly),
      constant,
      monic: isMonicPoly(poly)
    };
  }

  function buildProblem(opts = {}) {
    const degree = opts.degree === 4 ? 4 : 3;
    const wantMonic = opts.monic !== false;
    const wantNonMonic = !wantMonic;
    const intRoots = [rat(1), rat(-1), rat(2), rat(-2), rat(3), rat(-3), rat(4), rat(-4)];
    const fracRoots = [
      rat(1, 2),
      rat(-1, 2),
      rat(3, 2),
      rat(-3, 2),
      rat(1, 3),
      rat(-1, 3),
      rat(2, 3),
      rat(-2, 3)
    ];
    const smallInt = [rat(1), rat(-1), rat(2), rat(-2), rat(3), rat(-3)];

    for (let attempt = 0; attempt < 160; attempt += 1) {
      let roots;
      if (wantNonMonic) {
        const needFrac = 1;
        const fracs = pickDistinct(fracRoots, needFrac);
        const ints = pickDistinct(
          smallInt.filter((r) => !fracs.some((f) => ratEq(f, r))),
          degree - fracs.length
        );
        roots = [...fracs, ...ints];
        if (roots.length < degree) continue;
      } else {
        roots = pickDistinct(intRoots, degree);
        if (roots.length < degree) continue;
      }
      const problem = assembleProblem(roots);
      if (!problem) continue;
      if (wantNonMonic && problem.monic) continue;
      if (wantMonic && !problem.monic) continue;
      if (problem.degree !== degree) continue;
      return problem;
    }

    // Fallbacks with known-good fractional / monic cases matching the requested type
    if (wantNonMonic) {
      const fracDeg3 = assembleProblem([rat(1, 2), rat(-1), rat(2)]);
      if (fracDeg3 && degree === 3 && !fracDeg3.monic) return fracDeg3;
      const fracDeg4 = assembleProblem([rat(1, 2), rat(-1), rat(1), rat(2)]);
      if (fracDeg4 && degree === 4 && !fracDeg4.monic) return fracDeg4;
      if (fracDeg3 && !fracDeg3.monic) return fracDeg3;
      if (fracDeg4 && !fracDeg4.monic) return fracDeg4;
    }
    const monic = assembleProblem(degree === 4 ? [rat(1), rat(-1), rat(2), rat(-2)] : [rat(1), rat(2), rat(3)]);
    if (monic && monic.monic === wantMonic && monic.degree === degree) return monic;
    return (
      monic || {
        degree: 3,
        leading: 1,
        roots: [rat(1), rat(2), rat(3)],
        poly: [1, -6, 11, -6],
        polyTex: polyLatex([1, -6, 11, -6]),
        constant: -6,
        monic: true
      }
    );
  }

  function nextProblemSpec() {
    return PROBLEM_CYCLE[state.problemIndex % PROBLEM_CYCLE.length];
  }

  function currentIsMonic() {
    const coeffs = currentCoeffs();
    return coeffs ? isMonicPoly(coeffs) : true;
  }

  /* ---------- number parsing ---------- */
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

  /* ---------- synth UI ---------- */
  function inputHtml(name, opts = {}) {
    const { value = "", locked = false, aria = "" } = opts;
    const ro = locked ? "readonly" : "";
    const lockedCls = locked ? " synth-input--locked" : "";
    return `<input class="synth-input${lockedCls}" type="text" inputmode="text" name="${name}" value="${escapeHtml(
      value
    )}" ${ro} maxlength="10" aria-label="${escapeHtml(aria)}" autocomplete="off">`;
  }

  function displayRatCell(value) {
    if (value == null || value === "") return "";
    const r = asRat(value);
    return r ? ratPlain(r) : String(value);
  }

  function renderInteractiveSynth(coeffs, roundId, options = {}) {
    const { locked = false, root = null, filled = null } = options;
    const n = coeffs.length;
    const midRow = 2;
    const gapRow = 3;
    const botRow = 4;
    const doubleRow = 5;
    const products = filled?.products || [];
    const bottom = filled?.bottom || [];

    const cell = (col, row, html) =>
      `<span class="synth__cell" data-col="${col}" data-row="${row}" style="grid-column:${col + 1};grid-row:${
        row === "top" ? 1 : row === "mid" ? midRow : botRow
      }">${html}</span>`;

    const topCells = coeffs
      .map((c, i) =>
        cell(i, "top", `<span class="synth__val coeff-fixed">${katexHtml(String(c))}</span>`)
      )
      .join("");

    const midCells = coeffs
      .map((_, i) => {
        if (i === 0) return cell(i, "mid", "");
        const v = displayRatCell(products[i - 1]);
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
        const v = displayRatCell(bottom[i]);
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

    const rootHtml = katexHtml(ratLatex(asRat(root)));

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
    const num = root.querySelector(".katex") || root;
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
    if (rootEl && rootW) rootEl.style.minWidth = `${rootW}px`;

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
    const stages = $$(".synth").filter((stage) => !stage.closest("[hidden]"));
    if (!stages.length) return;
    const colW = Math.max(...stages.map(measureSynthColWidth));
    const rootW = Math.max(...stages.map(measureSynthRootWidth), 28);
    stages.forEach((stage) => equalizeAndDrawFrame(stage, colW, rootW));
  }

  function readRoundInputs(roundId, n) {
    const products = [];
    const bottom = [];
    let allFilled = true;

    for (let i = 1; i < n; i += 1) {
      const el = document.querySelector(`[name="${roundId}-mid-${i}"]`);
      const p = parseNumberInput(el?.value);
      if (p.empty) allFilled = false;
      products.push(p.ok ? p.value : null);
    }
    for (let i = 0; i < n; i += 1) {
      const el = document.querySelector(`[name="${roundId}-bot-${i}"]`);
      const p = parseNumberInput(el?.value);
      if (p.empty) allFilled = false;
      bottom.push(p.ok ? p.value : null);
    }
    return { products, bottom, allFilled };
  }

  function markRound(roundId, n, verdict) {
    const set = (name, ok) => {
      const el = document.querySelector(`[name="${name}"]`);
      if (!el || el.readOnly) return;
      el.classList.remove("synth-input--ok", "synth-input--bad");
      if (ok === true) el.classList.add("synth-input--ok");
      else if (ok === false) el.classList.add("synth-input--bad");
    };
    if (!verdict) {
      $$(`[name^="${roundId}-"]`).forEach((el) => {
        el.classList.remove("synth-input--ok", "synth-input--bad");
      });
      return;
    }
    for (let i = 1; i < n; i += 1) set(`${roundId}-mid-${i}`, verdict.midOk[i - 1]);
    for (let i = 0; i < n; i += 1) set(`${roundId}-bot-${i}`, verdict.botOk[i]);
  }

  function validateRound(coeffs, root, roundId) {
    const n = coeffs.length;
    const read = readRoundInputs(roundId, n);
    if (!read.allFilled) {
      markRound(roundId, n, {
        midOk: read.products.map((p) => (p != null ? null : false)),
        botOk: read.bottom.map((p) => (p != null ? null : false))
      });
      return { ok: false, reason: "empty" };
    }
    const expected = synthDivide(coeffs, root);
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
    markRound(roundId, n, { midOk, botOk });
    if (!allMatch) {
      return { ok: false, reason: "mismatch" };
    }
    if (!expected.remIsZero) {
      return { ok: false, reason: "remainder" };
    }
    return { ok: true, quotient: quotientInts(expected), expected };
  }

  /* ---------- cards / drag ---------- */
  function cardHtml(value, opts = {}) {
    const {
      kind = "factor",
      draggable = true,
      selected = false,
      muted = false,
      staticOnly = false,
      constant = false,
      leading = false
    } = opts;
    const r = asRat(value);
    const isFrac = r.d > 1;
    const classes = [
      "num-card",
      isFrac ? "num-card--frac" : "",
      kind === "constant" || constant ? "num-card--constant" : "",
      kind === "leading" || leading ? "num-card--leading" : "",
      selected ? "num-card--selected" : "",
      muted ? "num-card--muted" : "",
      staticOnly ? "num-card--static" : ""
    ]
      .filter(Boolean)
      .join(" ");
    const drag = draggable && !muted && !staticOnly ? 'draggable="true"' : "";
    let tex = ratLatex(r);
    if (kind === "factor" && r.d === 1 && r.n > 0) tex = `+${r.n}`;
    const label = ratPlain(r);
    return `<button type="button" class="${classes}" data-kind="${kind}" data-num="${r.n}" data-den="${r.d}" ${drag} aria-label="${escapeHtml(
      label
    )}"${staticOnly ? " tabindex=\"-1\"" : ""}>${katexHtml(tex)}</button>`;
  }

  function staticFactorCards(rats) {
    return rats
      .map((f) =>
        cardHtml(f, {
          kind: "factor",
          draggable: false,
          staticOnly: true
        })
      )
      .join("");
  }

  function zoneLabelHtml(label) {
    return label.includes("$") ? label : escapeHtml(label);
  }

  function zoneShell({ id, drop, label, filled, waiting, extraClass = "", body }) {
    const classes = [
      "drop-zone",
      filled ? "drop-zone--filled" : "",
      waiting ? "drop-zone--waiting" : "",
      extraClass
    ]
      .filter(Boolean)
      .join(" ");
    return `
      <div class="${classes}" id="${id}" ${drop ? `data-drop="${drop}"` : ""} role="group" aria-label="${escapeHtml(
        label.replace(/\$/g, "")
      )}">
        <span class="drop-zone__label">${zoneLabelHtml(label)}</span>
        <div class="drop-zone__body">${body}</div>
      </div>
    `;
  }

  function readCardRat(card) {
    return rat(Number(card.dataset.num), Number(card.dataset.den || 1));
  }

  function isRound2Phase() {
    return (
      state.phase === "needConstant2" ||
      state.phase === "needLeading2" ||
      state.phase === "pickRoot2" ||
      state.phase === "synth2" ||
      (state.phase === "done" && state.problem?.degree === 4)
    );
  }

  function currentCoeffs() {
    if (isRound2Phase()) return state.quotient;
    return state.problem?.poly;
  }

  function currentConstant() {
    const coeffs = currentCoeffs();
    return coeffs ? coeffs[coeffs.length - 1] : null;
  }

  function currentLeading() {
    const coeffs = currentCoeffs();
    return coeffs ? coeffs[0] : null;
  }

  function ratSelectedEq(a, b) {
    if (a == null || b == null) return false;
    return ratEq(asRat(a), asRat(b));
  }

  /* ---------- phase transitions ---------- */
  function acceptConstantDrop() {
    const constant = currentConstant();
    if (constant == null) return;
    state.constantConsumed = true;
    state.kFactors = signedDivisors(constant).map((n) => rat(n));
    state.selectedValue = null;
    state.selectedKind = null;
    state.evalRoot = null;
    state.evalValue = null;

    const monic = currentIsMonic();
    if (monic) {
      state.factors = state.kFactors;
      state.leadingConsumed = true;
      if (state.phase === "needConstant") state.phase = "pickRoot";
      if (state.phase === "needConstant2") state.phase = "pickRoot2";
    } else {
      state.factors = [];
      state.mFactors = [];
      if (state.phase === "needConstant") state.phase = "needLeading";
      if (state.phase === "needConstant2") state.phase = "needLeading2";
    }
    render();
  }

  function acceptLeadingDrop() {
    const leading = currentLeading();
    if (leading == null) return;
    if (!(state.phase === "needLeading" || state.phase === "needLeading2")) return;
    state.leadingConsumed = true;
    state.mFactors = positiveDivisors(leading).map((n) => rat(n));
    state.factors = kmCandidates(currentConstant(), leading);
    state.selectedValue = null;
    state.selectedKind = null;
    if (state.phase === "needLeading") state.phase = "pickRoot";
    if (state.phase === "needLeading2") state.phase = "pickRoot2";
    render();
  }

  function placeEvalRoot(value) {
    const coeffs = currentCoeffs();
    if (!coeffs) return;
    if (!(state.phase === "pickRoot" || state.phase === "pickRoot2")) return;
    const root = asRat(value);
    const result = evalPoly(coeffs, root);
    state.evalRoot = root;
    state.evalValue = result;
    state.selectedValue = null;
    state.selectedKind = null;

    if (!ratIsZero(result)) {
      render();
      return;
    }

    state.rootsFound = [...state.rootsFound, root];
    if (state.phase === "pickRoot") state.phase = "synth";
    else state.phase = "synth2";
    render();
  }

  function clearEvalSlot() {
    if (!(state.phase === "pickRoot" || state.phase === "pickRoot2")) return;
    state.evalRoot = null;
    state.evalValue = null;
    render();
  }

  function onSynthSuccess(round) {
    const root = state.rootsFound[round - 1];
    const coeffs = round === 1 ? state.problem.poly : state.quotient;
    const div = synthDivide(coeffs, root);
    // Fold (x - k/m)·Q into (m x - k)·(Q/m) so U(x) matches the written factorization.
    const absorbed = absorbRootScale(quotientInts(div), root);
    state.displayedFactors = [...state.displayedFactors, absorbed.factor];
    if (round === 1) {
      state.quotient = absorbed.quot;
      state.synthLocked = true;
      if (state.problem.degree === 4) {
        state.phase = "needConstant2";
        state.constantConsumed = false;
        state.leadingConsumed = false;
        state.factors = [];
        state.kFactors = [];
        state.mFactors = [];
        state.evalRoot = null;
        state.evalValue = null;
      } else {
        state.phase = "done";
        state.quotient2 = null;
      }
    } else {
      state.quotient2 = absorbed.quot;
      state.synth2Locked = true;
      state.phase = "done";
    }
    render();
  }

  function checkSynth(round) {
    const root = state.rootsFound[round - 1];
    const coeffs = round === 1 ? state.problem?.poly : state.quotient;
    if (root == null || !coeffs?.length) return;
    const roundId = round === 1 ? "r1" : "r2";
    const result = validateRound(coeffs, root, roundId);
    if (!result.ok) return;
    onSynthSuccess(round);
  }

  /* ---------- render ---------- */
  function renderFactoredProduct(linearFactors, quadraticCoeffs) {
    const parts = linearFactors.map((f) => `(${f})`);
    if (!quadraticCoeffs || quadraticCoeffs.length !== 3) {
      return parts.join("");
    }
    const facts = factorQuadraticInts(quadraticCoeffs[0], quadraticCoeffs[1], quadraticCoeffs[2]);
    if (facts) {
      facts.forEach((f) => parts.push(`(${f})`));
      return parts.join("");
    }
    parts.push(`(${polyLatex(quadraticCoeffs)})`);
    return parts.join("");
  }

  function renderIntermediateResult() {
    if (!state.synthLocked) return "";
    const p = state.problem;
    const factor = state.displayedFactors[0];
    const u1 = state.quotient;
    if (!factor || !u1) return "";
    return `
      <div class="panel-block">
        <p class="result-line">
          <span class="result-line__label">${escapeHtml(ui().willGet || "จะได้")}</span>
          $${p.polyTex} = (${factor})(${polyLatex(u1)})$
        </p>
      </div>
    `;
  }

  function renderFinalResult() {
    if (state.phase !== "done" && !state.synth2Locked) return "";
    const p = state.problem;
    if (!state.displayedFactors.length) return "";

    let final = "";
    if (state.synth2Locked && state.quotient2) {
      final = renderFactoredProduct(state.displayedFactors, state.quotient2);
    } else if (p.degree === 3 && state.quotient) {
      final = renderFactoredProduct(state.displayedFactors, state.quotient);
    } else {
      return "";
    }

    return `
      <div class="panel-block">
        <p class="result-line">
          <span class="result-line__label">${escapeHtml(ui().therefore || "ดังนั้น")}</span>
          $${p.polyTex} = ${final}$
        </p>
      </div>
    `;
  }

  function coeffDragMode() {
    if (state.phase === "needConstant" || state.phase === "needConstant2") return "constant";
    if (state.phase === "needLeading" || state.phase === "needLeading2") return "leading";
    return "none";
  }

  function renderCoeffCards(coeffs, bankId = "coeffBank") {
    const mode = coeffDragMode();
    return `
      <div class="coeff-row">
        <span class="coeff-row__label">${escapeHtml(ui().coeffLabel || "สัมประสิทธิ์")}</span>
        <div class="card-bank" id="${bankId}">
          ${coeffs
            .map((c, i) => {
              const isConstant = i === coeffs.length - 1;
              const isLeading = i === 0 && coeffs.length > 1;
              let kind = "coeff";
              if (isConstant) kind = "constant";
              else if (isLeading && !isMonicPoly(coeffs)) kind = "leading";

              let canDrag = false;
              if (isConstant) canDrag = mode === "constant" && !state.constantConsumed;
              else if (kind === "leading") canDrag = mode === "leading" && !state.leadingConsumed;

              const selected =
                (state.selectedKind === "constant" && isConstant && canDrag && state.selectedValue === c) ||
                (state.selectedKind === "leading" && isLeading && canDrag && state.selectedValue === c);

              return cardHtml(c, {
                kind,
                constant: isConstant,
                leading: kind === "leading",
                draggable: canDrag,
                muted: !canDrag,
                selected
              });
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function showKmFactors() {
    return (
      state.constantConsumed &&
      state.leadingConsumed &&
      state.factors.length > 0 &&
      (state.phase === "pickRoot" ||
        state.phase === "pickRoot2" ||
        state.phase === "synth" ||
        state.phase === "synth2" ||
        state.phase === "done")
    );
  }

  function renderMonicDropZone(inPick) {
    const copy = ui();
    const showFactors =
      state.constantConsumed &&
      state.factors.length > 0 &&
      (state.phase === "pickRoot" ||
        state.phase === "pickRoot2" ||
        state.phase === "synth" ||
        state.phase === "synth2" ||
        state.phase === "done");
    const body = showFactors
      ? state.factors
          .map((f) =>
            cardHtml(f, {
              kind: "factor",
              draggable: inPick,
              selected: state.selectedKind === "factor" && ratSelectedEq(state.selectedValue, f),
              muted: !inPick
            })
          )
          .join("")
      : `<p class="drop-zone__hint">${escapeHtml(copy.dropCoeffHint || "")}</p>`;
    return zoneShell({
      id: "factorDrop",
      drop: "constant",
      label: copy.findFactors || "หาตัวประกอบ",
      filled: showFactors || state.constantConsumed,
      body
    });
  }

  function renderKmDropZones(inPick) {
    const copy = ui();
    const needK = state.phase === "needConstant" || state.phase === "needConstant2";
    const needM = state.phase === "needLeading" || state.phase === "needLeading2";
    const hasK = state.constantConsumed && state.kFactors.length > 0;
    const hasM = state.leadingConsumed && state.mFactors.length > 0;
    const hasKm = showKmFactors();

    const kBody = hasK
      ? staticFactorCards(state.kFactors)
      : `<p class="drop-zone__hint">${escapeHtml(copy.dropCoeffHint || "")}</p>`;
    const mBody = hasM
      ? staticFactorCards(state.mFactors)
      : `<p class="drop-zone__hint">${escapeHtml(copy.dropLeadingHint || "")}</p>`;
    const kmBody = hasKm
      ? state.factors
          .map((f) =>
            cardHtml(f, {
              kind: "factor",
              draggable: inPick,
              selected: state.selectedKind === "factor" && ratSelectedEq(state.selectedValue, f),
              muted: !inPick
            })
          )
          .join("")
      : `<p class="drop-zone__hint">${zoneLabelHtml(copy.dropKmHint || "")}</p>`;

    return `
      <div class="factor-zones" id="factorZones">
        ${zoneShell({
          id: "kDrop",
          drop: needK ? "constant" : "",
          label: copy.findK || "หา $k$",
          filled: hasK,
          waiting: !needK && !hasK,
          body: kBody
        })}
        ${zoneShell({
          id: "mDrop",
          drop: needM ? "leading" : "",
          label: copy.findM || "หา $m$",
          filled: hasM,
          waiting: !needM && !hasM,
          body: mBody
        })}
        ${zoneShell({
          id: "kmDrop",
          drop: "",
          label: copy.findKM || "หา $\\dfrac{k}{m}$",
          filled: hasKm,
          waiting: !hasKm,
          extraClass: "drop-zone--km",
          body: kmBody
        })}
      </div>
    `;
  }

  function renderDropZone(inPick) {
    if (currentIsMonic()) return renderMonicDropZone(inPick);
    return renderKmDropZones(inPick);
  }

  function renderEvalBlock(evalName, coeffs, inPick, hintText) {
    const copy = ui();
    const slotFilled = state.evalRoot != null;
    const zero = slotFilled && ratIsZero(state.evalValue);
    const resultCls = !slotFilled ? "" : zero ? " eval-result--zero" : " eval-result--nonzero";
    const argTex = slotFilled ? ratLatex(state.evalRoot) : "\\square";
    let substNote = "";
    if (slotFilled) {
      const subst = substPolyLatex(coeffs, state.evalRoot);
      const sumTex = signedSumLatex(substTermValues(coeffs, state.evalRoot));
      substNote = `<div class="panel-block__note eval-subst">$$\\begin{aligned}
${evalName}\\!\\left(${argTex}\\right) &= ${subst} \\\\
&= ${sumTex} \\\\
&= ${ratLatex(state.evalValue)}
\\end{aligned}$$</div>`;
    }
    return `
      <div class="panel-block">
        <p class="panel-block__note">${hintText || ""}</p>
        <div class="eval-row">
          <span class="eval-prefix">$${evalName}($</span>
          <span class="eval-slot${slotFilled ? " eval-slot--filled" : ""}" id="evalSlot" data-drop="eval" role="button" tabindex="0" aria-label="${escapeHtml(
            copy.dropFactorHint || "ลากตัวประกอบมาวาง"
          )}">
            ${
              slotFilled
                ? cardHtml(state.evalRoot, {
                    kind: "factor",
                    draggable: inPick,
                    muted: !inPick
                  })
                : `<span class="drop-zone__hint">□</span>`
            }
          </span>
          <span class="eval-suffix">$)$</span>
          ${
            slotFilled
              ? `<span class="eval-result${resultCls}">$= ${ratLatex(state.evalValue)}$</span>`
              : `<span class="eval-suffix">$\\leftarrow$ ${escapeHtml(copy.dropFactorHint || "")}</span>`
          }
        </div>
        ${substNote}
      </div>
    `;
  }

  function renderSynthBlock(round, coeffs, root, locked, filled, showCheck) {
    const copy = ui();
    const roundId = round === 1 ? "r1" : "r2";
    return `
      <div class="panel-block">
        <p class="round-title">${(copy.roundLabel || "รอบที่ {n}").replace("{n}", String(round))} — ${escapeHtml(
          copy.synthTitle || "การหารสังเคราะห์"
        )}</p>
        <p class="panel-block__note">${copy.synthHint || ""}</p>
        ${renderInteractiveSynth(coeffs, roundId, { locked, root, filled })}
        ${
          showCheck
            ? `<div class="synth-actions"><button id="checkBtn${round}" class="action-btn action-btn--accent" type="button">${escapeHtml(
                copy.check || "ตรวจสอบ"
              )}</button></div>`
            : ""
        }
      </div>
    `;
  }

  function filledSynth(coeffs, root) {
    const d = synthDivide(coeffs, root);
    return {
      products: d.products.slice(1),
      bottom: d.bottom
    };
  }

  function polyActionsHtml() {
    const copy = ui();
    return `
      <div class="toolbar__actions poly-line__actions">
        <button id="randomBtn" class="action-btn action-btn--accent" type="button">${escapeHtml(
          copy.random || "สุ่มโจทย์"
        )}</button>
        <button id="resetBtn" class="stage-reset" type="button" aria-label="${escapeHtml(
          copy.reset || "ล้าง"
        )}" title="${escapeHtml(copy.reset || "ล้าง")}">
          <svg class="stage-reset__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
            <path d="M21 12a9 9 0 1 1-3-6.7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 3v6h-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;
  }

  function render() {
    const copy = ui();
    const p = state.problem;
    const stage = $("#stage");
    if (!stage || !p) return;

    const inRound1 =
      state.phase === "needConstant" ||
      state.phase === "needLeading" ||
      state.phase === "pickRoot" ||
      state.phase === "synth";
    const inRound2 =
      state.phase === "needConstant2" ||
      state.phase === "needLeading2" ||
      state.phase === "pickRoot2" ||
      state.phase === "synth2" ||
      (state.phase === "done" && p.degree === 4 && state.synthLocked);
    const inPick1 = state.phase === "pickRoot";
    const inPick2 = state.phase === "pickRoot2";
    const showEval1 =
      inPick1 || state.phase === "synth" || (state.phase === "done" && p.degree === 3 && state.evalRoot != null);
    const showEval2 =
      inPick2 ||
      state.phase === "synth2" ||
      (state.phase === "done" && p.degree === 4 && state.evalRoot != null);
    const showSynth1 =
      state.phase === "synth" ||
      state.synthLocked ||
      state.phase === "needConstant2" ||
      state.phase === "needLeading2" ||
      state.phase === "pickRoot2" ||
      state.phase === "synth2" ||
      state.phase === "done";
    const showSynth2 =
      state.phase === "synth2" || state.synth2Locked || (state.phase === "done" && p.degree === 4);

    let html = `
      <div class="panel-block">
        <div class="poly-line">
          <p class="poly-line__eq">
            <span>${escapeHtml(copy.polyLabel || "พหุนาม")}</span>
            $P(x) = ${p.polyTex}$
          </p>
          ${polyActionsHtml()}
        </div>
        ${inRound1 ? renderCoeffCards(p.poly, "coeffBank") : ""}
      </div>
    `;

    if (inRound1) {
      html += renderDropZone(inPick1);
      if (showEval1) {
        html += renderEvalBlock("P", p.poly, inPick1, copy.evalHint || "");
      }
    }

    if (showSynth1 && state.rootsFound[0] != null) {
      const locked = state.synthLocked || state.phase !== "synth";
      const filled1 = state.synthLocked ? filledSynth(p.poly, state.rootsFound[0]) : null;
      html += renderSynthBlock(1, p.poly, state.rootsFound[0], locked, filled1, state.phase === "synth");
    }

    if (state.synthLocked) {
      html += renderIntermediateResult();
    }

    if (inRound2 && state.quotient) {
      const uTex = polyLatex(state.quotient);
      const showUCards =
        state.phase === "needConstant2" ||
        state.phase === "needLeading2" ||
        state.phase === "pickRoot2" ||
        state.phase === "synth2";
      html += `
        <div class="panel-block">
          <p class="poly-line poly-line--plain">
            <span>${escapeHtml(copy.uLabel || "ผลหาร")}</span>
            $U(x) = ${uTex}$
          </p>
          ${showUCards ? renderCoeffCards(state.quotient, "coeffBank") : ""}
        </div>
      `;

      if (showUCards) {
        html += renderDropZone(inPick2);
        if (showEval2) {
          html += renderEvalBlock("U", state.quotient, inPick2, copy.evalHintU || copy.evalHint || "");
        }
      }
    }

    if (showSynth2 && state.rootsFound[1] != null && state.quotient) {
      const locked = state.synth2Locked || state.phase !== "synth2";
      const filled2 = state.synth2Locked ? filledSynth(state.quotient, state.rootsFound[1]) : null;
      html += renderSynthBlock(
        2,
        state.quotient,
        state.rootsFound[1],
        locked,
        filled2,
        state.phase === "synth2"
      );
    }

    html += renderFinalResult();

    stage.innerHTML = html;
    renderMath(stage);
    bindStageEvents();
    requestAnimationFrame(() => requestAnimationFrame(drawAllSynth));

    if (state.phase === "needConstant2" || state.phase === "needLeading2") {
      const target = $("#coeffBank") || $("#kDrop") || $("#mDrop") || $("#factorDrop");
      target?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
    }
  }

  /* ---------- events ---------- */
  function selectCard(kind, value) {
    if (kind === "constant") {
      if (!(state.phase === "needConstant" || state.phase === "needConstant2")) return;
      if (state.constantConsumed) return;
      state.selectedKind = "constant";
      state.selectedValue = typeof value === "number" ? value : asRat(value).n;
      render();
      return;
    }
    if (kind === "leading") {
      if (!(state.phase === "needLeading" || state.phase === "needLeading2")) return;
      if (state.leadingConsumed) return;
      state.selectedKind = "leading";
      state.selectedValue = typeof value === "number" ? value : asRat(value).n;
      render();
      return;
    }
    if (kind === "factor") {
      if (!(state.phase === "pickRoot" || state.phase === "pickRoot2")) return;
      state.selectedKind = "factor";
      state.selectedValue = asRat(value);
      render();
    }
  }

  function onDropTarget(target) {
    if (target === "constant") {
      if (state.selectedKind === "constant" || state.dragPayload?.kind === "constant") {
        acceptConstantDrop();
      }
      return;
    }
    if (target === "leading") {
      if (state.selectedKind === "leading" || state.dragPayload?.kind === "leading") {
        acceptLeadingDrop();
      }
      return;
    }
    if (target === "eval") {
      let value = null;
      if (state.dragPayload?.kind === "factor") value = state.dragPayload.value;
      else if (state.selectedKind === "factor") value = state.selectedValue;
      if (value == null) return;
      placeEvalRoot(value);
    }
  }

  function bindStageEvents() {
    $$(".num-card", $("#stage")).forEach((card) => {
      const kind = card.dataset.kind;
      const value = readCardRat(card);

      card.addEventListener("click", () => {
        if (card.classList.contains("num-card--muted") || card.classList.contains("num-card--static")) return;
        if (kind === "factor" && (state.phase === "pickRoot" || state.phase === "pickRoot2")) {
          selectCard(kind, value);
          return;
        }
        if (kind === "constant" || kind === "leading") {
          selectCard(kind, value.n);
          return;
        }
        selectCard(kind, value);
      });

      card.addEventListener("dragstart", (e) => {
        if (card.classList.contains("num-card--muted") || card.classList.contains("num-card--static")) {
          e.preventDefault();
          return;
        }
        state.dragPayload = { kind, value: kind === "factor" ? value : value.n };
        card.classList.add("num-card--ghost");
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("text/plain", `${kind}:${ratPlain(value)}`);
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("num-card--ghost");
        state.dragPayload = null;
      });
    });

    $$(".drop-zone[data-drop]", $("#stage")).forEach((factorDrop) => {
      const dropKind = factorDrop.dataset.drop;
      if (!dropKind) return;
      factorDrop.addEventListener("dragover", (e) => {
        if (dropKind === "constant" && state.phase !== "needConstant" && state.phase !== "needConstant2") return;
        if (dropKind === "leading" && state.phase !== "needLeading" && state.phase !== "needLeading2") return;
        e.preventDefault();
        factorDrop.classList.add("drop-zone--active");
      });
      factorDrop.addEventListener("dragleave", () => {
        factorDrop.classList.remove("drop-zone--active");
      });
      factorDrop.addEventListener("drop", (e) => {
        e.preventDefault();
        factorDrop.classList.remove("drop-zone--active");
        onDropTarget(dropKind);
      });
      factorDrop.addEventListener("click", () => {
        if (dropKind === "constant" && state.selectedKind === "constant") onDropTarget("constant");
        if (dropKind === "leading" && state.selectedKind === "leading") onDropTarget("leading");
      });
    });

    const evalSlot = $("#evalSlot");
    if (evalSlot) {
      evalSlot.addEventListener("dragover", (e) => {
        if (!(state.phase === "pickRoot" || state.phase === "pickRoot2")) return;
        e.preventDefault();
        evalSlot.classList.add("eval-slot--active");
      });
      evalSlot.addEventListener("dragleave", () => {
        evalSlot.classList.remove("eval-slot--active");
      });
      evalSlot.addEventListener("drop", (e) => {
        e.preventDefault();
        evalSlot.classList.remove("eval-slot--active");
        onDropTarget("eval");
      });
      evalSlot.addEventListener("click", () => {
        if (state.selectedKind === "factor") onDropTarget("eval");
        else if (state.evalRoot != null && (state.phase === "pickRoot" || state.phase === "pickRoot2")) {
          clearEvalSlot();
        }
      });
      evalSlot.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (state.selectedKind === "factor") onDropTarget("eval");
        }
      });
    }

    $("#checkBtn1")?.addEventListener("click", () => checkSynth(1));
    $("#checkBtn2")?.addEventListener("click", () => checkSynth(2));

    $("#randomBtn")?.addEventListener("click", randomize);
    $("#resetBtn")?.addEventListener("click", () => {
      resetProgress();
      render();
    });

    $$(".synth-input", $("#stage")).forEach((input) => {
      input.addEventListener("input", () => sanitizeNumberInput(input));
    });
  }

  function resetProgress() {
    state.phase = "needConstant";
    state.factors = [];
    state.kFactors = [];
    state.mFactors = [];
    state.constantConsumed = false;
    state.leadingConsumed = false;
    state.selectedValue = null;
    state.selectedKind = null;
    state.evalRoot = null;
    state.evalValue = null;
    state.rootsFound = [];
    state.displayedFactors = [];
    state.quotient = null;
    state.quotient2 = null;
    state.synthLocked = false;
    state.synth2Locked = false;
    state.dragPayload = null;
  }

  function randomize() {
    const spec = nextProblemSpec();
    state.problem = buildProblem(spec);
    state.problemIndex += 1;
    resetProgress();
    render();
  }

  function applyContent() {
    const c = t();
    if (!c) return;
    const titleHtml = c.landing.title.replace(/\n/g, "<br>");
    const eyebrow = $("#landingEyebrow");
    const landingTitle = $("#landingTitle");
    const startButton = $("#startButton");
    const appTitle = $("#appTitle");
    if (eyebrow) eyebrow.textContent = c.landing.eyebrow;
    if (landingTitle) landingTitle.innerHTML = titleHtml;
    if (startButton) startButton.textContent = c.landing.start;
    if (appTitle) appTitle.textContent = c.app.title;
    document.title = `${c.app.title} | Interactive Mathematics`;
  }

  function showApp() {
    $("#landingPage").hidden = true;
    $("#landingPage").classList.remove("view--active");
    $("#appPage").hidden = false;
    $("#appPage").classList.add("view--active");
    $("#appTitle").focus?.();
    if (!state.problem) randomize();
    else render();
  }

  function bootstrap() {
    applyContent();
    $("#startButton")?.addEventListener("click", showApp);
    window.addEventListener("resize", () => {
      requestAnimationFrame(drawAllSynth);
    });
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
