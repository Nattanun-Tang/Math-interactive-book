(() => {
  const $ = (selector, root = document) => root.querySelector(selector);

  const state = {
    categoryId: null,
    propertyId: null,
    step: 0,
    showAll: false
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

  function currentProperty() {
    const cat = currentCategory();
    if (!cat) return null;
    return cat.properties.find((p) => p.id === state.propertyId) || cat.properties[0] || null;
  }

  function ensureSelection() {
    const cat = currentCategory();
    if (!cat) {
      state.categoryId = null;
      state.propertyId = null;
      return;
    }
    state.categoryId = cat.id;
    if (!cat.properties.some((p) => p.id === state.propertyId)) {
      state.propertyId = cat.properties[0]?.id || null;
    }
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

  function formatSet(values) {
    return `\\{${values.join(", ")}\\}`;
  }

  function maxStep() {
    const prop = currentProperty();
    return prop?.steps?.length || 0;
  }

  function renderCategorySelect() {
    const select = $("#categorySelect");
    if (!select) return;
    const cats = categories();
    select.innerHTML = cats
      .map((cat) => {
        const selected = cat.id === state.categoryId ? " selected" : "";
        return `<option value="${escapeHtml(cat.id)}"${selected}>${escapeHtml(cat.label)}</option>`;
      })
      .join("");
  }

  function renderPropertyList() {
    const mount = $("#propertyList");
    if (!mount) return;
    const cat = currentCategory();
    if (!cat) {
      mount.innerHTML = "";
      return;
    }
    mount.innerHTML = cat.properties
      .map((prop, index) => {
        const active = prop.id === state.propertyId;
        const lines = Array.isArray(prop.list) ? prop.list : [prop.list];
        const mathHtml = lines
          .map((line) => `<span class="property-item__math-line">${katexHtml(line)}</span>`)
          .join("");
        const multi = lines.length > 1 ? " property-item--multi" : "";
        return `<button type="button" class="property-item${multi}${active ? " is-active" : ""}" role="option" data-property="${escapeHtml(
          prop.id
        )}" aria-selected="${active ? "true" : "false"}"><span class="property-item__num">${
          index + 1
        }.</span><span class="property-item__math">${mathHtml}</span></button>`;
      })
      .join("");
  }

  function activeExample() {
    const base = t()?.example || {};
    const cat = currentCategory();
    const prop = currentProperty();
    return {
      ...base,
      ...(cat?.example || {}),
      ...(prop?.example || {})
    };
  }

  function activeShowSets() {
    const prop = currentProperty();
    const cat = currentCategory();
    return prop?.showSets || cat?.showSets || ["U", "A", "B", "C"];
  }

  function renderSets() {
    const el = $("#setsBox");
    if (!el) return;
    const prop = currentProperty();
    if (!prop || prop.hideSets) {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    const example = activeExample();
    const keys = activeShowSets().filter((key) => Array.isArray(example[key]));
    if (!keys.length) {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }

    const hasU = keys.includes("U");
    const others = keys.filter((key) => key !== "U");
    const otherLine = others.map((key) => `$${key} = ${formatSet(example[key])}$`).join("&nbsp;&nbsp;");
    const lines = [];
    if (hasU) {
      lines.push(`<p class="sets-box__line">กำหนดให้ $U = ${formatSet(example.U)}$</p>`);
      if (otherLine) lines.push(`<p class="sets-box__line">${otherLine}</p>`);
    } else if (otherLine) {
      lines.push(`<p class="sets-box__line">กำหนดให้ ${otherLine}</p>`);
    }

    el.hidden = false;
    el.innerHTML = lines.join("");
    renderMath(el);
  }

  function renderProof() {
    const el = $("#proofBox");
    if (!el) return;
    const prop = currentProperty();
    const ui = t()?.ui;
    if (!prop) {
      el.className = "proof-box proof-box--idle";
      el.textContent = ui?.pickHint || "";
      return;
    }
    if (!state.showAll && state.step <= 0) {
      el.className = "proof-box proof-box--idle";
      el.textContent = ui?.emptyStep || "";
      return;
    }
    const visible = state.showAll ? prop.steps : prop.steps.slice(0, state.step);
    el.className = "proof-box";
    el.innerHTML = `<ol class="proof-list">${visible
      .map((step) => `<li class="proof-list__item">${step}</li>`)
      .join("")}</ol>`;
    renderMath(el);
  }

  function updateButtons() {
    const prevBtn = $("#prevBtn");
    const nextBtn = $("#nextBtn");
    const allBtn = $("#allBtn");
    if (!prevBtn || !nextBtn || !allBtn) return;

    const hasProp = Boolean(currentProperty());
    const max = maxStep();

    prevBtn.disabled = !hasProp || state.showAll || state.step <= 0;
    nextBtn.disabled = !hasProp || state.showAll || state.step >= max;
    allBtn.disabled = !hasProp;
    allBtn.setAttribute("aria-pressed", state.showAll ? "true" : "false");
  }

  function syncShell() {
    const layout = $("#appLayout");
    if (!layout) return;
    layout.dataset.step = String(state.showAll ? maxStep() : state.step);
    layout.dataset.showAll = state.showAll ? "1" : "0";
  }

  function renderStage() {
    renderSets();
    renderProof();
    updateButtons();
    syncShell();
  }

  function renderAll() {
    ensureSelection();
    renderCategorySelect();
    renderPropertyList();
    renderStage();
  }

  function resetSteps() {
    state.step = 0;
    state.showAll = false;
  }

  function selectCategory(id) {
    const cat = categories().find((c) => c.id === id);
    if (!cat) return;
    state.categoryId = cat.id;
    state.propertyId = cat.properties[0]?.id || null;
    resetSteps();
    renderAll();
  }

  function selectProperty(id) {
    const cat = currentCategory();
    if (!cat?.properties.some((p) => p.id === id)) return;
    state.propertyId = id;
    resetSteps();
    renderPropertyList();
    renderStage();
  }

  function refreshProofUi() {
    renderProof();
    updateButtons();
    syncShell();
  }

  function goPrev() {
    if (!currentProperty() || state.showAll || state.step <= 0) return;
    state.step -= 1;
    refreshProofUi();
  }

  function goNext() {
    if (!currentProperty() || state.showAll || state.step >= maxStep()) return;
    state.step += 1;
    refreshProofUi();
  }

  function goAll() {
    if (!currentProperty()) return;
    if (state.showAll) {
      state.showAll = false;
      state.step = 0;
    } else {
      state.showAll = true;
      state.step = maxStep();
    }
    refreshProofUi();
  }

  function applyContent() {
    const c = t();
    if (!c) return;
    const map = [
      ["#landingEyebrow", c.landing?.eyebrow],
      ["#landingTitle", c.landing?.title],
      ["#startButton", c.landing?.start],
      ["#appTitle", c.app?.title],
      ["#categoryLabel", c.ui?.categoryLabel],
      ["#propertyListLabel", c.ui?.propertyListLabel],
      ["#prevBtn", c.ui?.prev],
      ["#nextBtn", c.ui?.next],
      ["#allBtn", c.ui?.all]
    ];
    for (const [selector, value] of map) {
      const el = $(selector);
      if (el && value != null) el.textContent = value;
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
    renderAll();
  }

  function bootstrap() {
    applyContent();
    const cats = categories();
    state.categoryId = cats[0]?.id || null;
    state.propertyId = cats[0]?.properties[0]?.id || null;
    resetSteps();

    $("#startButton")?.addEventListener("click", showApp);

    $("#categorySelect")?.addEventListener("change", (event) => {
      selectCategory(event.target.value);
    });

    $("#propertyList")?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-property]");
      if (!btn) return;
      selectProperty(btn.dataset.property);
    });

    $("#prevBtn")?.addEventListener("click", goPrev);
    $("#nextBtn")?.addEventListener("click", goNext);
    $("#allBtn")?.addEventListener("click", goAll);

    ensureSelection();
    renderCategorySelect();
    renderPropertyList();
    updateButtons();
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
