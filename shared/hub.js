(function () {
  const catalog = () => window.BOOK_CATALOG || [];

  function parseHash() {
    const raw = (location.hash || "#").slice(1).trim();
    if (!raw) return { bookId: null, unitId: null };
    const [bookId, unitId] = raw.split("/");
    return { bookId: bookId || null, unitId: unitId || null };
  }

  function setHash(bookId, unitId) {
    if (!bookId) {
      // replaceState clears the URL but does not fire hashchange — must re-render
      if (location.hash) {
        history.replaceState(null, "", location.pathname + location.search);
        render();
      }
      return;
    }
    const next = unitId ? `#${bookId}/${unitId}` : `#${bookId}`;
    if (location.hash !== next) location.hash = next;
  }

  function findBook(bookId) {
    return catalog().find((b) => b.id === bookId) || null;
  }

  function findUnit(book, unitId) {
    return book?.units?.find((u) => u.id === unitId) || null;
  }

  function countItems(book) {
    return (book.units || []).reduce((n, u) => n + (u.items?.length || 0), 0);
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.entries(attrs).forEach(([key, value]) => {
        if (value == null || value === false) return;
        if (key === "className") node.className = value;
        else if (key === "text") node.textContent = value;
        else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
        else node.setAttribute(key, value === true ? "" : String(value));
      });
    }
    (children || []).forEach((child) => {
      if (child == null) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function renderNav(book, unit) {
    const nav = document.getElementById("hubNav");
    nav.replaceChildren();

    const home = el("button", {
      className: "hub__crumb",
      type: "button",
      text: "สารบัญหลัก",
      onClick: () => setHash(null)
    });
    if (!book) home.disabled = true;
    nav.appendChild(home);

    if (book) {
      nav.appendChild(el("span", { className: "hub__crumb-sep", text: "/" }));
      const bookCrumb = el("button", {
        className: "hub__crumb",
        type: "button",
        text: book.label,
        onClick: () => setHash(book.id)
      });
      if (!unit) bookCrumb.disabled = true;
      nav.appendChild(bookCrumb);
    }

    if (book && unit) {
      nav.appendChild(el("span", { className: "hub__crumb-sep", text: "/" }));
      nav.appendChild(el("button", {
        className: "hub__crumb",
        type: "button",
        text: unit.label,
        disabled: true
      }));
    }
  }

  function renderBooks(panel) {
    panel.appendChild(el("h2", { className: "hub__panel-title", text: "เลือกเล่ม" }));
    const grid = el("div", { className: "hub__grid" });
    catalog().forEach((book) => {
      const n = countItems(book);
      grid.appendChild(el("button", {
        className: "hub__tile",
        type: "button",
        onClick: () => setHash(book.id)
      }, [
        el("p", { className: "hub__tile-kicker", text: book.grade }),
        el("h3", { className: "hub__tile-title", text: book.label }),
        el("p", {
          className: "hub__tile-meta",
          text: n ? `${book.units.length} หน่วย · ${n} ชิ้นงาน` : `${book.units.length} หน่วย · ยังไม่มีชิ้นงาน`
        })
      ]));
    });
    panel.appendChild(grid);
  }

  function renderUnits(panel, book) {
    panel.appendChild(el("h2", { className: "hub__panel-title", text: `หน่วยใน${book.label}` }));
    const grid = el("div", { className: "hub__grid" });
    book.units.forEach((unit, index) => {
      const n = unit.items?.length || 0;
      grid.appendChild(el("button", {
        className: "hub__tile",
        type: "button",
        onClick: () => setHash(book.id, unit.id)
      }, [
        el("p", { className: "hub__tile-kicker", text: `บทที่ ${index + 1}` }),
        el("h3", { className: "hub__tile-title", text: unit.label }),
        el("p", {
          className: "hub__tile-meta",
          text: n ? `${n} ชิ้นงาน` : "ยังไม่มีชิ้นงาน"
        })
      ]));
    });
    panel.appendChild(grid);
  }

  function renderItems(panel, book, unit) {
    panel.appendChild(el("h2", { className: "hub__panel-title", text: unit.label }));
    const items = unit.items || [];
    if (!items.length) {
      panel.appendChild(el("p", {
        className: "hub__empty",
        text: "ยังไม่มีชิ้นงานในหน่วยนี้ — เพิ่มรายการใน catalog.js เมื่อสร้าง interactive ใหม่"
      }));
      return;
    }
    const list = el("div", { className: "hub__list" });
    items.forEach((item) => {
      const link = el("a", {
        className: "hub__item",
        // relative path — สำคัญสำหรับ Cursor Simple Browser / Live Preview
        // อย่าแปลงเป็น absolute จาก location.href (จะชี้ path ผิดใน webview)
        target: "_blank",
        rel: "noopener noreferrer"
      }, [
        el("span", { className: "hub__item-id", text: item.id }),
        el("span", { className: "hub__item-title", text: item.title })
      ]);
      link.setAttribute("href", item.href);
      list.appendChild(link);
    });
    panel.appendChild(list);
  }

  function render() {
    const { bookId, unitId } = parseHash();
    const book = findBook(bookId);
    const unit = book ? findUnit(book, unitId) : null;
    const panel = document.getElementById("hubPanel");

    if (bookId && !book) {
      setHash(null);
      return;
    }
    if (unitId && book && !unit) {
      setHash(book.id);
      return;
    }

    renderNav(book, unit);
    panel.replaceChildren();

    if (!book) renderBooks(panel);
    else if (!unit) renderUnits(panel, book);
    else renderItems(panel, book, unit);
  }

  function showPreviewHint() {
    const hint = document.getElementById("hubHint");
    if (!hint) return;
    const href = String(location.href || "");
    const embedded =
      /vscode-webview|vscode-cdn|vscode-resource|cursor/i.test(href) ||
      /Electron/i.test(navigator.userAgent || "");
    hint.hidden = !embedded;
  }

  window.addEventListener("hashchange", render);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      showPreviewHint();
      render();
    });
  } else {
    showPreviewHint();
    render();
  }
})();
