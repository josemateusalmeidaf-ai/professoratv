(function () {
  const SE = window.SE = window.SE || {};
  SE.$ = (s, r = document) => r.querySelector(s);
  SE.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  SE.esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  SE.fmtData = iso => { if (!iso) return "—"; const [y, m, d] = String(iso).slice(0, 10).split("-"); return `${d}/${m}/${y}`; };
  SE.fmtDataHora = iso => { const d = new Date(iso); return isNaN(d) ? "—" : d.toLocaleString("pt-BR"); };
  SE.fmtNota = v => v == null ? "—" : String(Math.round(v * 100) / 100).replace(".", ",");
  SE.debounce = (fn, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  SE.Erro = class extends Error { constructor(m, codigo) { super(m); this.codigo = codigo || 400; } };
  SE.badge = s => `<span class="badge ${s === "Aprovado" ? "ok" : s === "Reprovado" ? "bad" : "andamento"}">${SE.esc(s)}</span>`;
})();
