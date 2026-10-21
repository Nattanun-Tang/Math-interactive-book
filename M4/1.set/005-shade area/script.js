(() => {
  const $ = (selector) => document.querySelector(selector);

  const GEO = {
    vb: { w: 760, h: 640 },
    universe: { x: 48, y: 40, w: 664, h: 560, rx: 18 },
    two: {
      A: { cx: 270, cy: 330, r: 175 },
      B: { cx: 490, cy: 330, r: 175 },
      labelAngles: { A: 210, B: -30 }
    },
    three: {
      A: { cx: 300, cy: 255, r: 158 },
      B: { cx: 460, cy: 255, r: 158 },
      C: { cx: 380, cy: 375, r: 158 },
      labelAngles: { A: 205, B: -25, C: 90 }
    }
  };

  const LABEL_OUTSIDE_GAP = 38;
  const MAX_EXPR_TOKENS = 24;

  const REGION_COLORS = {
    onlyA: "#b7e0a8",
    onlyB: "#e8b8d4",
    onlyC: "#a8d8e8",
    ab: "#f5c9a8",
    ac: "#a8c6f0",
    bc: "#c8c8c8",
    abc: "#f0e090",
    outside: "#ff9eb8"
  };

  const REGIONS2 = {
    onlyA: { A: true, B: false },
    onlyB: { A: false, B: true },
    ab: { A: true, B: true },
    outside: { A: false, B: false }
  };

  const REGIONS3 = {
    onlyA: { A: true, B: false, C: false },
    onlyB: { A: false, B: true, C: false },
    onlyC: { A: false, B: false, C: true },
    ab: { A: true, B: true, C: false },
    ac: { A: true, B: false, C: true },
    bc: { A: false, B: true, C: true },
    abc: { A: true, B: true, C: true },
    outside: { A: false, B: false, C: false }
  };

  const TOKEN_DEFS = {
    A: { id: "A", kind: "set", label: "A", latex: "A" },
    B: { id: "B", kind: "set", label: "B", latex: "B" },
    C: { id: "C", kind: "set", label: "C", latex: "C" },
    U: { id: "U", kind: "set", label: "U", latex: "U" },
    empty: { id: "empty", kind: "set", label: "∅", latex: "\\varnothing" },
    union: { id: "union", kind: "binop", label: "∪", latex: "\\cup" },
    inter: { id: "inter", kind: "binop", label: "∩", latex: "\\cap" },
    diff: { id: "diff", kind: "binop", label: "−", latex: "-" },
    comp: { id: "comp", kind: "postfix", label: "′", latex: "'" },
    lparen: { id: "lparen", kind: "paren", label: "(", latex: "(" },
    rparen: { id: "rparen", kind: "paren", label: ")", latex: ")" }
  };

  const state = {
    mode: "explore",
    sets: 2,
    shaded: new Set(),
    hover: null,
    showResult: false,
    tokens: [],
    exprError: false,
    shadeLatex: null
  };

  let errorTimer = null;

  function t() {
    return window.CONTENT?.th;
  }

  function sameRegions(a, b) {
    if (a.length !== b.length) return false;
    const set = new Set(a);
    return b.every((id) => set.has(id));
  }

  function sorted(ids) {
    return [...ids].sort();
  }

  function findMatch(sets, shadedIds) {
    const catalog = sets === 2 ? t().expressions2 : t().expressions3;
    const want = sorted(shadedIds);
    return catalog.find((item) => sameRegions(sorted(item.regions), want)) || null;
  }

  function alreadyGrouped(latex) {
    let s = latex.trim();
    while (s.endsWith("'")) s = s.slice(0, -1);
    if (!s.startsWith("(") || !s.endsWith(")")) return false;
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === "(") depth += 1;
      else if (s[i] === ")") {
        depth -= 1;
        if (depth === 0 && i < s.length - 1) return false;
      }
      if (depth < 0) return false;
    }
    return depth === 0;
  }

  function fallbackLatex(sets, shadedIds) {
    if (!shadedIds.length) return t().ui.empty;
    const atoms = sets === 2 ? t().atoms2 : t().atoms3;
    const parts = sorted(shadedIds).map((id) => atoms[id]);
    if (parts.length === 1) return parts[0];
    return parts.map((p) => (alreadyGrouped(p) ? p : `(${p})`)).join(" \\cup ");
  }

  function expressionLatex() {
    const ids = [...state.shaded];
    const match = findMatch(state.sets, ids);
    return match ? match.latex : fallbackLatex(state.sets, ids);
  }

  function tokensToLatex(tokens) {
    return tokens.map((id) => TOKEN_DEFS[id].latex).join(" ");
  }

  function inCircle(pt, circle) {
    const dx = pt.x - circle.cx;
    const dy = pt.y - circle.cy;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function inUniverse(pt) {
    const u = GEO.universe;
    return pt.x >= u.x && pt.x <= u.x + u.w && pt.y >= u.y && pt.y <= u.y + u.h;
  }

  function regionAt(pt) {
    if (!inUniverse(pt)) return null;
    if (state.sets === 2) {
      const a = inCircle(pt, GEO.two.A);
      const b = inCircle(pt, GEO.two.B);
      if (a && b) return "ab";
      if (a) return "onlyA";
      if (b) return "onlyB";
      return "outside";
    }
    const a = inCircle(pt, GEO.three.A);
    const b = inCircle(pt, GEO.three.B);
    const c = inCircle(pt, GEO.three.C);
    if (a && b && c) return "abc";
    if (a && b) return "ab";
    if (a && c) return "ac";
    if (b && c) return "bc";
    if (a) return "onlyA";
    if (b) return "onlyB";
    if (c) return "onlyC";
    return "outside";
  }

  function svgPoint(svg, event) {
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    return pt.matrixTransform(ctm.inverse());
  }

  function renderLatex(el, latex) {
    if (!el) return;
    if (typeof katex === "undefined" || typeof katex.renderToString !== "function") {
      el.textContent = latex;
      return;
    }
    el.innerHTML = katex.renderToString(latex, {
      throwOnError: false,
      output: "html",
      displayMode: false
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

  function regionFill(id, hoverRegion = state.hover) {
    if (state.shaded.has(id)) return REGION_COLORS[id] || "#f3c4c2";
    if (state.mode === "explore" && hoverRegion === id) return "rgba(231,19,18,0.12)";
    return "transparent";
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
    const margin = 22;
    x = Math.min(Math.max(x, u.x + margin), u.x + u.w - margin);
    y = Math.min(Math.max(y, u.y + margin), u.y + u.h - margin);
    const dx = x - circle.cx;
    const dy = y - circle.cy;
    const dist = Math.hypot(dx, dy);
    const minDist = circle.r + Math.min(gap, 28);
    if (dist > 0 && dist < minDist) {
      const scale = minDist / dist;
      x = circle.cx + dx * scale;
      y = circle.cy + dy * scale;
      x = Math.min(Math.max(x, u.x + margin), u.x + u.w - margin);
      y = Math.min(Math.max(y, u.y + margin), u.y + u.h - margin);
    }
    return { x, y };
  }

  function label(x, y, text) {
    return `<text class="venn-label" x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" stroke="#ffffff" stroke-width="5" paint-order="stroke fill">${text}</text>`;
  }

  function setLabels(geo) {
    return Object.entries(geo.labelAngles)
      .map(([name, angle]) => {
        const pos = labelOutsideCircle(geo[name], angle);
        return label(pos.x, pos.y, name);
      })
      .join("");
  }

  function buildSvg() {
    const u = GEO.universe;
    const defs = [
      `<clipPath id="clipU" clipPathUnits="userSpaceOnUse"><rect x="${u.x}" y="${u.y}" width="${u.w}" height="${u.h}" rx="${u.rx}"/></clipPath>`
    ];

    let regions = "";
    let outlines = "";
    let labels = label(72, 72, "U");
    const cursor = state.mode === "explore" ? "pointer" : "default";

    if (state.sets === 2) {
      const A = GEO.two.A;
      const B = GEO.two.B;
      defs.push(clipCircle("clipA", A), clipCircle("clipB", B));
      defs.push(holeMask("maskNotA", A), holeMask("maskNotB", B));
      regions =
        regionPaint("onlyA", ["clipA"], ["maskNotB"]) +
        regionPaint("onlyB", ["clipB"], ["maskNotA"]) +
        regionPaint("ab", ["clipA", "clipB"], []) +
        regionPaint("outside", [], ["maskNotA", "maskNotB"]);
      outlines = circleEl(A) + circleEl(B);
      labels += setLabels(GEO.two);
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
        regionPaint("abc", ["clipA", "clipB", "clipC"], []) +
        regionPaint("outside", [], ["maskNotA", "maskNotB", "maskNotC"]);
      outlines = circleEl(A) + circleEl(B) + circleEl(C);
      labels += setLabels(GEO.three);
    }

    return `<svg viewBox="0 0 ${GEO.vb.w} ${GEO.vb.h}" role="img" aria-label="แผนภาพเวนน์"><defs>${defs.join("")}</defs><rect x="${u.x}" y="${u.y}" width="${u.w}" height="${u.h}" rx="${u.rx}" fill="#ffffff" stroke="#5e6b78" stroke-width="3"/>${regions}${outlines}${labels}<rect id="hitLayer" x="${u.x}" y="${u.y}" width="${u.w}" height="${u.h}" rx="${u.rx}" fill="transparent" style="cursor:${cursor}"/></svg>`;
  }

  function applyHover(region) {
    document.querySelectorAll("[data-fill]").forEach((rect) => {
      rect.setAttribute("fill", regionFill(rect.getAttribute("data-fill"), region));
    });
  }

  function parenthesesComplete(tokenIds) {
    let depth = 0;
    for (const id of tokenIds) {
      if (id === "lparen") depth += 1;
      else if (id === "rparen") {
        depth -= 1;
        if (depth < 0) return false;
      }
    }
    return depth === 0;
  }

  function parseExpression(tokenIds) {
    if (!tokenIds.length) return { ok: false };
    if (!parenthesesComplete(tokenIds)) return { ok: false };

    const tokens = tokenIds.map((id) => TOKEN_DEFS[id]);
    let i = 0;

    function peek() {
      return tokens[i] || null;
    }

    function consume() {
      return tokens[i++] || null;
    }

    // Chain same ∪/∩ without parentheses (A ∪ B ∪ C, A ∩ B ∩ C).
    // Mixed ops or − still need parentheses (e.g. A ∪ B ∩ C).
    function parseExpr() {
      let left = parsePostfix();
      if (!left) return null;

      const firstOp = peek();
      if (!firstOp || firstOp.kind !== "binop") return left;

      const chainOp = firstOp.id;
      const canChain = chainOp === "union" || chainOp === "inter";

      consume();
      let right = parsePostfix();
      if (!right) return null;
      left = { type: "binop", op: chainOp, left, right };

      if (canChain) {
        while (peek() && peek().kind === "binop") {
          if (peek().id !== chainOp) return null;
          consume();
          right = parsePostfix();
          if (!right) return null;
          left = { type: "binop", op: chainOp, left, right };
        }
      } else if (peek() && peek().kind === "binop") {
        return null;
      }

      return left;
    }

    function parsePostfix() {
      let node = parsePrimary();
      if (!node) return null;
      while (peek() && peek().id === "comp") {
        consume();
        node = { type: "comp", arg: node };
      }
      return node;
    }

    function parsePrimary() {
      const tok = peek();
      if (!tok) return null;

      if (tok.kind === "set") {
        consume();
        return { type: "set", id: tok.id };
      }

      if (tok.id === "lparen") {
        consume();
        const inner = parseExpr();
        if (!inner) return null;
        if (!peek() || peek().id !== "rparen") return null;
        consume();
        return inner;
      }

      return null;
    }

    const ast = parseExpr();
    if (!ast || i !== tokens.length) return { ok: false };
    return { ok: true, ast };
  }

  function evalAst(ast, membership) {
    switch (ast.type) {
      case "set":
        if (ast.id === "empty") return false;
        if (ast.id === "U") return true;
        return Boolean(membership[ast.id]);
      case "comp":
        return !evalAst(ast.arg, membership);
      case "binop": {
        const L = evalAst(ast.left, membership);
        const R = evalAst(ast.right, membership);
        if (ast.op === "union") return L || R;
        if (ast.op === "inter") return L && R;
        if (ast.op === "diff") return L && !R;
        return false;
      }
      default:
        return false;
    }
  }

  function regionsForExpression(ast, sets) {
    const table = sets === 2 ? REGIONS2 : REGIONS3;
    const ids = [];
    for (const [id, membership] of Object.entries(table)) {
      if (evalAst(ast, membership)) ids.push(id);
    }
    return ids;
  }

  function paletteIds() {
    const ids = ["A", "B"];
    if (state.sets === 3) ids.push("C");
    ids.push("U", "empty", "union", "inter", "diff", "comp", "lparen", "rparen");
    return ids;
  }

  function hideExprError() {
    state.exprError = false;
    if (errorTimer) {
      clearTimeout(errorTimer);
      errorTimer = null;
    }
    const el = $("#exprError");
    if (el) el.hidden = true;
  }

  function showExprError() {
    state.exprError = true;
    const el = $("#exprError");
    const c = t();
    if (el) {
      el.textContent = c.ui.exprInvalid;
      el.hidden = false;
    }
    if (errorTimer) clearTimeout(errorTimer);
    errorTimer = setTimeout(() => {
      hideExprError();
    }, 3200);
  }

  function discardAppliedShade() {
    state.shadeLatex = null;
    hideExprError();
    if (state.shaded.size > 0) {
      state.shaded = new Set();
      renderDiagram();
    }
  }

  function addToken(id) {
    if (state.tokens.length >= MAX_EXPR_TOKENS) return;
    if (id === "C" && state.sets !== 3) return;
    state.tokens.push(id);
    discardAppliedShade();
    renderShadeBuilder();
    renderResult();
  }

  function popToken() {
    if (!state.tokens.length) return;
    state.tokens.pop();
    discardAppliedShade();
    renderShadeBuilder();
    renderResult();
  }

  function clearTokens() {
    state.tokens = [];
    discardAppliedShade();
    renderShadeBuilder();
    renderResult();
  }

  function applyShadeFromExpression() {
    const parsed = parseExpression(state.tokens);
    if (!parsed.ok) {
      showExprError();
      return;
    }
    hideExprError();
    const ids = regionsForExpression(parsed.ast, state.sets);
    state.shaded = new Set(ids);
    state.shadeLatex = tokensToLatex(state.tokens);
    state.hover = null;
    renderDiagram();
    renderResult();
  }

  function setMode(mode) {
    if (state.mode === mode) return;
    state.mode = mode;
    state.shaded = new Set();
    state.hover = null;
    state.tokens = [];
    state.shadeLatex = null;
    hideExprError();
    renderApp();
  }

  function bindCanvas() {
    const canvas = $("#vennCanvas");
    canvas.addEventListener("mousemove", (event) => {
      if (state.mode !== "explore") return;
      const svg = canvas.querySelector("svg");
      if (!svg) return;
      const pt = svgPoint(svg, event);
      const region = pt ? regionAt(pt) : null;
      if (region === state.hover) return;
      state.hover = region;
      applyHover(region);
    });
    canvas.addEventListener("mouseleave", () => {
      if (state.hover == null) return;
      state.hover = null;
      applyHover(null);
    });
    canvas.addEventListener("click", (event) => {
      if (state.mode !== "explore") return;
      const svg = canvas.querySelector("svg");
      if (!svg) return;
      const pt = svgPoint(svg, event);
      const region = pt ? regionAt(pt) : null;
      if (!region) return;
      toggleRegion(region);
    });
  }

  function toggleRegion(id) {
    if (state.shaded.has(id)) state.shaded.delete(id);
    else state.shaded.add(id);
    renderApp();
  }

  function clearShading() {
    state.shaded = new Set();
    state.hover = null;
    if (state.mode === "shade") state.shadeLatex = null;
    renderApp();
  }

  function setShowResult(on) {
    state.showResult = Boolean(on);
    renderResult();
  }

  function setSetCount(n) {
    if (state.sets === n) return;
    state.sets = n;
    state.shaded = new Set();
    state.hover = null;
    state.shadeLatex = null;
    state.tokens = [];
    hideExprError();
    renderApp();
  }

  function renderDiagram() {
    const canvas = $("#vennCanvas");
    canvas.innerHTML = buildSvg();
    canvas.classList.toggle("is-locked", state.mode === "shade");
  }

  function renderShadeBuilder() {
    if (state.mode !== "shade") return;
    const c = t();
    $("#tilesLabel").textContent = c.ui.tilesLabel;
    $("#exprLabel").textContent = c.ui.exprLabel;
    $("#exprBackspace").setAttribute("aria-label", c.ui.exprBackspace);
    $("#exprBackspace").title = c.ui.exprBackspace;
    $("#exprClear").setAttribute("aria-label", c.ui.exprClear);
    $("#exprClear").title = c.ui.exprClear;
    $("#shadeApplyBtn").textContent = c.ui.shadeApply;
    $("#exprError").textContent = c.ui.exprInvalid;
    $("#exprError").hidden = !state.exprError;

    const palette = $("#tilePalette");
    const full = state.tokens.length >= MAX_EXPR_TOKENS;
    palette.innerHTML = "";
    paletteIds().forEach((id) => {
      const def = TOKEN_DEFS[id];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile-btn";
      btn.setAttribute("aria-label", def.label);
      btn.disabled = full;
      renderLatex(btn, def.latex);
      btn.addEventListener("click", () => addToken(id));
      palette.appendChild(btn);
    });

    const line = $("#exprLine");
    line.innerHTML = "";
    if (!state.tokens.length) {
      const empty = document.createElement("p");
      empty.className = "expr-line__empty";
      empty.textContent = c.ui.exprEmptyHint;
      line.appendChild(empty);
    } else {
      state.tokens.forEach((id) => {
        const chip = document.createElement("span");
        chip.className = "expr-chip";
        chip.setAttribute("role", "listitem");
        chip.setAttribute("aria-label", TOKEN_DEFS[id].label);
        renderLatex(chip, TOKEN_DEFS[id].latex);
        line.appendChild(chip);
      });
    }
  }

  function renderToolbar() {
    const c = t();
    const explore = state.mode === "explore";

    $("#modeLabel").textContent = c.ui.modeLabel;
    $("#btnExplore").textContent = c.ui.explore;
    $("#btnShade").textContent = c.ui.shade;
    $("#btnExplore").classList.toggle("is-active", explore);
    $("#btnShade").classList.toggle("is-active", !explore);
    $("#btnExplore").setAttribute("aria-checked", explore ? "true" : "false");
    $("#btnShade").setAttribute("aria-checked", explore ? "false" : "true");

    $("#setsLabel").textContent = c.ui.setsLabel;
    $("#btnTwo").textContent = c.ui.twoSets;
    $("#btnThree").textContent = c.ui.threeSets;
    $("#btnTwo").classList.toggle("is-active", state.sets === 2);
    $("#btnThree").classList.toggle("is-active", state.sets === 3);
    $("#btnTwo").setAttribute("aria-checked", state.sets === 2 ? "true" : "false");
    $("#btnThree").setAttribute("aria-checked", state.sets === 3 ? "true" : "false");

    $("#exploreControls").hidden = !explore;
    $("#shadeControls").hidden = explore;
    $("#exploreResultPanel").hidden = !explore;
    $("#shadeResultPanel").hidden = explore;
    $(".venn-app").classList.toggle("is-shade-mode", !explore);
    $("#vennResult").classList.toggle("is-shade-mode", !explore);

    if (explore) {
      $("#hintBox").textContent = c.ui.hint;
      $("#writeToggleLabel").textContent = c.ui.write;
      $("#writeToggle").checked = state.showResult;
    } else {
      renderShadeBuilder();
    }

    $("#resetButton").setAttribute("aria-label", c.ui.reset);
    $("#resetButton").title = c.ui.reset;
  }

  function renderResult() {
    const c = t();

    if (state.mode === "shade") {
      const lead = $("#shadeResultLead");
      const math = $("#shadeResultMath");
      const line = $("#shadeResultLine");
      if (state.shadeLatex) {
        lead.textContent = c.ui.shadeResultLead;
        renderLatex(math, state.shadeLatex);
        line.hidden = false;
      } else {
        lead.textContent = "";
        math.innerHTML = "";
        line.hidden = true;
      }
      return;
    }

    const lead = $("#resultLead");
    const math = $("#resultMath");

    if (!state.showResult) {
      lead.textContent = "";
      math.innerHTML = "";
      return;
    }

    lead.textContent = c.ui.resultLead;
    renderLatex(math, expressionLatex());
  }

  function renderApp() {
    renderToolbar();
    renderDiagram();
    renderResult();
  }

  function applyContent() {
    const c = t();
    if (!c) return;
    $("#landingEyebrow").textContent = c.landing.eyebrow;
    $("#landingTitle").textContent = c.landing.title;
    $("#startButton").textContent = c.landing.start;
    $("#appTitle").textContent = c.app.title;
    document.title = c.landing.title;
  }

  function showApp() {
    $("#landingPage").hidden = true;
    $("#landingPage").classList.remove("view--active");
    $("#appPage").hidden = false;
    $("#appPage").classList.add("view--active");
    renderApp();
    $("#appTitle").focus?.();
  }

  function bindLandingImage() {
    const img = document.querySelector(".landing__visual-image");
    const visual = document.querySelector(".landing__visual");
    if (!img || !visual) return;
    const markEmpty = () => {
      visual.classList.add("landing__visual--empty");
      img.remove();
    };
    img.addEventListener("error", markEmpty);
    if (img.complete && img.naturalWidth === 0) markEmpty();
  }

  function bootstrap() {
    applyContent();
    bindLandingImage();
    $("#startButton").addEventListener("click", showApp);
    $("#btnExplore").addEventListener("click", () => setMode("explore"));
    $("#btnShade").addEventListener("click", () => setMode("shade"));
    $("#btnTwo").addEventListener("click", () => setSetCount(2));
    $("#btnThree").addEventListener("click", () => setSetCount(3));
    $("#writeToggle").addEventListener("change", (event) => setShowResult(event.target.checked));
    $("#resetButton").addEventListener("click", clearShading);
    $("#exprBackspace").addEventListener("click", popToken);
    $("#exprClear").addEventListener("click", clearTokens);
    $("#shadeApplyBtn").addEventListener("click", applyShadeFromExpression);
    bindCanvas();
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
