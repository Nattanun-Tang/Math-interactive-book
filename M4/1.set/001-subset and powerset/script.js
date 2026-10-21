(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const MAX_MEMBERS = 4;
  const MEMBER_VALUES = ["∅", "1", "2", "3", "4", "a", "b"];

  const FORMATS = [
    { id: "plain", slots: 1, label: "□" },
    { id: "brace1", slots: 1, label: "{□}" },
    { id: "brace2", slots: 2, label: "{□, □}" },
    { id: "braceNest", slots: 2, label: "{□, {□}}" }
  ];

  const state = {
    formatId: "plain",
    slots: [null],
    activeSlot: 0,
    setA: [],
    subsetsRevealed: false,
    animating: false,
    showPower: false,
    feedback: ""
  };

  let animToken = 0;

  const SetModel = {
    val(v) {
      return { t: "v", v: String(v) };
    },

    set(items) {
      return { t: "s", items: SetModel.normalize(items) };
    },

    normalize(items) {
      const uniq = [];
      const seen = new Set();
      items.forEach((item) => {
        const key = SetModel.key(item);
        if (!seen.has(key)) {
          seen.add(key);
          uniq.push(item);
        }
      });
      return uniq.sort((a, b) => SetModel.compare(a, b));
    },

    compare(a, b) {
      if (a.t !== b.t) return a.t === "v" ? -1 : 1;
      if (a.t === "v") {
        if (a.v === "∅" && b.v !== "∅") return -1;
        if (b.v === "∅" && a.v !== "∅") return 1;
        const na = Number(a.v);
        const nb = Number(b.v);
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
        return a.v.localeCompare(b.v);
      }
      const len = Math.max(a.items.length, b.items.length);
      for (let i = 0; i < len; i += 1) {
        if (!a.items[i]) return -1;
        if (!b.items[i]) return 1;
        const c = SetModel.compare(a.items[i], b.items[i]);
        if (c !== 0) return c;
      }
      return 0;
    },

    key(node) {
      if (!node) return "";
      if (node.t === "v") return `v:${node.v}`;
      return `s:{${node.items.map(SetModel.key).join(",")}}`;
    },

    equals(a, b) {
      return SetModel.key(a) === SetModel.key(b);
    },

    buildFromFormat(formatId, slots) {
      const [a, b] = slots;
      if (formatId === "plain") return SetModel.val(a);
      if (formatId === "brace1") return SetModel.set([SetModel.val(a)]);
      if (formatId === "brace2") return SetModel.set([SetModel.val(a), SetModel.val(b)]);
      if (formatId === "braceNest") {
        return SetModel.set([SetModel.val(a), SetModel.set([SetModel.val(b)])]);
      }
      return null;
    },

    powerSet(elements) {
      const n = elements.length;
      const result = [];
      for (let mask = 0; mask < 2 ** n; mask += 1) {
        const subset = [];
        for (let i = 0; i < n; i += 1) {
          if (mask & (1 << i)) subset.push(elements[i]);
        }
        result.push(subset);
      }
      return result.sort((a, b) => {
        if (a.length !== b.length) return a.length - b.length;
        const len = Math.max(a.length, b.length);
        for (let i = 0; i < len; i += 1) {
          if (!a[i]) return -1;
          if (!b[i]) return 1;
          const c = SetModel.compare(a[i], b[i]);
          if (c !== 0) return c;
        }
        return 0;
      });
    },

    text(node) {
      if (!node) return "";
      if (node.t === "v") return node.v;
      if (!node.items.length) return "∅";
      return `{${node.items.map(SetModel.text).join(", ")}}`;
    },

    subsetText(items) {
      if (!items.length) return "∅";
      return `{${items.map(SetModel.text).join(", ")}}`;
    }
  };

  function t() {
    return window.CONTENT?.th;
  }

  function currentFormat() {
    return FORMATS.find((f) => f.id === state.formatId) || FORMATS[0];
  }

  function resetSlots(formatId) {
    const fmt = FORMATS.find((f) => f.id === formatId) || FORMATS[0];
    state.formatId = fmt.id;
    state.slots = Array(fmt.slots).fill(null);
    state.activeSlot = 0;
  }

  function draftReady() {
    return state.slots.every((s) => s != null);
  }

  function draftMember() {
    if (!draftReady()) return null;
    return SetModel.buildFromFormat(state.formatId, state.slots);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function plainLabel(str) {
    return String(str).replace(/\$/g, "");
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

  function formatMathText(str) {
    return escapeHtml(str).replace(/∅/g, '<span class="empty-symbol">∅</span>');
  }

  function cardHtml(node, opts = {}) {
    const cls = ["member-card"];
    if (opts.placeholder) cls.push("member-card--placeholder");
    if (opts.source) cls.push("member-card--source");
    const attrs = [
      `class="${cls.join(" ")}"`,
      opts.id != null ? `data-source-id="${opts.id}"` : "",
      opts.slotKey != null ? `data-slot-key="${opts.slotKey}"` : "",
      opts.source ? 'draggable="false"' : ""
    ].filter(Boolean).join(" ");

    if (opts.placeholder) {
      return `<span ${attrs} aria-hidden="true">□</span>`;
    }
    return `<span ${attrs}>${formatMathText(SetModel.text(node))}</span>`;
  }

  function renderFormatGlyph(id) {
    if (id === "plain") {
      return `<span class="fmt-box"></span>`;
    }
    if (id === "brace1") {
      return `<span class="fmt-brace">{</span><span class="fmt-box"></span><span class="fmt-brace">}</span>`;
    }
    if (id === "brace2") {
      return `<span class="fmt-brace">{</span><span class="fmt-box"></span><span class="fmt-comma">,</span><span class="fmt-box"></span><span class="fmt-brace">}</span>`;
    }
    return `<span class="fmt-brace">{</span><span class="fmt-box"></span><span class="fmt-comma">,</span><span class="fmt-brace">{</span><span class="fmt-box"></span><span class="fmt-brace">}</span><span class="fmt-brace">}</span>`;
  }

  function renderDraftPreview() {
    const fmt = currentFormat();
    const parts = state.slots.map((val, i) => {
      const filled = val != null;
      const active = state.activeSlot === i;
      const label = filled ? formatMathText(val) : "□";
      return `<button type="button" class="draft-slot${filled ? " is-filled" : ""}${active ? " is-active" : ""}" data-slot="${i}">${label}</button>`;
    });

    if (fmt.id === "plain") return parts[0];
    if (fmt.id === "brace1") {
      return `<span class="draft-brace">{</span>${parts[0]}<span class="draft-brace">}</span>`;
    }
    if (fmt.id === "brace2") {
      return `<span class="draft-brace">{</span>${parts[0]}<span class="draft-comma">,</span>${parts[1]}<span class="draft-brace">}</span>`;
    }
    return `<span class="draft-brace">{</span>${parts[0]}<span class="draft-comma">,</span><span class="draft-brace">{</span>${parts[1]}<span class="draft-brace">}</span><span class="draft-brace">}</span>`;
  }

  function emptySetCardHtml() {
    return cardHtml(SetModel.val("∅"));
  }

  function renderSetA() {
    if (!state.setA.length) {
      return `<div class="set-line"><span class="set-label">$A =$</span> ${emptySetCardHtml()}</div>`;
    }
    const cards = state.setA.map((el, i) => cardHtml(el, { id: i, source: true })).join('<span class="set-comma">,</span>');
    return `<div class="set-line" id="setALine"><span class="set-label">$A =$</span> <span class="set-brace">{</span>${cards}<span class="set-brace">}</span></div>`;
  }

  function renderSubsetUnit(subset, si) {
    if (subset.length === 0) {
      return `<span class="subset-unit" data-subset-index="${si}">${emptySetCardHtml()}</span>`;
    }
    const slots = subset.map((_, ei) => {
      const key = `${si}:${ei}`;
      if (state.subsetsRevealed) {
        return cardHtml(subset[ei], { slotKey: key });
      }
      return cardHtml(null, { placeholder: true, slotKey: key });
    }).join('<span class="set-comma">,</span>');
    return `<span class="subset-unit" data-subset-index="${si}"><span class="set-brace">{</span>${slots}<span class="set-brace">}</span></span>`;
  }

  function renderSubsetPlaceholders(subsets) {
    const bySize = new Map();
    subsets.forEach((subset, si) => {
      const size = subset.length;
      if (size === 0) return;
      if (!bySize.has(size)) bySize.set(size, []);
      bySize.get(size).push({ subset, si });
    });

    return [...bySize.keys()]
      .sort((a, b) => a - b)
      .map((size) => {
        const units = bySize
          .get(size)
          .map(({ subset, si }) => renderSubsetUnit(subset, si))
          .join('<span class="set-comma">,</span>');
        return `<div class="sp-subsets__row" data-size="${size}">${units}</div>`;
      })
      .join("");
  }

  function renderPowerUnit(subset) {
    if (subset.length === 0) {
      return `<span class="subset-unit">${emptySetCardHtml()}</span>`;
    }
    const cards = subset
      .map((el) => cardHtml(el))
      .join('<span class="set-comma">,</span>');
    return `<span class="subset-unit"><span class="set-brace">{</span>${cards}<span class="set-brace">}</span></span>`;
  }

  function renderPowerBlock(subsets) {
    if (!state.showPower) return "";
    const units = subsets
      .map((s) => renderPowerUnit(s))
      .join('<span class="set-comma">,</span>');
    return `
      <div class="power-block" id="powerBlock">
        <div class="power-line power-line--set">
          <span class="set-label">$P(A) =$</span>
          <span class="set-brace">{</span>
          ${units}
          <span class="set-brace">}</span>
        </div>
        <p class="power-line">$n[P(A)] = ${subsets.length}$</p>
      </div>
    `;
  }

  function renderApp() {
    const layout = $("#appLayout");
    const c = t()?.ui;
    if (!layout || !c) return;

    const subsets = SetModel.powerSet(state.setA);
    const n = state.setA.length;
    const defTitle = state.showPower ? c.defPowerTitle : c.defSubsetTitle;
    const defBody = state.showPower ? c.defPowerBody : c.defSubsetBody;
    const busy = state.animating ? "disabled" : "";

    layout.innerHTML = `
      <div class="sp-root">
        <section class="sp-def" aria-live="polite">
          <h2 class="sp-def__title">${escapeHtml(defTitle)}</h2>
          <p class="sp-def__body">${defBody}</p>
        </section>

        <div class="sp-workspace">
          <aside class="sp-sidebar" aria-label="สร้างเซต A">
            <p class="sp-instruction">${c.instruction}</p>

            <p class="sp-section-label">${escapeHtml(c.formatLabel)}</p>
            <div class="format-row" role="group" aria-label="${escapeHtml(c.formatLabel)}">
              ${FORMATS.map((f) => `
                <button
                  type="button"
                  class="format-btn${state.formatId === f.id ? " is-active" : ""}"
                  data-format="${f.id}"
                  aria-pressed="${state.formatId === f.id}"
                  aria-label="${escapeHtml(f.label)}"
                  ${busy}
                >${renderFormatGlyph(f.id)}</button>
              `).join("")}
            </div>

            <p class="sp-section-label">${escapeHtml(c.memberLabel)}</p>
            <div class="member-bank" role="group" aria-label="${escapeHtml(c.memberLabel)}">
              ${MEMBER_VALUES.map((v) => `
                <button type="button" class="member-btn" data-member="${escapeHtml(v)}" ${busy}>${formatMathText(v)}</button>
              `).join("")}
            </div>

            <div class="draft-row">
              <div class="draft-preview" id="draftPreview">${renderDraftPreview()}</div>
              <button type="button" class="primary-button sp-add" data-add ${busy}>${escapeHtml(c.add)}</button>
            </div>
            ${state.feedback ? `<p class="sp-feedback" role="status">${escapeHtml(state.feedback)}</p>` : ""}
          </aside>

          <section class="sp-main" aria-label="ผลลัพธ์">
            <div class="sp-main__top">
              <div class="sp-main__set">
                ${renderSetA()}
              </div>
              <div class="sp-main__actions">
                <button
                  type="button"
                  class="sp-reset"
                  data-reset-set
                  aria-label="${escapeHtml(plainLabel(c.resetSet))}"
                  title="${escapeHtml(plainLabel(c.resetSet))}"
                  ${busy}
                >
                  <svg class="sp-reset__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
                    <path d="M21 12a9 9 0 1 1-3-6.7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M21 3v6h-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button type="button" class="primary-button sp-create" data-create-subsets ${busy}>
                  ${escapeHtml(c.createSubsets)}
                </button>
              </div>
            </div>

            <div class="sp-subsets" id="subsetsArea">
              <div class="sp-subsets__label">
                <div class="sp-subsets__heading">
                  <span class="sp-subsets__intro">${c.allSubsets}</span>
                  ${emptySetCardHtml()}
                </div>
                <div class="sp-subsets__list" id="subsetsList">${renderSubsetPlaceholders(subsets)}</div>
              </div>
            </div>

            <p class="sp-count">
              ${c.subsetCount}
              <span class="sp-count__math">2<sup>${n}</sup> = ${2 ** n}</span>
              ${escapeHtml(c.subsetCountUnit)}
            </p>

            <button
              type="button"
              class="sp-power-btn${state.showPower ? " is-active" : ""}${!state.subsetsRevealed ? " is-locked" : ""}"
              data-power
              aria-label="${escapeHtml(plainLabel(c.powerSet))}"
              aria-disabled="${state.subsetsRevealed ? "false" : "true"}"
              ${busy}
            >${c.powerSet}</button>

            ${renderPowerBlock(subsets)}
          </section>
        </div>
      </div>
    `;

    bindEvents(layout);
    renderMath(layout);
  }

  async function animateSubsets() {
    if (state.animating) return;

    const subsets = SetModel.powerSet(state.setA);
    const token = ++animToken;
    state.animating = true;
    state.subsetsRevealed = false;
    state.showPower = false;
    state.feedback = "";
    renderApp();

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      if (token !== animToken) return;
      state.subsetsRevealed = true;
      state.animating = false;
      renderApp();
      return;
    }

    const bySize = new Map();
    subsets.forEach((subset, si) => {
      if (subset.length === 0) return;
      if (!bySize.has(subset.length)) bySize.set(subset.length, []);
      bySize.get(subset.length).push({ subset, si });
    });

    const sizes = [...bySize.keys()].sort((a, b) => a - b);

    for (const size of sizes) {
      if (token !== animToken) return;
      const group = bySize.get(size);
      for (const { subset, si } of group) {
        if (token !== animToken) return;
        await animateOneSubset(subset, si, token);
      }
    }

    if (token !== animToken) return;
    state.subsetsRevealed = true;
    state.animating = false;
    renderApp();
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function animateOneSubset(subset, si, token) {
    const layer = ensureAnimLayer();
    const flights = [];

    for (let ei = 0; ei < subset.length; ei += 1) {
      const sourceIdx = state.setA.findIndex((el) => SetModel.equals(el, subset[ei]));
      if (sourceIdx < 0) continue;
      const sourceEl = $(`[data-source-id="${sourceIdx}"]`);
      const targetEl = $(`[data-slot-key="${si}:${ei}"]`);
      if (!sourceEl || !targetEl) continue;

      const from = sourceEl.getBoundingClientRect();
      const to = targetEl.getBoundingClientRect();
      const clone = sourceEl.cloneNode(true);
      clone.classList.add("member-card--flying");
      clone.removeAttribute("data-source-id");
      clone.style.left = `${from.left}px`;
      clone.style.top = `${from.top}px`;
      clone.style.width = `${from.width}px`;
      clone.style.height = `${from.height}px`;
      layer.appendChild(clone);

      flights.push({ clone, from, to, targetEl, node: subset[ei] });
    }

    if (!flights.length) return;

    await wait(30);
    if (token !== animToken) {
      layer.replaceChildren();
      return;
    }

    flights.forEach(({ clone, from, to }) => {
      clone.style.transform = `translate(${to.left - from.left}px, ${to.top - from.top}px)`;
      clone.style.width = `${to.width}px`;
      clone.style.height = `${to.height}px`;
    });

    await wait(520);
    if (token !== animToken) {
      layer.replaceChildren();
      return;
    }

    flights.forEach(({ clone, targetEl, node }) => {
      targetEl.classList.remove("member-card--placeholder");
      targetEl.removeAttribute("aria-hidden");
      targetEl.innerHTML = formatMathText(SetModel.text(node));
      clone.remove();
    });

    await wait(120);
  }

  function ensureAnimLayer() {
    let layer = $("#animLayer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "animLayer";
      layer.className = "anim-layer";
      document.body.appendChild(layer);
    }
    layer.replaceChildren();
    return layer;
  }

  function invalidateSubsets() {
    animToken += 1;
    state.subsetsRevealed = false;
    state.showPower = false;
    state.animating = false;
    $("#animLayer")?.replaceChildren();
  }

  function addMember() {
    if (state.animating) return;
    if (!draftReady()) {
      state.feedback = t().ui.incomplete;
      renderApp();
      return;
    }
    if (state.setA.length >= MAX_MEMBERS) {
      state.feedback = t().ui.maxMembers;
      renderApp();
      return;
    }
    const member = draftMember();
    if (!member) return;
    if (state.setA.some((el) => SetModel.equals(el, member))) {
      state.feedback = t().ui.duplicate;
      renderApp();
      return;
    }

    invalidateSubsets();
    state.setA = SetModel.normalize([...state.setA, member]);
    state.feedback = "";
    resetSlots(state.formatId);
    renderApp();
  }

  function removeMemberAt(index) {
    if (index < 0 || index >= state.setA.length || state.animating) return;
    invalidateSubsets();
    state.setA = state.setA.filter((_, i) => i !== index);
    state.feedback = "";
    renderApp();
  }

  function resetSetA() {
    if (state.animating) return;
    invalidateSubsets();
    state.setA = [];
    state.feedback = "";
    resetSlots("plain");
    renderApp();
  }

  function pointOutsideRect(x, y, rect, pad = 8) {
    return (
      x < rect.left - pad ||
      x > rect.right + pad ||
      y < rect.top - pad ||
      y > rect.bottom + pad
    );
  }

  function bindSourceCardDrag(layout) {
    const setLine = $("#setALine", layout);
    if (!setLine || state.animating) return;

    $$("[data-source-id]", setLine).forEach((card) => {
      card.addEventListener("pointerdown", (e) => {
        if (e.button != null && e.button !== 0) return;
        if (state.animating) return;

        const index = Number(card.getAttribute("data-source-id"));
        if (!Number.isInteger(index) || index < 0 || index >= state.setA.length) return;

        e.preventDefault();
        const from = card.getBoundingClientRect();
        const offsetX = e.clientX - from.left;
        const offsetY = e.clientY - from.top;
        let moved = false;
        let pointerId = e.pointerId;

        const ghost = card.cloneNode(true);
        ghost.classList.add("member-card--drag");
        ghost.removeAttribute("data-source-id");
        ghost.style.left = `${from.left}px`;
        ghost.style.top = `${from.top}px`;
        ghost.style.width = `${from.width}px`;
        ghost.style.height = `${from.height}px`;
        document.body.appendChild(ghost);

        card.classList.add("member-card--dragging");
        try {
          card.setPointerCapture(pointerId);
        } catch (_) {}

        const onMove = (ev) => {
          if (ev.pointerId !== pointerId) return;
          const dx = Math.abs(ev.clientX - e.clientX);
          const dy = Math.abs(ev.clientY - e.clientY);
          if (dx > 4 || dy > 4) moved = true;

          ghost.style.left = `${ev.clientX - offsetX}px`;
          ghost.style.top = `${ev.clientY - offsetY}px`;

          const lineRect = setLine.getBoundingClientRect();
          const outside = pointOutsideRect(ev.clientX, ev.clientY, lineRect);
          ghost.classList.toggle("is-outside", outside);
          setLine.classList.toggle("is-drop-delete", outside);
        };

        const cleanup = () => {
          ghost.remove();
          card.classList.remove("member-card--dragging");
          setLine.classList.remove("is-drop-delete");
          try {
            if (card.hasPointerCapture?.(pointerId)) {
              card.releasePointerCapture(pointerId);
            }
          } catch (_) {}
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
        };

        const onUp = (ev) => {
          if (ev.pointerId !== pointerId) return;
          cleanup();
          if (!moved || state.animating) return;

          const lineRect = setLine.getBoundingClientRect();
          if (pointOutsideRect(ev.clientX, ev.clientY, lineRect)) {
            removeMemberAt(index);
          }
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
      });
    });
  }

  function bindEvents(layout) {
    $$("[data-format]", layout).forEach((btn) => {
      btn.addEventListener("click", () => {
        if (state.animating) return;
        resetSlots(btn.getAttribute("data-format"));
        state.feedback = "";
        renderApp();
      });
    });

    $$("[data-member]", layout).forEach((btn) => {
      btn.addEventListener("click", () => {
        if (state.animating) return;
        const value = btn.getAttribute("data-member");
        const idx = state.activeSlot;
        state.slots = state.slots.map((s, i) => (i === idx ? value : s));
        const nextEmpty = state.slots.findIndex((s) => s == null);
        state.activeSlot = nextEmpty === -1 ? Math.min(idx + 1, state.slots.length - 1) : nextEmpty;
        state.feedback = "";
        renderApp();
      });
    });

    $$("[data-slot]", layout).forEach((btn) => {
      btn.addEventListener("click", () => {
        if (state.animating) return;
        state.activeSlot = Number(btn.getAttribute("data-slot"));
        renderApp();
      });
    });

    $("[data-add]", layout)?.addEventListener("click", addMember);
    $("[data-reset-set]", layout)?.addEventListener("click", resetSetA);
    $("[data-create-subsets]", layout)?.addEventListener("click", () => {
      if (!state.animating) animateSubsets();
    });

    $("[data-power]", layout)?.addEventListener("click", () => {
      if (state.animating) return;
      if (!state.subsetsRevealed) {
        showNotice(t().ui.needCreateSubsets);
        return;
      }
      state.showPower = !state.showPower;
      renderApp();
      if (state.showPower) {
        $("#powerBlock")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });

    bindSourceCardDrag(layout);
  }

  function showNotice(message) {
    const existing = $(".sp-popup-overlay");
    if (existing) existing.remove();

    const c = t()?.ui;
    if (!c) return;

    const overlay = document.createElement("div");
    overlay.className = "sp-popup-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "spPopupMsg");
    overlay.innerHTML = `
      <div class="sp-popup">
        <p class="sp-popup__msg" id="spPopupMsg">${escapeHtml(message)}</p>
        <button type="button" class="primary-button sp-popup__ok">${escapeHtml(c.ok)}</button>
      </div>
    `;

    const close = () => {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    $(".sp-popup__ok", overlay).addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);
    $(".sp-popup__ok", overlay).focus();
  }

  function applyContent() {
    const c = t();
    if (!c) return;
    $("#landingEyebrow").textContent = c.landing.eyebrow;
    $("#landingTitle").textContent = c.landing.title;
    $("#startButton").textContent = c.landing.start;
    $("#appEyebrow").textContent = c.app.eyebrow;
    $("#appTitle").textContent = c.app.title;
    document.title = c.landing.title;
  }

  function showApp() {
    $("#landingPage").hidden = true;
    $("#landingPage").classList.remove("view--active");
    $("#appPage").hidden = false;
    $("#appPage").classList.add("view--active");
    renderApp();
    $("#appTitle").focus?.();
  }

  function runSelfTests() {
    const assert = (cond, msg) => {
      if (!cond) console.error("[SetModel test failed]", msg);
    };
    const a = SetModel.buildFromFormat("plain", ["1"]);
    const b = SetModel.buildFromFormat("brace1", ["1"]);
    const setA = SetModel.normalize([a, b]);
    assert(setA.length === 2, "A has 2 members");
    const power = SetModel.powerSet(setA);
    assert(power.length === 4, "2^2 = 4");
    assert(power[0].length === 0, "empty first");
    assert(SetModel.subsetText(power[3]) === "{1, {1}}", "full set text");
    const nested = SetModel.buildFromFormat("brace2", ["1", "2"]);
    assert(SetModel.text(nested) === "{1, 2}", "brace2 text");
    assert(SetModel.text(SetModel.set([nested])) === "{{1, 2}}", "nested display");
  }

  function bootstrap() {
    applyContent();
    runSelfTests();
    resetSlots("plain");
    $("#startButton")?.addEventListener("click", showApp);
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
