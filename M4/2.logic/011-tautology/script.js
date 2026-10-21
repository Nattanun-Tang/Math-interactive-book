(() => {
  const $ = (selector, root = document) => root.querySelector(selector);

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
  const MAX_EXPR_TOKENS = 24;

  const OPEN_PARENS = new Set(["lparen", "lbrack"]);
  const CLOSE_PARENS = new Set(["rparen", "rbrack"]);

  const state = {
    mode: "study",
    method: "truth",
    questionIndex: 0,
    answers: [],
    feedback: [],
    expected: [],
    revealed: false,
    checked: false,
    contra: null,
    tokens: [],
    exprError: false,
    testContra: null,
    lastFocus: null
  };

  const popupTimers = { check: null, contra: null, test: null };
  let errorTimer = null;
  let nodeSeq = 0;

  function t() {
    return window.CONTENT?.th;
  }

  function truthQuestions() {
    return t()?.truthQuestions || [];
  }

  function contraQuestions() {
    return t()?.contraQuestions || [];
  }

  function currentList() {
    return state.method === "truth" ? truthQuestions() : contraQuestions();
  }

  function currentQuestion() {
    const list = currentList();
    return list[state.questionIndex] || list[0] || null;
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

  function katexHtml(latex, displayMode = false) {
    if (typeof katex === "undefined" || typeof katex.renderToString !== "function") {
      return escapeHtml(latex);
    }
    return katex.renderToString(latex, { throwOnError: false, displayMode });
  }

  function renderLatex(el, latex) {
    if (!el) return;
    el.innerHTML = katexHtml(latex);
  }

  function formatProofLatex(latex) {
    if (!latex) return "";
    return String(latex)
      .replace(/(?<!\\mathbin\{)\\leftrightarrow/g, "\\mathbin{\\leftrightarrow}")
      .replace(/(?<!\\mathbin\{)\\rightarrow/g, "\\mathbin{\\rightarrow}")
      .replace(/(?<!\\mathbin\{)\\land/g, "\\mathbin{\\land}")
      .replace(/(?<!\\mathbin\{)\\lor/g, "\\mathbin{\\lor}")
      .replace(/(?<!\{)\\sim(?![a-zA-Z])/g, "{\\sim}");
  }

  function boolToTF(value) {
    return value ? "T" : "F";
  }

  function cycleTruth(current) {
    if (current == null || current === "") return "T";
    if (current === "T") return "F";
    return "T";
  }

  function imply(a, b) {
    return !a || b;
  }

  function iff(a, b) {
    return a === b;
  }

  const TRUTH_EVAL = {
    t1: [(a) => !a.p, (a) => a.p || !a.p],
    t2: [(a) => a.p && a.q, (a) => imply(a.p && a.q, a.q)],
    t3: [(a) => a.p || a.q, (a) => imply(a.p || a.q, a.p)],
    t4: [
      (a) => !a.q,
      (a) => imply(a.p, !a.q),
      (a) => !a.p,
      (a) => imply(a.q, !a.p),
      (a) => imply(a.p, !a.q) || imply(a.q, !a.p)
    ],
    t5: [
      (a) => imply(a.p, a.q),
      (a) => !imply(a.p, a.q),
      (a) => !a.q,
      (a) => a.p && !a.q,
      (a) => iff(!imply(a.p, a.q), a.p && !a.q)
    ]
  };

  function buildAssignments(atoms) {
    const n = atoms.length;
    const total = 1 << n;
    const rows = [];
    for (let i = 0; i < total; i += 1) {
      const row = {};
      for (let a = 0; a < n; a += 1) {
        row[atoms[a]] = ((i >> (n - 1 - a)) & 1) === 0;
      }
      rows.push(row);
    }
    return rows;
  }

  function buildExpected(question) {
    const evals = TRUTH_EVAL[question.id];
    if (!evals) return [];
    return buildAssignments(question.atoms).map((assignment) => [
      ...question.atoms.map((name) => boolToTF(assignment[name])),
      ...evals.map((fn) => boolToTF(fn(assignment)))
    ]);
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

    function nextNodeId() {
      nodeSeq += 1;
      return `n${nodeSeq}`;
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
    if (!ast) return null;
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

  function labelNodes(node, assignment, out) {
    if (node.type === "atom") {
      out[node.tokenIndex] = boolToTF(assignment[node.name]);
      return assignment[node.name];
    }
    if (node.type === "not") {
      const v = labelNodes(node.arg, assignment, out);
      out[node.tokenIndex] = boolToTF(!v);
      return !v;
    }
    const left = labelNodes(node.left, assignment, out);
    const right = labelNodes(node.right, assignment, out);
    let value;
    if (node.op === "and") value = left && right;
    else if (node.op === "or") value = left || right;
    else if (node.op === "implies") value = !left || right;
    else value = left === right;
    out[node.tokenIndex] = boolToTF(value);
    return value;
  }

  function tokensToLatex(tokenIds) {
    return (tokenIds || [])
      .map((id) => TOKEN_DEFS[id]?.latex || "")
      .filter(Boolean)
      .join(" ");
  }

  function findAtomConflicts(tokens, answers) {
    const byName = {};
    tokens.forEach((id, index) => {
      if (TOKEN_DEFS[id]?.kind !== "atom") return;
      const val = answers[index];
      if (val !== "T" && val !== "F") return;
      (byName[id] || (byName[id] = [])).push({ index, val });
    });
    const conflicts = [];
    Object.values(byName).forEach((items) => {
      const tItem = items.find((item) => item.val === "T");
      const fItem = items.find((item) => item.val === "F");
      if (tItem && fItem) conflicts.push([tItem.index, fItem.index]);
    });
    return conflicts;
  }

  function fillDefaultSubtree(node, out, atomValues) {
    if (out[node.tokenIndex] != null) return out[node.tokenIndex] === "T";
    if (node.type === "atom") {
      const known = atomValues[node.name];
      const want = known != null ? known : true;
      out[node.tokenIndex] = boolToTF(want);
      if (atomValues[node.name] === undefined) atomValues[node.name] = want;
      return want;
    }
    if (node.type === "not") {
      const arg = fillDefaultSubtree(node.arg, out, atomValues);
      out[node.tokenIndex] = boolToTF(!arg);
      return !arg;
    }
    const left = fillDefaultSubtree(node.left, out, atomValues);
    const right = fillDefaultSubtree(node.right, out, atomValues);
    let value;
    if (node.op === "and") value = left && right;
    else if (node.op === "or") value = left || right;
    else if (node.op === "implies") value = !left || right;
    else value = left === right;
    out[node.tokenIndex] = boolToTF(value);
    return value;
  }

  function knownValue(node, out, atomValues) {
    if (node.type === "atom") return atomValues[node.name];
    if (out[node.tokenIndex] === "T") return true;
    if (out[node.tokenIndex] === "F") return false;
    return undefined;
  }

  function forceLabel(node, wantBool, out, atomValues) {
    out[node.tokenIndex] = boolToTF(wantBool);

    if (node.type === "atom") {
      if (atomValues[node.name] === undefined) atomValues[node.name] = wantBool;
      return;
    }
    if (node.type === "not") {
      forceLabel(node.arg, !wantBool, out, atomValues);
      return;
    }

    const left = node.left;
    const right = node.right;
    if (node.op === "and") {
      if (wantBool) {
        forceLabel(left, true, out, atomValues);
        forceLabel(right, true, out, atomValues);
      } else {
        forceLabel(left, false, out, atomValues);
        fillDefaultSubtree(right, out, atomValues);
      }
      return;
    }
    if (node.op === "or") {
      if (!wantBool) {
        forceLabel(left, false, out, atomValues);
        forceLabel(right, false, out, atomValues);
      } else {
        forceLabel(left, true, out, atomValues);
        fillDefaultSubtree(right, out, atomValues);
      }
      return;
    }
    if (node.op === "implies") {
      if (!wantBool) {
        forceLabel(left, true, out, atomValues);
        forceLabel(right, false, out, atomValues);
      } else {
        const rightKnown = knownValue(right, out, atomValues);
        const leftKnown = knownValue(left, out, atomValues);
        if (rightKnown === false) {
          forceLabel(left, false, out, atomValues);
          forceLabel(right, false, out, atomValues);
        } else if (leftKnown === true) {
          forceLabel(left, true, out, atomValues);
          forceLabel(right, true, out, atomValues);
        } else {
          forceLabel(left, false, out, atomValues);
          fillDefaultSubtree(right, out, atomValues);
        }
      }
      return;
    }
    if (node.op === "iff") {
      if (wantBool) {
        const leftKnown = knownValue(left, out, atomValues);
        if (leftKnown !== undefined) {
          forceLabel(left, leftKnown, out, atomValues);
          forceLabel(right, leftKnown, out, atomValues);
        } else {
          forceLabel(left, true, out, atomValues);
          forceLabel(right, true, out, atomValues);
        }
      } else {
        const leftKnown = knownValue(left, out, atomValues);
        if (leftKnown !== undefined) {
          forceLabel(left, leftKnown, out, atomValues);
          forceLabel(right, !leftKnown, out, atomValues);
        } else {
          forceLabel(left, true, out, atomValues);
          forceLabel(right, false, out, atomValues);
        }
      }
    }
  }

  function buildTestContraSolution(ast, tokens) {
    const atoms = [...collectAtoms(ast)].sort();
    const assignments = buildAssignments(atoms);
    const tautology = assignments.every((assignment) => evalNode(ast, assignment) === true);
    const expected = {};

    if (!tautology) {
      const falseAssign = assignments.find((assignment) => evalNode(ast, assignment) === false);
      labelNodes(ast, falseAssign, expected);
      return { expected, conflicts: [], tautology: false };
    }

    forceLabel(ast, false, expected, {});
    return {
      expected,
      conflicts: findAtomConflicts(tokens, expected),
      tautology: true
    };
  }

  function maxDepth(ast) {
    return ast ? ast.depth : 0;
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

  function conclusionText(question, method) {
    const ui = t()?.ui;
    if (!question || !ui) return "";
    const expr = "$" + formatProofLatex(question.exprLatex) + "$";
    let template;
    if (method === "contra") {
      template = question.tautology ? ui.yesTautologyContra : ui.noTautologyContra;
    } else {
      template = question.tautology ? ui.yesTautology : ui.noTautology;
    }
    return (template || "").replace("${expr}", expr);
  }

  function popupSelector(kind) {
    if (kind === "contra") return "#contraCheckPopup";
    if (kind === "test") return "#testCheckPopup";
    return "#checkPopup";
  }

  function hidePopup(kind) {
    if (popupTimers[kind]) {
      clearTimeout(popupTimers[kind]);
      popupTimers[kind] = null;
    }
    const popup = $(popupSelector(kind));
    if (popup) popup.hidden = true;
  }

  function showPopup(kind) {
    const popup = $(popupSelector(kind));
    const ui = t()?.ui;
    if (popup) {
      popup.hidden = false;
      popup.textContent = ui?.checkIncomplete || "";
    }
    if (popupTimers[kind]) clearTimeout(popupTimers[kind]);
    popupTimers[kind] = setTimeout(() => hidePopup(kind), 2800);
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
    const ui = t()?.ui;
    if (el) {
      if (ui?.exprInvalid) el.textContent = ui.exprInvalid;
      el.hidden = false;
    }
    if (errorTimer) clearTimeout(errorTimer);
    errorTimer = setTimeout(() => hideExprError(), 3200);
  }

  function clearTestExercise() {
    state.testContra = null;
    hidePopup("test");
  }

  function resetTruthState(question) {
    const expected = buildExpected(question);
    state.expected = expected;
    state.answers = expected.map((row) =>
      row.map((val, index) => (index < question.atoms.length ? val : ""))
    );
    state.feedback = expected.map((row) => Array(row.length).fill(null));
    state.revealed = false;
    state.checked = false;
    hidePopup("check");
  }

  function editableTokenIndexes(tokens) {
    return tokens
      .map((id, index) => ({ id, index }))
      .filter((item) => TOKEN_DEFS[item.id]?.kind !== "paren")
      .map((item) => item.index);
  }

  function resetContraState(question) {
    const parsed = parseExpression(question.tokens || []);
    if (!parsed.ok) {
      state.contra = null;
      return;
    }
    const answers = {};
    const feedback = {};
    const editable = editableTokenIndexes(parsed.tokens);
    editable.forEach((index) => {
      answers[index] = "";
      feedback[index] = null;
    });
    // Root connective starts as assumed false.
    answers[parsed.ast.tokenIndex] = "F";
    state.contra = {
      question,
      tokens: parsed.tokens,
      ast: parsed.ast,
      answers,
      feedback,
      conflictSet: new Set(),
      revealed: false,
      checked: false
    };
    hidePopup("contra");
  }

  function resetQuestionState() {
    const q = currentQuestion();
    if (!q) return;
    if (state.method === "truth") resetTruthState(q);
    else resetContraState(q);
  }

  function questionCount() {
    return currentList().length;
  }

  function updateDefModalBody() {
    const body = $("#defModalBody");
    const card = $("#defModal .modal__card");
    const ui = t()?.ui;
    if (!body || !ui) return;
    const isContra = state.mode === "test" || state.method === "contra";
    body.textContent = isContra ? (ui.defTextContra || "") : (ui.defText || "");
    body.classList.toggle("modal__body--steps", isContra);
    card?.classList.toggle("modal__card--steps", isContra);
  }

  function setMode(mode) {
    if (mode !== "study" && mode !== "test") return;
    if (state.mode === mode) return;
    state.mode = mode;
    if (mode === "study") {
      state.tokens = [];
      clearTestExercise();
      hideExprError();
      resetQuestionState();
    } else {
      clearTestExercise();
      hideExprError();
    }
    renderAll();
    updateDefModalBody();
    if (mode === "test") openModal("#defModal");
  }

  function setMethod(method) {
    if (state.mode !== "study") return;
    if (method !== "truth" && method !== "contra") return;
    const prev = state.method;
    state.method = method;
    state.questionIndex = 0;
    resetQuestionState();
    renderAll();
    updateDefModalBody();
    if (method === "contra" && prev !== "contra") openModal("#defModal");
  }

  function goQuestion(index) {
    const max = questionCount();
    if (index < 0 || index >= max) return;
    state.questionIndex = index;
    resetQuestionState();
    renderAll();
  }

  function applyContent() {
    const c = t();
    if (!c) return;
    const map = [
      ["#landingEyebrow", c.landing?.eyebrow],
      ["#landingTitle", c.landing?.title],
      ["#startButton", c.landing?.start],
      ["#appTitle", c.app?.title],
      ["#modeLabel", c.ui?.modeLabel],
      ["#checkBtn", c.ui?.check],
      ["#revealBtn", c.ui?.reveal],
      ["#contraCheckBtn", c.ui?.check],
      ["#contraRevealBtn", c.ui?.reveal],
      ["#testCheckBtn", c.ui?.check],
      ["#testRevealBtn", c.ui?.reveal],
      ["#checkPopup", c.ui?.checkIncomplete],
      ["#contraCheckPopup", c.ui?.checkIncomplete],
      ["#testCheckPopup", c.ui?.checkIncomplete],
      ["#tilesLabel", c.ui?.tilesLabel],
      ["#exprLabel", c.ui?.exprLabel],
      ["#exprShowBtn", c.ui?.exprShow],
      ["#exprError", c.ui?.exprInvalid]
    ];
    for (const [selector, value] of map) {
      const el = $(selector);
      if (el && value != null) el.textContent = value;
    }
    updateDefModalBody();

    const infoBtn = $("#infoBtn");
    if (infoBtn && c.ui?.infoLabel) {
      infoBtn.setAttribute("aria-label", c.ui.infoLabel);
      infoBtn.title = c.ui.infoLabel;
    }

    const modeStudy = $('#modeToggle [data-mode="study"]');
    const modeTest = $('#modeToggle [data-mode="test"]');
    if (modeStudy && c.ui?.study) modeStudy.textContent = c.ui.study;
    if (modeTest && c.ui?.test) modeTest.textContent = c.ui.test;

    const methodLabel = $('label[for="methodSelect"]');
    if (methodLabel && c.ui?.methodLabel) methodLabel.textContent = c.ui.methodLabel;

    const select = $("#methodSelect");
    if (select) {
      if (c.ui?.methodLabel) select.setAttribute("aria-label", c.ui.methodLabel);
      select.innerHTML =
        '<option value="truth">' + escapeHtml(c.ui?.methodTruth || "") + "</option>" +
        '<option value="contra">' + escapeHtml(c.ui?.methodContra || "") + "</option>";
      select.value = state.method;
    }

    const exprBackspace = $("#exprBackspace");
    if (exprBackspace && c.ui?.exprBackspace) {
      exprBackspace.setAttribute("aria-label", c.ui.exprBackspace);
      exprBackspace.title = c.ui.exprBackspace;
    }
    const exprClear = $("#exprClear");
    if (exprClear && c.ui?.exprClear) {
      exprClear.setAttribute("aria-label", c.ui.exprClear);
      exprClear.title = c.ui.exprClear;
    }
    const testReset = $("#testResetBtn");
    if (testReset && c.ui?.exerciseReset) {
      testReset.setAttribute("aria-label", c.ui.exerciseReset);
      testReset.title = c.ui.exerciseReset;
    }

    const defTitle = $("#defModalTitle");
    if (defTitle && c.ui?.infoLabel) defTitle.textContent = c.ui.infoLabel;
  }

  function renderToolbar() {
    const layout = $("#appLayout");
    const select = $("#methodSelect");
    const study = state.mode === "study";
    if (layout) {
      layout.dataset.method = state.method;
      layout.classList.toggle("is-study-mode", study);
      layout.classList.toggle("is-test-mode", !study);
    }
    if (select) select.value = state.method;

    document.querySelectorAll("#modeToggle [data-mode]").forEach((btn) => {
      const on = btn.dataset.mode === state.mode;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-checked", on ? "true" : "false");
    });

    const methodControl = $("#methodControl");
    const studyPanel = $("#studyPanel");
    const testPanel = $("#testPanel");
    if (methodControl) methodControl.hidden = !study;
    if (studyPanel) studyPanel.hidden = !study;
    if (testPanel) testPanel.hidden = study;
  }

  function renderNav() {
    if (state.mode !== "study") return;
    const total = questionCount();
    const label = $("#questionLabel");
    const ui = t()?.ui;
    if (label && ui?.questionOf) {
      label.textContent = ui.questionOf
        .replace("{n}", String(state.questionIndex + 1))
        .replace("{total}", String(total));
    }

    const dots = $("#questionDots");
    if (dots) {
      dots.innerHTML = Array.from({ length: total }, (_, i) => {
        const active = i === state.questionIndex ? " is-active" : "";
        return (
          '<button type="button" class="question-dot' + active + '" data-index="' + i +
          '" aria-label="ข้อ ' + (i + 1) + '" ' +
          (i === state.questionIndex ? ' aria-current="true"' : "") +
          "></button>"
        );
      }).join("");
    }

    const prev = $("#prevQuestionBtn");
    const next = $("#nextQuestionBtn");
    if (prev) prev.disabled = state.questionIndex <= 0;
    if (next) next.disabled = state.questionIndex >= total - 1;
  }

  function renderPrompt() {
    if (state.mode !== "study") return;
    const box = $("#promptBox");
    const q = currentQuestion();
    if (!box) return;
    box.innerHTML = q?.prompt || "";
    renderMath(box);
  }

  function syncMethodPanels() {
    const study = state.mode === "study";
    const showTruth = study && state.method === "truth";
    const showContra = study && state.method === "contra";
    const truthPanel = $("#truthPanel");
    const contraPanel = $("#contraPanel");
    if (truthPanel) truthPanel.hidden = !showTruth;
    if (contraPanel) contraPanel.hidden = !showContra;
  }

  function allEditableCorrect(q) {
    return state.feedback.every((row) =>
      row.every((cell, c) => c < q.atoms.length || cell === "correct")
    );
  }

  function renderTruthTable() {
    const tableEl = $("#truthTable");
    const conclusion = $("#truthConclusion");
    if (!tableEl) return;

    if (state.mode !== "study" || state.method !== "truth") {
      if (conclusion) {
        conclusion.hidden = true;
        conclusion.textContent = "";
      }
      return;
    }

    const q = currentQuestion();
    if (!q) {
      tableEl.innerHTML = "";
      return;
    }

    const headers = q.atoms.concat(q.columns || []);
    const head = headers
      .map((latex) => '<th scope="col" class="practice-table__th">' + katexHtml(formatProofLatex(latex)) + "</th>")
      .join("");

    const body = state.answers
      .map((row, r) => {
        const cells = row
          .map((value, c) => {
            if (c < q.atoms.length) {
              return '<td class="practice-table__td practice-table__td--locked">' + katexHtml(value) + "</td>";
            }
            const fb = state.feedback[r] ? state.feedback[r][c] : null;
            const classes = ["practice-table__td"];
            if (fb === "correct") classes.push("is-correct");
            if (fb === "wrong") classes.push("is-wrong");
            const display = value === "T" || value === "F" ? katexHtml(value) : "";
            return (
              '<td class="' + classes.join(" ") + '">' +
              '<button type="button" class="truth-cell" data-row="' + r + '" data-col="' + c +
              '" aria-label="ค่าความจริง แถว ' + (r + 1) + " คอลัมน์ " + (c + 1) + '">' +
              display + "</button></td>"
            );
          })
          .join("");
        return "<tr>" + cells + "</tr>";
      })
      .join("");

    tableEl.innerHTML = "<thead><tr>" + head + "</tr></thead><tbody>" + body + "</tbody>";

    if (conclusion) {
      const show = state.revealed || (state.checked && allEditableCorrect(q));
      if (show) {
        conclusion.hidden = false;
        conclusion.innerHTML = conclusionText(q, "truth");
        renderMath(conclusion);
      } else {
        conclusion.hidden = true;
        conclusion.textContent = "";
      }
    }
  }

  function truthButton({ value, locked, tokenIndex, feedback, conflict }) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "truth-box";
    if (locked) btn.classList.add("truth-box--locked");
    if (feedback === "correct") btn.classList.add("is-correct");
    if (feedback === "wrong") btn.classList.add("is-wrong");
    if (conflict) btn.classList.add("is-conflict");
    if (value === "T" || value === "F") {
      renderLatex(btn, value);
    } else {
      btn.textContent = "";
    }
    if (tokenIndex != null) btn.dataset.tokenIndex = String(tokenIndex);
    if (locked) {
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
    }
    btn.setAttribute("aria-label", `ค่าความจริง ${value || "-"}`);
    return btn;
  }

  function renderAssume() {
    const box = $("#assumeBox");
    const ui = t()?.ui;
    const q = currentQuestion();
    if (!box) return;
    if (state.mode !== "study" || state.method !== "contra" || !q || !ui?.assumeTemplate) {
      box.textContent = "";
      return;
    }
    const expr = "$" + formatProofLatex(q.exprLatex) + "$";
    box.innerHTML = ui.assumeTemplate.replace("${expr}", expr);
    renderMath(box);
  }

  function renderContraTree() {
    const stage = $("#treeStage");
    const conclusion = $("#contraConclusion");
    if (!stage) return;

    if (state.mode !== "study" || state.method !== "contra") {
      stage.innerHTML = "";
      if (conclusion) {
        conclusion.hidden = true;
        conclusion.textContent = "";
      }
      return;
    }

    if (!state.contra) {
      stage.innerHTML = "";
      return;
    }

    paintContraTree(stage, conclusion, state.contra, "contra");
  }

  function columnCenters(tokenCount, stageWidth) {
    const colW = stageWidth / Math.max(tokenCount, 1);
    return Array.from({ length: tokenCount }, (_, i) => (i + 0.5) * colW);
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

  function renderBuilder() {
    if (state.mode !== "test") return;
    const ui = t()?.ui;
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
      empty.textContent = ui?.exprEmptyHint || "";
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

  function renderTestAssume() {
    const box = $("#testAssumeBox");
    const ui = t()?.ui;
    const ex = state.testContra;
    if (!box) return;
    if (state.mode !== "test" || !ex || !ui?.assumeTemplate) {
      box.textContent = "";
      return;
    }
    const expr = "$" + formatProofLatex(ex.question.exprLatex) + "$";
    box.innerHTML = ui.assumeTemplate.replace("${expr}", expr);
    renderMath(box);
  }

  function paintContraTree(stage, conclusion, ex, conclusionMethod) {
    if (!stage || !ex) {
      if (stage) stage.innerHTML = "";
      if (conclusion) {
        conclusion.hidden = true;
        conclusion.textContent = "";
      }
      return;
    }

    const tokens = ex.tokens;
    const depthMax = maxDepth(ex.ast);
    const rowCount = depthMax + 1;
    const colCount = tokens.length;
    const colTemplate = treeColumnTemplate(tokens);

    stage.innerHTML = "";

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
        renderLatex(cell, formatProofLatex(latex ?? TOKEN_DEFS[id].latex));
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

    const rootIndex = ex.ast.tokenIndex;

    for (let d = 0; d < rowCount; d += 1) {
      for (let col = 0; col < colCount; col += 1) {
        const slot = document.createElement("div");
        slot.className = "tree-slot";
        slot.style.gridColumn = String(col + 1);
        slot.style.gridRow = String(d + 1);

        const node = nodeByToken.get(col);
        if (node && node.depth === d) {
          const locked = node.tokenIndex === rootIndex;
          slot.appendChild(
            truthButton({
              value: ex.answers[node.tokenIndex],
              locked,
              tokenIndex: node.tokenIndex,
              feedback: ex.feedback[node.tokenIndex],
              conflict: ex.conflictSet.has(node.tokenIndex)
            })
          );
        }
        layers.appendChild(slot);
      }
    }

    body.appendChild(layers);
    stage.appendChild(body);

    requestAnimationFrame(() => {
      drawTreeLines(body, svg, ex.ast, colCount);
      requestAnimationFrame(() => drawTreeLines(body, svg, ex.ast, colCount));
    });

    if (conclusion) {
      const allCorrect = editableTokenIndexes(tokens).every(
        (index) => ex.feedback[index] === "correct"
      );
      const show = ex.revealed || (ex.checked && allCorrect);
      if (show) {
        conclusion.hidden = false;
        conclusion.innerHTML = conclusionText(ex.question, conclusionMethod);
        renderMath(conclusion);
      } else {
        conclusion.hidden = true;
        conclusion.textContent = "";
      }
    }

    if (ex.conflictSet.size) {
      requestAnimationFrame(() => {
        const conflictEl = stage.querySelector(".truth-box.is-conflict");
        if (conflictEl && stage) {
          const box = conflictEl.getBoundingClientRect();
          const area = stage.getBoundingClientRect();
          if (box.bottom > area.bottom - 8 || box.top < area.top + 8) {
            conflictEl.scrollIntoView({ block: "center", behavior: "smooth" });
          }
        }
      });
    }
  }

  function renderTestContraTree() {
    const panel = $("#testExercisePanel");
    const stage = $("#testTreeStage");
    const conclusion = $("#testConclusion");
    if (!panel) return;

    if (state.mode !== "test" || !state.testContra) {
      panel.hidden = true;
      if (stage) stage.innerHTML = "";
      if (conclusion) {
        conclusion.hidden = true;
        conclusion.textContent = "";
      }
      return;
    }

    panel.hidden = false;
    renderTestAssume();
    paintContraTree(stage, conclusion, state.testContra, "contra");
  }

  function renderAll() {
    renderToolbar();
    renderNav();
    renderPrompt();
    syncMethodPanels();
    renderTruthTable();
    renderAssume();
    renderContraTree();
    renderBuilder();
    renderTestContraTree();
  }

  function addToken(id) {
    if (state.mode !== "test") return;
    if (!TOKEN_DEFS[id]) return;
    if (state.tokens.length >= MAX_EXPR_TOKENS) return;
    state.tokens.push(id);
    clearTestExercise();
    hideExprError();
    renderBuilder();
    renderTestContraTree();
  }

  function popToken() {
    if (!state.tokens.length) return;
    state.tokens.pop();
    clearTestExercise();
    hideExprError();
    renderBuilder();
    renderTestContraTree();
  }

  function clearTokens() {
    state.tokens = [];
    clearTestExercise();
    hideExprError();
    renderBuilder();
    renderTestContraTree();
  }

  function buildTestExercise() {
    const parsed = parseExpression(state.tokens);
    if (!parsed.ok) {
      showExprError();
      clearTestExercise();
      renderTestContraTree();
      return;
    }
    hideExprError();
    const solution = buildTestContraSolution(parsed.ast, parsed.tokens);
    const answers = {};
    const feedback = {};
    const editable = editableTokenIndexes(parsed.tokens);
    editable.forEach((index) => {
      answers[index] = "";
      feedback[index] = null;
    });
    answers[parsed.ast.tokenIndex] = "F";
    state.testContra = {
      question: {
        exprLatex: tokensToLatex(parsed.tokens),
        tautology: solution.tautology,
        expected: Object.fromEntries(
          Object.entries(solution.expected).map(([key, value]) => [String(key), value])
        ),
        conflicts: solution.conflicts
      },
      tokens: parsed.tokens,
      ast: parsed.ast,
      answers,
      feedback,
      conflictSet: new Set(),
      revealed: false,
      checked: false
    };
    hidePopup("test");
    renderTestContraTree();
  }

  function resetTestTruths() {
    const ex = state.testContra;
    if (!ex) return;
    const editable = editableTokenIndexes(ex.tokens);
    editable.forEach((index) => {
      ex.answers[index] = index === ex.ast.tokenIndex ? "F" : "";
      ex.feedback[index] = null;
    });
    ex.answers[ex.ast.tokenIndex] = "F";
    ex.conflictSet = new Set();
    ex.checked = false;
    ex.revealed = false;
    hidePopup("test");
    renderTestContraTree();
  }

  function onTestBoxClick(tokenIndex) {
    const ex = state.testContra;
    if (!ex || state.mode !== "test") return;
    if (tokenIndex === ex.ast.tokenIndex) return;
    if (!(tokenIndex in ex.answers)) return;
    ex.answers[tokenIndex] = cycleTruth(ex.answers[tokenIndex]);
    ex.feedback[tokenIndex] = null;
    ex.conflictSet = new Set();
    ex.checked = false;
    ex.revealed = false;
    hidePopup("test");
    renderTestContraTree();
  }

  function checkTestAnswers() {
    const ex = state.testContra;
    if (!ex || state.mode !== "test") return;
    const indexes = editableTokenIndexes(ex.tokens);
    const incomplete = indexes.some((index) => {
      const val = ex.answers[index];
      return val !== "T" && val !== "F";
    });
    if (incomplete) {
      showPopup("test");
      return;
    }
    hidePopup("test");
    ex.checked = true;
    ex.revealed = false;
    const expected = ex.question.expected || {};
    ex.feedback = {};
    indexes.forEach((index) => {
      const key = String(index);
      ex.feedback[index] = ex.answers[index] === expected[key] ? "correct" : "wrong";
    });

    const allCorrect = indexes.every((index) => ex.feedback[index] === "correct");
    ex.conflictSet = new Set();
    if (allCorrect) {
      (ex.question.conflicts || []).forEach((pair) => {
        pair.forEach((tokenIndex) => ex.conflictSet.add(tokenIndex));
      });
    }
    renderTestContraTree();
  }

  function revealTestAnswers() {
    const ex = state.testContra;
    if (!ex || state.mode !== "test") return;
    hidePopup("test");
    ex.revealed = true;
    ex.checked = true;
    const expected = ex.question.expected || {};
    const indexes = editableTokenIndexes(ex.tokens);
    indexes.forEach((index) => {
      const key = String(index);
      ex.answers[index] = expected[key] ?? "";
      ex.feedback[index] = "correct";
    });
    ex.conflictSet = new Set();
    (ex.question.conflicts || []).forEach((pair) => {
      pair.forEach((tokenIndex) => ex.conflictSet.add(tokenIndex));
    });
    renderTestContraTree();
  }

  function onTruthCellClick(row, col) {
    const q = currentQuestion();
    if (!q || state.mode !== "study" || state.method !== "truth") return;
    if (col < q.atoms.length) return;
    if (!state.answers[row]) return;
    state.answers[row][col] = cycleTruth(state.answers[row][col]);
    if (state.feedback[row]) state.feedback[row][col] = null;
    state.checked = false;
    state.revealed = false;
    hidePopup("check");
    renderTruthTable();
  }

  function checkTruthAnswers() {
    const q = currentQuestion();
    if (!q || state.mode !== "study" || state.method !== "truth") return;
    const incomplete = state.answers.some((row) =>
      row.some((val, c) => c >= q.atoms.length && val !== "T" && val !== "F")
    );
    if (incomplete) {
      showPopup("check");
      return;
    }
    hidePopup("check");
    state.checked = true;
    state.revealed = false;
    state.feedback = state.expected.map((row, r) =>
      row.map((expected, c) => {
        if (c < q.atoms.length) return null;
        return state.answers[r][c] === expected ? "correct" : "wrong";
      })
    );
    renderTruthTable();
  }

  function revealTruthAnswers() {
    const q = currentQuestion();
    if (!q || state.mode !== "study" || state.method !== "truth") return;
    hidePopup("check");
    state.revealed = true;
    state.checked = true;
    state.answers = state.expected.map((row) => row.slice());
    state.feedback = state.expected.map((row) =>
      row.map((_, c) => (c < q.atoms.length ? null : "correct"))
    );
    renderTruthTable();
  }

  function onContraBoxClick(tokenIndex) {
    const ex = state.contra;
    if (!ex || state.mode !== "study" || state.method !== "contra") return;
    if (tokenIndex === ex.ast.tokenIndex) return;
    if (!(tokenIndex in ex.answers)) return;
    ex.answers[tokenIndex] = cycleTruth(ex.answers[tokenIndex]);
    ex.feedback[tokenIndex] = null;
    ex.conflictSet = new Set();
    ex.checked = false;
    ex.revealed = false;
    hidePopup("contra");
    renderContraTree();
  }

  function checkContraAnswers() {
    const ex = state.contra;
    if (!ex || state.mode !== "study" || state.method !== "contra") return;
    const indexes = editableTokenIndexes(ex.tokens);
    const incomplete = indexes.some((index) => {
      const val = ex.answers[index];
      return val !== "T" && val !== "F";
    });
    if (incomplete) {
      showPopup("contra");
      return;
    }
    hidePopup("contra");
    ex.checked = true;
    ex.revealed = false;
    const expected = ex.question.expected || {};
    ex.feedback = {};
    indexes.forEach((index) => {
      const key = String(index);
      ex.feedback[index] = ex.answers[index] === expected[key] ? "correct" : "wrong";
    });

    const allCorrect = indexes.every((index) => ex.feedback[index] === "correct");
    ex.conflictSet = new Set();
    if (allCorrect) {
      (ex.question.conflicts || []).forEach((pair) => {
        pair.forEach((tokenIndex) => ex.conflictSet.add(tokenIndex));
      });
    }
    renderContraTree();
  }

  function revealContraAnswers() {
    const ex = state.contra;
    if (!ex || state.mode !== "study" || state.method !== "contra") return;
    hidePopup("contra");
    ex.revealed = true;
    ex.checked = true;
    const expected = ex.question.expected || {};
    const indexes = editableTokenIndexes(ex.tokens);
    indexes.forEach((index) => {
      const key = String(index);
      ex.answers[index] = expected[key] ?? "";
      ex.feedback[index] = "correct";
    });
    ex.conflictSet = new Set();
    (ex.question.conflicts || []).forEach((pair) => {
      pair.forEach((tokenIndex) => ex.conflictSet.add(tokenIndex));
    });
    renderContraTree();
  }

  function openModal(id) {
    const modal = $(id);
    if (!modal) return;
    state.lastFocus = document.activeElement;
    modal.hidden = false;
    const closeBtn = $(".modal__close", modal);
    closeBtn?.focus?.();
    renderMath(modal);
  }

  function closeModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.hidden = true;
    if (state.lastFocus && typeof state.lastFocus.focus === "function") {
      state.lastFocus.focus();
    }
  }

  function showApp() {
    const landing = $("#landingPage");
    const app = $("#appPage");
    if (!landing || !app) return;
    landing.hidden = true;
    landing.classList.remove("view--active");
    app.hidden = false;
    app.classList.add("view--active");
    $("#appTitle")?.focus?.();
    resetQuestionState();
    renderAll();
    openModal("#defModal");
  }

  function bootstrap() {
    applyContent();
    state.mode = "study";
    state.method = "truth";
    state.questionIndex = 0;
    resetQuestionState();

    $("#startButton")?.addEventListener("click", showApp);

    document.querySelectorAll("#modeToggle [data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => setMode(btn.dataset.mode));
    });

    $("#methodSelect")?.addEventListener("change", (event) => {
      setMethod(event.target.value);
    });

    $("#infoBtn")?.addEventListener("click", () => {
      updateDefModalBody();
      openModal("#defModal");
    });
    $("#defCloseBtn")?.addEventListener("click", () => closeModal("#defModal"));

    document.querySelectorAll("[data-close]").forEach((el) => {
      el.addEventListener("click", () => {
        if (el.getAttribute("data-close") === "def") closeModal("#defModal");
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!$("#defModal")?.hidden) closeModal("#defModal");
    });

    $("#prevQuestionBtn")?.addEventListener("click", () => {
      if (state.mode !== "study") return;
      goQuestion(state.questionIndex - 1);
    });
    $("#nextQuestionBtn")?.addEventListener("click", () => {
      if (state.mode !== "study") return;
      goQuestion(state.questionIndex + 1);
    });
    $("#questionDots")?.addEventListener("click", (event) => {
      if (state.mode !== "study") return;
      const btn = event.target.closest("[data-index]");
      if (!btn) return;
      goQuestion(Number(btn.dataset.index));
    });

    $("#truthTable")?.addEventListener("click", (event) => {
      const cell = event.target.closest(".truth-cell");
      if (!cell) return;
      onTruthCellClick(Number(cell.dataset.row), Number(cell.dataset.col));
    });

    $("#checkBtn")?.addEventListener("click", checkTruthAnswers);
    $("#revealBtn")?.addEventListener("click", revealTruthAnswers);

    $("#treeStage")?.addEventListener("click", (event) => {
      const box = event.target.closest(".truth-box");
      if (!box || box.disabled) return;
      onContraBoxClick(Number(box.dataset.tokenIndex));
    });

    $("#contraCheckBtn")?.addEventListener("click", checkContraAnswers);
    $("#contraRevealBtn")?.addEventListener("click", revealContraAnswers);

    $("#exprBackspace")?.addEventListener("click", popToken);
    $("#exprClear")?.addEventListener("click", clearTokens);
    $("#exprShowBtn")?.addEventListener("click", buildTestExercise);
    $("#testResetBtn")?.addEventListener("click", resetTestTruths);
    $("#testCheckBtn")?.addEventListener("click", checkTestAnswers);
    $("#testRevealBtn")?.addEventListener("click", revealTestAnswers);

    $("#testTreeStage")?.addEventListener("click", (event) => {
      const box = event.target.closest(".truth-box");
      if (!box || box.disabled) return;
      onTestBoxClick(Number(box.dataset.tokenIndex));
    });

    window.addEventListener("resize", () => {
      if (state.mode === "study" && state.method === "contra") renderContraTree();
      if (state.mode === "test" && state.testContra) renderTestContraTree();
    });

    renderAll();
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
