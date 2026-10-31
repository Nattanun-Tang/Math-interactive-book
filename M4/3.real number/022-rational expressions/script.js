(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const state = {
    topic: "simplify",
    mode: "learn",
    learnIndex: 0,
    testIndex: 0,
    stepVisible: 1,
    cancelled: new Set(),
    selectedChip: null,
    testProblem: null,
    testCancelled: new Set(),
    testSelectedChip: null,
    testChoice: null,
    testExcluded: new Set(),
    feedback: null,
    revealed: false
  };

  function t() {
    return window.CONTENT?.th;
  }

  function topicData() {
    return t()?.topics?.[state.topic];
  }

  function learnList() {
    return topicData()?.learn || [];
  }

  function testPool() {
    return topicData()?.testPool || [];
  }

  function currentLearn() {
    return learnList()[state.learnIndex] || null;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function katexHtml(tex, displayMode = false) {
    if (typeof katex?.renderToString === "function") {
      try {
        return katex.renderToString(tex, { throwOnError: false, displayMode });
      } catch {
        /* fall through */
      }
    }
    return `<span class="katex-fallback">${escapeHtml(tex)}</span>`;
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

  function pairKey(a, b) {
    return [a, b].sort().join("|");
  }

  function requiredPairKeys(pairs) {
    return new Set((pairs || []).map(([a, b]) => pairKey(a, b)));
  }

  /** Pair identity by factor keys so equivalent chips (e.g. two x+3) count the same. */
  function keyPairFromIds(cancel, idA, idB) {
    const chipA = chipById(cancel, idA);
    const chipB = chipById(cancel, idB);
    if (!chipA || !chipB) return null;
    return [chipA.key, chipB.key].sort().join("|");
  }

  function countKeyPairs(cancel, idPairs) {
    const counts = new Map();
    for (const pair of idPairs || []) {
      const [a, b] = Array.isArray(pair) ? pair : String(pair).split("|");
      const key = keyPairFromIds(cancel, a, b);
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  }

  function isCancelComplete(cancel, cancelledSet) {
    if (!cancel?.pairs?.length) return true;
    const needed = countKeyPairs(cancel, cancel.pairs);
    const done = countKeyPairs(
      cancel,
      [...cancelledSet].map((pk) => pk.split("|"))
    );
    for (const [key, n] of needed) {
      if ((done.get(key) || 0) < n) return false;
    }
    return true;
  }

  function findPairMatch(cancel, idA, idB) {
    return (cancel.pairs || []).find(
      ([a, b]) => (a === idA && b === idB) || (a === idB && b === idA)
    );
  }

  function chipById(cancel, id) {
    return [...(cancel.num || []), ...(cancel.den || [])].find((c) => c.id === id);
  }

  function applyContent() {
    const c = t();
    if (!c) return;
    $("#landingEyebrow").textContent = c.landing.eyebrow;
    $("#landingTitle").textContent = c.landing.title;
    $("#startButton").textContent = c.landing.start;
    $("#appTitle").textContent = c.app.title;
    $("#modeLabel").textContent = c.ui.modeLabel;
    $("#modeLearnBtn").textContent = c.ui.modeLearn;
    $("#modeTestBtn").textContent = c.ui.modeTest;
    $("#prevBtn").textContent = c.ui.prev;
    $("#nextBtn").textContent = c.ui.next;
    $("#randomBtn").textContent = c.ui.random;
    $("#checkBtn").textContent = c.ui.check;
    $("#revealBtn").textContent = c.ui.reveal;

    const topicSelect = $("#topicSelect");
    if (topicSelect && c.ui.topics) {
      [...topicSelect.options].forEach((opt) => {
        if (c.ui.topics[opt.value]) opt.textContent = c.ui.topics[opt.value];
      });
      topicSelect.value = state.topic;
    }
  }

  function showApp() {
    $("#landingPage").hidden = true;
    $("#landingPage").classList.remove("view--active");
    $("#appPage").hidden = false;
    $("#appPage").classList.add("view--active");
    $("#appTitle").focus?.();
    renderAll();
  }

  function setMode(mode) {
    state.mode = mode;
    $("#modeLearnBtn").classList.toggle("mode-btn--active", mode === "learn");
    $("#modeTestBtn").classList.toggle("mode-btn--active", mode === "test");
    $("#modeLearnBtn").setAttribute("aria-pressed", String(mode === "learn"));
    $("#modeTestBtn").setAttribute("aria-pressed", String(mode === "test"));
    $("#learnPanel").hidden = mode !== "learn";
    $("#testPanel").hidden = mode !== "test";
    if (mode === "test" && !state.testProblem) loadTestAt(state.testIndex);
    renderAll();
  }

  function setTopic(topic) {
    if (state.topic === topic) return;
    state.topic = topic;
    state.learnIndex = 0;
    state.testIndex = 0;
    state.stepVisible = 1;
    state.cancelled = new Set();
    state.selectedChip = null;
    state.testProblem = null;
    state.testCancelled = new Set();
    state.testSelectedChip = null;
    state.testChoice = null;
    state.testExcluded = new Set();
    state.feedback = null;
    state.revealed = false;

    const topicSelect = $("#topicSelect");
    if (topicSelect) topicSelect.value = topic;

    if (state.mode === "test") loadTestAt(0);
    renderAll();
  }

  function renderPager() {
    const list = learnList();
    const total = list.length;
    const n = state.learnIndex + 1;
    const label = (t()?.ui.pagerLabel || "ข้อ {n}/{total}")
      .replace("{n}", String(n))
      .replace("{total}", String(total));
    $("#pagerLabel").textContent = label;

    const dots = $("#pagerDots");
    dots.innerHTML = "";
    list.forEach((_, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pager__dot" + (i === state.learnIndex ? " pager__dot--active" : "");
      btn.setAttribute("aria-label", `ข้อ ${i + 1}`);
      btn.addEventListener("click", () => {
        state.learnIndex = i;
        state.stepVisible = 1;
        state.cancelled = new Set();
        state.selectedChip = null;
        renderLearn();
      });
      dots.appendChild(btn);
    });

    $("#pagerPrev").disabled = state.learnIndex <= 0;
    $("#pagerNext").disabled = state.learnIndex >= total - 1;
  }

  function renderCancelUI(cancel, cancelledSet, selectedId, onChipClick, interactive, showAfterEq = true) {
    if (!cancel) return "";
    const ui = t()?.ui || {};
    const renderChips = (side) =>
      (cancel[side] || [])
        .map((chip) => {
          const cancelled = [...cancelledSet].some((pk) => pk.split("|").includes(chip.id));
          const selected = selectedId === chip.id;
          const classes = [
            "factor-chip",
            selected ? "factor-chip--selected" : "",
            cancelled ? "factor-chip--cancelled" : ""
          ]
            .filter(Boolean)
            .join(" ");
          const disabled = !interactive || cancelled ? "disabled" : "";
          return `<button type="button" class="${classes}" data-chip-id="${escapeHtml(chip.id)}" data-side="${side}" ${disabled}>${katexHtml(chip.tex)}</button>`;
        })
        .join('<span class="cancel-times" aria-hidden="true">·</span>');

    const done = isCancelComplete(cancel, cancelledSet);
    const statusClass = done ? "cancel-status--ok" : "";
    const statusText = done ? ui.cancelDone || "" : ui.cancelHint || "";

    return `
      <div class="cancel-panel" data-cancel-root="1">
        <p class="cancel-hint">${escapeHtml(ui.cancelHint || "")}</p>
        <div class="cancel-fraction">
          <div class="cancel-row">${renderChips("num")}</div>
          <div class="cancel-bar"></div>
          <div class="cancel-row">${renderChips("den")}</div>
        </div>
        <p class="cancel-status ${statusClass}" data-cancel-status="1">${escapeHtml(statusText)}</p>
        ${
          done && showAfterEq
            ? `<p class="after-eq">$=${cancel.afterTex}$${
                cancel.excludedNote ? ` เมื่อ $${cancel.excludedNote}$` : ""
              }</p>`
            : ""
        }
      </div>
    `;
  }

  function wireCancelClicks(root, cancel, getCancelled, setCancelled, getSelected, setSelected, onChange) {
    if (!root || !cancel) return;
    $$("[data-chip-id]", root).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.chipId;
        const cancelled = getCancelled();
        if ([...cancelled].some((pk) => pk.split("|").includes(id))) return;

        const selected = getSelected();
        if (!selected) {
          setSelected(id);
          onChange();
          return;
        }
        if (selected === id) {
          setSelected(null);
          onChange();
          return;
        }

        const chipA = chipById(cancel, selected);
        const chipB = chipById(cancel, id);
        const sameSide =
          (cancel.num || []).some((c) => c.id === selected) ===
          (cancel.num || []).some((c) => c.id === id);

        const match = findPairMatch(cancel, selected, id);
        const keysMatch = chipA && chipB && chipA.key === chipB.key && !sameSide;

        if (match || keysMatch) {
          const pair = match || [selected, id];
          const next = new Set(cancelled);
          next.add(pairKey(pair[0], pair[1]));
          setCancelled(next);
          setSelected(null);
          onChange();
          return;
        }

        setSelected(null);
        btn.classList.add("factor-chip--shake");
        const status = $("[data-cancel-status]", root);
        if (status) {
          status.textContent = t()?.ui.cancelWrong || "";
          status.classList.add("cancel-status--bad");
          status.classList.remove("cancel-status--ok");
        }
        window.setTimeout(() => {
          btn.classList.remove("factor-chip--shake");
          onChange();
        }, 380);
      });
    });
  }

  /** Strip a leading "=" from a step tex string. */
  function stripLeadingEq(tex) {
    return String(tex || "").replace(/^=/, "").trim();
  }

  /**
   * Build a KaTeX aligned block from consecutive show steps.
   * - First expression + first "=..." stay on one line: lhs &= rhs
   * - Later "=..." steps each get their own &= row (internal "=" kept)
   */
  function buildAlignedEqTex(chain) {
    const steps = (chain || [])
      .map((step) => String(step.tex || "").trim())
      .filter(Boolean);
    if (!steps.length) return "";
    if (steps.length === 1 && !steps[0].startsWith("=")) {
      return steps[0];
    }

    const lines = [];
    let i = 0;

    if (!steps[0].startsWith("=")) {
      const lhs = steps[0];
      if (steps[1] && steps[1].startsWith("=")) {
        lines.push(`${lhs} &= ${stripLeadingEq(steps[1])}`);
        i = 2;
      } else {
        lines.push(lhs);
        i = 1;
      }
    }

    while (i < steps.length) {
      const tex = steps[i];
      if (tex.startsWith("=")) {
        lines.push(`&= ${stripLeadingEq(tex)}`);
      } else {
        lines.push(tex);
      }
      i += 1;
    }

    if (lines.length === 1 && !String(lines[0]).includes("&=")) {
      return lines[0];
    }
    return `\\begin{aligned}${lines.join(" \\\\ ")}\\end{aligned}`;
  }

  function renderLearn() {
    const problem = currentLearn();
    const body = $("#learnBody");
    const promptEl = $("#learnPrompt");
    if (!problem) {
      promptEl.textContent = "";
      body.innerHTML = "";
      return;
    }

    renderPager();
    promptEl.innerHTML = `${escapeHtml(problem.prompt)} $${problem.promptTex}$`;

    const steps = problem.steps || [];
    const visible = Math.min(state.stepVisible, steps.length);
    const parts = [];

    let i = 0;
    while (i < visible) {
      const step = steps[i];
      if (step.type === "show") {
        const chain = [];
        while (i < visible && steps[i].type === "show") {
          chain.push(steps[i]);
          i += 1;
        }
        const alignedTex = buildAlignedEqTex(chain);
        const eqHtml = alignedTex.includes("\\begin{aligned}")
          ? `$$${alignedTex}$$`
          : `$${alignedTex}$`;
        const notesHtml = chain
          .filter((s) => s.note)
          .map((s) => `<p class="step-note">${s.note}</p>`)
          .join("");
        parts.push(`
          <div class="step-block">
            <div class="step-eq">${eqHtml}</div>
            ${notesHtml}
          </div>
        `);
        continue;
      }
      if (step.type === "cancel") {
        const interactive = i === visible - 1 && !isCancelComplete(step, state.cancelled);
        parts.push(`
          <div class="step-block" data-learn-cancel="${i}">
            ${renderCancelUI(step, state.cancelled, state.selectedChip, null, interactive)}
          </div>
        `);
      } else if (step.type === "result") {
        const whenPart = step.whenTex
          ? ` เมื่อ $${step.whenTex}$`
          : step.note
            ? ` ${step.note}`
            : "";
        parts.push(`
          <div class="step-block">
            <p class="step-eq"><strong>${escapeHtml(t()?.ui.thereforeLabel || "ดังนั้น")}</strong>
              $${problem.promptTex}=${step.tex}$${whenPart}</p>
          </div>
        `);
      }
      i += 1;
    }

    body.innerHTML = parts.join("");
    renderMath(promptEl);
    renderMath(body);

    const cancelStepIndex = steps.findIndex((s) => s.type === "cancel");
    if (cancelStepIndex >= 0 && cancelStepIndex < visible) {
      const cancelStep = steps[cancelStepIndex];
      const panel = $(`[data-learn-cancel="${cancelStepIndex}"]`, body);
      wireCancelClicks(
        panel,
        cancelStep,
        () => state.cancelled,
        (next) => {
          state.cancelled = next;
        },
        () => state.selectedChip,
        (id) => {
          state.selectedChip = id;
        },
        () => renderLearn()
      );
    }

    const cancelIncomplete =
      cancelStepIndex >= 0 &&
      cancelStepIndex < visible &&
      !isCancelComplete(steps[cancelStepIndex], state.cancelled);

    $("#prevBtn").disabled = state.stepVisible <= 1;
    $("#nextBtn").disabled = state.stepVisible >= steps.length || cancelIncomplete;
  }

  function advanceLearn() {
    const problem = currentLearn();
    if (!problem) return;
    const steps = problem.steps || [];
    const cancelStepIndex = steps.findIndex((s) => s.type === "cancel");

    if (
      cancelStepIndex >= 0 &&
      state.stepVisible > cancelStepIndex &&
      !isCancelComplete(steps[cancelStepIndex], state.cancelled)
    ) {
      return;
    }

    if (state.stepVisible < steps.length) {
      state.stepVisible += 1;
      const next = steps[state.stepVisible - 1];
      if (next?.type === "cancel") {
        state.cancelled = new Set();
        state.selectedChip = null;
      }
    }
    renderLearn();
  }

  /** Fisher–Yates shuffle (mutates and returns the array). */
  function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Clone a test problem with answer choices (and optional excludedChoices)
   * shuffled so the correct option is not always first.
   */
  function withShuffledChoices(problem) {
    if (!problem) return problem;
    const clone = {
      ...problem,
      cancel: problem.cancel
        ? {
            ...problem.cancel,
            num: problem.cancel.num ? [...problem.cancel.num] : problem.cancel.num,
            den: problem.cancel.den ? [...problem.cancel.den] : problem.cancel.den,
            pairs: problem.cancel.pairs
              ? problem.cancel.pairs.map((p) => [...p])
              : problem.cancel.pairs
          }
        : problem.cancel,
      excluded: problem.excluded ? [...problem.excluded] : problem.excluded
    };

    if (Array.isArray(problem.choices) && problem.choices.length) {
      const correctTex = problem.choices[problem.answerIndex ?? 0];
      const shuffled = shuffleInPlace([...problem.choices]);
      clone.choices = shuffled;
      clone.answerIndex = Math.max(0, shuffled.indexOf(correctTex));
    }

    if (Array.isArray(problem.excludedChoices) && problem.excludedChoices.length) {
      clone.excludedChoices = shuffleInPlace([...problem.excludedChoices]);
    }

    return clone;
  }

  function updateTestPager() {
    const pool = testPool();
    const total = pool.length || 1;
    if (state.testIndex >= total) state.testIndex = 0;
    const label = $("#testPagerLabel");
    if (label) {
      label.textContent = (t()?.ui?.pagerLabel || "ข้อ {n}/{total}")
        .replace("{n}", String(pool.length ? state.testIndex + 1 : 0))
        .replace("{total}", String(pool.length));
    }
    const dots = $("#testPagerDots");
    if (dots) {
      dots.innerHTML = pool
        .map(
          (_, i) =>
            `<button class="pager__dot${i === state.testIndex ? " pager__dot--active" : ""}" type="button" data-index="${i}" aria-label="ข้อ ${i + 1}"${i === state.testIndex ? ' aria-current="true"' : ""}></button>`
        )
        .join("");
    }
    const prev = $("#testPagerPrev");
    const next = $("#testPagerNext");
    if (prev) prev.disabled = !pool.length || state.testIndex <= 0;
    if (next) next.disabled = !pool.length || state.testIndex >= pool.length - 1;
  }

  function loadTestAt(index) {
    const pool = testPool();
    if (!pool.length) {
      state.testProblem = null;
      state.testIndex = 0;
      return;
    }
    const i = Math.max(0, Math.min(index, pool.length - 1));
    state.testIndex = i;
    state.testProblem = withShuffledChoices(pool[i]);
    resetTestInteraction();
  }

  function pickRandomTest() {
    const pool = testPool();
    if (!pool.length) {
      state.testProblem = null;
      state.testIndex = 0;
      return;
    }
    let i = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && i === state.testIndex) {
      i = (i + 1) % pool.length;
    }
    loadTestAt(i);
  }

  function resetTestInteraction() {
    state.testCancelled = new Set();
    state.testSelectedChip = null;
    state.testChoice = null;
    state.testExcluded = new Set();
    state.feedback = null;
    state.revealed = false;
  }

  function setFeedback(text, kind) {
    const el = $("#testFeedback");
    if (!el) return;
    if (!text) {
      el.hidden = true;
      el.textContent = "";
      el.className = "test-feedback";
      return;
    }
    el.hidden = false;
    el.textContent = text;
    el.className = `test-feedback test-feedback--${kind || "info"}`;
  }

  function renderTest() {
    updateTestPager();
    const problem = state.testProblem;
    const promptEl = $("#testPrompt");
    const body = $("#testBody");
    const ui = t()?.ui || {};

    if (!problem) {
      promptEl.textContent = "";
      body.innerHTML = "";
      setFeedback(null);
      return;
    }

    promptEl.innerHTML = `${escapeHtml(problem.prompt)} $${problem.promptTex}$`;

    const parts = [];

    if (problem.cancel && !problem.skipCancel) {
      // Test mode: hide the simplified result so the learner answers via choices.
      parts.push(
        renderCancelUI(problem.cancel, state.testCancelled, state.testSelectedChip, null, !state.revealed, false)
      );
    }

    parts.push(`<p class="section-label">${ui.pickAnswer || ""}</p>`);
    parts.push('<div class="choice-grid" role="group" aria-label="ตัวเลือกคำตอบ">');
    (problem.choices || []).forEach((tex, i) => {
      const classes = ["choice-btn"];
      if (state.testChoice === i) classes.push("choice-btn--selected");
      if (state.revealed) {
        if (i === problem.answerIndex) classes.push("choice-btn--correct");
        else if (state.testChoice === i) classes.push("choice-btn--wrong");
      }
      parts.push(
        `<button type="button" class="${classes.join(" ")}" data-choice="${i}" ${
          state.revealed ? "disabled" : ""
        }>$${tex}$</button>`
      );
    });
    parts.push("</div>");

    const excludedChoices = problem.excludedChoices;
    if (excludedChoices && excludedChoices.length) {
      parts.push(`<p class="section-label">${ui.pickExcluded || ""}</p>`);
      parts.push('<div class="excluded-grid" role="group" aria-label="ค่าที่ตัดออก">');
      excludedChoices.forEach((val) => {
        const on = state.testExcluded.has(val);
        parts.push(
          `<button type="button" class="excluded-chip${on ? " excluded-chip--selected" : ""}" data-excl="${val}" ${
            state.revealed ? "disabled" : ""
          }>$x\\neq ${val}$</button>`
        );
      });
      parts.push("</div>");
    }

    if (state.revealed) {
      parts.push(
        `<p class="step-eq after-eq"><strong>${ui.thereforeLabel || "ดังนั้น"}</strong>
          $${problem.promptTex}=${problem.resultTex}$${
          problem.excluded?.length
            ? ` เมื่อ $${problem.excluded.map((v) => `x\\neq ${v}`).join(",\\ ")}$`
            : ""
        }</p>`
      );
    }

    body.innerHTML = parts.join("");
    renderMath(promptEl);
    renderMath(body);

    if (problem.cancel && !problem.skipCancel) {
      wireCancelClicks(
        body,
        problem.cancel,
        () => state.testCancelled,
        (next) => {
          state.testCancelled = next;
        },
        () => state.testSelectedChip,
        (id) => {
          state.testSelectedChip = id;
        },
        () => renderTest()
      );
    }

    $$("[data-choice]", body).forEach((btn) => {
      btn.addEventListener("click", () => {
        if (state.revealed) return;
        state.testChoice = Number(btn.dataset.choice);
        state.feedback = null;
        setFeedback(null);
        renderTest();
      });
    });

    $$("[data-excl]", body).forEach((btn) => {
      btn.addEventListener("click", () => {
        if (state.revealed) return;
        const val = Number(btn.dataset.excl);
        if (state.testExcluded.has(val)) state.testExcluded.delete(val);
        else state.testExcluded.add(val);
        state.feedback = null;
        setFeedback(null);
        renderTest();
      });
    });

    if (state.feedback) setFeedback(state.feedback.text, state.feedback.kind);
    else setFeedback(null);
  }

  function setsEqual(a, b) {
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  }

  function checkTest() {
    const problem = state.testProblem;
    const ui = t()?.ui || {};
    if (!problem) return;

    if (problem.cancel && !problem.skipCancel && !isCancelComplete(problem.cancel, state.testCancelled)) {
      state.feedback = { text: ui.fillCancel, kind: "bad" };
      setFeedback(ui.fillCancel, "bad");
      return;
    }

    if (state.testChoice == null) {
      state.feedback = { text: ui.incorrect, kind: "bad" };
      setFeedback(ui.incorrect, "bad");
      return;
    }

    const choiceOk = state.testChoice === problem.answerIndex;
    let exclOk = true;
    if (problem.excludedChoices?.length) {
      const expected = new Set(problem.excluded || []);
      exclOk = setsEqual(state.testExcluded, expected);
    }

    if (choiceOk && exclOk) {
      state.feedback = { text: ui.allOk, kind: "ok" };
      setFeedback(ui.allOk, "ok");
    } else {
      state.feedback = { text: ui.incorrect, kind: "bad" };
      setFeedback(ui.incorrect, "bad");
    }
  }

  function revealTest() {
    const problem = state.testProblem;
    if (!problem) return;
    state.revealed = true;
    state.testChoice = problem.answerIndex;
    if (problem.cancel && !problem.skipCancel) {
      state.testCancelled = requiredPairKeys(problem.cancel.pairs);
    }
    state.testExcluded = new Set(problem.excluded || []);
    state.feedback = { text: t()?.ui.revealed, kind: "info" };
    renderTest();
  }

  function renderAll() {
    if (state.mode === "learn") renderLearn();
    else renderTest();
  }

  function bootstrap() {
    applyContent();

    $("#startButton")?.addEventListener("click", showApp);

    $("#modeLearnBtn")?.addEventListener("click", () => setMode("learn"));
    $("#modeTestBtn")?.addEventListener("click", () => setMode("test"));

    $("#topicSelect")?.addEventListener("change", (e) => {
      setTopic(e.target.value);
    });

    $("#pagerPrev")?.addEventListener("click", () => {
      if (state.learnIndex <= 0) return;
      state.learnIndex -= 1;
      state.stepVisible = 1;
      state.cancelled = new Set();
      state.selectedChip = null;
      renderLearn();
    });

    $("#pagerNext")?.addEventListener("click", () => {
      if (state.learnIndex >= learnList().length - 1) return;
      state.learnIndex += 1;
      state.stepVisible = 1;
      state.cancelled = new Set();
      state.selectedChip = null;
      renderLearn();
    });

    $("#prevBtn")?.addEventListener("click", () => {
      if (state.stepVisible <= 1) return;
      state.stepVisible -= 1;
      const steps = currentLearn()?.steps || [];
      const cancelIdx = steps.findIndex((s) => s.type === "cancel");
      if (cancelIdx >= 0 && state.stepVisible <= cancelIdx) {
        state.cancelled = new Set();
        state.selectedChip = null;
      }
      renderLearn();
    });

    $("#nextBtn")?.addEventListener("click", () => advanceLearn());

    $("#testPagerPrev")?.addEventListener("click", () => {
      if (state.testIndex > 0) {
        loadTestAt(state.testIndex - 1);
        renderTest();
      }
    });
    $("#testPagerNext")?.addEventListener("click", () => {
      if (state.testIndex < testPool().length - 1) {
        loadTestAt(state.testIndex + 1);
        renderTest();
      }
    });
    $("#testPagerDots")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".pager__dot");
      if (!btn) return;
      loadTestAt(Number(btn.dataset.index) || 0);
      renderTest();
    });

    $("#randomBtn")?.addEventListener("click", () => {
      pickRandomTest();
      renderTest();
    });

    $("#testReset")?.addEventListener("click", () => {
      resetTestInteraction();
      renderTest();
    });

    $("#checkBtn")?.addEventListener("click", checkTest);
    $("#revealBtn")?.addEventListener("click", revealTest);
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
