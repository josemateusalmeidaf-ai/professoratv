(function () {
  const SE = window.SE, { $ } = SE;
  if (SE.auth.sessao()) { location.replace("app.html"); return; }
  const em = $("#email"), chip = $("#perfil-detectado"), er = $("#erro");
  $("#ano-atual").textContent = new Date().getFullYear();
  $("#login-sparkle").innerHTML = SE.icons.render("sparkles");
  $("#login-arrow").innerHTML = SE.icons.render("arrow-right");
  $("#login-security-icon").innerHTML = SE.icons.render("shield-check");
  if (new URLSearchParams(location.search).get("expirou")) er.textContent = "Sua sessão expirou. Entre novamente.";
  em.addEventListener("input", () => {
    const p = SE.rules.perfilDoEmail(em.value);
    chip.textContent = p ? "Acesso: " + SE.config.perfis[p].rotulo : (em.value ? "E-mail não reconhecido" : "");
    chip.className = "chip " + (p ? "ok" : em.value ? "bad" : "");
  });
  $("#form-login").onsubmit = async e => {
    e.preventDefault(); er.textContent = ""; const b = $("#entrar"); b.disabled = true;
    try { await SE.auth.entrar(em.value, $("#senha").value); location.href = "app.html"; }
    catch (x) { er.textContent = x.message; b.disabled = false; }
  };
  const demo = $("#demo"); if (SE.config.api.modo === "local" && SE.config.seedDemo) demo.hidden = false;
  SE.$$("[data-demo]").forEach(b => b.onclick = () => { const [e, s] = b.dataset.demo.split("|"); em.value = e; $("#senha").value = s; em.dispatchEvent(new Event("input")); });
})();
