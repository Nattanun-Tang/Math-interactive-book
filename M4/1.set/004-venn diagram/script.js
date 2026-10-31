(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const SVG_W = 1000;
  const SVG_H = 620;
  const TOKEN_HALF = 28;
  const MEMBER_SETS = {
    numbers: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    letters: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]
  };

  const GEOMETRY = {
    2: {
      circles: {
        A: { cx: 380, cy: 310, r: 195 },
        B: { cx: 620, cy: 310, r: 195 }
      },
      labelAngles: { A: 210, B: -30 }
    },
    3: {
      circles: {
        A: { cx: 420, cy: 265, r: 168 },
        B: { cx: 580, cy: 265, r: 168 },
        C: { cx: 500, cy: 405, r: 168 }
      },
      labelAngles: { A: 205, B: -25, C: 90 }
    }
  };

  const UNIVERSAL = { x: 0, y: 0, w: SVG_W, h: SVG_H };
  const LABEL_OUTSIDE_GAP = 42;
  const DRAG_THRESHOLD = 3;

  const state = {
    setCount: 2,
    memberType: "numbers",
    members: {},
    draggingId: null,
    hoverRegion: null,
    ops: {
      union: false,
      intersection: false,
      difference: false,
      complement: false
    }
  };

  let dragPointerId = null;
  let dragStartClientX = 0;
  let dragStartClientY = 0;
  let dragActivated = false;
  let flashTimer = null;
  let svgPoint = null;
  let dragRafId = null;
  let pendingDragMove = null;
  let dragViewportLeft = 0;
  let dragViewportTop = 0;
  let dragViewportW = SVG_W;
  let dragViewportH = SVG_H;
  let dragCtm = null;
  let dragCtmInverse = null;
  let lastHighlightRegion = null;
  let lastCircleLayoutKey = null;
  let overlayRemeasureRaf = null;
  let diagramResizeRaf = null;
  let dragFloatEl = null;
  let dragPointerOffsetX = 0;
  let dragPointerOffsetY = 0;

  function isAppActive() {
    return Boolean($("#appPage")?.classList.contains("view--active") && !$("#appPage")?.hidden);
  }

  function copy() {
    return window.CONTENT?.th?.app || {};
  }

  function landingCopy() {
    return window.CONTENT?.th?.landing || {};
  }

  function applyShellContent() {
    const l = landingCopy();
    const a = copy();
    const map = [
      ["#landingEyebrow", l.eyebrow],
      ["#landingTitle", l.title],
      ["#startButton", l.start],
      ["#appTitle", a.title],
      ["#setCountLabel", a.setCount],
      ["#memberTypeLabel", a.memberType],
      ["#memberBankLabel", a.memberBank],
      ["#setReprTitle", a.setReprTitle],
      ["#opTogglesLegend", a.opToggles],
      ["#opLabelUnion", a.opUnion],
      ["#opLabelIntersection", a.opIntersection],
      ["#opLabelDifference", a.opDifference],
      ["#opLabelComplement", a.opComplement]
    ];
    map.forEach(([sel, text]) => {
      const el = $(sel);
      if (el && text != null) el.textContent = text;
    });

    const resetBtn = $("#resetButton");
    if (resetBtn && a.reset) {
      resetBtn.setAttribute("aria-label", a.reset);
      resetBtn.setAttribute("title", a.reset);
    }

    $$('.segmented__btn[data-set-count="2"]').forEach((btn) => { btn.textContent = a.setCount2 || "2 เซต"; });
    $$('.segmented__btn[data-set-count="3"]').forEach((btn) => { btn.textContent = a.setCount3 || "3 เซต"; });
    $$('.segmented__btn[data-member-type="numbers"]').forEach((btn) => { btn.textContent = a.numbers || "ตัวเลข"; });
    $$('.segmented__btn[data-member-type="letters"]').forEach((btn) => { btn.textContent = a.letters || "ตัวอักษร"; });
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

  function createMembers(memberType) {
    const labels = MEMBER_SETS[memberType];
    const members = {};
    labels.forEach((label) => {
      members[label] = {
        id: label,
        label,
        location: "bank",
        x: 0,
        y: 0,
        inA: false,
        inB: false,
        inC: false
      };
    });
    return members;
  }

  function resetMembersKeepSettings() {
    state.members = createMembers(state.memberType);
    state.draggingId = null;
    state.hoverRegion = null;
  }

  function labelOutsideCircle(circle, angleDeg, gap = LABEL_OUTSIDE_GAP) {
    const rad = (angleDeg * Math.PI) / 180;
    let x = circle.cx + Math.cos(rad) * (circle.r + gap);
    let y = circle.cy + Math.sin(rad) * (circle.r + gap);
    const margin = 22;
    x = Math.min(Math.max(x, UNIVERSAL.x + margin), UNIVERSAL.x + UNIVERSAL.w - margin);
    y = Math.min(Math.max(y, UNIVERSAL.y + margin), UNIVERSAL.y + UNIVERSAL.h - margin);

    const dx = x - circle.cx;
    const dy = y - circle.cy;
    const dist = Math.hypot(dx, dy);
    const minDist = circle.r + Math.min(gap, 28);
    if (dist > 0 && dist < minDist) {
      const scale = minDist / dist;
      x = circle.cx + dx * scale;
      y = circle.cy + dy * scale;
      x = Math.min(Math.max(x, UNIVERSAL.x + margin), UNIVERSAL.x + UNIVERSAL.w - margin);
      y = Math.min(Math.max(y, UNIVERSAL.y + margin), UNIVERSAL.y + UNIVERSAL.h - margin);
    }

    return { x, y };
  }

  function geometry() {
    const base = GEOMETRY[state.setCount];
    const labels = {};
    Object.entries(base.labelAngles).forEach(([name, angle]) => {
      labels[name] = labelOutsideCircle(base.circles[name], angle);
    });
    return { circles: base.circles, labels };
  }

  function pointInCircle(x, y, circle) {
    const dx = x - circle.cx;
    const dy = y - circle.cy;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function pointInUniversal(x, y) {
    return (
      x >= UNIVERSAL.x &&
      x <= UNIVERSAL.x + UNIVERSAL.w &&
      y >= UNIVERSAL.y &&
      y <= UNIVERSAL.y + UNIVERSAL.h
    );
  }

  function membershipAt(x, y) {
    const circles = geometry().circles;
    return {
      inA: pointInCircle(x, y, circles.A),
      inB: pointInCircle(x, y, circles.B),
      inC: state.setCount === 3 ? pointInCircle(x, y, circles.C) : false
    };
  }

  function regionKeyFromMembership(m) {
    const a = m.inA;
    const b = m.inB;
    const c = m.inC;
    if (state.setCount === 2) {
      if (a && b) return "AB";
      if (a) return "A";
      if (b) return "B";
      return "outside";
    }
    if (a && b && c) return "ABC";
    if (a && b && !c) return "AB";
    if (a && c && !b) return "AC";
    if (b && c && !a) return "BC";
    if (a && !b && !c) return "A";
    if (b && !a && !c) return "B";
    if (c && !a && !b) return "C";
    return "outside";
  }

  function deriveSets() {
    const order = MEMBER_SETS[state.memberType];
    const A = [];
    const B = [];
    const C = [];
    const U = [];

    order.forEach((id) => {
      const m = state.members[id];
      if (!m || m.location !== "diagram") return;
      U.push(id);
      if (m.inA) A.push(id);
      if (m.inB) B.push(id);
      if (state.setCount === 3 && m.inC) C.push(id);
    });

    return { U, A, B, C };
  }

  function setIntersect(a, b) {
    const lookup = new Set(b);
    return a.filter((id) => lookup.has(id));
  }

  function setUnion(...lists) {
    const seen = new Set();
    const out = [];
    lists.forEach((list) => {
      list.forEach((id) => {
        if (seen.has(id)) return;
        seen.add(id);
        out.push(id);
      });
    });
    return out;
  }

  function setDifference(a, b) {
    const lookup = new Set(b);
    return a.filter((id) => !lookup.has(id));
  }

  function sortMembers(members) {
    const order = MEMBER_SETS[state.memberType];
    const rank = new Map(order.map((id, i) => [id, i]));
    return [...members].sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0));
  }

  function formatSetLatex(name, members) {
    const sorted = sortMembers(members);
    if (!sorted.length) return `${name} = \\varnothing`;
    const list = sorted.map((id) => `\\mathrm{${id}}`).join(", ");
    return `${name} = \\{${list}\\}`;
  }

  function equationRowsForSets(sets) {
    const { union, intersection, difference, complement } = state.ops;
    const rows = [];

    if (state.setCount === 2) {
      rows.push([
        formatSetLatex("U", sets.U),
        formatSetLatex("A", sets.A),
        formatSetLatex("B", sets.B)
      ]);
      if (union) {
        rows.push([formatSetLatex("A \\cup B", setUnion(sets.A, sets.B))]);
      }
      if (intersection) {
        rows.push([formatSetLatex("A \\cap B", setIntersect(sets.A, sets.B))]);
      }
      if (difference) {
        rows.push([
          formatSetLatex("A - B", setDifference(sets.A, sets.B)),
          formatSetLatex("B - A", setDifference(sets.B, sets.A))
        ]);
      }
      if (complement) {
        const unionAB = setUnion(sets.A, sets.B);
        rows.push([
          formatSetLatex("A'", setDifference(sets.U, sets.A)),
          formatSetLatex("B'", setDifference(sets.U, sets.B)),
          formatSetLatex("(A \\cup B)'", setDifference(sets.U, unionAB))
        ]);
      }
      return rows;
    }

    rows.push([
      formatSetLatex("U", sets.U),
      formatSetLatex("A", sets.A),
      formatSetLatex("B", sets.B),
      formatSetLatex("C", sets.C)
    ]);
    if (union) {
      rows.push([
        formatSetLatex("A \\cup B", setUnion(sets.A, sets.B)),
        formatSetLatex("B \\cup C", setUnion(sets.B, sets.C)),
        formatSetLatex("A \\cup C", setUnion(sets.A, sets.C)),
        formatSetLatex("A \\cup B \\cup C", setUnion(sets.A, sets.B, sets.C))
      ]);
    }
    if (intersection) {
      const ab = setIntersect(sets.A, sets.B);
      const bc = setIntersect(sets.B, sets.C);
      const ac = setIntersect(sets.A, sets.C);
      const abc = setIntersect(ab, sets.C);
      rows.push([
        formatSetLatex("A \\cap B", ab),
        formatSetLatex("B \\cap C", bc),
        formatSetLatex("A \\cap C", ac),
        formatSetLatex("A \\cap B \\cap C", abc)
      ]);
    }
    if (difference) {
      rows.push([
        formatSetLatex("A - (B \\cup C)", setDifference(sets.A, setUnion(sets.B, sets.C))),
        formatSetLatex("B - (A \\cup C)", setDifference(sets.B, setUnion(sets.A, sets.C))),
        formatSetLatex("C - (A \\cup B)", setDifference(sets.C, setUnion(sets.A, sets.B)))
      ]);
    }
    if (complement) {
      const unionABC = setUnion(sets.A, sets.B, sets.C);
      rows.push([
        formatSetLatex("A'", setDifference(sets.U, sets.A)),
        formatSetLatex("B'", setDifference(sets.U, sets.B)),
        formatSetLatex("C'", setDifference(sets.U, sets.C)),
        formatSetLatex("(A \\cup B \\cup C)'", setDifference(sets.U, unionABC))
      ]);
    }
    return rows;
  }

  function clientToSvg(clientX, clientY) {
    const svg = $("#vennSvg");
    if (!svg) return { x: 0, y: 0 };
    if (!svgPoint) svgPoint = svg.createSVGPoint();
    svgPoint.x = clientX;
    svgPoint.y = clientY;
    const ctm = dragCtmInverse || svg.getScreenCTM()?.inverse();
    if (!ctm) return { x: 0, y: 0 };
    const p = svgPoint.matrixTransform(ctm);
    return { x: p.x, y: p.y };
  }

  function svgToLayerPx(x, y) {
    const svg = $("#vennSvg");
    const viewport = $("#diagramViewport");
    if (!viewport) return { left: 0, top: 0 };

    const vpRect =
      state.draggingId != null
        ? {
            left: dragViewportLeft,
            top: dragViewportTop,
            width: dragViewportW,
            height: dragViewportH
          }
        : viewport.getBoundingClientRect();

    const ctm = state.draggingId != null ? dragCtm : svg?.getScreenCTM();
    if (!svg || !ctm) {
      return {
        left: (x / SVG_W) * (vpRect.width || SVG_W),
        top: (y / SVG_H) * (vpRect.height || SVG_H)
      };
    }

    if (!svgPoint) svgPoint = svg.createSVGPoint();
    svgPoint.x = x;
    svgPoint.y = y;
    const screen = svgPoint.matrixTransform(ctm);
    return {
      left: screen.x - vpRect.left,
      top: screen.y - vpRect.top
    };
  }

  function cacheDragMetrics() {
    const viewport = $("#diagramViewport");
    const svg = $("#vennSvg");
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      dragViewportLeft = rect.left;
      dragViewportTop = rect.top;
      dragViewportW = rect.width || SVG_W;
      dragViewportH = rect.height || SVG_H;
    }
    if (svg) {
      if (!svgPoint) svgPoint = svg.createSVGPoint();
      const ctm = svg.getScreenCTM();
      dragCtm = ctm || null;
      dragCtmInverse = ctm ? ctm.inverse() : null;
    }
  }

  function clearDragMetrics() {
    dragCtm = null;
    dragCtmInverse = null;
    pendingDragMove = null;
    if (dragRafId != null) {
      cancelAnimationFrame(dragRafId);
      dragRafId = null;
    }
  }

  function clampInsideUniversal(x, y) {
    const pad = TOKEN_HALF * 0.35;
    return {
      x: Math.min(Math.max(x, UNIVERSAL.x + pad), UNIVERSAL.x + UNIVERSAL.w - pad),
      y: Math.min(Math.max(y, UNIVERSAL.y + pad), UNIVERSAL.y + UNIVERSAL.h - pad)
    };
  }

  function applyMembershipToMember(member, x, y) {
    const clamped = clampInsideUniversal(x, y);
    const mem = membershipAt(clamped.x, clamped.y);
    member.location = "diagram";
    member.x = clamped.x;
    member.y = clamped.y;
    member.inA = mem.inA;
    member.inB = mem.inB;
    member.inC = mem.inC;
    return regionKeyFromMembership(mem);
  }

  function returnMemberToBank(member) {
    member.location = "bank";
    member.x = 0;
    member.y = 0;
    member.inA = false;
    member.inB = false;
    member.inC = false;
  }

  function placeMathLabel(el, x, y) {
    if (!el) return;
    const pos = svgToLayerPx(x, y);
    el.style.left = `${pos.left}px`;
    el.style.top = `${pos.top}px`;
    el.hidden = false;
  }

  function renderDiagramLabels() {
    const geo = geometry();
    const labelA = $("#labelA");
    const labelB = $("#labelB");
    const labelC = $("#labelC");

    placeMathLabel(labelA, geo.labels.A.x, geo.labels.A.y);
    placeMathLabel(labelB, geo.labels.B.x, geo.labels.B.y);

    if (state.setCount === 3 && geo.labels.C) {
      placeMathLabel(labelC, geo.labels.C.x, geo.labels.C.y);
    } else if (labelC) {
      labelC.hidden = true;
    }

    renderMath($("#labelOverlay") || document.body);
  }

  function renderCircles() {
    const layer = $("#circleLayer");
    const highlightLayer = $("#highlightLayer");
    if (!layer || !highlightLayer) return;

    const geo = geometry();
    const layoutKey = String(state.setCount);
    if (lastCircleLayoutKey !== layoutKey) {
      lastCircleLayoutKey = layoutKey;
      lastHighlightRegion = null;
      layer.innerHTML = "";
      highlightLayer.innerHTML = "";

      Object.entries(geo.circles).forEach(([name, c]) => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("id", `circle${name}`);
        circle.setAttribute("class", `venn-circle venn-circle--${name.toLowerCase()}`);
        circle.setAttribute("cx", String(c.cx));
        circle.setAttribute("cy", String(c.cy));
        circle.setAttribute("r", String(c.r));
        circle.setAttribute("data-set", name);
        layer.appendChild(circle);
      });

      ["A", "B", "C"].forEach((name) => {
        if (!geo.circles[name]) return;
        const c = geo.circles[name];
        const glow = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        glow.setAttribute("id", `glow${name}`);
        glow.setAttribute("class", "region-glow");
        glow.setAttribute("cx", String(c.cx));
        glow.setAttribute("cy", String(c.cy));
        glow.setAttribute("r", String(c.r));
        highlightLayer.appendChild(glow);
      });
    }

    renderDiagramLabels();
  }

  function updateCircleHighlights(region) {
    if (region === lastHighlightRegion) return;
    lastHighlightRegion = region;

    $$(".venn-circle").forEach((el) => el.classList.remove("is-hot"));
    $$(".region-glow").forEach((el) => el.classList.remove("is-visible"));

    if (!region || region === "bank" || region === "outside") return;

    ["A", "B", "C"].forEach((name) => {
      const on =
        (name === "A" && /A/.test(region)) ||
        (name === "B" && /B/.test(region)) ||
        (name === "C" && /C/.test(region));
      if (!on) return;
      $(`#circle${name}`)?.classList.add("is-hot");
      $(`#glow${name}`)?.classList.add("is-visible");
    });
  }

  function createTokenElement(member) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "token";
    btn.dataset.memberId = member.id;
    btn.setAttribute("aria-label", `สมาชิก ${member.label}`);
    btn.textContent = member.label;
    btn.addEventListener("pointerdown", onTokenPointerDown);
    return btn;
  }

  function renderTokens() {
    const bank = $("#memberBank");
    const layer = $("#tokenLayer");
    if (!bank || !layer) return;

    const existing = new Map();
    $$(".token", bank).forEach((el) => existing.set(el.dataset.memberId, el));
    $$(".token", layer).forEach((el) => existing.set(el.dataset.memberId, el));

    MEMBER_SETS[state.memberType].forEach((id) => {
      const member = state.members[id];
      if (!member) return;

      let el = existing.get(id);
      if (!el) el = createTokenElement(member);
      else existing.delete(id);

      el.classList.toggle("is-dragging", state.draggingId === id);
      el.classList.remove("is-placeholder", "is-float");

      if (member.location === "bank") {
        el.classList.remove("is-on-diagram");
        el.style.left = "";
        el.style.top = "";
        el.style.transform = "";
        bank.appendChild(el);
      } else {
        el.classList.add("is-on-diagram");
        const pos = svgToLayerPx(member.x, member.y);
        const tokenSize = el.offsetWidth || TOKEN_HALF * 2;
        el.style.left = `${pos.left - tokenSize / 2}px`;
        el.style.top = `${pos.top - tokenSize / 2}px`;
        el.style.transform = "";
        layer.appendChild(el);
      }
    });

    existing.forEach((el) => el.remove());
  }

  function opsSignature() {
    const { union, intersection, difference, complement } = state.ops;
    return [union, intersection, difference, complement].map((v) => (v ? "1" : "0")).join("");
  }

  function syncOpToggles() {
    $$("#opToggles input[data-op]").forEach((input) => {
      const key = input.dataset.op;
      if (!key || !(key in state.ops)) return;
      input.checked = Boolean(state.ops[key]);
    });
  }

  function setOpEnabled(op, enabled) {
    if (!(op in state.ops)) return;
    state.ops[op] = Boolean(enabled);
    syncOpToggles();
    renderSetEquations();
    scheduleOverlayRemeasure();
  }

  function renderSetEquations() {
    const host = $("#setEquations");
    if (!host) return;
    const sets = deriveSets();
    const rows = equationRowsForSets(sets);
    const signature = `${state.setCount}:${opsSignature()}::${rows.map((row) => row.join("|")).join("||")}`;
    const hadSignature = host.dataset.signature != null;
    const changed = hadSignature && host.dataset.signature !== signature;

    if (hadSignature && !changed && host.childElementCount > 0) return;

    host.dataset.signature = signature;
    host.innerHTML = "";
    host.dataset.setCount = String(state.setCount);
    rows.forEach((row) => {
      const rowEl = document.createElement("div");
      rowEl.className = "set-eq-row";
      row.forEach((latex) => {
        const p = document.createElement("p");
        p.className = "set-eq";
        p.textContent = `$${latex}$`;
        rowEl.appendChild(p);
      });
      host.appendChild(rowEl);
    });
    renderMath(host);

    if (!changed) return;
    $$(".set-eq", host).forEach((el) => el.classList.add("is-flash"));
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      $$(".set-eq", host).forEach((el) => el.classList.remove("is-flash"));
    }, 280);
  }

  function remeasureOverlays() {
    if (!isAppActive() || state.draggingId != null) return;
    renderDiagramLabels();
    renderTokens();
  }

  function scheduleOverlayRemeasure(immediate = false) {
    if (overlayRemeasureRaf != null) {
      cancelAnimationFrame(overlayRemeasureRaf);
      overlayRemeasureRaf = null;
    }
    if (immediate) {
      remeasureOverlays();
      return;
    }
    overlayRemeasureRaf = requestAnimationFrame(() => {
      overlayRemeasureRaf = requestAnimationFrame(() => {
        overlayRemeasureRaf = null;
        remeasureOverlays();
      });
    });
  }

  function renderSegmented() {
    $$(".segmented__btn[data-set-count]").forEach((btn) => {
      const active = Number(btn.dataset.setCount) === state.setCount;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-checked", active ? "true" : "false");
    });
    $$(".segmented__btn[data-member-type]").forEach((btn) => {
      const active = btn.dataset.memberType === state.memberType;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-checked", active ? "true" : "false");
    });
    $("#appLayout")?.setAttribute("data-set-count", String(state.setCount));
    $("#appLayout")?.setAttribute("data-member-type", state.memberType);
  }

  function renderAll() {
    renderSegmented();
    syncOpToggles();
    renderSetEquations();
    void $(".diagram-stage")?.offsetHeight;
    renderCircles();
    renderTokens();
    scheduleOverlayRemeasure();
    updateCircleHighlights(state.hoverRegion);
  }

  function beginActiveDrag(el, member, clientX, clientY) {
    dragActivated = true;
    el.classList.add("is-dragging");
    state.draggingId = member.id;
    cacheDragMetrics();

    const rect = el.getBoundingClientRect();
    dragPointerOffsetX = clientX - (rect.left + rect.width / 2);
    dragPointerOffsetY = clientY - (rect.top + rect.height / 2);

    const floatLayer = $("#dragFloatLayer");
    if (floatLayer) {
      dragFloatEl = el.cloneNode(true);
      dragFloatEl.classList.add("is-dragging", "is-float");
      dragFloatEl.classList.remove("is-on-diagram");
      dragFloatEl.removeAttribute("id");
      dragFloatEl.style.left = "0px";
      dragFloatEl.style.top = "0px";
      dragFloatEl.style.width = `${rect.width}px`;
      dragFloatEl.style.height = `${rect.height}px`;
      floatLayer.appendChild(dragFloatEl);
      updateFloatPosition(clientX, clientY);
    }

    el.classList.add("is-placeholder");
  }

  function updateFloatPosition(clientX, clientY) {
    if (!dragFloatEl) return;
    const halfW = dragFloatEl.offsetWidth / 2;
    const halfH = dragFloatEl.offsetHeight / 2;
    const x = clientX - dragPointerOffsetX - halfW;
    const y = clientY - dragPointerOffsetY - halfH;
    dragFloatEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function clearFloatToken() {
    dragFloatEl?.remove();
    dragFloatEl = null;
  }

  function onTokenPointerDown(event) {
    if (event.button != null && event.button !== 0) return;
    const el = event.currentTarget;
    const id = el.dataset.memberId;
    const member = state.members[id];
    if (!member) return;

    event.preventDefault();
    el.setPointerCapture(event.pointerId);
    dragPointerId = event.pointerId;
    dragActivated = false;
    dragStartClientX = event.clientX;
    dragStartClientY = event.clientY;
    lastHighlightRegion = null;

    el.addEventListener("pointermove", onTokenPointerMove);
    el.addEventListener("pointerup", onTokenPointerUp);
    el.addEventListener("pointercancel", onTokenPointerUp);
  }

  function onTokenPointerMove(event) {
    if (event.pointerId !== dragPointerId) return;
    pendingDragMove = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      el: event.currentTarget
    };
    if (dragRafId != null) return;
    dragRafId = requestAnimationFrame(flushDragMove);
  }

  function flushDragMove() {
    dragRafId = null;
    const move = pendingDragMove;
    pendingDragMove = null;
    if (!move || move.pointerId !== dragPointerId) return;

    const el = move.el;
    const id = el?.dataset?.memberId;
    const member = id ? state.members[id] : null;
    if (!member || !el) return;

    const dx = move.clientX - dragStartClientX;
    const dy = move.clientY - dragStartClientY;
    if (!dragActivated) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      beginActiveDrag(el, member, move.clientX, move.clientY);
    }

    updateFloatPosition(move.clientX, move.clientY);

    const centerX = move.clientX - dragPointerOffsetX;
    const centerY = move.clientY - dragPointerOffsetY;
    const svgPos = clientToSvg(centerX, centerY);

    if (pointInUniversal(svgPos.x, svgPos.y)) {
      const mem = membershipAt(svgPos.x, svgPos.y);
      const region = regionKeyFromMembership(mem);
      state.hoverRegion = region;
      updateCircleHighlights(region);
    } else {
      state.hoverRegion = null;
      updateCircleHighlights(null);
    }
  }

  function onTokenPointerUp(event) {
    if (event.pointerId !== dragPointerId) return;
    const el = event.currentTarget;
    const id = el.dataset.memberId;
    const member = state.members[id];

    if (pendingDragMove) flushDragMove();

    el.releasePointerCapture?.(event.pointerId);
    el.removeEventListener("pointermove", onTokenPointerMove);
    el.removeEventListener("pointerup", onTokenPointerUp);
    el.removeEventListener("pointercancel", onTokenPointerUp);

    const dropClientX = event.clientX;
    const dropClientY = event.clientY;
    const dropCenterX = dropClientX - dragPointerOffsetX;
    const dropCenterY = dropClientY - dragPointerOffsetY;
    const svgPos = dragActivated ? clientToSvg(dropCenterX, dropCenterY) : null;

    clearFloatToken();
    clearDragMetrics();

    dragPointerId = null;
    state.draggingId = null;
    state.hoverRegion = null;
    el.classList.remove("is-dragging", "is-placeholder");

    if (!member) {
      renderAll();
      return;
    }

    if (!dragActivated || !svgPos) {
      renderTokens();
      return;
    }

    if (!pointInUniversal(svgPos.x, svgPos.y)) {
      returnMemberToBank(member);
    } else {
      applyMembershipToMember(member, svgPos.x, svgPos.y);
    }

    renderAll();
  }

  function changeSetCount(next) {
    const value = Number(next);
    if (value !== 2 && value !== 3) return;
    if (value === state.setCount) return;

    state.setCount = value;
    clearFloatToken();
    resetMembersKeepSettings();
    renderAll();
  }

  function changeMemberType(next) {
    if (next !== "numbers" && next !== "letters") return;
    if (next === state.memberType) return;
    state.memberType = next;
    clearFloatToken();
    resetMembersKeepSettings();
    renderAll();
  }

  function handleReset() {
    clearFloatToken();
    resetMembersKeepSettings();
    renderAll();
  }

  function showApp({ focusTitle = true } = {}) {
    $("#landingPage").hidden = true;
    $("#landingPage").classList.remove("view--active");
    $("#appPage").hidden = false;
    $("#appPage").classList.add("view--active");
    if (focusTitle) $("#appTitle").focus?.();
    renderAll();
    scheduleOverlayRemeasure();
  }

  function bindDiagramObservers() {
    const stage = $(".diagram-stage");
    if (stage && typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        if (!isAppActive() || state.draggingId != null) return;
        if (diagramResizeRaf != null) cancelAnimationFrame(diagramResizeRaf);
        diagramResizeRaf = requestAnimationFrame(() => {
          diagramResizeRaf = null;
          remeasureOverlays();
        });
      });
      observer.observe(stage);
    }

    window.addEventListener("resize", () => {
      if (!isAppActive() || state.draggingId != null) return;
      remeasureOverlays();
    });

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (isAppActive()) scheduleOverlayRemeasure();
      });
    }
  }

  function setSidebarCollapsed(collapsed) {
    const sidebar = $("#vennSidebar");
    const toggle = $("#sidebarToggle");
    if (!sidebar || !toggle) return;

    sidebar.classList.toggle("is-collapsed", collapsed);
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    toggle.setAttribute("aria-label", collapsed ? "ขยายแผงควบคุม" : "ย่อแผงควบคุม");
    scheduleOverlayRemeasure();
  }

  function bindControls() {
    $$(".segmented__btn[data-set-count]").forEach((btn) => {
      btn.addEventListener("click", () => changeSetCount(btn.dataset.setCount));
    });
    $$(".segmented__btn[data-member-type]").forEach((btn) => {
      btn.addEventListener("click", () => changeMemberType(btn.dataset.memberType));
    });
    $$("#opToggles input[data-op]").forEach((input) => {
      input.addEventListener("change", () => {
        setOpEnabled(input.dataset.op, input.checked);
      });
    });
    $("#resetButton")?.addEventListener("click", handleReset);
    $("#startButton")?.addEventListener("click", () => showApp());
    $("#sidebarToggle")?.addEventListener("click", () => {
      const sidebar = $("#vennSidebar");
      if (!sidebar) return;
      setSidebarCollapsed(!sidebar.classList.contains("is-collapsed"));
    });
    bindDiagramObservers();
  }

  function bootstrap() {
    applyShellContent();
    state.members = createMembers(state.memberType);
    bindControls();

    if ((location.hash || "").replace(/^#/, "") === "app") {
      try {
        history.replaceState(null, "", `${location.pathname}${location.search}`);
      } catch (_) {
        /* ignore */
      }
      showApp({ focusTitle: false });
    }
  }

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
