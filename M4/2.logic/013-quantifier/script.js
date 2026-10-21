(() => {
  const $ = (selector, root = document) => root.querySelector(selector);

  const state = {
    questionIndex: 0,
    selected: null,
    checked: false,
    revealed: false,
    lastFocus: null
  };

  let popupTimer = null;

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

  function resetAnswerState() {
    state.selected = null;
    state.checked = false;
    state.revealed = false;
    hidePopup();
  }

  function hidePopup() {
    const popup = $("#checkPopup");
    if (!popup) return;
    popup.hidden = true;
    if (popupTimer) {
      clearTimeout(popupTimer);
      popupTimer = null;
    }
  }

  function showPopup() {
    const popup = $("#checkPopup");
    const ui = t()?.ui;
    if (!popup) return;
    popup.textContent = ui?.checkIncomplete || "เลือกคำตอบก่อน";
    popup.hidden = false;
    if (popupTimer) clearTimeout(popupTimer);
    popupTimer = setTimeout(() => {
      popup.hidden = true;
      popupTimer = null;
    }, 1800);
  }

  function applyContent() {
    const c = t();
    if (!c) return;
    const setText = (id, value) => {
      const el = $(id);
      if (el && value != null) el.textContent = value;
    };
    setText("#landingEyebrow", c.landing?.eyebrow);
    const landingTitle = $("#landingTitle");
    if (landingTitle && c.landing?.title != null) {
      landingTitle.innerHTML = escapeHtml(c.landing.title).replaceAll("\n", "<br>");
    }
    setText("#startButton", c.landing?.start);
    setText("#appTitle", c.app?.title);
    setText("#checkBtn", c.ui?.check);
    setText("#revealBtn", c.ui?.reveal);
    setText("#answerPrompt", c.ui?.answerPrompt);
    const infoBtn = $("#infoBtn");
    if (infoBtn) {
      infoBtn.setAttribute("aria-label", c.ui?.infoLabel || "ความหมาย");
      infoBtn.title = c.ui?.infoLabel || "ความหมาย";
    }
    const trueBtn = $('.choice-btn[data-value="T"]');
    const falseBtn = $('.choice-btn[data-value="F"]');
    if (trueBtn) trueBtn.textContent = c.ui?.choiceTrue || "จริง";
    if (falseBtn) falseBtn.textContent = c.ui?.choiceFalse || "เท็จ";
    updateDefModalBody();
  }

  function updateDefModalBody() {
    const body = $("#defModalBody");
    const text = t()?.ui?.defText || "";
    if (!body) return;
    body.innerHTML = text
      .split("\n")
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("");
    renderMath(body);
  }

  function renderNav() {
    const list = questions();
    const total = list.length;
    const ui = t()?.ui;
    const label = $("#questionLabel");
    if (label) {
      label.textContent = (ui?.questionOf || "ข้อ {n}/{total}")
        .replace("{n}", String(state.questionIndex + 1))
        .replace("{total}", String(total));
    }

    const dots = $("#questionDots");
    if (dots) {
      dots.innerHTML = list
        .map((_, index) => {
          const active = index === state.questionIndex;
          return (
            `<button type="button" class="question-dot${active ? " is-active" : ""}"` +
            ` data-index="${index}" aria-label="ข้อ ${index + 1}"` +
            `${active ? ' aria-current="true"' : ""}></button>`
          );
        })
        .join("");
    }

    const prev = $("#prevQuestionBtn");
    const next = $("#nextQuestionBtn");
    if (prev) prev.disabled = state.questionIndex <= 0;
    if (next) next.disabled = state.questionIndex >= total - 1;
  }

  function renderPrompt() {
    const box = $("#promptBox");
    const q = currentQuestion();
    if (!box || !q) return;
    const parts = [];
    if (q.universe) {
      parts.push(`<p class="prompt-box__universe">${escapeHtml(q.universe)}</p>`);
    }
    if (q.sentence) {
      parts.push(`<p class="prompt-box__sentence">${escapeHtml(q.sentence)}</p>`);
    }
    if (q.sentenceLatex) {
      parts.push(`<p class="prompt-box__latex">$${escapeHtml(q.sentenceLatex)}$</p>`);
    }
    box.innerHTML = parts.join("");
    renderMath(box);
  }

  function renderChoices() {
    const q = currentQuestion();
    document.querySelectorAll(".choice-btn").forEach((btn) => {
      const value = btn.dataset.value;
      const selected = state.selected === value;
      btn.classList.toggle("is-selected", selected);
      btn.setAttribute("aria-checked", selected ? "true" : "false");
      btn.classList.remove("is-correct", "is-wrong");

      if (!q || (!state.checked && !state.revealed)) return;

      if (state.revealed && value === q.answer) {
        btn.classList.add("is-correct");
        return;
      }
      if (selected) {
        btn.classList.add(value === q.answer ? "is-correct" : "is-wrong");
      }
    });
  }

  function renderResult() {
    const line = $("#resultLine");
    const ui = t()?.ui;
    const q = currentQuestion();
    if (!line || !q) return;

    if (!state.checked && !state.revealed) {
      line.hidden = true;
      line.textContent = "";
      line.classList.remove("is-ok", "is-bad");
      return;
    }

    line.hidden = false;
    if (state.revealed) {
      const answerLabel =
        q.answer === "T" ? ui?.choiceTrue || "จริง" : ui?.choiceFalse || "เท็จ";
      line.classList.remove("is-bad");
      line.classList.add("is-ok");
      line.textContent = `คำตอบที่ถูก: ${answerLabel}`;
      return;
    }

    if (state.selected === q.answer) {
      line.classList.add("is-ok");
      line.classList.remove("is-bad");
      line.textContent = ui?.resultCorrect || "ถูกต้อง";
    } else {
      line.classList.add("is-bad");
      line.classList.remove("is-ok");
      line.textContent = ui?.resultWrong || "ยังไม่ถูกต้อง กดปุ่ม เฉลย เพื่อดูคำตอบ";
    }
  }

  function renderSolution() {
    const box = $("#solutionBox");
    const body = $("#solutionBody");
    const title = box ? $(".solution-box__title", box) : null;
    const ui = t()?.ui;
    const q = currentQuestion();
    if (!box || !body || !q) return;

    const show = state.revealed || (state.checked && state.selected === q.answer);
    if (!show) {
      box.hidden = true;
      body.innerHTML = "";
      return;
    }

    if (title) title.textContent = ui?.solutionTitle || "วิธีทำ";

    const steps = Array.isArray(q.solution) ? q.solution : [];
    body.innerHTML = `<ul class="solution-list">${steps
      .map((step) => `<li>${escapeHtml(step)}</li>`)
      .join("")}</ul>`;
    box.hidden = false;
    renderMath(body);
  }

  function renderAll() {
    renderNav();
    renderPrompt();
    renderChoices();
    renderResult();
    renderSolution();
  }

  function goQuestion(index) {
    const list = questions();
    if (index < 0 || index >= list.length || index === state.questionIndex) return;
    state.questionIndex = index;
    resetAnswerState();
    renderAll();
  }

  function selectChoice(value) {
    if (value !== "T" && value !== "F") return;
    state.selected = value;
    state.checked = false;
    state.revealed = false;
    hidePopup();
    renderAll();
  }

  function checkAnswer() {
    if (state.selected !== "T" && state.selected !== "F") {
      showPopup();
      return;
    }
    hidePopup();
    state.checked = true;
    state.revealed = false;
    renderAll();
  }

  function revealAnswer() {
    const q = currentQuestion();
    if (!q) return;
    hidePopup();
    state.revealed = true;
    state.checked = true;
    state.selected = q.answer;
    renderAll();
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
    resetAnswerState();
    renderAll();
    openModal("#defModal");
  }

  function bootstrap() {
    applyContent();
    state.questionIndex = 0;
    resetAnswerState();

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

    $("#choiceGroup")?.addEventListener("click", (event) => {
      const btn = event.target.closest(".choice-btn");
      if (!btn) return;
      selectChoice(btn.dataset.value);
    });

    $("#checkBtn")?.addEventListener("click", checkAnswer);
    $("#revealBtn")?.addEventListener("click", revealAnswer);

    renderAll();
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
