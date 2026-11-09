/* Registro de renderizadores e inicialização de cada página de módulo. */
(function () {
  const SE = window.SE, { $, esc } = SE;
  SE.modulos = {
    lista: [],
    registrar(m) { this.lista.push(m); },
    doPerfil(p) { return SE.config.modulos.filter(m => m.perfis.includes(p)); }
  };
  SE.router = {
    url(id) { return "../" + id + "/index.html"; },
    async iniciar(id) {
      const s = SE.auth.exigir(); if (!s) return;
      const u = s.usuario, mods = SE.modulos.doPerfil(u.perfil);
      const meta = mods.find(m => m.id === id), renderizador = SE.modulos.lista.find(m => m.id === id);
      if (!meta || !renderizador) {
        location.replace(this.url(mods[0].id));
        return;
      }
      document.title = meta.titulo + " · EDU+";
      const nome = u.nome || "Usuário", perfil = SE.config.perfis[u.perfil].rotulo;
      let grupo = "", links = "";
      for (const m of mods) {
        if (m.grupo !== grupo) {
          grupo = m.grupo;
          links += `<p class="grupo">${esc(grupo)}</p>`;
        }
        links += `<a class="nav-link${m.id === id ? " on" : ""}" href="${this.url(m.id)}" ${m.id === id ? 'aria-current="page"' : ""}><span class="nav-icone">${SE.ui.icone(m.icone)}</span><span>${esc(m.titulo)}</span></a>`;
      }
      $("#menu").innerHTML = links;
      $("#u-nome").textContent = nome;
      $("#u-perfil").textContent = perfil;
      $("#u-avatar").textContent = nome.trim().charAt(0).toUpperCase();
      $("#topo-perfil").textContent = perfil;
      $("#sair").onclick = () => SE.auth.sair();
      $("#burger").innerHTML = SE.ui.icone("menu");
      $("#sair").innerHTML = SE.ui.icone("log-out");
      $("#burger").onclick = e => {
        const aberto = document.body.classList.toggle("menu-aberto");
        e.currentTarget.setAttribute("aria-expanded", String(aberto));
      };
      document.body.addEventListener("click", e => {
        if (document.body.classList.contains("menu-aberto") && !e.target.closest(".lateral, #burger")) {
          document.body.classList.remove("menu-aberto");
          $("#burger").setAttribute("aria-expanded", "false");
        }
      });
      $("#view").innerHTML = '<p class="vazio">Carregando módulo…</p>';
      try {
        await renderizador.render($("#view"), { usuario: u, perfil: u.perfil });
      } catch (e) {
        $("#view").innerHTML = `<section class="painel estado-erro"><h2>Não foi possível carregar os dados</h2><p>${esc(e.message)}</p><button class="sec" onclick="location.reload()">Tentar novamente</button></section>`;
      }
    }
  };
})();
