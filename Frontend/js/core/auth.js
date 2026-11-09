/* Sessão e guarda de acesso. O perfil vem do back-end (modo http) ou do cadastro local. */
(function () {
  const SE = window.SE, K = "se.sessao";
  SE.api = SE.config.api.modo === "http" ? SE.criarHttp() : SE.criarLocal();
  SE.auth = {
    sessao() { try { return JSON.parse(sessionStorage.getItem(K)); } catch (e) { return null; } },
    async entrar(email, senha) {
      const perfil = SE.rules.perfilDoEmail(email);
      if (!perfil) throw new SE.Erro("E-mail não reconhecido. Use seu e-mail institucional de professor ou da coordenação.");
      if (!senha) throw new SE.Erro("Informe a senha.");
      const r = await SE.api.login(email.trim(), senha);
      if (!r.usuario || !SE.config.perfis[r.usuario.perfil] || r.usuario.perfil !== perfil) throw new SE.Erro("Perfil de acesso inválido para este e-mail.", 403);
      sessionStorage.setItem(K, JSON.stringify(r));
      return r;
    },
    sair(expirou) { const s = this.sessao(); sessionStorage.removeItem(K); if (s) SE.api.logout(); location.href = (document.body.dataset.module ? "../../index.html" : "index.html") + (expirou ? "?expirou=1" : ""); },
    exigir() { const s = this.sessao(); if (!s) { location.replace(document.body.dataset.module ? "../../index.html" : "index.html"); return null; } return s; }
  };
})();
