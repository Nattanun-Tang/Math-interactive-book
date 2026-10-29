(() => {
  const $ = (selector, root = document) => root.querySelector(selector);

  const state = {
    mode: "learn",
    categoryId: null,
    itemId: null,
    questionIndex: 0,
    answers: [],
    checked: false,
    revealed: false,
    modalOpen: false
  };

  function t() {
    return window.CONTENT?.th;
  }

  function categories() {
    return t()?.categories || [];
  }

  function currentCategory() {
    return categories().find((c) => c.id === state.categoryId) || categories()[0] || null;
  }

  function questions() {
    return t()?.questions || [];
  }

  function propertyKeys() {
    return t()?.propertyKeys || ["add", "sub", "mul", "div"];
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function formatStatement(html) {
    return String(html || "")
      .split(/<br\s*\/?>/i)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<span class="item-card__line">${line}</span>`)
      .join("");
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

  function ensureCategory() {
    const cats = categories();
    if (!cats.length) {
      state.categoryId = null;
      state.itemId = null;
      return;
    }
    if (!cats.some((c) => c.id === state.categoryId)) {
      state.categoryId = cats[0].id;
    }
    const cat = currentCategory();
    if (!cat) return;
    if (cat.layout === "list") {
      const ids = (cat.items || []).map((i) => i.id);
      if (!ids.includes(state.itemId)) state.itemId = ids[0] || null;
    } else {
      state.itemId = null;
    }
  }

  function blankAnswers() {
    const keys = propertyKeys();
    return questions().map(() => {
      const row = {};
      keys.forEach((k) => {
        row[k] = false;
      });
      return row;
    });
  }

  function applyLandingContent() {
    const c = t();
    if (!c) return;
    const eyebrow = $("#landingEyebrow");
    const title = $("#landingTitle");
    const start = $("#startButton");
    if (eyebrow) eyebrow.textContent = c.landing?.eyebrow || "";
    if (title) title.textContent = c.landing?.title || "";
    if (start) start.textContent = c.landing?.start || "เริ่ม";
  }

  function applyAppChrome() {
    const c = t();
    if (!c) return;
    const ui = c.ui || {};
    const title = $("#appTitle");
    if (title) title.textContent = c.app?.title || c.landing?.title || "";

    const modeLabel = $("#modeLabel");
    if (modeLabel) modeLabel.textContent = ui.modeLabel || "โหมด";
    const learnBtn = $("#modeLearnBtn");
    const testBtn = $("#modeTestBtn");
    if (learnBtn) learnBtn.textContent = ui.modeLearn || "ศึกษา";
    if (testBtn) testBtn.textContent = ui.modeTest || "ทดสอบ";

    const categoryLabel = $("#categoryLabel");
    if (categoryLabel) categoryLabel.textContent = ui.categoryLabel || "ตัวเลือก";

    const instruction = $("#testInstruction");
    if (instruction) instruction.textContent = ui.testInstruction || "";

    const checkBtn = $("#checkBtn");
    const revealBtn = $("#revealBtn");
    if (checkBtn) checkBtn.textContent = ui.check || "ตรวจสอบ";
    if (revealBtn) revealBtn.textContent = ui.reveal || "เฉลย";

    const propHeader = $("#quizPropHeader");
    if (propHeader) propHeader.textContent = ui.quizPropHeader || "สมบัติ";
  }

  function setMode(mode) {
    state.mode = mode;
    const isLearn = mode === "learn";
    const learnBtn = $("#modeLearnBtn");
    const testBtn = $("#modeTestBtn");
    const learnPanel = $("#learnPanel");
    const testPanel = $("#testPanel");
    const categoryBar = $("#categoryBar");

    learnBtn?.classList.toggle("mode-btn--active", isLearn);
    testBtn?.classList.toggle("mode-btn--active", !isLearn);
    learnBtn?.setAttribute("aria-pressed", String(isLearn));
    testBtn?.setAttribute("aria-pressed", String(!isLearn));

    if (learnPanel) learnPanel.hidden = !isLearn;
    if (testPanel) testPanel.hidden = isLearn;
    if (categoryBar) categoryBar.hidden = !isLearn;

    closeModal();

    if (isLearn) {
      renderCategorySelect();
      renderLearn();
    } else {
      if (state.answers.length === 0) {
        state.answers = blankAnswers();
        state.questionIndex = 0;
        state.checked = false;
        state.revealed = false;
      }
      renderTest();
    }
  }

  function renderCategorySelect() {
    const select = $("#categorySelect");
    if (!select) return;
    ensureCategory();
    select.innerHTML = categories()
      .map((cat) => {
        const selected = cat.id === state.categoryId ? " selected" : "";
        return `<option value="${escapeHtml(cat.id)}"${selected}>${escapeHtml(cat.label)}</option>`;
      })
      .join("");
  }

  function hintText(cat) {
    const ui = t()?.ui || {};
    const key = cat?.hintKey || "learnHintEquality";
    return ui[key] || ui.learnHintEquality || "";
  }

  function renderLearn() {
    const cat = currentCategory();
    const stage = $("#learnStage");
    const hint = $("#learnHint");
    if (!stage) return;

    if (hint) {
      hint.innerHTML = hintText(cat);
      renderMath(hint);
    }

    if (!cat) {
      stage.innerHTML = "";
      return;
    }

    if (cat.layout === "table") {
      stage.innerHTML = renderSystemTable(cat);
      renderMath(stage);
      return;
    }

    stage.innerHTML = renderListLayout(cat);
    renderMath(stage);
  }

  function renderListLayout(cat) {
    const ui = t()?.ui || {};
    const items = cat.items || [];
    const active = items.find((i) => i.id === state.itemId) || items[0];
    if (active && active.id !== state.itemId) state.itemId = active.id;

    const listHtml = items
      .map((item, index) => {
        const isActive = item.id === state.itemId;
        return `
          <button
            type="button"
            class="item-card${isActive ? " item-card--active" : ""}"
            data-item="${escapeHtml(item.id)}"
            aria-pressed="${isActive}"
          >
            <span class="item-card__num">${index + 1}.</span>
            <span class="item-card__body">
              <span class="item-card__title">${escapeHtml(item.title)}</span>
              <span class="item-card__statement">${formatStatement(item.statement)}</span>
            </span>
          </button>`;
      })
      .join("");

    const examples = (active?.examples || [])
      .map(
        (ex, i) =>
          `<li class="example-list__item"><span class="example-list__num">${i + 1})</span><span class="example-list__body">${ex}</span></li>`
      )
      .join("");

    // บทนิยาม / ทฤษฎีบท (4): จัดเลขข้อระดับเดียวกับแกนคณิต (=)
    const mathBaseline = cat.id === "definition" || cat.id === "theorem4";

    return `
      <div class="learn-split">
        <div class="item-list" role="listbox" aria-label="${escapeHtml(cat.label)}">
          ${listHtml}
        </div>
        <div class="example-panel${mathBaseline ? " example-panel--math-baseline" : ""}" aria-live="polite">
          <h2 class="example-panel__title">${escapeHtml(ui.exampleTitle || "ตัวอย่าง")}</h2>
          <ol class="example-list">${examples}</ol>
        </div>
      </div>`;
  }

  function renderSystemTable(cat) {
    const ui = t()?.ui || {};
    const rows = cat.rows || [];

    const propCell = (cell) => {
      if (!cell) return "";
      const noteHtml = cell.note
        ? `<span class="prop-cell__note">${cell.note}</span>`
        : "";
      return `
      <button type="button" class="prop-cell" data-prop="${escapeHtml(cell.id)}">
        <span class="prop-cell__num">${escapeHtml(cell.title)}</span>
        <span class="prop-cell__math">$${cell.latex}$</span>
        ${noteHtml}
      </button>`;
    };

    const body = rows
      .map((row) => {
        if (row.span) {
          return `
            <tr>
              <td colspan="2">${propCell(row.span)}</td>
            </tr>`;
        }

        return `
          <tr>
            <td>${propCell(row.add)}</td>
            <td>${propCell(row.mul)}</td>
          </tr>`;
      })
      .join("");

    return `
      <div class="system-table-wrap">
        <table class="system-table" aria-label="${escapeHtml(cat.label)}">
          <thead>
            <tr>
              <th scope="col">${escapeHtml(ui.colAddition || "การบวก")}</th>
              <th scope="col">${escapeHtml(ui.colMultiplication || "การคูณ")}</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;
  }

  function findSystemProp(propId) {
    const cat = categories().find((c) => c.id === "system");
    if (!cat) return null;
    for (const row of cat.rows || []) {
      if (row.span?.id === propId) return row.span;
      if (row.add?.id === propId) return row.add;
      if (row.mul?.id === propId) return row.mul;
    }
    return null;
  }

  function openModal(prop) {
    const modal = $("#exampleModal");
    const title = $("#exampleModalTitle");
    const body = $("#exampleModalBody");
    if (!modal || !prop || !title || !body) return;

    title.textContent = prop.title || "";
    body.innerHTML = (prop.body || []).map((line) => `<p>${line}</p>`).join("");
    modal.hidden = false;
    state.modalOpen = true;
    renderMath(body);
    $("#exampleCloseBtn")?.focus();
  }

  function closeModal() {
    const modal = $("#exampleModal");
    if (modal) modal.hidden = true;
    state.modalOpen = false;
  }

  function currentQuestion() {
    return questions()[state.questionIndex] || null;
  }

  function clearResultLine() {
    const result = $("#testResult");
    if (!result) return;
    result.hidden = true;
    result.textContent = "";
    result.classList.remove("result-line--ok", "result-line--bad");
  }

  function setQuestionIndex(index) {
    const total = questions().length;
    if (total === 0) return;
    state.questionIndex = Math.max(0, Math.min(total - 1, index));
    state.checked = false;
    state.revealed = false;
    clearResultLine();
    renderTest();
  }

  function renderTest() {
    const ui = t()?.ui || {};
    const keys = propertyKeys();
    const labels = t()?.propertyLabels || {};
    const q = currentQuestion();
    const total = questions().length;
    const idx = state.questionIndex;

    const progress = $("#testProgress");
    if (progress) {
      progress.textContent = (ui.progress || "ข้อ {n}/{total}")
        .replace("{n}", String(idx + 1))
        .replace("{total}", String(total));
    }

    const dots = $("#testDots");
    if (dots) {
      dots.innerHTML = questions()
        .map((_, i) => {
          const active = i === idx ? " test-dot--active" : "";
          return `<button type="button" class="test-dot${active}" data-q="${i}" aria-label="ข้อ ${i + 1}"${i === idx ? ' aria-current="true"' : ""}></button>`;
        })
        .join("");
    }

    const prevBtn = $("#testPrevBtn");
    const nextBtn = $("#testNextBtn");
    if (prevBtn) prevBtn.disabled = idx <= 0;
    if (nextBtn) nextBtn.disabled = idx >= total - 1;

    const setHeader = $("#quizSetHeader");
    if (setHeader && q) {
      setHeader.innerHTML = q.setLatex ? `$${q.setLatex}$` : escapeHtml(q.setLabel || "");
    }

    const body = $("#quizBody");
    const ans = state.answers[idx] || {};
    if (body && q) {
      body.innerHTML = keys
        .map((key) => {
          const marked = !!ans[key];
          const correct = !!q.correct?.[key];
          let extra = "";
          let rowClass = "";
          if (state.revealed || state.checked) {
            rowClass = marked === correct ? " quiz-row--ok" : " quiz-row--bad";
          }
          if (state.revealed) {
            if (correct) extra += " quiz-check--correct";
            if (marked !== correct) extra += " quiz-check--miss";
          }
          return `
            <tr${rowClass ? ` class="${rowClass.trim()}"` : ""}>
              <th scope="row">${escapeHtml(labels[key] || key)}</th>
              <td>
                <button
                  type="button"
                  class="quiz-check${marked ? " quiz-check--mark" : ""}${extra}"
                  data-type="${key}"
                  aria-pressed="${marked}"
                  aria-label="${escapeHtml(labels[key] || key)}"
                  ${state.revealed ? "disabled" : ""}
                ></button>
              </td>
            </tr>`;
        })
        .join("");
    }

    renderSolution();
    renderMath($("#testPanel") || document.body);
  }

  function renderSolution() {
    const box = $("#solutionBox");
    const ui = t()?.ui || {};
    const labels = t()?.propertyLabels || {};
    const keys = propertyKeys();
    const q = currentQuestion();
    if (!box) return;

    if (!state.revealed || !q) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }

    const lines = keys
      .map((key) => {
        const sol = q.solutions?.[key];
        if (!sol) return "";
        const status = sol.ok
          ? `<span class="solution-ok">${escapeHtml(ui.hasProperty || "มีสมบัตินี้")}</span>`
          : `<span class="solution-bad">${escapeHtml(ui.noProperty || "ไม่มีสมบัตินี้")}</span>`;
        const counter = sol.ok
          ? ""
          : `<span class="solution-counter"> (${escapeHtml(ui.counterPrefix || "ตัวอย่างค้าน")})</span>`;
        return `
          <li class="solution-list__item">
            <p class="solution-list__head"><strong>${escapeHtml(labels[key] || key)}</strong> — ${status}${counter}</p>
            <p class="solution-list__detail">${sol.detail}</p>
          </li>`;
      })
      .join("");

    box.hidden = false;
    box.innerHTML = `
      <h3 class="solution-box__title">${escapeHtml(ui.solutionTitle || "เฉลยละเอียด")}</h3>
      <ul class="solution-list">${lines}</ul>`;
  }

  function toggleAnswer(type) {
    if (state.revealed) return;
    const keys = propertyKeys();
    if (!keys.includes(type)) return;
    const ans = state.answers[state.questionIndex];
    if (!ans) return;
    ans[type] = !ans[type];
    if (state.checked) {
      state.checked = false;
      clearResultLine();
    }
    renderTest();
  }

  function answersMatch(ans, correct) {
    return propertyKeys().every((key) => !!ans[key] === !!correct[key]);
  }

  function checkAnswers() {
    const ui = t()?.ui || {};
    const q = currentQuestion();
    if (!q || state.revealed) return;

    state.checked = true;
    const ans = state.answers[state.questionIndex] || {};
    const ok = answersMatch(ans, q.correct || {});

    const result = $("#testResult");
    if (result) {
      result.hidden = false;
      result.textContent = ok
        ? ui.resultCorrect || "ถูกต้อง"
        : ui.resultWrong || "ยังไม่ถูกต้อง กดปุ่ม เฉลย เพื่อดูคำตอบละเอียด";
      result.classList.toggle("result-line--ok", ok);
      result.classList.toggle("result-line--bad", !ok);
    }

    renderTest();
  }

  function revealAnswers() {
    const q = currentQuestion();
    if (!q) return;

    let ans = state.answers[state.questionIndex];
    if (!ans) {
      ans = {};
      propertyKeys().forEach((key) => {
        ans[key] = false;
      });
      state.answers[state.questionIndex] = ans;
    }

    state.revealed = true;
    state.checked = true;

    propertyKeys().forEach((key) => {
      ans[key] = !!q.correct?.[key];
    });

    const result = $("#testResult");
    const ui = t()?.ui || {};
    if (result) {
      result.hidden = false;
      result.textContent = ui.resultCorrect || "ถูกต้อง";
      result.classList.add("result-line--ok");
      result.classList.remove("result-line--bad");
    }

    renderTest();
  }

  function showApp() {
    const landing = $("#landingPage");
    const app = $("#appPage");
    if (landing) {
      landing.classList.remove("view--active");
      landing.hidden = true;
    }
    if (app) {
      app.hidden = false;
      app.classList.add("view--active");
      $("#appTitle")?.focus();
    }
    state.answers = blankAnswers();
    setMode("learn");
  }

  function bindEvents() {
    $("#startButton")?.addEventListener("click", showApp);

    $("#modeLearnBtn")?.addEventListener("click", () => setMode("learn"));
    $("#modeTestBtn")?.addEventListener("click", () => setMode("test"));

    $("#categorySelect")?.addEventListener("change", (e) => {
      state.categoryId = e.target.value;
      state.itemId = null;
      ensureCategory();
      closeModal();
      renderLearn();
    });

    $("#learnStage")?.addEventListener("click", (e) => {
      const itemBtn = e.target.closest("[data-item]");
      if (itemBtn) {
        state.itemId = itemBtn.dataset.item;
        renderLearn();
        return;
      }
      const propBtn = e.target.closest("[data-prop]");
      if (propBtn) {
        const prop = findSystemProp(propBtn.dataset.prop);
        if (prop) openModal(prop);
      }
    });

    $("#exampleCloseBtn")?.addEventListener("click", closeModal);
    $("#exampleModal")?.addEventListener("click", (e) => {
      if (e.target?.dataset?.close === "true") closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.modalOpen) closeModal();
    });

    $("#testPrevBtn")?.addEventListener("click", () => setQuestionIndex(state.questionIndex - 1));
    $("#testNextBtn")?.addEventListener("click", () => setQuestionIndex(state.questionIndex + 1));

    $("#testDots")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-q]");
      if (!btn) return;
      setQuestionIndex(Number(btn.dataset.q));
    });

    $("#quizBody")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".quiz-check");
      if (!btn || btn.disabled) return;
      toggleAnswer(btn.dataset.type);
    });

    $("#checkBtn")?.addEventListener("click", checkAnswers);
    $("#revealBtn")?.addEventListener("click", revealAnswers);
  }

  function init() {
    applyLandingContent();
    applyAppChrome();
    renderCategorySelect();
    bindEvents();
    renderMath(document.body);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
