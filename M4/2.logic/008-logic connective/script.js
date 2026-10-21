(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const MAX_EXPR_TOKENS = 24;

  const TOKEN_DEFS = {
    p: { id: "p", kind: "atom", label: "p", latex: "p" },
    q: { id: "q", kind: "atom", label: "q", latex: "q" },
    r: { id: "r", kind: "atom", label: "r", latex: "r" },
    s: { id: "s", kind: "atom", label: "s", latex: "s" },
    t: { id: "t", kind: "atom", label: "t", latex: "t" },
    and: { id: "and", kind: "binop", label: "∧", latex: "\\land", prec: 4 },
    or: { id: "or", kind: "binop", label: "∨", latex: "\\lor", prec: 3 },
    implies: { id: "implies", kind: "binop", label: "→", latex: "\\rightarrow", prec: 2 },
    iff: { id: "iff", kind: "binop", label: "↔", latex: "\\leftrightarrow", prec: 1 },
    not: { id: "not", kind: "unary", label: "~", latex: "\\sim" },
    lparen: { id: "lparen", kind: "paren", label: "(", latex: "(", closer: "rparen" },
    rparen: { id: "rparen", kind: "paren", label: ")", latex: ")" },
    lbrack: { id: "lbrack", kind: "paren", label: "[", latex: "[", closer: "rbrack" },
    rbrack: { id: "rbrack", kind: "paren", label: "]", latex: "]" }
  };

  const PALETTE_IDS = [
    "p", "q", "r", "s", "t",
    "and", "or", "implies", "iff", "not",
    "lparen", "rparen", "lbrack", "rbrack"
  ];
  const OPEN_PARENS = new Set(["lparen", "lbrack"]);
  const CLOSE_PARENS = new Set(["rparen", "rbrack"]);

  const state = {
    mode: "study",
    connective: "and",
    tokens: [],
    exprError: false,
    exercise: null,
    checkPopup: false
  };

  let errorTimer = null;
  let popupTimer = null;
  let nodeSeq = 0;

  function t() {
    return window.CONTENT?.th;
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

  function nextNodeId() {
    nodeSeq += 1;
    return `n${nodeSeq}`;
  }

  function parenthesesComplete(tokenIds) {
    const stack = [];
    for (const id of tokenIds) {
      if (OPEN_PARENS.has(id)) {
        stack.push(TOKEN_DEFS[id].closer);
      } else if (CLOSE_PARENS.has(id)) {
        if (!stack.length || stack.pop() !== id) return false;
      }
    }
    return stack.length === 0;
  }

  function matchingCloser(tokenIds, openIndex) {
    const openId = tokenIds[openIndex];
    const closer = TOKEN_DEFS[openId]?.closer;
    if (!closer) return -1;
    const stack = [];
    for (let i = openIndex; i < tokenIds.length; i += 1) {
      const id = tokenIds[i];
      if (OPEN_PARENS.has(id)) {
        stack.push(TOKEN_DEFS[id].closer);
      } else if (CLOSE_PARENS.has(id)) {
        if (!stack.length || stack.pop() !== id) return -1;
        if (!stack.length) return i;
      }
    }
    return -1;
  }

  // นับ (...) / [...] เป็น 1 ประพจน์ — ที่ระดับเดียวกันใช้ตัวเชื่อมต่างชนิดไม่ได้
  // ตัวเชื่อมซ้ำได้เฉพาะ ∧ หรือ ∨ เท่านั้น (→ ↔ ต้องจัดกลุ่มให้เหลือตัวเชื่อมระดับนั้นแค่ 1 ตัว)
  function levelConnectivesOk(tokenIds, start = 0, end = tokenIds.length) {
    const binops = [];
    let i = start;
    while (i < end) {
      const id = tokenIds[i];
      if (OPEN_PARENS.has(id)) {
        const close = matchingCloser(tokenIds, i);
        if (close < 0 || close >= end) return false;
        if (!levelConnectivesOk(tokenIds, i + 1, close)) return false;
        i = close + 1;
        continue;
      }
      if (CLOSE_PARENS.has(id)) return false;
      if (TOKEN_DEFS[id]?.kind === "binop") binops.push(id);
      i += 1;
    }

    if (binops.length <= 1) return true;
    const first = binops[0];
    if (!binops.every((id) => id === first)) return false;
    return first === "and" || first === "or";
  }

  function parseExpression(tokenIds) {
    if (!tokenIds.length) return { ok: false };
    if (!parenthesesComplete(tokenIds)) return { ok: false };
    if (!levelConnectivesOk(tokenIds)) return { ok: false };

    if (tokenIds.some((id) => !TOKEN_DEFS[id])) return { ok: false };

    const tokens = tokenIds.map((id, index) => ({ ...TOKEN_DEFS[id], index }));
    let i = 0;
    nodeSeq = 0;

    function peek() {
      return tokens[i] || null;
    }

    function consume() {
      return tokens[i++] || null;
    }

    function parseExpr(minPrec = 0) {
      let left = parseUnary();
      if (!left) return null;

      while (true) {
        const op = peek();
        if (!op || op.kind !== "binop" || op.prec < minPrec) break;
        consume();
        const right = parseExpr(op.prec + 1);
        if (!right) return null;
        left = {
          type: "binop",
          id: nextNodeId(),
          op: op.id,
          tokenIndex: op.index,
          left,
          right,
          depth: Math.max(left.depth, right.depth) + 1
        };
      }
      return left;
    }

    function parseUnary() {
      const tok = peek();
      if (tok && tok.id === "not") {
        consume();
        const arg = parseUnary();
        if (!arg) return null;
        return {
          type: "not",
          id: nextNodeId(),
          tokenIndex: tok.index,
          arg,
          depth: arg.depth + 1
        };
      }
      return parsePrimary();
    }

    function parsePrimary() {
      const tok = peek();
      if (!tok) return null;

      if (tok.kind === "atom") {
        consume();
        return {
          type: "atom",
          id: nextNodeId(),
          name: tok.id,
          tokenIndex: tok.index,
          depth: 0
        };
      }

      if (OPEN_PARENS.has(tok.id)) {
        const closer = tok.closer;
        consume();
        const inner = parseExpr(0);
        if (!inner) return null;
        if (!peek() || peek().id !== closer) return null;
        consume();
        return inner;
      }

      return null;
    }

    const ast = parseExpr(0);
    if (!ast || i !== tokens.length) return { ok: false };
    return { ok: true, ast, tokens: tokenIds.slice() };
  }

  function collectAtoms(ast, out = new Set()) {
    if (!ast) return out;
    if (ast.type === "atom") out.add(ast.name);
    else if (ast.type === "not") collectAtoms(ast.arg, out);
    else if (ast.type === "binop") {
      collectAtoms(ast.left, out);
      collectAtoms(ast.right, out);
    }
    return out;
  }

  function evalNode(ast, assignment) {
    if (ast.type === "atom") return assignment[ast.name];
    if (ast.type === "not") {
      const v = evalNode(ast.arg, assignment);
      return v == null ? null : !v;
    }
    const left = evalNode(ast.left, assignment);
    const right = evalNode(ast.right, assignment);
    if (left == null || right == null) return null;
    if (ast.op === "and") return left && right;
    if (ast.op === "or") return left || right;
    if (ast.op === "implies") return !left || right;
    if (ast.op === "iff") return left === right;
    return null;
  }

  function boolToTF(value) {
    if (value === true) return "T";
    if (value === false) return "F";
    return "-";
  }

  function cycleTruth(current) {
    if (current == null || current === "-") return "T";
    if (current === "T") return "F";
    return "T";
  }

  function tfToBool(value) {
    if (value === "T") return true;
    if (value === "F") return false;
    return null;
  }

  function walkConnectives(ast, visit) {
    if (!ast) return;
    if (ast.type === "not") {
      walkConnectives(ast.arg, visit);
      visit(ast);
    } else if (ast.type === "binop") {
      walkConnectives(ast.left, visit);
      walkConnectives(ast.right, visit);
      visit(ast);
    }
  }

  function maxDepth(ast) {
    return ast ? ast.depth : 0;
  }

  function clearExercise() {
    state.exercise = null;
    hideCheckPopup();
  }

  function resetExerciseTruths() {
    const ex = state.exercise;
    if (!ex) return;
    ex.atoms.forEach((name) => {
      ex.assignment[name] = "-";
    });
    Object.keys(ex.answers).forEach((id) => {
      ex.answers[id] = "-";
    });
    ex.feedback = {};
    hideCheckPopup();
    renderExercise();
  }

  function treeColumnTemplate(tokens) {
    return tokens
      .map((id) => (TOKEN_DEFS[id]?.kind === "paren" ? "0px" : "minmax(56px, 1fr)"))
      .join(" ");
  }

  function symbolLatexForColumn(tokens, index, consumedParens) {
    const id = tokens[index];
    if (!id || TOKEN_DEFS[id]?.kind === "paren") return null;

    const parts = [];
    let j = index - 1;
    const prefix = [];
    while (j >= 0 && OPEN_PARENS.has(tokens[j]) && !consumedParens.has(j)) {
      prefix.push(j);
      j -= 1;
    }
    prefix.reverse().forEach((pi) => {
      consumedParens.add(pi);
      parts.push(TOKEN_DEFS[tokens[pi]].latex);
    });

    parts.push(TOKEN_DEFS[id].latex);

    j = index + 1;
    while (j < tokens.length && CLOSE_PARENS.has(tokens[j]) && !consumedParens.has(j)) {
      consumedParens.add(j);
      parts.push(TOKEN_DEFS[tokens[j]].latex);
      j += 1;
    }

    return parts.join("");
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
    errorTimer = setTimeout(() => hideExprError(), 3200);
  }

  function hideCheckPopup() {
    state.checkPopup = false;
    if (popupTimer) {
      clearTimeout(popupTimer);
      popupTimer = null;
    }
    const el = $("#checkPopup");
    if (el) el.hidden = true;
  }

  function showCheckPopup() {
    state.checkPopup = true;
    const el = $("#checkPopup");
    const c = t();
    if (el) {
      el.textContent = c?.ui?.checkIncomplete || "เติมคำตอบให้ครบถ้วน";
      el.hidden = false;
    }
    if (popupTimer) clearTimeout(popupTimer);
    popupTimer = setTimeout(() => hideCheckPopup(), 2800);
  }

  function buildExercise() {
    const parsed = parseExpression(state.tokens);
    if (!parsed.ok) {
      showExprError();
      clearExercise();
      renderExercise();
      return;
    }
    hideExprError();
    const atoms = [...collectAtoms(parsed.ast)].sort();
    const assignment = {};
    atoms.forEach((name) => {
      assignment[name] = "-";
    });
    const answers = {};
    walkConnectives(parsed.ast, (node) => {
      answers[node.id] = "-";
    });
    state.exercise = {
      tokens: parsed.tokens.slice(),
      ast: parsed.ast,
      atoms,
      assignment,
      answers,
      feedback: {}
    };
    hideCheckPopup();
    renderExercise();
  }

  function currentAssignmentBools() {
    const ex = state.exercise;
    if (!ex) return null;
    const out = {};
    for (const name of ex.atoms) {
      const v = tfToBool(ex.assignment[name]);
      if (v == null) return null;
      out[name] = v;
    }
    return out;
  }

  function expectedAnswers() {
    const ex = state.exercise;
    const assignment = currentAssignmentBools();
    if (!ex || !assignment) return null;
    const expected = {};
    walkConnectives(ex.ast, (node) => {
      expected[node.id] = boolToTF(evalNode(node, assignment));
    });
    return expected;
  }

  function setMode(mode) {
    if (state.mode === mode) return;
    state.mode = mode;
    if (mode === "study") {
      state.tokens = [];
      clearExercise();
      hideExprError();
    } else {
      clearExercise();
    }
    renderAll();
  }

  function applyContent() {
    const c = t();
    if (!c) return;

    const setText = (sel, value) => {
      const el = $(sel);
      if (el && value != null) el.textContent = value;
    };
    const setLabel = (sel, value) => {
      const el = $(sel);
      if (!el || value == null) return;
      el.setAttribute("aria-label", value);
      el.title = value;
    };

    setText("#landingEyebrow", c.landing.eyebrow);
    setText("#landingTitle", c.landing.title);
    setText("#startButton", c.landing.start);
    setText("#appTitle", c.app.title);

    setText("#modeLabel", c.ui.modeLabel);
    setText("#connectiveLabel", c.ui.connectiveLabel);
    $$('#modeToggle [data-mode="study"]').forEach((btn) => { btn.textContent = c.ui.study; });
    $$('#modeToggle [data-mode="test"]').forEach((btn) => { btn.textContent = c.ui.test; });

    const select = $("#connectiveSelect");
    if (select) {
      const options = [
        ["and", c.connectives.and],
        ["or", c.connectives.or],
        ["implies", c.connectives.implies],
        ["iff", c.connectives.iff],
        ["not", c.connectives.not]
      ];
      select.innerHTML = options
        .map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`)
        .join("");
      select.value = state.connective;
    }

    setText("#tilesLabel", c.ui.tilesLabel);
    setText("#exprLabel", c.ui.exprLabel);
    setLabel("#exprBackspace", c.ui.exprBackspace);
    setLabel("#exprClear", c.ui.exprClear);
    setText("#exprShowBtn", c.ui.exprShow);
    setText("#exprError", c.ui.exprInvalid);
    setText("#exerciseHint", c.ui.exerciseHint);
    setLabel("#exerciseReset", c.ui.exerciseReset);
    setText("#checkBtn", c.ui.check);
    setText("#checkPopup", c.ui.checkIncomplete);
  }

  function renderModeChrome() {
    const study = state.mode === "study";
    $$("#modeToggle [data-mode]").forEach((btn) => {
      const on = btn.dataset.mode === state.mode;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });
    const connectiveControl = $("#connectiveControl");
    const studyPanel = $("#studyPanel");
    const testPanel = $("#testPanel");
    const appLayout = $("#appLayout");
    if (connectiveControl) connectiveControl.hidden = !study;
    if (studyPanel) studyPanel.hidden = !study;
    if (testPanel) testPanel.hidden = study;
    if (appLayout) {
      appLayout.classList.toggle("is-study-mode", study);
      appLayout.classList.toggle("is-test-mode", !study);
    }
  }

  function renderStudy() {
    if (state.mode !== "study") return;
    const c = t();
    const data = c?.study?.[state.connective];
    const defBox = $("#definitionBox");
    const table = $("#truthTable");
    const tip = $("#tipBox");
    if (!defBox || !table || !tip) return;

    if (!data) {
      defBox.innerHTML = "";
      table.innerHTML = "";
      tip.textContent = "";
      return;
    }

    defBox.innerHTML = data.definition
      .map((line) => `<p class="study-definition__line">${line}</p>`)
      .join("");

    const head = data.headers
      .map((h) => `<th scope="col">${katexHtml(h)}</th>`)
      .join("");
    const body = data.rows
      .map((row) => `<tr>${row.map((cell) => {
        if (cell === "T" || cell === "F") return `<td>${katexHtml(cell)}</td>`;
        return `<td>${escapeHtml(cell)}</td>`;
      }).join("")}</tr>`)
      .join("");
    table.innerHTML = `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>`;

    tip.textContent = data.tip;
    renderMath(defBox);
  }

  function renderBuilder() {
    if (state.mode !== "test") return;
    const c = t();
    const errorEl = $("#exprError");
    if (errorEl) errorEl.hidden = !state.exprError;

    const palette = $("#tilePalette");
    const line = $("#exprLine");
    if (!palette || !line) return;

    const full = state.tokens.length >= MAX_EXPR_TOKENS;
    palette.innerHTML = "";
    PALETTE_IDS.forEach((id) => {
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

    line.innerHTML = "";
    if (!state.tokens.length) {
      const empty = document.createElement("p");
      empty.className = "expr-line__empty";
      empty.textContent = c?.ui?.exprEmptyHint || "";
      line.appendChild(empty);
    } else {
      state.tokens.forEach((id) => {
        const def = TOKEN_DEFS[id];
        if (!def) return;
        const chip = document.createElement("span");
        chip.className = "expr-chip";
        chip.setAttribute("role", "listitem");
        chip.setAttribute("aria-label", def.label);
        renderLatex(chip, def.latex);
        line.appendChild(chip);
      });
    }
  }

  function truthButton({ value, locked, nodeId, assignName, feedback, tokenIndex }) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "truth-box";
    if (locked) btn.classList.add("truth-box--locked");
    if (feedback === "correct") btn.classList.add("is-correct");
    if (feedback === "wrong") btn.classList.add("is-wrong");
    if (value === "T" || value === "F") {
      renderLatex(btn, value);
    } else {
      btn.textContent = value || "-";
    }
    if (tokenIndex != null) btn.dataset.tokenIndex = String(tokenIndex);
    if (locked) {
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
    } else if (nodeId) {
      btn.dataset.nodeId = nodeId;
    } else if (assignName) {
      btn.dataset.assign = assignName;
    }
    btn.setAttribute("aria-label", `ค่าความจริง ${value || "-"}`);
    return btn;
  }

  function columnCenters(tokenCount, stageWidth) {
    const colW = stageWidth / Math.max(tokenCount, 1);
    return Array.from({ length: tokenCount }, (_, i) => (i + 0.5) * colW);
  }

  function renderExercise() {
    const panel = $("#exercisePanel");
    if (!panel) return;
    const c = t();
    if (state.mode !== "test" || !state.exercise) {
      panel.hidden = true;
      panel.setAttribute("aria-hidden", "true");
      return;
    }
    panel.hidden = false;
    panel.setAttribute("aria-hidden", "false");
    const hint = $("#exerciseHint");
    if (hint && c?.ui?.exerciseHint) hint.textContent = c.ui.exerciseHint;

    const ex = state.exercise;
    const assignRow = $("#assignRow");
    const stage = $("#treeStage");
    if (!assignRow || !stage) return;

    assignRow.innerHTML = "";
    ex.atoms.forEach((name) => {
      const item = document.createElement("div");
      item.className = "assign-item";
      const label = document.createElement("span");
      label.className = "assign-item__label";
      label.innerHTML = (c?.ui?.assignTemplate || "$VAR$").replace(
        "$VAR$",
        katexHtml(name)
      );
      const box = truthButton({
        value: ex.assignment[name],
        locked: false,
        assignName: name
      });
      item.appendChild(label);
      item.appendChild(box);
      assignRow.appendChild(item);
    });

    stage.innerHTML = "";

    const tokens = ex.tokens;
    const depthMax = maxDepth(ex.ast);
    const rowCount = depthMax + 1;
    const colCount = tokens.length;
    const colTemplate = treeColumnTemplate(tokens);
    const symbolRow = document.createElement("div");
    symbolRow.className = "tree-symbols";
    symbolRow.style.gridTemplateColumns = colTemplate;
    const consumedParens = new Set();
    tokens.forEach((id, index) => {
      const cell = document.createElement("div");
      cell.className = "tree-symbol";
      if (OPEN_PARENS.has(id)) {
        cell.classList.add("tree-symbol--lparen");
        cell.setAttribute("aria-hidden", "true");
      } else if (CLOSE_PARENS.has(id)) {
        cell.classList.add("tree-symbol--rparen");
        cell.setAttribute("aria-hidden", "true");
      } else {
        const latex = symbolLatexForColumn(tokens, index, consumedParens);
        renderLatex(cell, latex ?? TOKEN_DEFS[id].latex);
      }
      symbolRow.appendChild(cell);
    });
    stage.appendChild(symbolRow);

    const nodeByToken = new Map();
    function indexNodes(node) {
      if (!node) return;
      if (node.type === "atom" || node.type === "not" || node.type === "binop") {
        nodeByToken.set(node.tokenIndex, node);
      }
      if (node.type === "not") indexNodes(node.arg);
      if (node.type === "binop") {
        indexNodes(node.left);
        indexNodes(node.right);
      }
    }
    indexNodes(ex.ast);

    const body = document.createElement("div");
    body.className = "tree-body";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "tree-lines");
    svg.setAttribute("aria-hidden", "true");
    body.appendChild(svg);

    const layers = document.createElement("div");
    layers.className = "tree-layers";
    layers.style.gridTemplateColumns = colTemplate;
    layers.style.gridTemplateRows = `repeat(${rowCount}, 72px)`;

    for (let d = 0; d < rowCount; d += 1) {
      for (let col = 0; col < colCount; col += 1) {
        const slot = document.createElement("div");
        slot.className = "tree-slot";
        slot.style.gridColumn = String(col + 1);
        slot.style.gridRow = String(d + 1);

        const node = nodeByToken.get(col);
        if (node && node.depth === d) {
          if (node.type === "atom") {
            slot.appendChild(truthButton({
              value: ex.assignment[node.name],
              locked: true,
              tokenIndex: node.tokenIndex
            }));
          } else {
            slot.appendChild(truthButton({
              value: ex.answers[node.id],
              locked: false,
              nodeId: node.id,
              feedback: ex.feedback[node.id],
              tokenIndex: node.tokenIndex
            }));
          }
        }
        layers.appendChild(slot);
      }
    }
    body.appendChild(layers);
    stage.appendChild(body);

    requestAnimationFrame(() => {
      drawTreeLines(body, svg, ex.ast, colCount);
      // Layout can settle a frame later (fonts/KaTeX); redraw once more.
      requestAnimationFrame(() => drawTreeLines(body, svg, ex.ast, colCount));
    });

    const popup = $("#checkPopup");
    if (popup) popup.hidden = !state.checkPopup;
  }

  function drawTreeLines(body, svg, ast, colCount) {
    const layers = body.querySelector(".tree-layers");
    if (!layers) return;
    const rect = layers.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    svg.setAttribute("width", String(rect.width));
    svg.setAttribute("height", String(rect.height));
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    function pointFor(node) {
      const el = layers.querySelector(`[data-token-index="${node.tokenIndex}"]`);
      if (el) {
        const box = el.getBoundingClientRect();
        return {
          x: box.left + box.width / 2 - rect.left,
          y: box.top + box.height / 2 - rect.top,
          halfH: box.height / 2
        };
      }
      const centers = columnCenters(colCount || 1, rect.width);
      return {
        x: centers[node.tokenIndex] || 0,
        y: (node.depth + 0.5) * 72,
        halfH: 24
      };
    }

    function strokePath(d) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#4a647c");
      path.setAttribute("stroke-width", "2.25");
      path.setAttribute("stroke-linecap", "square");
      path.setAttribute("stroke-linejoin", "miter");
      svg.appendChild(path);
    }

    function connectUnary(parent, child) {
      const a = pointFor(child);
      const b = pointFor(parent);
      const childBottom = a.y + a.halfH;
      const parentTop = b.y - b.halfH;
      // ~ sits in its own column; operand often differs — need an elbow, not a lone vertical.
      if (Math.abs(a.x - b.x) < 0.5) {
        strokePath(`M ${a.x} ${childBottom} V ${parentTop}`);
        return;
      }
      const joinY = Math.max(parentTop - 10, childBottom + 8);
      strokePath(`M ${a.x} ${childBottom} V ${joinY}`);
      strokePath(`M ${a.x} ${joinY} H ${b.x}`);
      strokePath(`M ${b.x} ${joinY} V ${parentTop}`);
    }

    function connectBinary(parent, left, right) {
      const p = pointFor(parent);
      const L = pointFor(left);
      const R = pointFor(right);
      const joinY = Math.max(
        p.y - p.halfH - 10,
        L.y + L.halfH + 8,
        R.y + R.halfH + 8
      );
      const x1 = Math.min(L.x, R.x, p.x);
      const x2 = Math.max(L.x, R.x, p.x);
      strokePath(`M ${L.x} ${L.y + L.halfH} V ${joinY}`);
      strokePath(`M ${R.x} ${R.y + R.halfH} V ${joinY}`);
      strokePath(`M ${x1} ${joinY} H ${x2}`);
      strokePath(`M ${p.x} ${joinY} V ${p.y - p.halfH}`);
    }

    function walk(node) {
      if (!node) return;
      if (node.type === "not") {
        walk(node.arg);
        connectUnary(node, node.arg);
      } else if (node.type === "binop") {
        walk(node.left);
        walk(node.right);
        connectBinary(node, node.left, node.right);
      }
    }
    walk(ast);
  }

  function addToken(id) {
    if (state.tokens.length >= MAX_EXPR_TOKENS) return;
    state.tokens.push(id);
    clearExercise();
    hideExprError();
    renderBuilder();
    renderExercise();
  }

  function popToken() {
    if (!state.tokens.length) return;
    state.tokens.pop();
    clearExercise();
    hideExprError();
    renderBuilder();
    renderExercise();
  }

  function clearTokens() {
    state.tokens = [];
    clearExercise();
    hideExprError();
    renderBuilder();
    renderExercise();
  }

  function onTruthClick(target) {
    const ex = state.exercise;
    if (!ex) return;

    if (target.dataset.assign) {
      const name = target.dataset.assign;
      ex.assignment[name] = cycleTruth(ex.assignment[name]);
      ex.feedback = {};
      hideCheckPopup();
      renderExercise();
      return;
    }

    if (target.dataset.nodeId) {
      const id = target.dataset.nodeId;
      ex.answers[id] = cycleTruth(ex.answers[id]);
      if (ex.feedback[id]) delete ex.feedback[id];
      hideCheckPopup();
      renderExercise();
    }
  }

  function checkAnswers() {
    const ex = state.exercise;
    if (!ex) return;

    const assignmentReady = ex.atoms.every((name) => ex.assignment[name] === "T" || ex.assignment[name] === "F");
    const answersReady = Object.values(ex.answers).every((v) => v === "T" || v === "F");
    if (!assignmentReady || !answersReady) {
      showCheckPopup();
      return;
    }

    hideCheckPopup();
    const expected = expectedAnswers();
    if (!expected) {
      showCheckPopup();
      return;
    }

    ex.feedback = {};
    Object.keys(ex.answers).forEach((id) => {
      ex.feedback[id] = ex.answers[id] === expected[id] ? "correct" : "wrong";
    });
    renderExercise();
  }

  function renderAll() {
    renderModeChrome();
    const select = $("#connectiveSelect");
    if (select) select.value = state.connective;
    renderStudy();
    renderBuilder();
    renderExercise();
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
    }
    $("#appTitle")?.focus();
  }

  function bindEvents() {
    $("#startButton")?.addEventListener("click", showApp);

    $$("#modeToggle [data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => setMode(btn.dataset.mode));
    });

    $("#connectiveSelect")?.addEventListener("change", (e) => {
      state.connective = e.target.value;
      renderStudy();
    });

    $("#exprBackspace")?.addEventListener("click", popToken);
    $("#exprClear")?.addEventListener("click", clearTokens);
    $("#exprShowBtn")?.addEventListener("click", buildExercise);
    $("#exerciseReset")?.addEventListener("click", resetExerciseTruths);
    $("#checkBtn")?.addEventListener("click", checkAnswers);

    const onTruthBoxClick = (e) => {
      const btn = e.target.closest(".truth-box");
      if (!btn || btn.disabled) return;
      onTruthClick(btn);
    };
    $("#assignRow")?.addEventListener("click", onTruthBoxClick);
    $("#treeStage")?.addEventListener("click", onTruthBoxClick);

    window.addEventListener("resize", () => {
      if (!state.exercise) return;
      const body = $("#treeStage")?.querySelector(".tree-body");
      const svg = body?.querySelector(".tree-lines");
      if (body && svg) {
        drawTreeLines(body, svg, state.exercise.ast, state.exercise.tokens.length);
      }
    });
  }

  function bootstrap() {
    if (!t()) return;
    applyContent();
    bindEvents();
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
