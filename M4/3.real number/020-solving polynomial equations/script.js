(() => {
  const $ = (selector, root = document) => root.querySelector(selector);

  const COEFF_MAX = 25;
  const GEN_MAX_TRIES = 40;

  const state = {
    mode: "learn",
    methodId: "factor",
    learnIndex: 0,
    testProblem: null,
    step: 0,
    showAll: false
  };

  function t() {
    return window.CONTENT?.th;
  }

  function methods() {
    return t()?.methods || [];
  }

  function examplesFor(methodId) {
    return t()?.examples?.[methodId] || [];
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
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

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
  }

  function nonzero(max = 6) {
    let n = 0;
    while (n === 0) n = randInt(-max, max);
    return n;
  }

  function absLe(n, max = COEFF_MAX) {
    return Math.abs(n) <= max;
  }

  function coeffsOk(coeffs) {
    return coeffs.every((c) => absLe(c));
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
    const parts = [];
    const maxDeg = coeffs.length - 1;
    for (let i = 0; i < coeffs.length; i += 1) {
      const c = coeffs[i];
      if (c === 0) continue;
      parts.push(termLatex(c, maxDeg - i, { forceSign: parts.length > 0 }));
    }
    return parts.length ? parts.join(" ") : "0";
  }

  /** Expanded substitution of an integer root into a polynomial, e.g. 1^{3} - 6(1)^{2} + 11(1) - 6 */
  function polyEvalSubstLatex(coeffs, r) {
    const maxDeg = coeffs.length - 1;
    const bare = r < 0 ? `(${r})` : String(r);
    const wrapped = `(${r})`;
    const parts = [];
    for (let i = 0; i < coeffs.length; i += 1) {
      const c = coeffs[i];
      if (c === 0) continue;
      const deg = maxDeg - i;
      const abs = Math.abs(c);
      let body;
      if (deg === 0) {
        body = String(abs);
      } else if (abs === 1) {
        const base = parts.length === 0 ? bare : wrapped;
        body = deg === 1 ? base : `${base}^{${deg}}`;
      } else {
        body = deg === 1 ? `${abs}${wrapped}` : `${abs}${wrapped}^{${deg}}`;
      }
      if (!parts.length) parts.push(c < 0 ? `-${body}` : body);
      else parts.push(c < 0 ? `- ${body}` : `+ ${body}`);
    }
    return parts.length ? parts.join(" ") : "0";
  }

  function eqLatex(coeffs) {
    return `${polyLatex(coeffs)} = 0`;
  }

  /** Render terms in a given display order (not necessarily descending degree). */
  function polyLatexOrdered(terms) {
    const parts = [];
    for (const item of terms) {
      const c = item.c;
      const deg = item.deg;
      if (!c) continue;
      parts.push(termLatex(c, deg, { forceSign: parts.length > 0 }));
    }
    return parts.length ? parts.join(" ") : "0";
  }

  function eqLatexOrdered(terms) {
    return `${polyLatexOrdered(terms)} = 0`;
  }

  function linearFactorLatex(a, b) {
    // ax + b
    if (a === 1) return b === 0 ? "x" : b > 0 ? `x + ${b}` : `x - ${Math.abs(b)}`;
    if (a === -1) return b === 0 ? "-x" : b > 0 ? `-x + ${b}` : `-x - ${Math.abs(b)}`;
    const head = `${a}x`;
    if (b === 0) return head;
    return b > 0 ? `${head} + ${b}` : `${head} - ${Math.abs(b)}`;
  }

  function fracLatex(n, d) {
    if (d < 0) {
      n = -n;
      d = -d;
    }
    const g = gcd(n, d);
    n /= g;
    d /= g;
    if (d === 1) return String(n);
    if (n < 0) return `-\\dfrac{${Math.abs(n)}}{${d}}`;
    return `\\dfrac{${n}}{${d}}`;
  }

  function sortedSetLatex(values) {
    // values: array of { sort, tex }
    const sorted = [...values].sort((a, b) => a.sort - b.sort);
    if (!sorted.length) return "\\varnothing";
    return `\\left\\{${sorted.map((v) => v.tex).join(", ")}\\right\\}`;
  }

  function syntheticDivide(coeffs, root) {
    const out = [coeffs[0]];
    for (let i = 1; i < coeffs.length; i += 1) {
      out.push(coeffs[i] + out[i - 1] * root);
    }
    return out;
  }

  function expandQuadratic(a, b, c, d) {
    // (ax+b)(cx+d) = ac x^2 + (ad+bc)x + bd
    return [a * c, a * d + b * c, b * d];
  }

  function mulPolys(p, q) {
    const out = Array(p.length + q.length - 1).fill(0);
    for (let i = 0; i < p.length; i += 1) {
      for (let j = 0; j < q.length; j += 1) {
        out[i + j] += p[i] * q[j];
      }
    }
    return out;
  }

  /** Parse "$lhs = rhs$" (optional Thai prefix) or { lhs, rhs, prefix } into aligned parts. */
  function tryParseEqLine(line) {
    if (line && typeof line === "object" && !line.conclusion && (line.lhs != null || line.rhs != null)) {
      return {
        prefix: line.prefix || "",
        lhs: line.lhs || "",
        rhs: line.rhs || ""
      };
    }
    if (typeof line !== "string") return null;
    const m = line.match(/^([^$]*)\$([^$]+)\$(.*)$/);
    if (!m) return null;
    const prefix = m[1];
    const math = m[2];
    const suffix = m[3];
    if (String(suffix).trim()) return null;
    const eqIdx = math.indexOf("=");
    if (eqIdx < 0) return null;
    const lhs = math.slice(0, eqIdx).trim();
    const rhs = math.slice(eqIdx + 1).trim();
    if (!lhs || !rhs) return null;
    return { prefix: prefix.trim(), lhs, rhs };
  }

  function eqRowHtml(eq) {
    const prefix = eq.prefix
      ? `<span class="eq-prefix">${escapeHtml(eq.prefix)}</span>`
      : `<span class="eq-prefix"></span>`;
    const lhs = eq.lhs
      ? `<span class="eq-lhs">$${eq.lhs}$</span>`
      : `<span class="eq-lhs"></span>`;
    return `<p class="eq-row">${prefix}${lhs}<span class="eq-eq">=</span><span class="eq-rhs">$${eq.rhs || ""}$</span></p>`;
  }

  function lineHtml(line) {
    const eq = tryParseEqLine(line);
    if (eq) return eqRowHtml(eq);
    if (typeof line === "string") {
      return `<p class="step-line">${line}</p>`;
    }
    if (line?.conclusion) {
      return `<p class="step-line step-line--conclusion">${line.text}</p>`;
    }
    return `<p class="step-line">${line?.text || ""}</p>`;
  }

  /** Group consecutive LHS=RHS rows so the "=" column stays aligned. */
  function linesHtml(lines) {
    const parts = [];
    let eqBuf = [];
    const flushEq = () => {
      if (!eqBuf.length) return;
      parts.push(`<div class="work-steps">${eqBuf.join("")}</div>`);
      eqBuf = [];
    };
    for (const line of lines || []) {
      const eq = tryParseEqLine(line);
      if (eq) {
        eqBuf.push(eqRowHtml(eq));
      } else {
        flushEq();
        parts.push(lineHtml(line));
      }
    }
    flushEq();
    return parts.join("");
  }

  /* ---------- problem generators ---------- */

  function genFactor(tries = 0) {
    if (tries >= GEN_MAX_TRIES) return genFactorSimpleFallback();
    const kind = pick(["simple", "ac", "diffsq", "biquad"]);
    if (kind === "simple") {
      let p = nonzero(6);
      let q = nonzero(6);
      while (q === p) q = nonzero(6);
      const coeffs = [1, -(p + q), p * q];
      if (!coeffsOk(coeffs)) return genFactor(tries + 1);
      const set = sortedSetLatex([
        { sort: p, tex: String(p) },
        { sort: q, tex: String(q) }
      ]);
      return {
        eqTex: eqLatex(coeffs),
        steps: [
          `$${eqLatex(coeffs)}$`,
          `$(${linearFactorLatex(1, -p)})(${linearFactorLatex(1, -q)}) = 0$`,
          `นั่นคือ $${linearFactorLatex(1, -p)} = 0$ หรือ $${linearFactorLatex(1, -q)} = 0$`,
          `จะได้ $x = ${p}$ หรือ $x = ${q}$`,
          { conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` }
        ]
      };
    }
    if (kind === "ac") {
      const a = pick([1, 2, 3, 4, 5, 6]);
      const c = pick([1, 2, 3, 4, 5]);
      const b = nonzero(5);
      const d = nonzero(5);
      const coeffs = expandQuadratic(a, b, c, d);
      if (!coeffsOk(coeffs) || coeffs[0] === 0) return genFactor(tries + 1);
      // roots -b/a, -d/c
      const r1 = { sort: -b / a, tex: fracLatex(-b, a) };
      const r2 = { sort: -d / c, tex: fracLatex(-d, c) };
      const set = sortedSetLatex([r1, r2]);
      return {
        eqTex: eqLatex(coeffs),
        steps: [
          `$${eqLatex(coeffs)}$`,
          `$(${linearFactorLatex(a, b)})(${linearFactorLatex(c, d)}) = 0$`,
          `นั่นคือ $${linearFactorLatex(a, b)} = 0$ หรือ $${linearFactorLatex(c, d)} = 0$`,
          `จะได้ $x = ${r1.tex}$ หรือ $x = ${r2.tex}$`,
          { conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` }
        ]
      };
    }
    if (kind === "diffsq") {
      const k = pick([1, 2, 3, 4, 5]);
      const m = pick([1, 2, 3, 4, 5]);
      const coeffs = [k * k, 0, -(m * m)];
      if (!coeffsOk(coeffs)) return genFactor(tries + 1);
      const set = sortedSetLatex([
        { sort: -m / k, tex: fracLatex(-m, k) },
        { sort: m / k, tex: fracLatex(m, k) }
      ]);
      return {
        eqTex: eqLatex(coeffs),
        steps: [
          `$${eqLatex(coeffs)}$`,
          `$(${k === 1 ? "x" : `${k}x`})^{2} - ${m}^{2} = 0$`,
          `$(${linearFactorLatex(k, -m)})(${linearFactorLatex(k, m)}) = 0$`,
          `นั่นคือ $${linearFactorLatex(k, -m)} = 0$ หรือ $${linearFactorLatex(k, m)} = 0$`,
          `จะได้ $x = ${fracLatex(m, k)}$ หรือ $x = ${fracLatex(-m, k)}$`,
          { conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` }
        ]
      };
    }
    // biquad: (x^2 - u)(x^2 - v) = x^4 - (u+v)x^2 + uv
    let u = pick([1, 2, 3, 4]);
    let v = pick([1, 2, 3, 4, 5]);
    while (v === u) v = pick([1, 2, 3, 4, 5]);
    const coeffs = [1, 0, -(u + v), 0, u * v];
    if (!coeffsOk(coeffs)) return genFactor(tries + 1);
    const uTex = sqrtLatex(u);
    const vTex = sqrtLatex(v);
    const roots = [
      { sort: -Math.sqrt(u), tex: `-${uTex}` },
      { sort: Math.sqrt(u), tex: uTex },
      { sort: -Math.sqrt(v), tex: `-${vTex}` },
      { sort: Math.sqrt(v), tex: vTex }
    ];
    const set = sortedSetLatex(roots);
    return {
      eqTex: eqLatex(coeffs),
      steps: [
        `$${eqLatex(coeffs)}$`,
        `$(x^{2} - ${u})(x^{2} - ${v}) = 0$`,
        `นั่นคือ $x^{2} - ${u} = 0$ หรือ $x^{2} - ${v} = 0$`,
        `จะได้ $x = \\pm ${uTex}$ หรือ $x = \\pm ${vTex}$`,
        { conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` }
      ]
    };
  }

  function genFactorSimpleFallback() {
    const coeffs = [1, -5, 6];
    const set = sortedSetLatex([
      { sort: 2, tex: "2" },
      { sort: 3, tex: "3" }
    ]);
    return {
      eqTex: eqLatex(coeffs),
      steps: [
        `$${eqLatex(coeffs)}$`,
        `$(x - 2)(x - 3) = 0$`,
        `นั่นคือ $x - 2 = 0$ หรือ $x - 3 = 0$`,
        `จะได้ $x = 2$ หรือ $x = 3$`,
        { conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` }
      ]
    };
  }

  function simplifySqrtParts(n) {
    // n > 0: write as k * sqrt(m) with m square-free
    let k = 1;
    let m = n;
    for (let i = 2; i * i <= m; i += 1) {
      while (m % (i * i) === 0) {
        m /= i * i;
        k *= i;
      }
    }
    return { k, m };
  }

  function sqrtLatex(n) {
    if (n === 0) return "0";
    const { k, m } = simplifySqrtParts(n);
    if (m === 1) return String(k);
    if (k === 1) return `\\sqrt{${m}}`;
    return `${k}\\sqrt{${m}}`;
  }

  /** (center ± sqrtTex) / den — omit leading 0 when center is 0. */
  function pmSqrtFracLatex(center, sqrtTex, den) {
    if (center === 0) {
      const pos = den === 1 ? sqrtTex : `\\dfrac{${sqrtTex}}{${den}}`;
      const neg = den === 1 ? `-${sqrtTex}` : `-\\dfrac{${sqrtTex}}{${den}}`;
      return { plus: pos, minus: neg };
    }
    return {
      plus: `\\dfrac{${center} + ${sqrtTex}}{${den}}`,
      minus: `\\dfrac{${center} - ${sqrtTex}}{${den}}`
    };
  }

  /** Positive root of a x^2 - b = 0 as simplified latex (sqrt(b/a)). */
  function posSqrtQuotientLatex(a, b) {
    if (a === 1) return sqrtLatex(b);
    const { k, m } = simplifySqrtParts(a * b);
    const g = gcd(k, a);
    const nk = k / g;
    const nd = a / g;
    if (m === 1) return fracLatex(nk, nd);
    const num = nk === 1 ? `\\sqrt{${m}}` : `${nk}\\sqrt{${m}}`;
    if (nd === 1) return num;
    return `\\dfrac{${num}}{${nd}}`;
  }

  function genComplete(tries = 0) {
    if (tries >= GEN_MAX_TRIES) return genFactorSimpleFallback();
    const a = pick([1, 1, 1, 4, 9]);
    if (a === 1) {
      const h = nonzero(6);
      // (x+h)^2 = k, pick k positive not perfect square preferred
      const k = pick([2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15]);
      // x^2 + 2hx + h^2 - k = 0
      const c = h * h - k;
      const coeffs = [1, 2 * h, c];
      if (!coeffsOk(coeffs)) return genComplete(tries + 1);
      const sqrtK = sqrtLatex(k);
      const set = sortedSetLatex([
        { sort: -h - Math.sqrt(k), tex: `${-h} - ${sqrtK}` },
        { sort: -h + Math.sqrt(k), tex: `${-h} + ${sqrtK}` }
      ]);
      const red = `\\textcolor{red}{${Math.abs(h)}^{2}}`;
      const mid = h > 0
        ? `[x^{2} + 2(x)(${h}) + ${red}] + (${c}) - ${red} = 0`
        : `[x^{2} - 2(x)(${Math.abs(h)}) + ${red}] + (${c}) - ${red} = 0`;
      return {
        eqTex: eqLatex(coeffs),
        steps: [
          `$${eqLatex(coeffs)}$`,
          `$${mid}$`,
          `$(x ${h >= 0 ? "+" : "-"} ${Math.abs(h)})^{2} - ${k} = 0$`,
          `$(x ${h >= 0 ? "+" : "-"} ${Math.abs(h)})^{2} - (${sqrtK})^{2} = 0$`,
          `จะได้ $x = ${-h} + ${sqrtK},\\; ${-h} - ${sqrtK}$`,
          { conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` }
        ]
      };
    }
    // a = 4 or 9 → (√a x + h)^2 style with integer h
    const s = a === 4 ? 2 : 3;
    const h = nonzero(4);
    const k = pick([2, 3, 5, 6, 7, 8, 10, 12]);
    // (s x + h)^2 - k = 0 → a x^2 + 2 s h x + h^2 - k = 0
    const b = 2 * s * h;
    const c = h * h - k;
    const coeffs = [a, b, c];
    if (!coeffsOk(coeffs)) return genComplete(tries + 1);
    const sqrtK = sqrtLatex(k);
    const rootPlus = `\\dfrac{${-h} + ${sqrtK}}{${s}}`;
    const rootMinus = `\\dfrac{${-h} - ${sqrtK}}{${s}}`;
    const set = sortedSetLatex([
      { sort: (-h - Math.sqrt(k)) / s, tex: rootMinus },
      { sort: (-h + Math.sqrt(k)) / s, tex: rootPlus }
    ]);
    const red = `\\textcolor{red}{${Math.abs(h)}^{2}}`;
    const sign = h >= 0 ? "+" : "-";
    return {
      eqTex: eqLatex(coeffs),
      steps: [
        `$${eqLatex(coeffs)}$`,
        `$[(${s}x)^{2} ${sign} 2(${s}x)(${Math.abs(h)}) + ${red}] + (${c}) - ${red} = 0$`,
        `$(${s}x ${sign} ${Math.abs(h)})^{2} - ${k} = 0$`,
        `จะได้ $x = ${rootPlus},\\; ${rootMinus}$`,
        { conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` }
      ]
    };
  }

  function genFormula() {
    let a = randInt(1, 6);
    let b = randInt(-10, 10);
    let c = randInt(-10, 10);
    // Prefer solvable over reals ~80%
    const wantReal = Math.random() < 0.8;
    let disc = b * b - 4 * a * c;
    let tries = 0;
    while (tries < 40) {
      tries += 1;
      a = randInt(1, 6);
      b = randInt(-10, 10);
      c = randInt(-10, 10);
      disc = b * b - 4 * a * c;
      if (!coeffsOk([a, b, c])) continue;
      if (wantReal && disc >= 0) break;
      if (!wantReal && disc < 0) break;
    }
    disc = b * b - 4 * a * c;
    const coeffs = [a, b, c];
    const bSub = b < 0 ? `(${b})` : `${b}`;
    const steps = [
      `จาก $${eqLatex(coeffs)}$`,
      `จะได้ $a = ${a},\\; b = ${b}$ และ $c = ${c}$`,
      `แทนในสูตร $x = \\dfrac{-b \\pm \\sqrt{b^{2} - 4ac}}{2a}$`,
      `$x = \\dfrac{-${bSub} \\pm \\sqrt{${bSub}^{2} - 4(${a})(${c})}}{2(${a})}$`
    ];
    if (disc < 0) {
      steps.push(`$x = \\dfrac{${-b} \\pm \\sqrt{${disc}}}{${2 * a}}$`);
      steps.push(`เนื่องจาก $\\sqrt{${disc}}$ หาค่าไม่ได้`);
      steps.push({ conclusion: true, text: "ดังนั้น เซตคำตอบของสมการ คือ $\\varnothing$" });
      return { eqTex: eqLatex(coeffs), steps };
    }
    if (disc === 0) {
      const root = fracLatex(-b, 2 * a);
      steps.push(`$x = \\dfrac{${-b} \\pm 0}{${2 * a}}$`);
      steps.push(`จะได้ $x = ${root}$`);
      steps.push({ conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $\\left\\{${root}\\right\\}$` });
      return { eqTex: eqLatex(coeffs), steps };
    }
    const { k, m } = simplifySqrtParts(disc);
    const sqrtPart = m === 1 ? String(k) : k === 1 ? `\\sqrt{${m}}` : `${k}\\sqrt{${m}}`;
    const den = 2 * a;
    steps.push(`$x = \\dfrac{${-b} \\pm ${sqrtPart}}{${den}}$`);
    if (m === 1) {
      const r1 = fracLatex(-b + k, den);
      const r2 = fracLatex(-b - k, den);
      steps.push(`จะได้ $x = ${r1},\\; ${r2}$`);
      const set = sortedSetLatex([
        { sort: (-b - k) / den, tex: r2 },
        { sort: (-b + k) / den, tex: r1 }
      ]);
      steps.push({ conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` });
    } else {
      // Reduce common factor of |b|, k, |den| when present
      const gAll = gcd(gcd(Math.abs(b), k), Math.abs(den));
      let center;
      let sp;
      let nd;
      if (gAll > 1) {
        center = -b / gAll;
        const nk = k / gAll;
        nd = den / gAll;
        sp = nk === 1 ? `\\sqrt{${m}}` : `${nk}\\sqrt{${m}}`;
      } else {
        center = -b;
        nd = den;
        sp = sqrtPart;
      }
      // Keep 0 ± in the working line; omit leading 0 in the solution set.
      const r1 = `\\dfrac{${center} + ${sp}}{${nd}}`;
      const r2 = `\\dfrac{${center} - ${sp}}{${nd}}`;
      const clean = pmSqrtFracLatex(center, sp, nd);
      steps.push(`จะได้ $x = ${r1},\\; ${r2}$`);
      const set = sortedSetLatex([
        { sort: (-b - Math.sqrt(disc)) / den, tex: clean.minus },
        { sort: (-b + Math.sqrt(disc)) / den, tex: clean.plus }
      ]);
      steps.push({ conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` });
    }
    return { eqTex: eqLatex(coeffs), steps };
  }

  function posFactorTex(n) {
    const abs = Math.abs(n) || 1;
    const list = [];
    for (let i = 1; i <= abs; i += 1) if (abs % i === 0) list.push(i);
    return list.map((v) => `\\pm ${v}`).join(",\\; ");
  }

  function commonScrambleTerms3(c3, c2, c1, c0) {
    // Leading + constant first so naive consecutive pairing fails.
    return [
      { c: c3, deg: 3 },
      { c: c0, deg: 0 },
      { c: c2, deg: 2 },
      { c: c1, deg: 1 }
    ];
  }

  function commonAltTerms3(c3, c2, c1, c0) {
    // Order deg3, deg1, deg2, deg0 → pair (1st,2nd) and (3rd,4th) as written.
    return [
      { c: c3, deg: 3 },
      { c: c1, deg: 1 },
      { c: c2, deg: 2 },
      { c: c0, deg: 0 }
    ];
  }

  function genCommonDeg3Sq(scramble, altPair) {
    const p = pick([2, 3, 4, 5]);
    const r = nonzero(5);
    const coeffs = [1, -r, -(p * p), p * p * r];
    if (!coeffsOk(coeffs)) return null;
    const set = sortedSetLatex([
      { sort: -p, tex: String(-p) },
      { sort: p, tex: String(p) },
      { sort: r, tex: String(r) }
    ]);
    const lin = linearFactorLatex(1, -r);
    const grouped =
      r >= 0
        ? `(x^{3} - ${r}x^{2}) - (${p * p}x - ${p * p * r}) = 0`
        : `(x^{3} + ${Math.abs(r)}x^{2}) - (${p * p}x + ${p * p * Math.abs(r)}) = 0`;
    const tail = [
      `$x^{2}(${lin}) - ${p * p}(${lin}) = 0$`,
      `$(x^{2} - ${p * p})(${lin}) = 0$`,
      `$(x - ${p})(x + ${p})(${lin}) = 0$`,
      `จะได้ $x = ${p},\\; ${-p},\\; ${r}$`,
      { conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` }
    ];

    if (altPair) {
      const terms = commonAltTerms3(1, -r, -(p * p), p * p * r);
      const pairBClean =
        r > 0
          ? r === 1
            ? `(-x^{2} + ${p * p * r})`
            : `(-${r}x^{2} + ${p * p * r})`
          : Math.abs(r) === 1
            ? `(x^{2} - ${p * p * Math.abs(r)})`
            : `(${Math.abs(r)}x^{2} - ${p * p * Math.abs(r)})`;
      const pull2 =
        r > 0
          ? r === 1
            ? `$x(x^{2} - ${p * p}) - (x^{2} - ${p * p}) = 0$`
            : `$x(x^{2} - ${p * p}) - ${r}(x^{2} - ${p * p}) = 0$`
          : Math.abs(r) === 1
            ? `$x(x^{2} - ${p * p}) + (x^{2} - ${p * p}) = 0$`
            : `$x(x^{2} - ${p * p}) + ${Math.abs(r)}(x^{2} - ${p * p}) = 0$`;
      return {
        eqTex: eqLatexOrdered(terms),
        steps: [
          `$${eqLatexOrdered(terms)}$`,
          `$(x^{3} - ${p * p}x) + ${pairBClean} = 0$`,
          pull2,
          `$(${lin})(x^{2} - ${p * p}) = 0$`,
          `$(${lin})(x - ${p})(x + ${p}) = 0$`,
          `จะได้ $x = ${r},\\; ${p},\\; ${-p}$`,
          { conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` }
        ]
      };
    }

    if (scramble) {
      const terms = commonScrambleTerms3(1, -r, -(p * p), p * p * r);
      return {
        eqTex: eqLatexOrdered(terms),
        steps: [
          `$${eqLatexOrdered(terms)}$`,
          `จัดเรียงพจน์ใหม่ได้ $${eqLatex(coeffs)}$`,
          `$${grouped}$`,
          ...tail
        ]
      };
    }

    return {
      eqTex: eqLatex(coeffs),
      steps: [`$${eqLatex(coeffs)}$`, `$${grouped}$`, ...tail]
    };
  }

  function genCommonDeg3Lin(scramble, altPair) {
    const a = pick([1, 2, 3]);
    const b = pick([2, 3, 5, 6, 8]);
    const r = nonzero(4);
    const coeffs = [a, -a * r, -b, b * r];
    if (!coeffsOk(coeffs)) return null;
    const rootPos = posSqrtQuotientLatex(a, b);
    const set = sortedSetLatex([
      { sort: -Math.sqrt(b / a), tex: `-${rootPos}` },
      { sort: Math.sqrt(b / a), tex: rootPos },
      { sort: r, tex: String(r) }
    ]);
    const head3 = a === 1 ? "x^{3}" : `${a}x^{3}`;
    const leftSq = a === 1 ? "x^{2}" : `${a}x^{2}`;
    const lin = linearFactorLatex(1, -r);
    const grouped =
      r >= 0
        ? `(${head3} - ${a * r}x^{2}) - (${b}x - ${b * r}) = 0`
        : `(${head3} + ${Math.abs(a * r)}x^{2}) - (${b}x + ${Math.abs(b * r)}) = 0`;
    const tail = [
      `$${leftSq}(${lin}) - ${b}(${lin}) = 0$`,
      `$(${leftSq} - ${b})(${lin}) = 0$`,
      `นั่นคือ $${leftSq} - ${b} = 0$ หรือ $${lin} = 0$`,
      `จะได้ $x = \\pm ${rootPos}$ หรือ $x = ${r}$`,
      { conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` }
    ];

    if (altPair) {
      // (a x³ − b x) + (−a r x² + b r) = x(a x² − b) − r(a x² − b)
      const terms = commonAltTerms3(a, -a * r, -b, b * r);
      const midAbs = Math.abs(a * r);
      const pairBClean =
        r > 0
          ? midAbs === 1
            ? `(-x^{2} + ${b * r})`
            : `(-${midAbs}x^{2} + ${b * r})`
          : midAbs === 1
            ? `(x^{2} - ${Math.abs(b * r)})`
            : `(${midAbs}x^{2} - ${Math.abs(b * r)})`;
      const pull2 =
        r > 0
          ? r === 1
            ? `$x(${leftSq} - ${b}) - (${leftSq} - ${b}) = 0$`
            : `$x(${leftSq} - ${b}) - ${r}(${leftSq} - ${b}) = 0$`
          : Math.abs(r) === 1
            ? `$x(${leftSq} - ${b}) + (${leftSq} - ${b}) = 0$`
            : `$x(${leftSq} - ${b}) + ${Math.abs(r)}(${leftSq} - ${b}) = 0$`;
      return {
        eqTex: eqLatexOrdered(terms),
        steps: [
          `$${eqLatexOrdered(terms)}$`,
          `$(${head3} - ${b}x) + ${pairBClean} = 0$`,
          pull2,
          `$(${lin})(${leftSq} - ${b}) = 0$`,
          `นั่นคือ $${leftSq} - ${b} = 0$ หรือ $${lin} = 0$`,
          `จะได้ $x = \\pm ${rootPos}$ หรือ $x = ${r}$`,
          { conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` }
        ]
      };
    }

    if (scramble) {
      const terms = commonScrambleTerms3(a, -a * r, -b, b * r);
      return {
        eqTex: eqLatexOrdered(terms),
        steps: [
          `$${eqLatexOrdered(terms)}$`,
          `จัดเรียงพจน์ใหม่ได้ $${eqLatex(coeffs)}$`,
          `$${grouped}$`,
          ...tail
        ]
      };
    }

    return {
      eqTex: eqLatex(coeffs),
      steps: [`$${eqLatex(coeffs)}$`, `$${grouped}$`, ...tail]
    };
  }

  function genCommonDeg4(scramble, altPair) {
    const m = pick([1, 2, 4, 5, 8]);
    const coeffs = [m, 1, 0, -m, -1];
    if (!coeffsOk(coeffs)) return null;
    const set = sortedSetLatex([
      { sort: -1 / m, tex: fracLatex(-1, m) },
      { sort: 1, tex: "1" }
    ]);
    const head4 = m === 1 ? "x^{4}" : `${m}x^{4}`;
    const mx = m === 1 ? "x" : `${m}x`;
    const lin = linearFactorLatex(m, 1);
    const tail = [
      `$x^{3}(${lin}) - (${lin}) = 0$`,
      `$(x^{3} - 1)(${lin}) = 0$`,
      `$(x - 1)(x^{2} + x + 1)(${lin}) = 0$`,
      `จะได้ $x = 1$ หรือ $x = ${fracLatex(-1, m)}$ และ $x^{2} + x + 1 = 0$ ไม่มีคำตอบที่เป็นจำนวนจริง`,
      { conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` }
    ];

    if (altPair) {
      const terms = [
        { c: 1, deg: 3 },
        { c: -1, deg: 0 },
        { c: m, deg: 4 },
        { c: -m, deg: 1 }
      ];
      return {
        eqTex: eqLatexOrdered(terms),
        steps: [
          `$${eqLatexOrdered(terms)}$`,
          `$(x^{3} - 1) + (${head4} - ${mx}) = 0$`,
          `$(x^{3} - 1) + ${mx}(x^{3} - 1) = 0$`,
          `$(x^{3} - 1)(${m === 1 ? "x + 1" : `${m}x + 1`}) = 0$`,
          `$(x - 1)(x^{2} + x + 1)(${lin}) = 0$`,
          `จะได้ $x = 1$ หรือ $x = ${fracLatex(-1, m)}$ และ $x^{2} + x + 1 = 0$ ไม่มีคำตอบที่เป็นจำนวนจริง`,
          { conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` }
        ]
      };
    }

    if (scramble) {
      const terms = [
        { c: m, deg: 4 },
        { c: -1, deg: 0 },
        { c: 1, deg: 3 },
        { c: -m, deg: 1 }
      ];
      return {
        eqTex: eqLatexOrdered(terms),
        steps: [
          `$${eqLatexOrdered(terms)}$`,
          `จัดเรียงพจน์ใหม่ได้ $${eqLatex(coeffs)}$`,
          `$(${head4} + x^{3}) - (${mx} + 1) = 0$`,
          ...tail
        ]
      };
    }

    return {
      eqTex: eqLatex(coeffs),
      steps: [
        `$${eqLatex(coeffs)}$`,
        `$(${head4} + x^{3}) - (${mx} + 1) = 0$`,
        ...tail
      ]
    };
  }

  function genCommon(tries = 0) {
    if (tries >= GEN_MAX_TRIES) return genFactorSimpleFallback();
    const kind = pick([
      "deg3sq",
      "deg3lin",
      "deg4",
      "rearrange3sq",
      "rearrange3lin",
      "rearrange4",
      "altpair3sq",
      "altpair3lin",
      "altpair4"
    ]);
    let problem = null;
    if (kind === "deg3sq") problem = genCommonDeg3Sq(false, false);
    else if (kind === "deg3lin") problem = genCommonDeg3Lin(false, false);
    else if (kind === "deg4") problem = genCommonDeg4(false, false);
    else if (kind === "rearrange3sq") problem = genCommonDeg3Sq(true, false);
    else if (kind === "rearrange3lin") problem = genCommonDeg3Lin(true, false);
    else if (kind === "rearrange4") problem = genCommonDeg4(true, false);
    else if (kind === "altpair3sq") problem = genCommonDeg3Sq(false, true);
    else if (kind === "altpair3lin") problem = genCommonDeg3Lin(false, true);
    else if (kind === "altpair4") problem = genCommonDeg4(false, true);
    if (!problem) return genCommon(tries + 1);
    return problem;
  }

  function genTheorem() {
    const roll = Math.random();
    if (roll < 0.4) return genTheoremCubicInteger();
    if (roll < 0.7) return genTheoremCubicRational();
    if (roll < 0.85) return genTheoremQuarticInteger();
    return genTheoremQuarticRational();
  }

  function genTheoremCubicInteger(tries = 0) {
    if (tries >= GEN_MAX_TRIES) return genFactorSimpleFallback();
    let r1 = nonzero(4);
    let r2 = nonzero(4);
    let r3 = nonzero(4);
    let guard = 0;
    let coeffs = mulPolys(mulPolys([1, -r1], [1, -r2]), [1, -r3]);
    while ((!coeffsOk(coeffs) || new Set([r1, r2, r3]).size < 2) && guard < 40) {
      r1 = nonzero(4);
      r2 = nonzero(4);
      r3 = nonzero(4);
      coeffs = mulPolys(mulPolys([1, -r1], [1, -r2]), [1, -r3]);
      guard += 1;
    }
    if (!coeffsOk(coeffs)) return genTheoremCubicInteger(tries + 1);
    const after = syntheticDivide(coeffs, r1);
    if (after[after.length - 1] !== 0) return genTheoremCubicInteger(tries + 1);
    const quad = after.slice(0, -1);
    const uniq = [...new Set([r1, r2, r3])];
    const set = sortedSetLatex(uniq.map((r) => ({ sort: r, tex: String(r) })));
    return {
      eqTex: eqLatex(coeffs),
      steps: [
        `ตัวประกอบของ $${Math.abs(coeffs[3])}$ คือ $${posFactorTex(coeffs[3])}$`,
        `กำหนด $P(x) = ${polyLatex(coeffs)}$`,
        `จะพบว่า $P(${r1}) = ${polyEvalSubstLatex(coeffs, r1)} = 0$`,
        `จะได้ $${linearFactorLatex(1, -r1)}$ เป็นตัวประกอบของ $${polyLatex(coeffs)}$`,
        `นำ $${linearFactorLatex(1, -r1)}$ ไปหาร $${polyLatex(coeffs)}$ ได้ $${polyLatex(quad)}$`,
        `นั่นคือ $(${linearFactorLatex(1, -r1)})(${polyLatex(quad)}) = 0$`,
        `$(${linearFactorLatex(1, -r1)})(${linearFactorLatex(1, -r2)})(${linearFactorLatex(1, -r3)}) = 0$`,
        `จะได้ $x = ${uniq.join(",\\; ")}$`,
        { conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` }
      ]
    };
  }

  function genTheoremCubicRational(tries = 0) {
    if (tries >= GEN_MAX_TRIES) return genTheoremCubicInteger();
    const q = pick([2, 3]);
    const p = nonzero(4);
    let r1 = nonzero(3);
    let r2 = nonzero(3);
    let guard = 0;
    let coeffs = mulPolys(mulPolys([1, -r1], [1, -r2]), [q, -p]);
    while ((!coeffsOk(coeffs) || r1 === r2) && guard < 40) {
      r1 = nonzero(3);
      r2 = nonzero(3);
      coeffs = mulPolys(mulPolys([1, -r1], [1, -r2]), [q, -p]);
      guard += 1;
    }
    if (!coeffsOk(coeffs)) return genTheoremCubicInteger();
    const after = syntheticDivide(coeffs, r1);
    if (after[after.length - 1] !== 0) return genTheoremCubicRational(tries + 1);
    const quad = after.slice(0, -1);
    const roots = [
      { sort: r1, tex: String(r1) },
      { sort: r2, tex: String(r2) },
      { sort: p / q, tex: fracLatex(p, q) }
    ];
    const set = sortedSetLatex(roots);
    return {
      eqTex: eqLatex(coeffs),
      steps: [
        `หา $k$ จากตัวประกอบของ $${Math.abs(coeffs[3])}$ และ $m$ จากตัวประกอบของ $${Math.abs(coeffs[0])}$`,
        `กำหนด $P(x) = ${polyLatex(coeffs)}$`,
        `จะพบว่า $P(${r1}) = ${polyEvalSubstLatex(coeffs, r1)} = 0$`,
        `จะได้ $${linearFactorLatex(1, -r1)}$ เป็นตัวประกอบของ $${polyLatex(coeffs)}$`,
        `นำ $${linearFactorLatex(1, -r1)}$ ไปหาร $${polyLatex(coeffs)}$ ได้ $${polyLatex(quad)}$`,
        `นั่นคือ $(${linearFactorLatex(1, -r1)})(${polyLatex(quad)}) = 0$`,
        `$(${linearFactorLatex(1, -r1)})(${linearFactorLatex(1, -r2)})(${linearFactorLatex(q, -p)}) = 0$`,
        `จะได้ $x = ${r1},\\; ${r2},\\; ${fracLatex(p, q)}$`,
        { conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` }
      ]
    };
  }

  function genTheoremQuarticInteger(tries = 0) {
    if (tries >= GEN_MAX_TRIES) return genTheoremCubicInteger();
    let r1 = nonzero(3);
    let r2 = nonzero(3);
    let r3 = nonzero(3);
    let r4 = nonzero(3);
    let guard = 0;
    let coeffs = mulPolys(mulPolys(mulPolys([1, -r1], [1, -r2]), [1, -r3]), [1, -r4]);
    while ((!coeffsOk(coeffs) || new Set([r1, r2, r3, r4]).size < 2) && guard < 40) {
      r1 = nonzero(3);
      r2 = nonzero(3);
      r3 = nonzero(3);
      r4 = nonzero(3);
      coeffs = mulPolys(mulPolys(mulPolys([1, -r1], [1, -r2]), [1, -r3]), [1, -r4]);
      guard += 1;
    }
    if (!coeffsOk(coeffs)) return genTheoremCubicInteger();
    const after1 = syntheticDivide(coeffs, r1);
    if (after1[after1.length - 1] !== 0) return genTheoremQuarticInteger(tries + 1);
    const cub = after1.slice(0, -1);
    const after2 = syntheticDivide(cub, r2);
    if (after2[after2.length - 1] !== 0) return genTheoremQuarticInteger(tries + 1);
    const quad = after2.slice(0, -1);
    const uniq = [...new Set([r1, r2, r3, r4])];
    const set = sortedSetLatex(uniq.map((r) => ({ sort: r, tex: String(r) })));
    return {
      eqTex: eqLatex(coeffs),
      steps: [
        `ตัวประกอบของ $${Math.abs(coeffs[4])}$ คือ $${posFactorTex(coeffs[4])}$`,
        `กำหนด $P(x) = ${polyLatex(coeffs)}$`,
        `จะพบว่า $P(${r1}) = ${polyEvalSubstLatex(coeffs, r1)} = 0$`,
        `จะได้ $${linearFactorLatex(1, -r1)}$ เป็นตัวประกอบของ $${polyLatex(coeffs)}$`,
        `นำ $${linearFactorLatex(1, -r1)}$ ไปหาร $${polyLatex(coeffs)}$ ได้ $${polyLatex(cub)}$`,
        `กำหนด $Q(x) = ${polyLatex(cub)}$`,
        `จะพบว่า $Q(${r2}) = ${polyEvalSubstLatex(cub, r2)} = 0$`,
        `นำ $${linearFactorLatex(1, -r2)}$ ไปหาร $${polyLatex(cub)}$ ได้ $${polyLatex(quad)}$`,
        `นั่นคือ $(${linearFactorLatex(1, -r1)})(${linearFactorLatex(1, -r2)})(${polyLatex(quad)}) = 0$`,
        `จะได้ $x = ${uniq.join(",\\; ")}$`,
        { conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` }
      ]
    };
  }

  function genTheoremQuarticRational(tries = 0) {
    if (tries >= GEN_MAX_TRIES) return genTheoremQuarticInteger();
    const q = pick([2, 3]);
    const p = nonzero(3);
    let r1 = nonzero(3);
    let r2 = nonzero(3);
    let r3 = nonzero(3);
    let guard = 0;
    let coeffs = mulPolys(mulPolys(mulPolys([1, -r1], [1, -r2]), [1, -r3]), [q, -p]);
    while ((!coeffsOk(coeffs) || new Set([r1, r2, r3]).size < 2) && guard < 40) {
      r1 = nonzero(3);
      r2 = nonzero(3);
      r3 = nonzero(3);
      coeffs = mulPolys(mulPolys(mulPolys([1, -r1], [1, -r2]), [1, -r3]), [q, -p]);
      guard += 1;
    }
    if (!coeffsOk(coeffs)) return genTheoremQuarticInteger();
    const after1 = syntheticDivide(coeffs, r1);
    if (after1[after1.length - 1] !== 0) return genTheoremQuarticRational(tries + 1);
    const cub = after1.slice(0, -1);
    const after2 = syntheticDivide(cub, r2);
    if (after2[after2.length - 1] !== 0) return genTheoremQuarticRational(tries + 1);
    const quad = after2.slice(0, -1);
    const roots = [
      { sort: r1, tex: String(r1) },
      { sort: r2, tex: String(r2) },
      { sort: r3, tex: String(r3) },
      { sort: p / q, tex: fracLatex(p, q) }
    ];
    const uniqMap = new Map();
    roots.forEach((r) => uniqMap.set(r.tex, r));
    const uniq = [...uniqMap.values()];
    const set = sortedSetLatex(uniq);
    return {
      eqTex: eqLatex(coeffs),
      steps: [
        `หา $k$ จากตัวประกอบของ $${Math.abs(coeffs[4])}$ และ $m$ จากตัวประกอบของ $${Math.abs(coeffs[0])}$`,
        `กำหนด $P(x) = ${polyLatex(coeffs)}$`,
        `จะพบว่า $P(${r1}) = ${polyEvalSubstLatex(coeffs, r1)} = 0$`,
        `จะได้ $${linearFactorLatex(1, -r1)}$ เป็นตัวประกอบของ $${polyLatex(coeffs)}$`,
        `นำ $${linearFactorLatex(1, -r1)}$ ไปหาร $${polyLatex(coeffs)}$ ได้ $${polyLatex(cub)}$`,
        `กำหนด $Q(x) = ${polyLatex(cub)}$`,
        `จะพบว่า $Q(${r2}) = ${polyEvalSubstLatex(cub, r2)} = 0$`,
        `นำ $${linearFactorLatex(1, -r2)}$ ไปหาร $${polyLatex(cub)}$ ได้ $${polyLatex(quad)}$`,
        `นั่นคือ $(${linearFactorLatex(1, -r1)})(${linearFactorLatex(1, -r2)})(${polyLatex(quad)}) = 0$`,
        `จะได้ $x = ${uniq.map((u) => u.tex).join(",\\; ")}$`,
        { conclusion: true, text: `ดังนั้น เซตคำตอบของสมการ คือ $${set}$` }
      ]
    };
  }

  function generateProblem(methodId) {
    const map = {
      factor: genFactor,
      complete: genComplete,
      formula: genFormula,
      common: genCommon,
      theorem: genTheorem
    };
    const fn = map[methodId] || genFactor;
    for (let i = 0; i < 16; i += 1) {
      try {
        const problem = fn();
        if (problem?.eqTex && problem?.steps?.length) return problem;
      } catch {
        /* retry */
      }
    }
    return genFactor();
  }

  /* ---------- views ---------- */

  function applyContent() {
    const c = t();
    if (!c) return;
    const eyebrow = $("#landingEyebrow");
    const title = $("#landingTitle");
    const start = $("#startButton");
    const appTitle = $("#appTitle");
    if (eyebrow) eyebrow.textContent = c.landing?.eyebrow || "INTERACTIVE MATHEMATICS";
    if (title) title.textContent = c.landing?.title || "";
    if (start) start.textContent = c.landing?.start || "เริ่ม";
    if (appTitle) appTitle.textContent = c.app?.title || c.landing?.title || "";
    document.title = `${c.app?.title || "Interactive Mathematics"} | Interactive Mathematics`;

    const modeLabel = $("#modeLabel");
    const methodLabel = $("#methodLabel");
    if (modeLabel) modeLabel.textContent = c.ui?.modeLabel || "โหมด";
    if (methodLabel) methodLabel.textContent = c.ui?.methodLabel || "แก้สมการโดย";
    const modeLearnBtn = $("#modeLearnBtn");
    const modeTestBtn = $("#modeTestBtn");
    const randomBtn = $("#randomBtn");
    const prevBtn = $("#prevBtn");
    const nextBtn = $("#nextBtn");
    const allBtn = $("#allBtn");
    if (modeLearnBtn) modeLearnBtn.textContent = c.ui?.modeLearn || "ศึกษา";
    if (modeTestBtn) modeTestBtn.textContent = c.ui?.modeTest || "ทดสอบ";
    if (randomBtn) randomBtn.textContent = c.ui?.random || "สุ่มโจทย์";
    if (prevBtn) prevBtn.textContent = c.ui?.prev || "ก่อนหน้า";
    if (nextBtn) nextBtn.textContent = c.ui?.next || "ถัดไป";
    if (allBtn) allBtn.textContent = c.ui?.all || "ทั้งหมด";
    const infoBtn = $("#infoBtn");
    if (infoBtn) {
      const infoAria = c.ui?.infoAria || "สูตรที่เกี่ยวข้อง";
      infoBtn.setAttribute("aria-label", infoAria);
      infoBtn.title = infoAria;
    }
    const infoTitle = $("#infoTitle");
    if (infoTitle) infoTitle.textContent = c.ui?.infoTitle || "สูตรที่เกี่ยวข้อง";
  }

  function fillMethodSelect() {
    const select = $("#methodSelect");
    if (!select) return;
    select.innerHTML = methods()
      .map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.label)}</option>`)
      .join("");
    select.value = state.methodId;
  }

  function setMode(mode) {
    state.mode = mode;
    const learnBtn = $("#modeLearnBtn");
    const testBtn = $("#modeTestBtn");
    learnBtn?.classList.toggle("mode-btn--active", mode === "learn");
    testBtn?.classList.toggle("mode-btn--active", mode === "test");
    learnBtn?.setAttribute("aria-pressed", mode === "learn" ? "true" : "false");
    testBtn?.setAttribute("aria-pressed", mode === "test" ? "true" : "false");
    const learnPanel = $("#learnPanel");
    const testPanel = $("#testPanel");
    if (learnPanel) learnPanel.hidden = mode !== "learn";
    if (testPanel) testPanel.hidden = mode !== "test";
    if (mode === "learn") renderLearn();
    else {
      if (!state.testProblem) randomProblem();
      else renderTest();
    }
  }

  function setMethod(methodId) {
    state.methodId = methodId;
    state.learnIndex = 0;
    state.step = 0;
    state.showAll = false;
    state.testProblem = null;
    if (state.mode === "learn") renderLearn();
    else randomProblem();
  }

  function renderLearn() {
    const list = examplesFor(state.methodId);
    const total = list.length || 1;
    if (state.learnIndex >= total) state.learnIndex = 0;
    const ex = list[state.learnIndex];
    const label = $("#pagerLabel");
    const ui = t()?.ui;
    if (label) {
      label.textContent = (ui?.pagerLabel || "ข้อ {n}/{total}")
        .replace("{n}", String(state.learnIndex + 1))
        .replace("{total}", String(total));
    }
    const dots = $("#pagerDots");
    if (dots) {
      dots.innerHTML = list
        .map(
          (_, i) =>
            `<button class="pager__dot${i === state.learnIndex ? " pager__dot--active" : ""}" type="button" data-index="${i}" aria-label="ข้อ ${i + 1}"${i === state.learnIndex ? ' aria-current="true"' : ""}></button>`
        )
        .join("");
    }
    const prev = $("#pagerPrev");
    const next = $("#pagerNext");
    if (prev) prev.disabled = state.learnIndex <= 0;
    if (next) next.disabled = state.learnIndex >= total - 1;

    const body = $("#learnBody");
    if (!body || !ex) {
      if (body) body.innerHTML = "";
      return;
    }
    const prompt = `${ui?.promptPrefix || "ให้หาเซตคำตอบของสมการ"} $${ex.eqTex}$`;
    body.innerHTML = `<p class="prompt-text">${prompt}</p>${linesHtml(ex.lines)}`;
    renderMath(body);
  }

  function randomProblem() {
    state.testProblem = generateProblem(state.methodId);
    state.step = 0;
    state.showAll = false;
    renderTest();
  }

  function resetTestView() {
    state.step = 0;
    state.showAll = false;
    renderTest();
  }

  function updateTestButtons() {
    const has = Boolean(state.testProblem);
    const steps = state.testProblem?.steps || [];
    const last = steps.length;
    const prev = $("#prevBtn");
    const next = $("#nextBtn");
    const all = $("#allBtn");
    if (prev) prev.disabled = !has || state.showAll || state.step <= 0;
    if (next) next.disabled = !has || state.showAll || state.step >= last;
    if (all) {
      all.disabled = !has;
      all.setAttribute("aria-pressed", state.showAll ? "true" : "false");
    }
  }

  function renderTest() {
    const ui = t()?.ui;
    const promptEl = $("#testPrompt");
    const body = $("#testBody");
    const problem = state.testProblem;
    if (!problem) {
      if (promptEl) promptEl.textContent = ui?.testHint || "";
      if (body) body.innerHTML = `<p class="test-empty">${escapeHtml(ui?.testHint || "")}</p>`;
      updateTestButtons();
      return;
    }
    if (promptEl) {
      promptEl.innerHTML = `${ui?.promptPrefix || "ให้หาเซตคำตอบของสมการ"} $${problem.eqTex}$`;
      renderMath(promptEl);
    }
    const steps = problem.steps || [];
    const visible = state.showAll ? steps.length : state.step;
    if (body) {
      if (visible <= 0) {
        body.innerHTML = `<p class="test-empty">กด “ถัดไป” เพื่อดูเฉลยทีละบรรทัด</p>`;
      } else {
        body.innerHTML = linesHtml(steps.slice(0, visible));
        renderMath(body);
      }
    }
    updateTestButtons();
  }

  function renderInfo() {
    const body = $("#infoBody");
    const formulas = t()?.formulas || [];
    if (!body) return;
    body.innerHTML = formulas
      .map((f) => {
        const name = f.name
          ? `<span class="formula-item__name">${escapeHtml(f.name)}</span>`
          : `<span class="formula-item__name"></span>`;
        return `<p class="formula-item">${name}<span class="formula-item__tex">${f.tex}</span></p>`;
      })
      .join("");
    renderMath(body);
  }

  function openInfo() {
    const modal = $("#infoModal");
    if (!modal) return;
    renderInfo();
    modal.hidden = false;
    $("#infoCloseBtn")?.focus();
  }

  function closeInfo() {
    const modal = $("#infoModal");
    if (!modal) return;
    modal.hidden = true;
    $("#infoBtn")?.focus();
  }

  function showApp() {
    const landing = $("#landingPage");
    const app = $("#appPage");
    if (landing) {
      landing.hidden = true;
      landing.classList.remove("view--active");
    }
    if (app) {
      app.hidden = false;
      app.classList.add("view--active");
      $("#appTitle")?.focus();
    }
  }

  function bind() {
    $("#startButton")?.addEventListener("click", showApp);
    $("#modeLearnBtn")?.addEventListener("click", () => setMode("learn"));
    $("#modeTestBtn")?.addEventListener("click", () => setMode("test"));
    $("#methodSelect")?.addEventListener("change", (e) => setMethod(e.target.value));

    $("#pagerPrev")?.addEventListener("click", () => {
      if (state.learnIndex > 0) {
        state.learnIndex -= 1;
        renderLearn();
      }
    });
    $("#pagerNext")?.addEventListener("click", () => {
      const total = examplesFor(state.methodId).length;
      if (state.learnIndex < total - 1) {
        state.learnIndex += 1;
        renderLearn();
      }
    });
    $("#pagerDots")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".pager__dot");
      if (!btn) return;
      state.learnIndex = Number(btn.dataset.index) || 0;
      renderLearn();
    });

    $("#randomBtn")?.addEventListener("click", randomProblem);
    $("#testReset")?.addEventListener("click", () => {
      if (state.testProblem) resetTestView();
      else randomProblem();
    });
    $("#prevBtn")?.addEventListener("click", () => {
      if (!state.testProblem || state.showAll || state.step <= 0) return;
      state.step -= 1;
      renderTest();
    });
    $("#nextBtn")?.addEventListener("click", () => {
      const last = state.testProblem?.steps?.length || 0;
      if (!state.testProblem || state.showAll || state.step >= last) return;
      state.step += 1;
      renderTest();
    });
    $("#allBtn")?.addEventListener("click", () => {
      if (!state.testProblem) return;
      state.showAll = !state.showAll;
      if (state.showAll) state.step = state.testProblem.steps.length;
      else state.step = 0;
      renderTest();
    });

    $("#infoBtn")?.addEventListener("click", openInfo);
    $("#infoCloseBtn")?.addEventListener("click", closeInfo);
    $("#infoModal")?.addEventListener("click", (e) => {
      if (e.target?.dataset?.close) closeInfo();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#infoModal")?.hidden) closeInfo();
    });
  }

  function init() {
    applyContent();
    fillMethodSelect();
    bind();
    setMode("learn");
    renderLearn();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
