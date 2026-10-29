(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const TYPE_KEYS = ["natural", "integer", "rational", "irrational"];
  const TYPE_LABEL_KEYS = {
    natural: "colNatural",
    integer: "colInteger",
    rational: "colRational",
    irrational: "colIrrational"
  };

  /** จำโจทย์ที่เพิ่งสุ่มไป เพื่อลดการซ้ำเมื่อกดสุ่มติดกัน */
  const RECENT_LIMIT = 20;

  const state = {
    mode: "learn",
    activeNode: null,
    showVenn: false,
    questions: [],
    answers: [],
    checked: false,
    revealed: false,
    recentIds: []
  };

  let popupTimer = null;

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

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickOne(list, usedIds, preferFresh) {
    const available = list.filter((item) => !usedIds.has(item.id));
    if (available.length === 0) return null;

    const fresh = preferFresh
      ? available.filter((item) => !state.recentIds.includes(item.id))
      : available;
    const pool = shuffle(fresh.length > 0 ? fresh : available);
    return pool[0] || null;
  }

  function rememberRecent(ids) {
    const merged = [...ids, ...state.recentIds];
    const unique = [];
    for (const id of merged) {
      if (!unique.includes(id)) unique.push(id);
      if (unique.length >= RECENT_LIMIT) break;
    }
    state.recentIds = unique;
  }

  /**
   * สุ่ม 5 ข้อ ให้ชนิดกระจายทุกครั้ง:
   * 1 จำนวนนับ, 1 จำนวนเต็มที่ไม่ใช่จำนวนนับ, 1 ตรรกยะที่ไม่ใช่จำนวนเต็ม, 1 อตรรกยะ
   * + 1 ข้อจากคลังที่เหลือ (ไม่ซ้ำในรอบ และหลีกเลี่ยงโจทย์ที่เพิ่งสุ่มไป)
   */
  function buildRound() {
    const bank = t()?.questionBank;
    if (!bank) return [];

    const used = new Set();
    const picked = [];

    const requiredBuckets = [
      bank.naturalPos,
      bank.intNotNatural,
      bank.nonIntRational,
      bank.irrational
    ];

    for (const bucket of requiredBuckets) {
      const item = pickOne(bucket, used, true);
      if (item) {
        used.add(item.id);
        picked.push(item);
      }
    }

    const all = [
      ...bank.naturalPos,
      ...bank.intNotNatural,
      ...bank.nonIntRational,
      ...bank.irrational
    ];
    const filler = pickOne(all, used, true);
    if (filler) {
      used.add(filler.id);
      picked.push(filler);
    }

    const round = shuffle(picked);
    rememberRecent(round.map((q) => q.id));
    return round;
  }

  function blankAnswers(count) {
    return Array.from({ length: count }, () => ({
      natural: false,
      integer: false,
      rational: false,
      irrational: false
    }));
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

  function applyAppContent() {
    const c = t();
    if (!c) return;
    const ui = c.ui || {};
    const title = $("#appTitle");
    if (title) title.textContent = c.app?.title || "จำนวนจริง";

    const modeLabel = $("#modeLabel");
    if (modeLabel) modeLabel.textContent = ui.modeLabel || "โหมด";
    const learnBtn = $("#modeLearnBtn");
    const testBtn = $("#modeTestBtn");
    if (learnBtn) learnBtn.textContent = ui.modeLearn || "ศึกษา";
    if (testBtn) testBtn.textContent = ui.modeTest || "ทดสอบ";

    const learnHint = $("#learnHint");
    if (learnHint) learnHint.textContent = ui.learnHint || "เลือกแผ่นป้ายเพื่อศึกษา";

    const vennLabel = $(".venn-toggle span");
    if (vennLabel) vennLabel.textContent = ui.vennToggle || "";

    const instruction = $("#testInstruction");
    if (instruction) instruction.textContent = ui.testInstruction || "";

    const shuffleBtn = $("#shuffleBtn");
    const checkBtn = $("#checkBtn");
    const revealBtn = $("#revealBtn");
    if (shuffleBtn) shuffleBtn.textContent = ui.shuffle || "สุ่ม";
    if (checkBtn) checkBtn.textContent = ui.check || "ตรวจสอบ";
    if (revealBtn) revealBtn.textContent = ui.reveal || "เฉลย";

    const headers = $$(".quiz-table thead th");
    const headerLabels = [
      ui.colItem || "ข้อ",
      ui.colNumber || "จำนวน",
      ui.colNatural || "จำนวนนับ",
      ui.colInteger || "จำนวนเต็ม",
      ui.colRational || "จำนวนตรรกยะ",
      ui.colIrrational || "จำนวนอตรรกยะ"
    ];
    headers.forEach((th, i) => {
      if (headerLabels[i]) th.textContent = headerLabels[i];
    });
  }

  function setMode(mode) {
    state.mode = mode;
    const learnBtn = $("#modeLearnBtn");
    const testBtn = $("#modeTestBtn");
    const learnPanel = $("#learnPanel");
    const testPanel = $("#testPanel");

    const isLearn = mode === "learn";
    learnBtn?.classList.toggle("mode-btn--active", isLearn);
    testBtn?.classList.toggle("mode-btn--active", !isLearn);
    learnBtn?.setAttribute("aria-pressed", String(isLearn));
    testBtn?.setAttribute("aria-pressed", String(!isLearn));

    if (learnPanel) learnPanel.hidden = !isLearn;
    if (testPanel) testPanel.hidden = isLearn;

    if (!isLearn && state.questions.length === 0) {
      reshuffle();
    }
  }

  function showDefinition(nodeId) {
    const def = t()?.definitions?.[nodeId];
    const box = $("#defBox");
    const body = $("#defBoxBody");
    if (!def || !box || !body) return;

    state.activeNode = nodeId;
    body.innerHTML = def;
    box.hidden = false;
    $$(".tree-node").forEach((btn) => {
      btn.classList.toggle("tree-node--active", btn.dataset.node === nodeId);
    });
    renderMath(body);
  }

  function closeDefinition() {
    state.activeNode = null;
    const box = $("#defBox");
    if (box) box.hidden = true;
    $$(".tree-node").forEach((btn) => btn.classList.remove("tree-node--active"));
  }

  function setVennVisible(show) {
    state.showVenn = show;
    const checkbox = $("#vennCheckbox");
    const treeView = $("#treeView");
    const vennView = $("#vennView");
    if (checkbox) checkbox.checked = show;
    if (treeView) treeView.hidden = show;
    if (vennView) vennView.hidden = !show;
    if (show) {
      closeDefinition();
      renderMath(vennView || document.body);
    } else {
      requestAnimationFrame(updateTreeLines);
    }
  }

  function hidePopup() {
    const popup = $("#testPopup");
    if (!popup) return;
    popup.hidden = true;
    if (popupTimer) {
      clearTimeout(popupTimer);
      popupTimer = null;
    }
  }

  function showPopup(message) {
    const popup = $("#testPopup");
    if (!popup) return;
    popup.textContent = message;
    popup.hidden = false;
    if (popupTimer) clearTimeout(popupTimer);
    popupTimer = setTimeout(() => {
      popup.hidden = true;
      popupTimer = null;
    }, 1800);
  }

  function resetQuizFlags() {
    state.checked = false;
    state.revealed = false;
    hidePopup();
    const result = $("#testResult");
    if (result) {
      result.hidden = true;
      result.textContent = "";
      result.classList.remove("result-line--ok", "result-line--bad");
    }
  }

  function reshuffle() {
    state.questions = buildRound();
    state.answers = blankAnswers(state.questions.length);
    resetQuizFlags();
    renderQuiz();
  }

  function renderQuiz() {
    const body = $("#quizBody");
    const ui = t()?.ui || {};
    if (!body) return;

    body.innerHTML = state.questions
      .map((q, index) => {
        const ans = state.answers[index] || {};
        const cells = TYPE_KEYS.map((key) => {
          const marked = !!ans[key];
          const correct = !!q[key];
          let extra = "";
          if (state.revealed) {
            if (correct) extra += " quiz-check--correct";
            if (marked !== correct) extra += " quiz-check--miss";
          }
          return `
            <td>
              <button
                type="button"
                class="quiz-check${marked ? " quiz-check--mark" : ""}${extra}"
                data-row="${index}"
                data-type="${key}"
                aria-pressed="${marked}"
                aria-label="${escapeHtml(ui[TYPE_LABEL_KEYS[key]] || key)}"
                ${state.revealed ? "disabled" : ""}
              ></button>
            </td>`;
        }).join("");

        let rowClass = "";
        if (state.revealed || state.checked) {
          const ok = TYPE_KEYS.every((key) => !!ans[key] === !!q[key]);
          rowClass = ok ? " quiz-row--ok" : " quiz-row--bad";
          if (state.revealed) rowClass += " quiz-row--reveal";
        }

        return `
          <tr class="${rowClass.trim()}">
            <td>${index + 1})</td>
            <td class="cell-num">$${q.latex}$</td>
            ${cells}
          </tr>`;
      })
      .join("");

    renderMath(body);
  }

  function toggleAnswer(row, type) {
    if (state.revealed) return;
    const ans = state.answers[row];
    if (!ans || !TYPE_KEYS.includes(type)) return;
    ans[type] = !ans[type];
    if (state.checked) {
      state.checked = false;
      const result = $("#testResult");
      if (result) {
        result.hidden = true;
        result.textContent = "";
        result.classList.remove("result-line--ok", "result-line--bad");
      }
    }
    renderQuiz();
  }

  function hasAnyAnswer(ans) {
    return TYPE_KEYS.some((key) => ans[key]);
  }

  function checkAnswers() {
    const ui = t()?.ui || {};
    if (state.questions.length === 0 || state.revealed) return;

    const incomplete = state.answers.some((ans) => !hasAnyAnswer(ans));
    if (incomplete) {
      showPopup(ui.checkIncomplete || "เลือกคำตอบอย่างน้อย 1 ช่องในทุกข้อก่อน");
      return;
    }

    hidePopup();
    state.checked = true;

    const allCorrect = state.questions.every((q, i) =>
      TYPE_KEYS.every((key) => !!state.answers[i][key] === !!q[key])
    );

    const result = $("#testResult");
    if (result) {
      result.hidden = false;
      result.textContent = allCorrect
        ? ui.resultCorrect || "ถูกต้อง"
        : ui.resultWrong || "ยังไม่ถูกต้อง กดปุ่ม เฉลย เพื่อดูคำตอบ";
      result.classList.toggle("result-line--ok", allCorrect);
      result.classList.toggle("result-line--bad", !allCorrect);
    }

    renderQuiz();
  }

  function revealAnswers() {
    if (state.questions.length === 0) return;

    hidePopup();
    state.revealed = true;
    state.checked = true;
    state.answers = state.questions.map((q) => ({
      natural: !!q.natural,
      integer: !!q.integer,
      rational: !!q.rational,
      irrational: !!q.irrational
    }));

    const result = $("#testResult");
    const ui = t()?.ui || {};
    if (result) {
      result.hidden = false;
      result.textContent = ui.resultCorrect || "ถูกต้อง";
      result.classList.add("result-line--ok");
      result.classList.remove("result-line--bad");
    }

    renderQuiz();
  }

  function nodeBox(tree, sel, sx, sy) {
    const el = $(sel, tree);
    if (!el) return null;
    const tr = tree.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return {
      cx: ((r.left + r.right) / 2 - tr.left) * sx,
      top: (r.top - tr.top) * sy,
      bottom: (r.bottom - tr.top) * sy
    };
  }

  function forkPath(parent, children) {
    // ทับขอบการ์ดเล็กน้อย (SVG อยู่ใต้การ์ด) เพื่อไม่ให้เหลือช่องว่างจาก subpixel
    const overlap = 2;
    const fromY = parent.bottom - overlap;
    const childEnd = (c) => c.top + overlap;
    const midY = (fromY + Math.min(...children.map(childEnd))) / 2;
    const sorted = [...children].sort((a, b) => a.cx - b.cx);
    const f = (n) => +n.toFixed(1);
    // เส้นต่อเนื่อง: ลงจากพ่อ → ไปลูกซ้ายสุด → กลับมาแยกไปลูกอื่น
    const first = sorted[0];
    let d = `M${f(parent.cx)} ${f(fromY)} L${f(parent.cx)} ${f(midY)} L${f(first.cx)} ${f(midY)} L${f(first.cx)} ${f(childEnd(first))}`;
    for (let i = 1; i < sorted.length; i += 1) {
      const c = sorted[i];
      d += ` M${f(parent.cx)} ${f(midY)} L${f(c.cx)} ${f(midY)} L${f(c.cx)} ${f(childEnd(c))}`;
    }
    return d;
  }

  /** วาดเส้นเชื่อมให้ชิดขอบบน/ล่างของการ์ดจริง (ไม่มีช่องว่าง) */
  function updateTreeLines() {
    const tree = $(".number-tree");
    const svg = $(".number-tree__lines");
    if (!tree || !svg || tree.closest("[hidden]")) return;

    const tr = tree.getBoundingClientRect();
    if (tr.width < 1 || tr.height < 1) return;

    const sx = 1100 / tr.width;
    const sy = 680 / tr.height;
    const r = nodeBox(tree, ".tree-node--r", sx, sy);
    const q = nodeBox(tree, ".tree-node--q", sx, sy);
    const irr = nodeBox(tree, ".tree-node--irr", sx, sy);
    const z = nodeBox(tree, ".tree-node--z", sx, sy);
    const nonz = nodeBox(tree, ".tree-node--nonz", sx, sy);
    const neg = nodeBox(tree, ".tree-node--neg", sx, sy);
    const zero = nodeBox(tree, ".tree-node--zero", sx, sy);
    const pos = nodeBox(tree, ".tree-node--pos", sx, sy);
    if (!r || !q || !irr || !z || !nonz || !neg || !zero || !pos) return;

    const paths = $$("path", svg);
    if (paths[0]) paths[0].setAttribute("d", forkPath(r, [q, irr]));
    if (paths[1]) paths[1].setAttribute("d", forkPath(q, [z, nonz]));
    if (paths[2]) paths[2].setAttribute("d", forkPath(z, [neg, zero, pos]));
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
    setMode("learn");
    setVennVisible(false);
    requestAnimationFrame(updateTreeLines);
  }

  function bindEvents() {
    $("#startButton")?.addEventListener("click", showApp);

    $("#modeLearnBtn")?.addEventListener("click", () => {
      setMode("learn");
      requestAnimationFrame(updateTreeLines);
    });
    $("#modeTestBtn")?.addEventListener("click", () => setMode("test"));

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (state.mode === "learn" && !state.showVenn) updateTreeLines();
      }, 80);
    });

    $$(".tree-node").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.node;
        if (!id) return;
        if (state.activeNode === id) closeDefinition();
        else showDefinition(id);
      });
    });

    $("#defCloseBtn")?.addEventListener("click", closeDefinition);

    $("#vennCheckbox")?.addEventListener("change", (e) => {
      setVennVisible(!!e.target.checked);
    });

    $("#vennCloseBtn")?.addEventListener("click", () => setVennVisible(false));

    $("#shuffleBtn")?.addEventListener("click", reshuffle);
    $("#checkBtn")?.addEventListener("click", checkAnswers);
    $("#revealBtn")?.addEventListener("click", revealAnswers);

    $("#quizBody")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".quiz-check");
      if (!btn || btn.disabled) return;
      const row = Number(btn.dataset.row);
      const type = btn.dataset.type;
      if (Number.isInteger(row) && type) toggleAnswer(row, type);
    });
  }

  function init() {
    applyLandingContent();
    applyAppContent();
    bindEvents();
    renderMath(document.body);
    requestAnimationFrame(updateTreeLines);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => requestAnimationFrame(updateTreeLines));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
