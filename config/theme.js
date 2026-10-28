const ACCENTS = [
  { name: "FindBack Purple", value: "#7B4AA2" },
  { name: "Indigo", value: "#4F46E5" },
  { name: "Blue", value: "#2563EB" }, 
  { name: "Teal", value: "#0F766E" },
  { name: "Emerald", value: "#047857" }, 
  { name: "Violet", value: "#6D28D9" },
  { name: "Rose", value: "#BE123C" },
  { name: "Slate", value: "#334155" },
];

const DEFAULT_THEME = { mode: "light", color: "#4F46E5" };

const isMode = (mode) => mode === "light" || mode === "dark";
const isAccent = (color) =>
  ACCENTS.some(
    (a) => a.value.toLowerCase() === String(color || "").toLowerCase(), 
  );

  function sanitize(input) {
  const color = ACCENTS.find(
    (a) => a.value.toLowerCase() === String(input?.color || "").toLowerCase(),
  );
  return {
    mode: input?.mode === "dark" ? "dark" : "light", // OPTIONAL CHAINING
    color: color ? color.value : DEFAULT_THEME.color, 
  };
}


function themeScript(theme, applyDark) {
  const t = sanitize(theme);
  return `<script>(function(){var r=document.documentElement;r.style.setProperty('--accent','${t.color}');${
    applyDark && t.mode === "dark" ? "r.setAttribute('data-theme','dark');" : ""
  }})();</script>`;
}

module.exports = {ACCENTS, DEFAULT_THEME, isMode, isAccent, sanitize,themeScript,};
