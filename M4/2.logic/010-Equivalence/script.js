(() => {
  const $ = (selector, root = document) => root.querySelector(selector);

  const state = {
    method: "truth",
    questionIndex: 0,
    step: 0,
    showAll: false,
    answers: [],
    feedback: [],
    expected: [],
    revealed: false,
    checked: false,
    lastFocus: null
  };

  let popupTimer = null;

  function t() {
    return window.CONTENT?.th;
  }

  function truthQuestions() {
    return t()?.truthQuestions || [];
  }

  function formQuestions() {
    return t()?.formQuestions || [];
  }

  function currentList() {
    return state.method === "truth" ? truthQuestions() : formQuestions();
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

  function unwrapMath(expr) {
    return String(expr || "")
      .trim()
      .replace(/^\$/, "")
      .replace(/\$$/, "")
      .trim();
  }

  /** Even spacing for logic connectives; treat \\sim as negation (not a relation). Idempotent. */
  function formatProofLatex(latex) {
    if (!latex) return "";
    return String(latex)
      .replace(/(?<!\\mathbin\{)\\leftrightarrow/g, "\\mathbin{\\leftrightarrow}")
      .replace(/(?<!\\mathbin\{)\\rightarrow/g, "\\mathbin{\\rightarrow}")
      .replace(/(?<!\\mathbin\{)\\land/g, "\\mathbin{\\land}")
      .replace(/(?<!\\mathbin\{)\\lor/g, "\\mathbin{\\lor}")
      .replace(/(?<!\\mathbin\{)\\equiv(?![a-zA-Z])/g, "\\mathbin{\\equiv}")
      .replace(/(?<!\{)\\sim(?![a-zA-Z])/g, "{\\sim}");
  }

  /** Apply formatProofLatex to each $...$ fragment in mixed Thai + math text. */
  function formatInlineMathText(text) {
    return String(text || "").replace(/\$([^$]+)\$/g, (_, latex) => "$" + formatProofLatex(latex) + "$");
  }

  function splitEquivExpr(expr) {
    const inner = unwrapMath(expr);
    const match = /\\equiv(?![a-zA-Z])/.exec(inner);
    if (!match) {
      return { left: inner, right: "", hasEquiv: false };
    }
    return {
      left: inner.slice(0, match.index).trim(),
      right: inner.slice(match.index + match[0].length).trim(),
      hasEquiv: true
    };
  }

  function renderProofExprHtml(expr) {
    const { left, right, hasEquiv } = splitEquivExpr(expr);
    const leftHtml = left ? katexHtml(formatProofLatex(left)) : "";
    const rightHtml = right ? katexHtml(formatProofLatex(right)) : "";
    const equivHtml = hasEquiv ? katexHtml("\\equiv") : "";
    return (
      '<span class="proof-list__left">' +
      leftHtml +
      "</span>" +
      '<span class="proof-list__equiv">' +
      equivHtml +
      "</span>" +
      '<span class="proof-list__right">' +
      rightHtml +
      "</span>"
    );
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
    t1: [
      (a) => !a.p,
      (a) => imply(a.p, a.q),
      (a) => !a.p || a.q
    ],
    t2: [
      (a) => !a.p,
      (a) => !a.q,
      (a) => imply(a.p, a.q),
      (a) => imply(!a.q, !a.p)
    ],
    t3: [
      (a) => a.p || a.q,
      (a) => imply(a.p || a.q, a.r),
      (a) => imply(a.p, a.q),
      (a) => imply(a.p, a.r),
      (a) => imply(a.p, a.q) || imply(a.p, a.r)
    ],
    t4: [
      (a) => !a.p,
      (a) => iff(a.p, a.q),
      (a) => !iff(a.p, a.q),
      (a) => iff(!a.p, a.q)
    ],
    t5: [
      (a) => imply(a.p, a.q),
      (a) => imply(a.q, a.p),
      (a) => iff(a.p, a.q),
      (a) => imply(a.p, a.q) && imply(a.q, a.p)
    ]
  };

  function expressionColumns(question) {
    if (Array.isArray(question.columns) && question.columns.length) {
      return question.columns;
    }
    return [question.leftLatex, question.rightLatex].filter(Boolean);
  }

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

  function resetTruthState(question) {
    const expected = buildExpected(question);
    state.expected = expected;
    state.answers = expected.map((row) =>
      row.map((val, index) => (index < question.atoms.length ? val : ""))
    );
    state.feedback = expected.map((row) => Array(row.length).fill(null));
    state.revealed = false;
    state.checked = false;
    hideCheckPopup();
  }

  function resetProofState() {
    state.step = 0;
    state.showAll = false;
  }

  function resetQuestionState() {
    const q = currentQuestion();
    if (!q) return;
    if (state.method === "truth") resetTruthState(q);
    else resetProofState();
  }

  function hideCheckPopup() {
    if (popupTimer) {
      clearTimeout(popupTimer);
      popupTimer = null;
    }
    const popup = $("#checkPopup");
    if (popup) popup.hidden = true;
  }

  function showCheckPopup() {
    const popup = $("#checkPopup");
    const ui = t()?.ui;
    if (popup) {
      popup.hidden = false;
      popup.textContent = ui?.checkIncomplete || "";
    }
    if (popupTimer) clearTimeout(popupTimer);
    popupTimer = setTimeout(() => hideCheckPopup(), 2800);
  }

  function questionCount() {
    return currentList().length;
  }

  function setMethod(method) {
    if (method !== "truth" && method !== "forms") return;
    state.method = method;
    state.questionIndex = 0;
    resetQuestionState();
    renderAll();
  }

  function goQuestion(index) {
    const max = questionCount();
    if (index < 0 || index >= max) return;
    state.questionIndex = index;
    resetQuestionState();
    renderAll();
  }

  function maxProofStep() {
    const q = currentQuestion();
    if (!q?.steps) return 0;
    return q.steps.length + (q.conclusion ? 1 : 0);
  }

  function applyContent() {
    const c = t();
    if (!c) return;
    const map = [
      ["#landingEyebrow", c.landing?.eyebrow],
      ["#landingTitle", c.landing?.title],
      ["#startButton", c.landing?.start],
      ["#appTitle", c.app?.title],
      ["#checkBtn", c.ui?.check],
      ["#revealBtn", c.ui?.reveal],
      ["#prevStepBtn", c.ui?.prev],
      ["#nextStepBtn", c.ui?.next],
      ["#allStepsBtn", c.ui?.all],
      ["#formulasBtn", c.ui?.formulasBtn],
      ["#defModalBody", c.ui?.defText],
      ["#formulasModalTitle", c.ui?.formulasTitle],
      ["#checkPopup", c.ui?.checkIncomplete]
    ];
    for (const [selector, value] of map) {
      const el = $(selector);
      if (el && value != null) el.textContent = value;
    }

    const infoBtn = $("#infoBtn");
    if (infoBtn && c.ui?.infoLabel) {
      infoBtn.setAttribute("aria-label", c.ui.infoLabel);
      infoBtn.title = c.ui.infoLabel;
    }

    const methodLabel = $('label[for="methodSelect"]');
    if (methodLabel && c.ui?.methodLabel) methodLabel.textContent = c.ui.methodLabel;

    const select = $("#methodSelect");
    if (select) {
      select.innerHTML =
        '<option value="truth">' + escapeHtml(c.ui?.methodTruth || "") + "</option>" +
        '<option value="forms">' + escapeHtml(c.ui?.methodForms || "") + "</option>";
      select.value = state.method;
    }

    const list = $("#formulasList");
    if (list && Array.isArray(c.formulas)) {
      list.innerHTML = c.formulas.map((item) => "<li>" + formatInlineMathText(item) + "</li>").join("");
      renderMath(list);
    }
  }

  function renderToolbar() {
    const layout = $("#appLayout");
    const formulasBtn = $("#formulasBtn");
    const select = $("#methodSelect");
    if (layout) layout.dataset.method = state.method;
    if (select) select.value = state.method;
    if (formulasBtn) formulasBtn.hidden = state.method !== "forms";
  }

  function renderNav() {
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
          '" aria-label="ข้อ ' + (i + 1) + '" ' + (i === state.questionIndex ? ' aria-current="true"' : '') + "></button>"
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
    const q = currentQuestion();
    if (!box) return;
    box.innerHTML = q?.prompt || "";
    renderMath(box);
  }

  function allEditableCorrect(q) {
    return state.feedback.every((row) =>
      row.every((cell, c) => c < q.atoms.length || cell === "correct")
    );
  }

  function syncMethodPanels() {
    const showTruth = state.method === "truth";
    const truthPanel = $("#truthPanel");
    const proofPanel = $("#proofPanel");
    if (truthPanel) truthPanel.hidden = !showTruth;
    if (proofPanel) proofPanel.hidden = showTruth;
    return showTruth;
  }

  function renderTruthTable() {
    const tableEl = $("#truthTable");
    const conclusion = $("#truthConclusion");
    if (!tableEl) return;

    if (state.method !== "truth") {
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

    const headers = q.atoms.concat(expressionColumns(q));
    const head = headers
      .map((latex) => '<th scope="col" class="practice-table__th">' + katexHtml(latex) + "</th>")
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
        const verb = q.equivalent ? "สมมูลกับ" : "ไม่สมมูลกับ";
        conclusion.hidden = false;
        conclusion.innerHTML = "ดังนั้น $" + q.leftLatex + "$ " + verb + " $" + q.rightLatex + "$";
        renderMath(conclusion);
      } else {
        conclusion.hidden = true;
        conclusion.textContent = "";
      }
    }
  }

  function renderProof() {
    const box = $("#proofBox");
    if (!box) return;
    if (state.method !== "forms") return;

    const q = currentQuestion();
    const ui = t()?.ui;
    if (!q) {
      box.className = "proof-box proof-box--idle";
      box.textContent = "";
      updateProofButtons();
      return;
    }

    if (!state.showAll && state.step <= 0) {
      box.className = "proof-box proof-box--idle";
      box.textContent = ui?.emptyStep || "";
      updateProofButtons();
      return;
    }

    const steps = q.steps || [];
    const visibleCount = state.showAll ? steps.length : Math.min(state.step, steps.length);
    const showConclusion = Boolean(q.conclusion) && (state.showAll || state.step > steps.length);

    const items = steps.slice(0, visibleCount).map((step) => {
      return (
        '<li class="proof-list__item">' +
        renderProofExprHtml(step.expr) +
        '<p class="proof-list__reason">' +
        formatInlineMathText(step.reason || "") +
        "</p>" +
        "</li>"
      );
    });

    if (showConclusion) {
      items.push(
        '<li class="proof-list__item proof-list__item--conclusion">' +
          '<p class="proof-list__conclusion">' +
          formatInlineMathText(q.conclusion) +
          "</p></li>"
      );
    }

    box.className = "proof-box";
    box.innerHTML = '<ol class="proof-list">' + items.join("") + "</ol>";
    renderMath(box);
    updateProofButtons();
  }

  function updateProofButtons() {
    const prevBtn = $("#prevStepBtn");
    const nextBtn = $("#nextStepBtn");
    const allBtn = $("#allStepsBtn");
    if (!prevBtn || !nextBtn || !allBtn) return;
    const max = maxProofStep();
    prevBtn.disabled = state.showAll || state.step <= 0;
    nextBtn.disabled = state.showAll || state.step >= max;
    allBtn.setAttribute("aria-pressed", state.showAll ? "true" : "false");
  }

  function renderAll() {
    renderToolbar();
    renderNav();
    renderPrompt();
    syncMethodPanels();
    renderTruthTable();
    renderProof();
  }

  function onCellClick(row, col) {
    const q = currentQuestion();
    if (!q || state.method !== "truth") return;
    if (col < q.atoms.length) return;
    if (!state.answers[row]) return;
    state.answers[row][col] = cycleTruth(state.answers[row][col]);
    if (state.feedback[row]) state.feedback[row][col] = null;
    state.checked = false;
    state.revealed = false;
    hideCheckPopup();
    renderTruthTable();
  }

  function checkAnswers() {
    const q = currentQuestion();
    if (!q || state.method !== "truth") return;
    const incomplete = state.answers.some((row) =>
      row.some((val, c) => c >= q.atoms.length && val !== "T" && val !== "F")
    );
    if (incomplete) {
      showCheckPopup();
      return;
    }
    hideCheckPopup();
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

  function revealAnswers() {
    const q = currentQuestion();
    if (!q || state.method !== "truth") return;
    hideCheckPopup();
    state.revealed = true;
    state.checked = true;
    state.answers = state.expected.map((row) => row.slice());
    state.feedback = state.expected.map((row) =>
      row.map((_, c) => (c < q.atoms.length ? null : "correct"))
    );
    renderTruthTable();
  }

  function goPrevStep() {
    if (state.method !== "forms" || state.showAll || state.step <= 0) return;
    state.step -= 1;
    renderProof();
  }

  function goNextStep() {
    if (state.method !== "forms" || state.showAll) return;
    const max = maxProofStep();
    if (state.step >= max) return;
    state.step += 1;
    renderProof();
  }

  function goAllSteps() {
    if (state.method !== "forms") return;
    if (state.showAll) {
      state.showAll = false;
      state.step = 0;
    } else {
      state.showAll = true;
      state.step = maxProofStep();
    }
    renderProof();
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
    state.method = "truth";
    state.questionIndex = 0;
    resetQuestionState();

    $("#startButton")?.addEventListener("click", showApp);

    $("#methodSelect")?.addEventListener("change", (event) => {
      setMethod(event.target.value);
    });

    $("#infoBtn")?.addEventListener("click", () => openModal("#defModal"));
    $("#defCloseBtn")?.addEventListener("click", () => closeModal("#defModal"));
    $("#formulasBtn")?.addEventListener("click", () => openModal("#formulasModal"));
    $("#formulasCloseBtn")?.addEventListener("click", () => closeModal("#formulasModal"));

    document.querySelectorAll("[data-close]").forEach((el) => {
      el.addEventListener("click", () => {
        const which = el.getAttribute("data-close");
        if (which === "def") closeModal("#defModal");
        if (which === "formulas") closeModal("#formulasModal");
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!$("#defModal")?.hidden) closeModal("#defModal");
      if (!$("#formulasModal")?.hidden) closeModal("#formulasModal");
    });

    $("#prevQuestionBtn")?.addEventListener("click", () => goQuestion(state.questionIndex - 1));
    $("#nextQuestionBtn")?.addEventListener("click", () => goQuestion(state.questionIndex + 1));
    $("#questionDots")?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-index]");
      if (!btn) return;
      goQuestion(Number(btn.dataset.index));
    });

    $("#truthTable")?.addEventListener("click", (event) => {
      const cell = event.target.closest(".truth-cell");
      if (!cell) return;
      onCellClick(Number(cell.dataset.row), Number(cell.dataset.col));
    });

    $("#checkBtn")?.addEventListener("click", checkAnswers);
    $("#revealBtn")?.addEventListener("click", revealAnswers);
    $("#prevStepBtn")?.addEventListener("click", goPrevStep);
    $("#nextStepBtn")?.addEventListener("click", goNextStep);
    $("#allStepsBtn")?.addEventListener("click", goAllSteps);

    renderAll();
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();