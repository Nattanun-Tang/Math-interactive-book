(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const UNIVERSE = {
    numbers: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    letters: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]
  };

  const DEFAULT_SETS = {
    numbers: {
      A: ["1", "2", "5"],
      B: ["4", "5", "8"],
      C: ["3", "4", "5", "8"]
    },
    letters: {
      A: ["a", "b", "e"],
      B: ["d", "e", "h"],
      C: ["c", "d", "e", "h"]
    }
  };

  const MAX_EXPR_TOKENS = 24;

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
    mode: "study",
    setCount: 2,
    memberType: "numbers",
    operation: "union",
    sets: {
      A: new Set(DEFAULT_SETS.numbers.A),
      B: new Set(DEFAULT_SETS.numbers.B),
      C: new Set(DEFAULT_SETS.numbers.C)
    },
    variantId: null,
    tokens: [],
    exprError: false,
    exprResultLatex: null
  };

  let errorTimer = null;

  function t() {
    return window.CONTENT?.th;
  }

  function universe() {
    return UNIVERSE[state.memberType];
  }

  function setNamesFor(setCount) {
    return setCount === 3 ? ["A", "B", "C"] : ["A", "B"];
  }

  function activeSetNames() {
    return setNamesFor(state.setCount);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function katexHtml(latex, displayMode = false) {
    if (typeof katex === "undefined" || typeof katex.renderToString !== "function") {
      return escapeHtml(latex);
    }
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode
    });
  }

  function renderLatex(el, latex) {
    if (!el) return;
    el.innerHTML = katexHtml(latex);
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

  function sortMembers(members) {
    const order = universe();
    const rank = new Map(order.map((m, i) => [m, i]));
    return [...members].sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0));
  }

  function formatSetLatex(name, members) {
    const sorted = sortMembers(members);
    return `${name} = \\{${sorted.join(", ")}\\}`;
  }

  function setDifference(left, right) {
    return new Set([...left].filter((x) => !right.has(x)));
  }

  function setUnion(...sets) {
    const out = new Set();
    sets.forEach((s) => s.forEach((x) => out.add(x)));
    return out;
  }

  function setIntersection(...sets) {
    if (!sets.length) return new Set();
    return new Set([...sets[0]].filter((x) => sets.every((s) => s.has(x))));
  }

  function setComplement(target) {
    return setDifference(new Set(universe()), target);
  }

  function variantsFor(operation, setCount) {
    if (operation === "union") {
      if (setCount === 2) {
        return [{ id: "AUB", label: "A \\cup B", compute: () => setUnion(state.sets.A, state.sets.B) }];
      }
      return [
        { id: "AUB", label: "A \\cup B", compute: () => setUnion(state.sets.A, state.sets.B) },
        { id: "AUC", label: "A \\cup C", compute: () => setUnion(state.sets.A, state.sets.C) },
        { id: "BUC", label: "B \\cup C", compute: () => setUnion(state.sets.B, state.sets.C) },
        {
          id: "AUBUC",
          label: "A \\cup B \\cup C",
          compute: () => setUnion(state.sets.A, state.sets.B, state.sets.C)
        }
      ];
    }

    if (operation === "intersection") {
      if (setCount === 2) {
        return [{ id: "AnB", label: "A \\cap B", compute: () => setIntersection(state.sets.A, state.sets.B) }];
      }
      return [
        { id: "AnB", label: "A \\cap B", compute: () => setIntersection(state.sets.A, state.sets.B) },
        { id: "AnC", label: "A \\cap C", compute: () => setIntersection(state.sets.A, state.sets.C) },
        { id: "BnC", label: "B \\cap C", compute: () => setIntersection(state.sets.B, state.sets.C) },
        {
          id: "AnBnC",
          label: "A \\cap B \\cap C",
          compute: () => setIntersection(state.sets.A, state.sets.B, state.sets.C)
        }
      ];
    }

    if (operation === "difference") {
      const names = setNamesFor(setCount);
      const list = [];
      names.forEach((left) => {
        names.forEach((right) => {
          if (left === right) return;
          list.push({
            id: `${left}-${right}`,
            label: `${left} - ${right}`,
            compute: () => setDifference(state.sets[left], state.sets[right])
          });
        });
      });
      return list;
    }

    if (operation === "complement") {
      return setNamesFor(setCount).map((name) => ({
        id: `${name}'`,
        label: `${name}'`,
        compute: () => setComplement(state.sets[name])
      }));
    }

    return [];
  }

  function currentVariants() {
    return variantsFor(state.operation, state.setCount);
  }

  function ensureVariant() {
    const variants = currentVariants();
    if (!variants.some((v) => v.id === state.variantId)) {
      state.variantId = null;
    }
  }

  function resetDefaultMembers() {
    const defaults = DEFAULT_SETS[state.memberType];
    state.sets.A = new Set(defaults.A);
    state.sets.B = new Set(defaults.B);
    state.sets.C = new Set(defaults.C);
  }

  function clearSelectedMembers() {
    state.sets.A = new Set();
    state.sets.B = new Set();
    state.sets.C = new Set();
  }

  function tokensToLatex(tokens) {
    return tokens.map((id) => TOKEN_DEFS[id].latex).join(" ");
  }

  function paletteIds() {
    const ids = ["A", "B"];
    if (state.setCount === 3) ids.push("C");
    ids.push("U", "empty", "union", "inter", "diff", "comp", "lparen", "rparen");
    return ids;
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

  function evalAstToSet(ast) {
    switch (ast.type) {
      case "set":
        if (ast.id === "empty") return new Set();
        if (ast.id === "U") return new Set(universe());
        return new Set(state.sets[ast.id] || []);
      case "comp":
        return setComplement(evalAstToSet(ast.arg));
      case "binop": {
        const left = evalAstToSet(ast.left);
        const right = evalAstToSet(ast.right);
        if (ast.op === "union") return setUnion(left, right);
        if (ast.op === "inter") return setIntersection(left, right);
        if (ast.op === "diff") return setDifference(left, right);
        return new Set();
      }
      default:
        return new Set();
    }
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
      if (c?.ui?.exprInvalid) el.textContent = c.ui.exprInvalid;
      el.hidden = false;
    }
    if (errorTimer) clearTimeout(errorTimer);
    errorTimer = setTimeout(() => {
      hideExprError();
    }, 3200);
  }

  function clearExprResult() {
    state.exprResultLatex = null;
    hideExprError();
  }

  function addToken(id) {
    if (state.tokens.length >= MAX_EXPR_TOKENS) return;
    if (id === "C" && state.setCount !== 3) return;
    state.tokens.push(id);
    clearExprResult();
    renderStudyBuilder();
    renderResult();
  }

  function popToken() {
    if (!state.tokens.length) return;
    state.tokens.pop();
    clearExprResult();
    renderStudyBuilder();
    renderResult();
  }

  function clearTokens() {
    state.tokens = [];
    clearExprResult();
    renderStudyBuilder();
    renderResult();
  }

  function showExpressionResult() {
    const parsed = parseExpression(state.tokens);
    if (!parsed.ok) {
      showExprError();
      state.exprResultLatex = null;
      renderResult();
      return;
    }
    hideExprError();
    const result = sortMembers(evalAstToSet(parsed.ast));
    const exprLatex = tokensToLatex(state.tokens);
    state.exprResultLatex = `${exprLatex} = \\{${result.join(", ")}\\}`;
    renderResult();
  }

  function setMode(mode) {
    if (state.mode === mode) return;
    state.mode = mode;
    if (mode === "study") {
      state.tokens = [];
      clearExprResult();
      ensureVariant();
    } else {
      state.variantId = null;
      clearExprResult();
    }
    renderAll();
  }

  function applyContent() {
    const c = t();
    if (!c) return;

    $("#landingEyebrow").textContent = c.landing.eyebrow;
    $("#landingTitle").textContent = c.landing.title;
    $("#startButton").textContent = c.landing.start;
    $("#appTitle").textContent = c.app.title;

    $("#modeLabel").textContent = c.ui.modeLabel;
    $("#setCountLabel").textContent = c.ui.setCount;
    $("#memberTypeLabel").textContent = c.ui.memberType;
    $("#operationLabel").textContent = c.ui.operation;

    $$('#modeToggle [data-mode="study"]').forEach((btn) => { btn.textContent = c.ui.study; });
    $$('#modeToggle [data-mode="test"]').forEach((btn) => { btn.textContent = c.ui.test; });
    $$('.ops-controls [data-set-count="2"]').forEach((btn) => { btn.textContent = c.ui.setCount2; });
    $$('.ops-controls [data-set-count="3"]').forEach((btn) => { btn.textContent = c.ui.setCount3; });
    $$('.ops-controls [data-member-type="numbers"]').forEach((btn) => { btn.textContent = c.ui.numbers; });
    $$('.ops-controls [data-member-type="letters"]').forEach((btn) => { btn.textContent = c.ui.letters; });

    const select = $("#operationSelect");
    const ops = [
      ["union", c.operations.union],
      ["intersection", c.operations.intersection],
      ["difference", c.operations.difference],
      ["complement", c.operations.complement]
    ];
    select.innerHTML = ops
      .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
      .join("");
    select.value = state.operation;
  }

  function renderDefinition() {
    const c = t();
    const box = $("#definitionBox");
    if (state.mode !== "study") {
      box.innerHTML = "";
      box.hidden = true;
      return;
    }
    const key = `${state.operation}${state.setCount}`;
    const def = c?.definitions?.[key];
    if (!def) {
      box.innerHTML = "";
      box.hidden = true;
      return;
    }
    box.hidden = false;
    box.innerHTML = `
      <span class="ops-definition__label">${escapeHtml(c.definitionLabel || "บทนิยาม")}</span>
      <div class="ops-definition__body">
        <p class="ops-definition__line">${def.lead}</p>
        <p class="ops-definition__line">${def.symbol}</p>
      </div>
    `;
    renderMath(box);
  }

  function renderHint() {
    const c = t();
    let hint = state.setCount === 3 ? c.ui.hint3 : c.ui.hint2;
    if (state.mode === "test") {
      hint = hint.replace("เลือกการดำเนินการ", "สร้างนิพจน์");
    }
    const clearLabel = escapeHtml(c.ui.clearMembers || "ล้าง");
    const box = $("#memberHint");
    box.innerHTML = `
      <span class="ops-hint__text">${escapeHtml(hint)}</span>
      <button id="clearMembersBtn" class="stage-reset" type="button" aria-label="${clearLabel}" title="${clearLabel}">
        <svg class="stage-reset__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
          <path d="M21 12a9 9 0 1 1-3-6.7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M21 3v6h-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    `;
    renderMath(box);
  }

  function renderMemberPanel() {
    const c = t();
    const panel = $("#memberPanel");
    const members = universe();
    const rows = [
      { key: "U", label: c.ui.universal, locked: true },
      ...activeSetNames().map((name) => ({
        key: name,
        label: c.ui.membersOf.replaceAll("NAME", name),
        locked: false
      }))
    ];

    panel.innerHTML = rows.map((row) => {
      const selected = row.locked
        ? new Set(members)
        : state.sets[row.key];
      const chips = members.map((m) => {
        const on = selected.has(m);
        const disabled = row.locked ? "disabled aria-disabled=\"true\"" : "";
        return `<button type="button" class="member-chip${on ? " is-on" : ""}" data-set="${escapeHtml(row.key)}" data-member="${escapeHtml(m)}" ${disabled}>${escapeHtml(m)}</button>`;
      }).join("");

      const latex = formatSetLatex(row.key, selected);
      return `
        <div class="member-row${row.locked ? " member-row--locked" : ""}" data-row="${escapeHtml(row.key)}">
          <div class="member-row__label">${escapeHtml(row.label)}</div>
          <div class="member-row__chips" role="group" aria-label="${escapeHtml(row.key)}">${chips}</div>
          <div class="member-row__set">${katexHtml(latex)}</div>
        </div>
      `;
    }).join("");
    renderMath(panel);
  }

  function renderVariants() {
    const panel = $("#variantPanel");
    if (state.mode !== "study") {
      panel.innerHTML = "";
      panel.hidden = true;
      return;
    }
    ensureVariant();
    const variants = currentVariants();
    panel.hidden = false;
    panel.innerHTML = variants.map((v) => {
      const checked = v.id === state.variantId;
      return `
        <label class="ops-variant">
          <input type="checkbox" name="opsVariant" value="${escapeHtml(v.id)}" ${checked ? "checked" : ""}>
          <span class="ops-variant__math">${katexHtml(v.label)}</span>
        </label>
      `;
    }).join("");
  }

  function renderStudyBuilder() {
    const builder = $("#studyBuilder");
    const c = t();
    if (state.mode !== "test") {
      builder.hidden = true;
      return;
    }
    builder.hidden = false;

    $("#tilesLabel").textContent = c.ui.tilesLabel;
    $("#exprLabel").textContent = c.ui.exprLabel;
    $("#exprBackspace").setAttribute("aria-label", c.ui.exprBackspace);
    $("#exprBackspace").title = c.ui.exprBackspace;
    $("#exprClear").setAttribute("aria-label", c.ui.exprClear);
    $("#exprClear").title = c.ui.exprClear;
    $("#exprShowBtn").textContent = c.ui.exprShow;
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

  function renderResult() {
    const box = $("#resultBox");

    if (state.mode === "test") {
      if (!state.exprResultLatex) {
        box.innerHTML = "";
        return;
      }
      box.innerHTML = katexHtml(state.exprResultLatex);
      return;
    }

    const variants = currentVariants();
    const variant = variants.find((v) => v.id === state.variantId);
    if (!variant) {
      box.innerHTML = "";
      return;
    }
    const result = sortMembers(variant.compute());
    const latex = `${variant.label} = \\{${result.join(", ")}\\}`;
    box.innerHTML = katexHtml(latex);
  }

  function renderModeChrome() {
    const study = state.mode === "study";
    $$("#modeToggle [data-mode]").forEach((btn) => {
      const on = btn.dataset.mode === state.mode;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    $("#operationControl").hidden = !study;
    $("#appLayout").classList.toggle("is-study-mode", study);
    $("#appLayout").classList.toggle("is-test-mode", !study);
  }

  function renderAll() {
    renderModeChrome();

    $$(".ops-controls [data-set-count]").forEach((btn) => {
      btn.classList.toggle("is-active", Number(btn.dataset.setCount) === state.setCount);
    });
    $$(".ops-controls [data-member-type]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.memberType === state.memberType);
    });
    $("#operationSelect").value = state.operation;

    renderDefinition();
    renderHint();
    renderMemberPanel();
    renderVariants();
    renderStudyBuilder();
    renderResult();
  }

  function showApp() {
    $("#landingPage").hidden = true;
    $("#landingPage").classList.remove("view--active");
    $("#appPage").hidden = false;
    $("#appPage").classList.add("view--active");
    $("#appTitle")?.focus();
  }

  function bindEvents() {
    $("#startButton")?.addEventListener("click", showApp);

    $$("#modeToggle [data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => setMode(btn.dataset.mode));
    });

    $$(".ops-controls [data-set-count]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = Number(btn.dataset.setCount);
        if (state.setCount === next) return;
        state.setCount = next;
        if (state.mode === "test") {
          state.tokens = state.tokens.filter((id) => id !== "C");
          clearExprResult();
        } else {
          ensureVariant();
        }
        renderAll();
      });
    });

    $$(".ops-controls [data-member-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.memberType === state.memberType) return;
        state.memberType = btn.dataset.memberType;
        resetDefaultMembers();
        if (state.mode === "test") clearExprResult();
        else ensureVariant();
        renderAll();
      });
    });

    $("#operationSelect")?.addEventListener("change", (e) => {
      state.operation = e.target.value;
      ensureVariant();
      renderAll();
    });

    $("#memberHint")?.addEventListener("click", (e) => {
      if (!e.target.closest("#clearMembersBtn")) return;
      clearSelectedMembers();
      if (state.mode === "test") clearExprResult();
      renderMemberPanel();
      renderResult();
    });

    $("#memberPanel")?.addEventListener("click", (e) => {
      const chip = e.target.closest(".member-chip");
      if (!chip || chip.disabled) return;
      const setName = chip.dataset.set;
      const member = chip.dataset.member;
      if (!state.sets[setName]) return;
      if (state.sets[setName].has(member)) state.sets[setName].delete(member);
      else state.sets[setName].add(member);
      if (state.mode === "test") clearExprResult();
      renderMemberPanel();
      renderResult();
    });

    $("#variantPanel")?.addEventListener("change", (e) => {
      const input = e.target.closest('input[name="opsVariant"]');
      if (!input) return;
      if (!input.checked) {
        state.variantId = null;
        renderResult();
        return;
      }
      state.variantId = input.value;
      $$('#variantPanel input[name="opsVariant"]').forEach((el) => {
        el.checked = el === input;
      });
      renderResult();
    });

    $("#exprBackspace")?.addEventListener("click", popToken);
    $("#exprClear")?.addEventListener("click", clearTokens);
    $("#exprShowBtn")?.addEventListener("click", showExpressionResult);
  }

  function bootstrap() {
    if (!t()) return;
    applyContent();
    ensureVariant();
    bindEvents();
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
