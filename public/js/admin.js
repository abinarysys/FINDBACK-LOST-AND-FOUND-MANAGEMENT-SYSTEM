// File guide: This module handles browser-side admin page interactions.
// Inputs and outputs: Express requests or configuration enter through its exports; it returns middleware, route responses, query results, or browser behavior as appropriate.
// Connections: Imports and router mounts in app.js show how other modules call this code.

/* FindBack Admin — shared behaviour (loaded with `defer` on every admin page) */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- toasts ---------- */
  function toast(message, type) {
    const box = $("#toasts");
    if (!box) return alert(message);
    const t = document.createElement("div");
    t.className =
      "toast " + (type === "error" ? "err" : type === "success" ? "ok" : "");
    t.textContent = message;
    box.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  /* ---------- modals: data-open="id" / data-close ---------- */
  const openModal = (id) => {
    const m = document.getElementById(id);
    if (m) {
      m.classList.add("open");
      const f = $("input,select,textarea,button", m);
    }
  };
  const closeModal = (m) => m && m.classList.remove("open");
  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-open]");
    if (opener) {
      e.preventDefault();
      openModal(opener.dataset.open);
      return;
    }
    if (e.target.closest("[data-close]")) {
      closeModal(e.target.closest(".modal"));
      return;
    }
    if (e.target.classList && e.target.classList.contains("modal"))
      closeModal(e.target);
    const x = e.target.closest(".alert .close");
    if (x) x.parentElement.remove();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $$(".modal.open").forEach(closeModal);
  });

  /* ---------- one-click API actions ----------
       <button data-action data-url="/admin/users/5/status" data-method="PATCH"
               data-body='{"status":"inactive"}' data-confirm="Deactivate this user?">          */
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    if (btn.dataset.confirm && !confirm(btn.dataset.confirm)) return;
    btn.disabled = true;
    try {
      const res = await fetch(btn.dataset.url, {
        method: btn.dataset.method || "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: btn.dataset.body || "{}",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false)
        throw new Error(data.message || "Something went wrong.");
      toast(data.message || "Done.", "success");
      setTimeout(() => location.reload(), 700);
    } catch (err) {
      toast(err.message, "error");
      btn.disabled = false;
    }
  });

  /* ---------- search + chip filters for tables ----------
       <input data-search="tableId">   <button class="chip" data-filter="tableId" data-key="status" data-value="pending">
       rows: <tr data-row data-status="pending">   count: <span data-count="tableId">                  */
  const filterState = {};
  function applyFilters(id) {
    const table = document.getElementById(id);
    if (!table) return;
    const st = filterState[id] || (filterState[id] = { q: "", f: {} });
    let shown = 0;
    $$("tbody tr[data-row]", table).forEach((tr) => {
      const okText = !st.q || tr.textContent.toLowerCase().includes(st.q);
      const okFilters = Object.entries(st.f).every(
        ([k, v]) => !v || (tr.dataset[k] || "") === v,
      );
      const ok = okText && okFilters;
      tr.hidden = !ok;
      if (ok) shown++;
    });
    const empty = document.querySelector('[data-empty="' + id + '"]');
    if (empty) empty.hidden = shown > 0;
    $$('[data-count="' + id + '"]').forEach((el) => {
      el.textContent = shown;
    });
  }
  document.addEventListener("input", (e) => {
    const input = e.target.closest("[data-search]");
    if (!input) return;
    const id = input.dataset.search;
    (filterState[id] || (filterState[id] = { q: "", f: {} })).q = input.value
      .trim()
      .toLowerCase();
    applyFilters(id);
  });
  document.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-filter]");
    if (!chip) return;
    const id = chip.dataset.filter;
    (filterState[id] || (filterState[id] = { q: "", f: {} })).f[
      chip.dataset.key
    ] = chip.dataset.value;
    $$(
      '[data-filter="' + id + '"][data-key="' + chip.dataset.key + '"]',
    ).forEach((c) => c.classList.toggle("active", c === chip));
    applyFilters(id);
  });

  /* ---------- tabs that switch panels without reload: data-tabs ---------- */
  document.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (!tab) return;
    const group = tab.closest("[data-tabs]");
    $$("[data-tab]", group).forEach((t) =>
      t.classList.toggle("active", t === tab),
    );
    $$("[data-panel]").forEach((p) => {
      p.hidden = p.dataset.panel !== tab.dataset.tab;
    });
    history.replaceState(null, "", "#" + tab.dataset.tab);
  });

  /* ---------- CSV export of visible rows: data-export="tableId" ---------- */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-export]");
    if (!btn) return;
    const table = document.getElementById(btn.dataset.export);
    if (!table) return;
    const rows = [$$("thead th", table).map((th) => th.textContent.trim())];
    $$("tbody tr[data-row]", table).forEach((tr) => {
      if (!tr.hidden)
        rows.push(
          $$("td", tr).map((td) => td.textContent.replace(/\s+/g, " ").trim()),
        );
    });
    const csv = rows
      .map((r) =>
        r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(","),
      )
      .join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
    );
    a.download =
      (btn.dataset.name || "export") +
      "-" +
      new Date().toISOString().slice(0, 10) +
      ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  /* ---------- theme (dark mode + accent colour) ---------- */
  const root = document.documentElement;
  const THEME_KEY = "fb-theme",
    ACCENT_KEY = "fb-accent",
    DEFAULT_ACCENT = "#4F46E5";

  function currentTheme() {
    return {
      mode: root.dataset.theme === "dark" ? "dark" : "light",
      color:
        root.style.getPropertyValue("--accent").trim() ||
        getComputedStyle(root).getPropertyValue("--accent").trim() ||
        DEFAULT_ACCENT,
    };
  }

  async function persistTheme(theme) {
    try {
      const response = await fetch("/user/settings/theme", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(theme),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save appearance.");
      }
      return true;
    } catch (error) {
      toast("Appearance previewed, but could not be saved to your account.", "error");
      return false;
    }
  }

  window.FBTheme = {
    isDark: () => root.dataset.theme === "dark",
    setDark(on) {
      if (on) root.dataset.theme = "dark";
      else delete root.dataset.theme;
      try {
        localStorage.setItem(THEME_KEY, on ? "dark" : "light");
      } catch (e) {}
      persistTheme(currentTheme());
    },
    setAccent(c) {
      const color = c || DEFAULT_ACCENT;
      root.style.setProperty("--accent", color);
      // Let the active light/dark palette derive --primary from the accent.
      root.style.removeProperty("--primary");
      try {
        localStorage.setItem(ACCENT_KEY, color);
      } catch (e) {}
      $$(".swatch").forEach((s) =>
        s.classList.toggle(
          "active",
          (s.dataset.color || "").toLowerCase() === color.toLowerCase(),
        ),
      );
      persistTheme(currentTheme());
    },
    reset() {
      root.removeAttribute("data-theme");
      root.style.setProperty("--accent", DEFAULT_ACCENT);
      root.style.removeProperty("--primary");
      try {
        localStorage.setItem(THEME_KEY, "light");
        localStorage.setItem(ACCENT_KEY, DEFAULT_ACCENT);
      } catch (e) {}
      $$(".swatch").forEach((s) =>
        s.classList.toggle(
          "active",
          (s.dataset.color || "").toLowerCase() === DEFAULT_ACCENT.toLowerCase(),
        ),
      );
      persistTheme({ mode: "light", color: DEFAULT_ACCENT });
    },
  };
  document.addEventListener("DOMContentLoaded", () => {
    $$("[data-w]").forEach((el) => {
      el.style.width = (parseFloat(el.dataset.w) || 0) + "%";
    });
    $$(".swatch[data-color]").forEach((el) => {
      el.style.background = el.dataset.color;
    });
    const dark = $("#darkToggle");
    if (dark) {
      dark.checked = FBTheme.isDark();
      dark.addEventListener("change", () => FBTheme.setDark(dark.checked));
    }
    $$(".swatch").forEach((s) =>
      s.addEventListener("click", () => FBTheme.setAccent(s.dataset.color)),
    );
    const reset = $("#resetTheme");
    if (reset)
      reset.addEventListener("click", () => {
        FBTheme.reset();
        if (dark) dark.checked = false;
        toast("Appearance reset.", "success");
      });
    const saved = currentTheme().color;
    $$(".swatch").forEach((s) =>
      s.classList.toggle(
        "active",
        (s.dataset.color || "").toLowerCase() === saved.toLowerCase(),
      ),
    );
  });

  window.FB = { toast, openModal, closeModal, applyFilters };
})();
