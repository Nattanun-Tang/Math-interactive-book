(() => {
  const $ = (selector, root = document) => root.querySelector(selector);

  const state = {
    mode: "learn",
    typeId: "sameDenom",
    learnIndex: 0,
    testIndex: 0,
    testProblem: null,
    step: 0,
    showAll: false
  };

  function t() {
    return window.CONTENT?.th;
  }

  function types() {
    return t()?.types || [];
  }

  function examplesFor(typeId) {
    return t()?.examples?.[typeId] || [];
  }

  function testPoolFor(typeId) {
    return t()?.testPool?.[typeId] || [];
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

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function tryParseEqLine(line) {
    if (line && typeof line === "object" && !line.conclusion && (line.lhs != null || line.rhs != null)) {
      return {
        prefix: line.prefix || "",
        lhs: line.lhs || "",
        rhs: line.rhs || ""
      };
    }
    if (typeof line !== "string") return null;
    const m = line.match(/^([^$]*)\$([^$]+)\$(.*)$/);
    if (!m) return null;
    const prefix = m[1];
    const math = m[2];
    const suffix = m[3];
    if (String(suffix).trim()) return null;
    const eqIdx = math.indexOf("=");
    if (eqIdx < 0) return null;
    const lhs = math.slice(0, eqIdx).trim();
    const rhs = math.slice(eqIdx + 1).trim();
    if (!lhs || !rhs) return null;
    return { prefix: prefix.trim(), lhs, rhs };
  }

  function eqRowHtml(eq) {
    const prefix = eq.prefix
      ? `<span class="eq-prefix">${escapeHtml(eq.prefix)}</span>`
      : `<span class="eq-prefix"></span>`;
    const lhs = eq.lhs
      ? `<span class="eq-lhs">$${eq.lhs}$</span>`
      : `<span class="eq-lhs"></span>`;
    return `<p class="eq-row">${prefix}${lhs}<span class="eq-eq">=</span><span class="eq-rhs">$${eq.rhs || ""}$</span></p>`;
  }

  function lineHtml(line) {
    const eq = tryParseEqLine(line);
    if (eq) return eqRowHtml(eq);
    if (typeof line === "string") {
      return `<p class="step-line">${line}</p>`;
    }
    if (line?.conclusion) {
      return `<p class="step-line step-line--conclusion">${line.text}</p>`;
    }
    return `<p class="step-line">${line?.text || ""}</p>`;
  }

  /** Group consecutive LHS=RHS rows so the "=" column stays aligned. */
  function linesHtml(lines) {
    const parts = [];
    let eqBuf = [];
    const flushEq = () => {
      if (!eqBuf.length) return;
      parts.push(`<div class="work-steps">${eqBuf.join("")}</div>`);
      eqBuf = [];
    };
    for (const line of lines || []) {
      const eq = tryParseEqLine(line);
      if (eq) {
        eqBuf.push(eqRowHtml(eq));
      } else {
        flushEq();
        parts.push(lineHtml(line));
      }
    }
    flushEq();
    return parts.join("");
  }

  function toTestProblem(item) {
    if (!item) return null;
    return {
      eqTex: item.eqTex,
      steps: item.lines || item.steps || []
    };
  }

  function applyContent() {
    const c = t();
    if (!c) return;
    const eyebrow = $("#landingEyebrow");
    const title = $("#landingTitle");
    const start = $("#startButton");
    const appTitle = $("#appTitle");
    if (eyebrow) eyebrow.textContent = c.landing?.eyebrow || "INTERACTIVE MATHEMATICS";
    if (title) title.textContent = c.landing?.title || "";
    if (start) start.textContent = c.landing?.start || "เริ่ม";
    if (appTitle) appTitle.textContent = c.app?.title || c.landing?.title || "";
    document.title = `${c.app?.title || "Interactive Mathematics"} | Interactive Mathematics`;

    const modeLabel = $("#modeLabel");
    const typeLabel = $("#typeLabel");
    if (modeLabel) modeLabel.textContent = c.ui?.modeLabel || "โหมด";
    if (typeLabel) typeLabel.textContent = c.ui?.typeLabel || "ประเภทโจทย์";
    const modeLearnBtn = $("#modeLearnBtn");
    const modeTestBtn = $("#modeTestBtn");
    const randomBtn = $("#randomBtn");
    const prevBtn = $("#prevBtn");
    const nextBtn = $("#nextBtn");
    const allBtn = $("#allBtn");
    if (modeLearnBtn) modeLearnBtn.textContent = c.ui?.modeLearn || "ศึกษา";
    if (modeTestBtn) modeTestBtn.textContent = c.ui?.modeTest || "ทดสอบ";
    if (randomBtn) randomBtn.textContent = c.ui?.random || "สุ่มโจทย์";
    if (prevBtn) prevBtn.textContent = c.ui?.prev || "ก่อนหน้า";
    if (nextBtn) nextBtn.textContent = c.ui?.next || "ถัดไป";
    if (allBtn) allBtn.textContent = c.ui?.all || "ทั้งหมด";
  }

  function fillTypeSelect() {
    const select = $("#typeSelect");
    if (!select) return;
    const list = types();
    if (list.length && !list.some((item) => item.id === state.typeId)) {
      state.typeId = list[0].id;
    }
    select.innerHTML = list
      .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`)
      .join("");
    select.value = state.typeId;
  }

  function setMode(mode) {
    state.mode = mode;
    const learnBtn = $("#modeLearnBtn");
    const testBtn = $("#modeTestBtn");
    learnBtn?.classList.toggle("mode-btn--active", mode === "learn");
    testBtn?.classList.toggle("mode-btn--active", mode === "test");
    learnBtn?.setAttribute("aria-pressed", mode === "learn" ? "true" : "false");
    testBtn?.setAttribute("aria-pressed", mode === "test" ? "true" : "false");
    const learnPanel = $("#learnPanel");
    const testPanel = $("#testPanel");
    if (learnPanel) learnPanel.hidden = mode !== "learn";
    if (testPanel) testPanel.hidden = mode !== "test";
    if (mode === "learn") renderLearn();
    else {
      if (!state.testProblem) loadTestAt(state.testIndex);
      else renderTest();
    }
  }

  function setType(typeId) {
    state.typeId = typeId;
    state.learnIndex = 0;
    state.testIndex = 0;
    state.step = 0;
    state.showAll = false;
    state.testProblem = null;
    if (state.mode === "learn") renderLearn();
    else loadTestAt(0);
  }

  function renderLearn() {
    const list = examplesFor(state.typeId);
    const total = list.length || 1;
    if (state.learnIndex >= total) state.learnIndex = 0;
    const ex = list[state.learnIndex];
    const label = $("#pagerLabel");
    const ui = t()?.ui;
    if (label) {
      label.textContent = (ui?.pagerLabel || "ข้อ {n}/{total}")
        .replace("{n}", String(state.learnIndex + 1))
        .replace("{total}", String(total));
    }
    const dots = $("#pagerDots");
    if (dots) {
      dots.innerHTML = list
        .map(
          (_, i) =>
            `<button class="pager__dot${i === state.learnIndex ? " pager__dot--active" : ""}" type="button" data-index="${i}" aria-label="ข้อ ${i + 1}"${i === state.learnIndex ? ' aria-current="true"' : ""}></button>`
        )
        .join("");
    }
    const prev = $("#pagerPrev");
    const next = $("#pagerNext");
    if (prev) prev.disabled = state.learnIndex <= 0;
    if (next) next.disabled = state.learnIndex >= total - 1;

    const body = $("#learnBody");
    if (!body || !ex) {
      if (body) body.innerHTML = "";
      return;
    }
    const prompt = `${ui?.promptPrefix || "หาเซตคำตอบของสมการ"} $${ex.eqTex}$`;
    body.innerHTML = `<p class="prompt-text">${prompt}</p>${linesHtml(ex.lines)}`;
    renderMath(body);
  }

  function updateTestPager() {
    const pool = testPoolFor(state.typeId);
    const total = pool.length || 1;
    if (state.testIndex >= total) state.testIndex = 0;
    const ui = t()?.ui;
    const label = $("#testPagerLabel");
    if (label) {
      label.textContent = (ui?.pagerLabel || "ข้อ {n}/{total}")
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
    const pool = testPoolFor(state.typeId);
    if (!pool.length) {
      state.testProblem = null;
      state.testIndex = 0;
      renderTest();
      return;
    }
    const i = Math.max(0, Math.min(index, pool.length - 1));
    state.testIndex = i;
    state.testProblem = toTestProblem(pool[i]);
    state.step = 0;
    state.showAll = false;
    renderTest();
  }

  function randomProblem() {
    const pool = testPoolFor(state.typeId);
    if (!pool.length) {
      state.testProblem = null;
      state.testIndex = 0;
      renderTest();
      return;
    }
    let i = randInt(0, pool.length - 1);
    if (pool.length > 1 && i === state.testIndex) {
      i = (i + 1) % pool.length;
    }
    loadTestAt(i);
  }

  function resetTestView() {
    state.step = 0;
    state.showAll = false;
    renderTest();
  }

  function updateTestButtons() {
    const has = Boolean(state.testProblem);
    const steps = state.testProblem?.steps || [];
    const last = steps.length;
    const prev = $("#prevBtn");
    const next = $("#nextBtn");
    const all = $("#allBtn");
    if (prev) prev.disabled = !has || state.showAll || state.step <= 0;
    if (next) next.disabled = !has || state.showAll || state.step >= last;
    if (all) {
      all.disabled = !has;
      all.setAttribute("aria-pressed", state.showAll ? "true" : "false");
    }
  }

  function renderTest() {
    updateTestPager();
    const ui = t()?.ui;
    const promptEl = $("#testPrompt");
    const body = $("#testBody");
    const problem = state.testProblem;
    if (!problem) {
      if (promptEl) promptEl.textContent = ui?.testHint || "";
      if (body) body.innerHTML = `<p class="test-empty">${escapeHtml(ui?.testHint || "")}</p>`;
      updateTestButtons();
      return;
    }
    if (promptEl) {
      promptEl.innerHTML = `${ui?.promptPrefix || "หาเซตคำตอบของสมการ"} $${problem.eqTex}$`;
      renderMath(promptEl);
    }
    const steps = problem.steps || [];
    const visible = state.showAll ? steps.length : state.step;
    if (body) {
      if (visible <= 0) {
        body.innerHTML = `<p class="test-empty">${escapeHtml(ui?.stepHint || "กด “ถัดไป” เพื่อดูเฉลยทีละบรรทัด")}</p>`;
      } else {
        body.innerHTML = linesHtml(steps.slice(0, visible));
        renderMath(body);
      }
    }
    updateTestButtons();
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
      $("#appTitle")?.focus();
    }
  }

  function bind() {
    $("#startButton")?.addEventListener("click", showApp);
    $("#modeLearnBtn")?.addEventListener("click", () => setMode("learn"));
    $("#modeTestBtn")?.addEventListener("click", () => setMode("test"));
    $("#typeSelect")?.addEventListener("change", (e) => setType(e.target.value));

    $("#pagerPrev")?.addEventListener("click", () => {
      if (state.learnIndex > 0) {
        state.learnIndex -= 1;
        renderLearn();
      }
    });
    $("#pagerNext")?.addEventListener("click", () => {
      const total = examplesFor(state.typeId).length;
      if (state.learnIndex < total - 1) {
        state.learnIndex += 1;
        renderLearn();
      }
    });
    $("#pagerDots")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".pager__dot");
      if (!btn) return;
      state.learnIndex = Number(btn.dataset.index) || 0;
      renderLearn();
    });

    $("#testPagerPrev")?.addEventListener("click", () => {
      if (state.testIndex > 0) loadTestAt(state.testIndex - 1);
    });
    $("#testPagerNext")?.addEventListener("click", () => {
      const total = testPoolFor(state.typeId).length;
      if (state.testIndex < total - 1) loadTestAt(state.testIndex + 1);
    });
    $("#testPagerDots")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".pager__dot");
      if (!btn) return;
      loadTestAt(Number(btn.dataset.index) || 0);
    });

    $("#randomBtn")?.addEventListener("click", randomProblem);
    $("#testReset")?.addEventListener("click", () => {
      if (state.testProblem) resetTestView();
      else loadTestAt(state.testIndex);
    });
    $("#prevBtn")?.addEventListener("click", () => {
      if (!state.testProblem || state.showAll || state.step <= 0) return;
      state.step -= 1;
      renderTest();
    });
    $("#nextBtn")?.addEventListener("click", () => {
      const last = state.testProblem?.steps?.length || 0;
      if (!state.testProblem || state.showAll || state.step >= last) return;
      state.step += 1;
      renderTest();
    });
    $("#allBtn")?.addEventListener("click", () => {
      if (!state.testProblem) return;
      state.showAll = !state.showAll;
      if (state.showAll) state.step = state.testProblem.steps.length;
      else state.step = 0;
      renderTest();
    });
  }

  function init() {
    applyContent();
    fillTypeSelect();
    bind();
    setMode("learn");
    renderLearn();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
