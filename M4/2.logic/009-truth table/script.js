(() => {
  const $ = (selector, root = document) => root.querySelector(selector);

  const MAX_EXPR_TOKENS = 24;
  const MAX_ATOMS = 4;

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
  const ATOM_ORDER = ["p", "q", "r", "s", "t"];

  const state = {
    tokens: [],
    exprError: false,
    errorMessage: "",
    table: null,
    highlightCol: null,
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
        const wrapStyle = tok.id === "lbrack" ? "brack" : "paren";
        consume();
        const inner = parseExpr(0);
        if (!inner) return null;
        if (!peek() || peek().id !== closer) return null;
        consume();
        return { ...inner, wrapped: true, wrapStyle };
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
    return value ? "T" : "F";
  }

  function cycleTruth(current) {
    if (current == null || current === "") return "T";
    if (current === "T") return "F";
    return "T";
  }

  function opLatex(op) {
    return TOKEN_DEFS[op]?.latex || op;
  }

  function needsParensAsChild(node, parentOp, side) {
    if (!node || node.type === "atom" || node.type === "not") return false;
    if (node.type !== "binop" || !parentOp) return false;
    const childPrec = TOKEN_DEFS[node.op]?.prec ?? 0;
    const parentPrec = TOKEN_DEFS[parentOp]?.prec ?? 0;
    if (childPrec < parentPrec) return true;
    if (childPrec > parentPrec) return false;
    return side === "right";
  }

  function wrapDelims(style) {
    return style === "brack" ? ["[", "]"] : ["(", ")"];
  }

  function latexOf(node, parentOp = null, side = null) {
    if (!node) return "";
    if (node.type === "atom") return TOKEN_DEFS[node.name]?.latex || node.name;

    if (node.type === "not") {
      const arg = node.arg;
      const inner = latexOf(arg, "not", "arg");
      if (arg.type === "binop" && !arg.wrapped) return `\\sim(${inner})`;
      return `\\sim ${inner}`;
    }

    if (node.type === "binop") {
      const renderChild = (child, childSide) => {
        const raw = latexOf({ ...child, wrapped: false, wrapStyle: null }, null, null);
        if (child.wrapped || needsParensAsChild(child, node.op, childSide)) {
          const [open, close] = wrapDelims(child.wrapped ? child.wrapStyle : "paren");
          return `${open}${raw}${close}`;
        }
        return raw;
      };
      const body = `${renderChild(node.left, "left")} ${opLatex(node.op)} ${renderChild(node.right, "right")}`;
      if (parentOp && (node.wrapped || needsParensAsChild(node, parentOp, side))) {
        const [open, close] = wrapDelims(node.wrapped ? node.wrapStyle : "paren");
        return `${open}${body}${close}`;
      }
      return body;
    }
    return "";
  }

  function collectColumns(ast) {
    const atomNames = [...collectAtoms(ast)].sort(
      (a, b) => ATOM_ORDER.indexOf(a) - ATOM_ORDER.indexOf(b)
    );
    const columns = [];
    const atomIndex = new Map();

    atomNames.forEach((name) => {
      const col = {
        key: `atom:${name}`,
        kind: "atom",
        name,
        latex: TOKEN_DEFS[name].latex,
        node: null,
        deps: []
      };
      atomIndex.set(name, columns.length);
      columns.push(col);
    });

    const nodeIndex = new Map();

    function visit(node) {
      if (!node) return -1;
      if (node.type === "atom") return atomIndex.get(node.name);

      if (node.type === "not") {
        const argCol = visit(node.arg);
        if (nodeIndex.has(node.id)) return nodeIndex.get(node.id);
        const colIndex = columns.length;
        nodeIndex.set(node.id, colIndex);
        columns.push({
          key: node.id,
          kind: "compound",
          latex: latexOf(node),
          node,
          deps: argCol >= 0 ? [argCol] : []
        });
        return colIndex;
      }

      if (node.type === "binop") {
        const leftCol = visit(node.left);
        const rightCol = visit(node.right);
        if (nodeIndex.has(node.id)) return nodeIndex.get(node.id);
        const colIndex = columns.length;
        nodeIndex.set(node.id, colIndex);
        const deps = [];
        if (leftCol >= 0) deps.push(leftCol);
        if (rightCol >= 0) deps.push(rightCol);
        columns.push({
          key: node.id,
          kind: "compound",
          latex: latexOf(node),
          node,
          deps
        });
        return colIndex;
      }
      return -1;
    }

    visit(ast);
    return { columns, atomNames };
  }
 
  function generateAssignments(atomNames) {
    const n = atomNames.length;
    const rows = 1 << n;
    const assignments = [];
    for (let i = 0; i < rows; i += 1) {
      const row = {};
      for (let a = 0; a < n; a += 1) {
        // MSB = first atom (p), like TTTTFFFF for 3 vars
        const bit = (i >> (n - 1 - a)) & 1;
        row[atomNames[a]] = bit === 0;
      }
      assignments.push(row);
    }
    return assignments;
  }

  function expectedMatrix(columns, assignments) {
    return assignments.map((assignment) =>
      columns.map((col) => {
        if (col.kind === "atom") return boolToTF(assignment[col.name]);
        return boolToTF(evalNode(col.node, assignment));
      })
    );
  }

  function hideExprError() {
    state.exprError = false;
    state.errorMessage = "";
    if (errorTimer) {
      clearTimeout(errorTimer);
      errorTimer = null;
    }
    const el = $("#exprError");
    if (el) el.hidden = true;
  }

  function showExprError(message) {
    state.exprError = true;
    state.errorMessage = message || t()?.ui?.exprInvalid || "";
    const el = $("#exprError");
    if (el) {
      el.textContent = state.errorMessage;
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

  function clearTable() {
    state.table = null;
    state.highlightCol = null;
    hideCheckPopup();
  }

  function buildTable() {
    const parsed = parseExpression(state.tokens);
    if (!parsed.ok) {
      showExprError(t()?.ui?.exprInvalid);
      clearTable();
      renderTable();
      return;
    }

    const { columns, atomNames } = collectColumns(parsed.ast);
    if (atomNames.length > MAX_ATOMS) {
      showExprError(t()?.ui?.exprTooManyAtoms);
      clearTable();
      renderTable();
      return;
    }

    hideExprError();
    const assignments = generateAssignments(atomNames);
    const expected = expectedMatrix(columns, assignments);
    const answers = expected.map((row) =>
      row.map((val, colIndex) => (columns[colIndex].kind === "atom" ? val : ""))
    );
    const feedback = expected.map((row) => Array(row.length).fill(null));

    state.table = {
      tokens: parsed.tokens.slice(),
      ast: parsed.ast,
      columns,
      atomNames,
      assignments,
      expected,
      answers,
      feedback
    };
    state.highlightCol = null;
    hideCheckPopup();
    renderTable();
  }

  function resetTableAnswers() {
    const table = state.table;
    if (!table) return;
    table.answers = table.expected.map((row) =>
      row.map((val, c) => (table.columns[c].kind === "atom" ? val : ""))
    );
    table.feedback = table.expected.map((row) => Array(row.length).fill(null));
    state.highlightCol = null;
    hideCheckPopup();
    renderTable();
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
    setText("#tilesLabel", c.ui.tilesLabel);
    setText("#exprLabel", c.ui.exprLabel);
    setLabel("#exprBackspace", c.ui.exprBackspace);
    setLabel("#exprClear", c.ui.exprClear);
    setText("#exprShowBtn", c.ui.exprShow);
    setText("#exprError", c.ui.exprInvalid);
    setText("#tableHint", c.ui.tableHint);
    setLabel("#tableReset", c.ui.tableReset);
    setText("#checkBtn", c.ui.check);
    setText("#revealBtn", c.ui.reveal);
    setText("#checkPopup", c.ui.checkIncomplete);
  }

  function renderBuilder() {
    const c = t();
    const errorEl = $("#exprError");
    if (errorEl) {
      errorEl.hidden = !state.exprError;
      if (state.exprError && state.errorMessage) {
        errorEl.textContent = state.errorMessage;
      }
    }

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
      btn.dataset.token = id;
      btn.setAttribute("aria-label", def.label);
      btn.disabled = full;
      renderLatex(btn, def.latex);
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

  function highlightSet(colIndex) {
    const table = state.table;
    if (!table || colIndex == null) return new Set();
    const col = table.columns[colIndex];
    if (!col || col.kind !== "compound") return new Set();
    return new Set([colIndex, ...col.deps]);
  }

  function renderTable() {
    const panel = $("#tablePanel");
    const tableEl = $("#truthTable");
    if (!panel || !tableEl) return;

    if (!state.table) {
      panel.hidden = true;
      panel.setAttribute("aria-hidden", "true");
      tableEl.innerHTML = "";
      return;
    }

    panel.hidden = false;
    panel.setAttribute("aria-hidden", "false");

    const c = t();
    const hint = $("#tableHint");
    if (hint && c?.ui?.tableHint) hint.textContent = c.ui.tableHint;

    const { columns, answers, feedback } = state.table;
    const active = highlightSet(state.highlightCol);

    const headCells = columns
      .map((col, index) => {
        const classes = ["practice-table__th"];
        if (col.kind === "compound") classes.push("practice-table__th--clickable");
        if (active.has(index)) classes.push("is-highlight");
        if (state.highlightCol === index) classes.push("is-active-col");
        const role = col.kind === "compound" ? ' role="button" tabindex="0"' : "";
        return `<th scope="col" class="${classes.join(" ")}" data-col="${index}"${role}>${katexHtml(col.latex)}</th>`;
      })
      .join("");

    const bodyRows = answers
      .map((row, r) => {
        const cells = row
          .map((value, cIndex) => {
            const col = columns[cIndex];
            const classes = ["practice-table__td"];
            if (active.has(cIndex)) classes.push("is-highlight");
            if (col.kind === "atom") {
              classes.push("practice-table__td--locked");
              return `<td class="${classes.join(" ")}">${katexHtml(value)}</td>`;
            }
            const fb = feedback[r][cIndex];
            if (fb === "correct") classes.push("is-correct");
            if (fb === "wrong") classes.push("is-wrong");
            const display = value === "T" || value === "F" ? katexHtml(value) : "";
            return `<td class="${classes.join(" ")}"><button type="button" class="truth-cell" data-row="${r}" data-col="${cIndex}" aria-label="ค่าความจริง แถว ${r + 1} คอลัมน์ ${cIndex + 1}">${display}</button></td>`;
          })
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    tableEl.innerHTML = `<thead><tr>${headCells}</tr></thead><tbody>${bodyRows}</tbody>`;

    const popup = $("#checkPopup");
    if (popup) popup.hidden = !state.checkPopup;
  }

  function afterTokenEdit() {
    clearTable();
    hideExprError();
    renderBuilder();
    renderTable();
  }

  function addToken(id) {
    if (!TOKEN_DEFS[id] || state.tokens.length >= MAX_EXPR_TOKENS) return;
    state.tokens.push(id);
    afterTokenEdit();
  }

  function popToken() {
    if (!state.tokens.length) return;
    state.tokens.pop();
    afterTokenEdit();
  }

  function clearTokens() {
    if (!state.tokens.length) {
      hideExprError();
      return;
    }
    state.tokens = [];
    afterTokenEdit();
  }

  function onHeaderActivate(colIndex) {
    const table = state.table;
    if (!table) return;
    const col = table.columns[colIndex];
    if (!col || col.kind !== "compound") return;
    state.highlightCol = state.highlightCol === colIndex ? null : colIndex;
    renderTable();
  }

  function onCellClick(row, col) {
    const table = state.table;
    if (!table) return;
    if (!Number.isInteger(row) || !Number.isInteger(col)) return;
    if (!table.columns[col] || table.columns[col].kind === "atom") return;
    if (!table.answers[row]) return;
    table.answers[row][col] = cycleTruth(table.answers[row][col]);
    if (table.feedback[row]) {
      table.feedback[row][col] = null;
    }
    hideCheckPopup();
    renderTable();
  }

  function checkAnswers() {
    const table = state.table;
    if (!table) return;

    const incomplete = table.columns.some((col, c) => {
      if (col.kind !== "compound") return false;
      return table.answers.some((row) => row[c] !== "T" && row[c] !== "F");
    });

    if (incomplete) {
      showCheckPopup();
      return;
    }

    hideCheckPopup();
    table.feedback = table.expected.map((row, r) =>
      row.map((expected, c) => {
        if (table.columns[c].kind === "atom") return null;
        return table.answers[r][c] === expected ? "correct" : "wrong";
      })
    );
    renderTable();
  }

  function revealAnswers() {
    const table = state.table;
    if (!table) return;

    hideCheckPopup();
    table.answers = table.expected.map((row) => row.slice());
    table.feedback = table.expected.map((row) =>
      row.map((_, c) => (table.columns[c].kind === "atom" ? null : "correct"))
    );
    renderTable();
  }

  function renderAll() {
    renderBuilder();
    renderTable();
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
    $("#exprBackspace")?.addEventListener("click", popToken);
    $("#exprClear")?.addEventListener("click", clearTokens);
    $("#exprShowBtn")?.addEventListener("click", buildTable);
    $("#tableReset")?.addEventListener("click", resetTableAnswers);
    $("#checkBtn")?.addEventListener("click", checkAnswers);
    $("#revealBtn")?.addEventListener("click", revealAnswers);

    $("#tilePalette")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".tile-btn[data-token]");
      if (!btn || btn.disabled) return;
      addToken(btn.dataset.token);
    });

    $("#truthTable")?.addEventListener("click", (e) => {
      const th = e.target.closest("th[data-col]");
      if (th) {
        onHeaderActivate(Number(th.dataset.col));
        return;
      }
      const cell = e.target.closest(".truth-cell");
      if (cell) {
        onCellClick(Number(cell.dataset.row), Number(cell.dataset.col));
      }
    });

    $("#truthTable")?.addEventListener("keydown", (e) => {
      const th = e.target.closest("th[data-col]");
      if (!th) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onHeaderActivate(Number(th.dataset.col));
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
