(() => {
  const $ = (selector, root = document) => root.querySelector(selector);

  const TOKEN_DEFS = {
    p: { id: "p", kind: "atom", label: "p", latex: "p" },
    q: { id: "q", kind: "atom", label: "q", latex: "q" },
    r: { id: "r", kind: "atom", label: "r", latex: "r" },
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

  const OPEN_PARENS = new Set(["lparen", "lbrack"]);
  const CLOSE_PARENS = new Set(["rparen", "rbrack"]);

  const state = {
    questionIndex: 0,
    contra: null,
    lastFocus: null
  };

  let popupTimer = null;
  let resizeTimer = null;
  let treeDrawGen = 0;
  let nodeSeq = 0;

  function t() {
    return window.CONTENT?.th;
  }

  function questions() {
    return t()?.questions || [];
  }

  function currentQuestion() {
    const list = questions();
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

  function cycleTruth(current) {
    if (current == null || current === "") return "T";
    if (current === "T") return "F";
    return "T";
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

  function conclusionText(question) {
    const ui = t()?.ui;
    if (!question || !ui) return "";
    return question.valid ? ui.yesValid || "" : ui.noValid || "";
  }

  function hidePopup() {
    if (popupTimer) {
      clearTimeout(popupTimer);
      popupTimer = null;
    }
    const popup = $("#contraCheckPopup");
    if (popup) popup.hidden = true;
  }

  function showPopup() {
    const popup = $("#contraCheckPopup");
    const ui = t()?.ui;
    if (popup) {
      popup.hidden = false;
      popup.textContent = ui?.checkIncomplete || "";
    }
    if (popupTimer) clearTimeout(popupTimer);
    popupTimer = setTimeout(() => hidePopup(), 2800);
  }

  function editableTokenIndexes(tokens) {
    return tokens
      .map((id, index) => ({ id, index }))
      .filter((item) => TOKEN_DEFS[item.id]?.kind !== "paren")
      .map((item) => item.index);
  }

  function resetQuestionState() {
    const question = currentQuestion();
    if (!question) return;
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
    hidePopup();
  }

  function goQuestion(index) {
    const max = questions().length;
    if (index < 0 || index >= max || index === state.questionIndex) return;
    state.questionIndex = index;
    resetQuestionState();
    renderAll();
  }

  function updateDefModalBody() {
    const body = $("#defModalBody");
    const ui = t()?.ui;
    if (!body || !ui) return;
    body.textContent = ui.defText || "";
    renderMath(body);
  }

  function applyContent() {
    const c = t();
    if (!c) return;
    const map = [
      ["#landingEyebrow", c.landing?.eyebrow],
      ["#landingTitle", c.landing?.title],
      ["#startButton", c.landing?.start],
      ["#appTitle", c.app?.title],
      ["#contraCheckBtn", c.ui?.check],
      ["#contraRevealBtn", c.ui?.reveal],
      ["#contraCheckPopup", c.ui?.checkIncomplete]
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

    const defTitle = $("#defModalTitle");
    if (defTitle && c.ui?.infoLabel) defTitle.textContent = c.ui.infoLabel;
  }

  function buildPromptHtml(question) {
    if (!question) return "";
    const ui = t()?.ui;
    const ask = escapeHtml(ui?.promptAsk || "");
    const premiseTag = escapeHtml(ui?.premiseTag || "");
    const conclusionTag = escapeHtml(ui?.conclusionTag || "");
    const lines = ['<p class="prompt-box__ask">' + ask + "</p>"];
    (question.premises || []).forEach((latex, index) => {
      const tag =
        index === 0
          ? '<span class="prompt-box__tag">' + premiseTag + "</span> "
          : '<span class="prompt-box__tag" aria-hidden="true"></span> ';
      lines.push(
        '<p class="prompt-box__line">' + tag + "$" + formatProofLatex(latex) + "$</p>"
      );
    });
    lines.push(
      '<p class="prompt-box__line"><span class="prompt-box__tag">' +
        conclusionTag +
        "</span> $" +
        formatProofLatex(question.conclusion) +
        "$</p>"
    );
    return lines.join("");
  }

  function renderNav() {
    const total = questions().length;
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
          '<button type="button" class="question-dot' +
          active +
          '" data-index="' +
          i +
          '" aria-label="ข้อ ' +
          (i + 1) +
          '" ' +
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
    const box = $("#promptBox");
    const formBox = $("#formBox");
    const q = currentQuestion();
    const ui = t()?.ui;
    if (box) {
      box.innerHTML = buildPromptHtml(q);
      renderMath(box);
    }
    if (formBox) {
      if (q?.formLatex) {
        formBox.innerHTML =
          '<span class="form-box__label">' +
          escapeHtml(ui?.formLabel || "") +
          "</span> $" +
          formatProofLatex(q.formLatex) +
          "$";
        renderMath(formBox);
      } else {
        formBox.textContent = "";
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
    if (!q || !ui?.assumeTemplate) {
      box.textContent = "";
      return;
    }
    const expr = "$" + formatProofLatex(q.formLatex) + "$";
    box.innerHTML = ui.assumeTemplate.split("${expr}").join(expr);
    renderMath(box);
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

  function renderContraTree() {
    const stage = $("#treeStage");
    const conclusion = $("#contraConclusion");
    if (!stage) return;

    const ex = state.contra;
    if (!ex) {
      stage.innerHTML = "";
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

    const drawGen = ++treeDrawGen;
    requestAnimationFrame(() => {
      if (drawGen !== treeDrawGen) return;
      drawTreeLines(body, svg, ex.ast, colCount);
      requestAnimationFrame(() => {
        if (drawGen !== treeDrawGen) return;
        drawTreeLines(body, svg, ex.ast, colCount);
      });
    });

    if (conclusion) {
      const allCorrect = editableTokenIndexes(tokens).every(
        (index) => ex.feedback[index] === "correct"
      );
      const show = ex.revealed || (ex.checked && allCorrect);
      if (show) {
        conclusion.hidden = false;
        conclusion.textContent = conclusionText(ex.question);
      } else {
        conclusion.hidden = true;
        conclusion.textContent = "";
      }
    }

    if (ex.conflictSet.size) {
      requestAnimationFrame(() => {
        if (drawGen !== treeDrawGen) return;
        const conflictEl = stage.querySelector(".truth-box.is-conflict");
        if (conflictEl) {
          conflictEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      });
    }
  }

  function renderAll() {
    renderNav();
    renderPrompt();
    renderAssume();
    renderContraTree();
  }

  function onContraBoxClick(tokenIndex) {
    const ex = state.contra;
    if (!ex || Number.isNaN(tokenIndex)) return;
    if (tokenIndex === ex.ast.tokenIndex) return;
    if (!(tokenIndex in ex.answers)) return;
    ex.answers[tokenIndex] = cycleTruth(ex.answers[tokenIndex]);
    ex.feedback[tokenIndex] = null;
    ex.conflictSet = new Set();
    ex.checked = false;
    ex.revealed = false;
    hidePopup();
    renderContraTree();
  }

  function checkContraAnswers() {
    const ex = state.contra;
    if (!ex) return;
    const indexes = editableTokenIndexes(ex.tokens);
    const incomplete = indexes.some((index) => {
      const val = ex.answers[index];
      return val !== "T" && val !== "F";
    });
    if (incomplete) {
      showPopup();
      return;
    }
    hidePopup();
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
    if (!ex) return;
    hidePopup();
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
    state.questionIndex = 0;
    resetQuestionState();

    $("#startButton")?.addEventListener("click", showApp);

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

    $("#prevQuestionBtn")?.addEventListener("click", () => goQuestion(state.questionIndex - 1));
    $("#nextQuestionBtn")?.addEventListener("click", () => goQuestion(state.questionIndex + 1));
    $("#questionDots")?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-index]");
      if (!btn) return;
      const index = Number(btn.dataset.index);
      if (Number.isNaN(index)) return;
      goQuestion(index);
    });

    $("#treeStage")?.addEventListener("click", (event) => {
      const box = event.target.closest(".truth-box");
      if (!box || box.disabled) return;
      onContraBoxClick(Number(box.dataset.tokenIndex));
    });

    $("#contraCheckBtn")?.addEventListener("click", checkContraAnswers);
    $("#contraRevealBtn")?.addEventListener("click", revealContraAnswers);

    window.addEventListener("resize", () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeTimer = null;
        renderContraTree();
      }, 100);
    });

    renderAll();
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
