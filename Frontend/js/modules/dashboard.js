SE.modulos.registrar({
  id: "dashboard", titulo: "Visão geral", grupo: "Início", perfis: ["coordenacao", "professor"],
  async render(el, { usuario, perfil }) {
    const r = await SE.api.resumo(), { ui, esc, router } = SE;
    const card = (rotulo, valor, id, icone) => {
      const meta = SE.config.modulos.find(m => m.id === id);
      return `<a class="indicador" href="${router.url(id)}"><span class="indicador-icone" aria-hidden="true">${ui.icone(icone)}</span><span class="indicador-conteudo"><span class="indicador-rotulo">${esc(rotulo)}</span><strong>${esc(valor)}</strong></span><span class="indicador-ir" aria-label="Abrir ${esc(meta.titulo)}">${ui.icone("arrow-right")}</span></a>`;
    };
    const indicadores = perfil === "coordenacao"
      ? [
          card("Alunos ativos", r.alunos, "alunos", "users"),
          card("Professores ativos", r.professores, "professores", "user-round"),
          card("Disciplinas", r.disciplinas, "disciplinas", "book-open"),
          card("Turmas", r.turmas, "turmas", "graduation-cap"),
          card("Matrículas ativas", r.matriculas, "matriculas", "clipboard-list"),
          card("Notas pendentes", r.notasPendentes, "notas", "notebook-pen")
        ]
      : [
          card("Minhas turmas", r.turmas, "turmas", "graduation-cap"),
          card("Alunos nas minhas turmas", r.alunos, "boletim", "users"),
          card("Notas pendentes", r.notasPendentes, "notas", "notebook-pen"),
          card("Aprovados", r.aprovados, "notas", "check"),
          card("Reprovados", r.reprovados, "notas", "alert-circle")
        ];
    const acessos = perfil === "coordenacao"
      ? [["turmas", "Organizar turmas"], ["matriculas", "Gerenciar matrículas"], ["auditoria", "Consultar auditoria"]]
      : [["notas", "Acessar minhas notas"], ["turmas", "Consultar minhas turmas"], ["boletim", "Consultar boletins"]];
    const nome = esc((usuario.nome || "Usuário").trim().split(/\s+/)[0]);
    const saudacao = perfil === "coordenacao"
      ? "Acompanhe os cadastros e a organização acadêmica da escola."
      : "Acompanhe suas turmas e mantenha o diário acadêmico em dia.";
    el.innerHTML = ui.cabecalho("Olá, " + nome, saudacao, "", "dashboard") +
      `<div class="dashboard-layout"><div class="dashboard-principal"><section class="secao-dashboard" aria-labelledby="titulo-indicadores"><header class="secao-cabecalho"><div><span class="sobrelinha">ACOMPANHAMENTO</span><h2 id="titulo-indicadores">Resumo acadêmico</h2></div><span class="periodo-contexto">${ui.icone("calendar")} <span>Ano letivo ${new Date().getFullYear()}</span></span></header><div class="indicadores">${indicadores.join("")}</div></section><section class="secao-dashboard secao-acessos" aria-labelledby="titulo-acessos"><header class="secao-cabecalho"><div><span class="sobrelinha">ATALHOS</span><h2 id="titulo-acessos">Acessos rápidos</h2></div></header><div class="lista-acessos">${acessos.map(([id, titulo]) => { const m = SE.config.modulos.find(x => x.id === id); return `<a class="atalho-modulo" href="${router.url(id)}"><span class="atalho-icone" aria-hidden="true">${ui.icone(m.icone)}</span><span>${esc(titulo)}</span>${ui.icone("chevron-right", "atalho-seta")}</a>`; }).join("")}</div></section></div><aside class="painel-contexto"><span class="contexto-icone" aria-hidden="true">${ui.icone(perfil === "coordenacao" ? "school" : "notebook-pen")}</span><span class="sobrelinha">${perfil === "coordenacao" ? "ESPAÇO DA COORDENAÇÃO" : "ESPAÇO DO PROFESSOR"}</span><h2>${perfil === "coordenacao" ? "Gestão acadêmica" : "Rotina docente"}</h2><p>${perfil === "coordenacao" ? "Use os módulos para manter cadastros, turmas e matrículas organizados." : "Acesse suas turmas para lançar notas e acompanhar o desempenho acadêmico."}</p><a class="botao-contexto" href="${router.url(perfil === "coordenacao" ? "turmas" : "notas")}">${perfil === "coordenacao" ? "Ver turmas" : "Abrir notas"}${ui.icone("arrow-right")}</a><div class="contexto-rodape">${ui.icone("shield-check")}<span>Acesso institucional · ${esc(SE.config.perfis[perfil].rotulo)}</span></div></aside></div>`;
  }
});
