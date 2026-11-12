/* Configuração central. Tudo que muda entre "demonstração" e "produção" fica aqui. */
window.SE = window.SE || {};
SE.config = {
  api: {
    modo: "local",          // "local" = dados no navegador (demonstração) | "http" = back-end real
    baseUrl: "/api"         // usado quando modo = "http"
  },
  seedDemo: true,           // popula dados de exemplo no modo local

  /* O perfil é identificado SOMENTE pelo domínio do e-mail (não há seletor de perfil).
     Ajuste os domínios para os da escola. O back-end deve devolver o perfil no login. */
  perfis: {
    coordenacao: { rotulo: "Coordenação", dominio: /@coordenacao\.[a-z0-9.-]+$/i },
    professor:   { rotulo: "Professor",   dominio: /@professor\.[a-z0-9.-]+$/i }
  },

  avaliacao: { notaMin: 0, notaMax: 10, mediaAprovacao: 6 },

  /* Quem pode lançar/corrigir notas. Coordenação apenas consulta (ver docs/API.md). */
  permissoes: { notas: { escrita: ["professor"] } },

  /* Navegação das páginas independentes. Alunos são registros acadêmicos, nunca usuários. */
  modulos: [
    { id: "dashboard", titulo: "Visão geral", grupo: "Início", icone: "layout-dashboard", perfis: ["coordenacao", "professor"] },
    { id: "alunos", titulo: "Alunos", grupo: "Cadastros", icone: "users", perfis: ["coordenacao"] },
    { id: "professores", titulo: "Professores", grupo: "Cadastros", icone: "user-round", perfis: ["coordenacao"] },
    { id: "disciplinas", titulo: "Disciplinas", grupo: "Cadastros", icone: "book-open", perfis: ["coordenacao"] },
    { id: "turmas", titulo: "Turmas", grupo: "Acadêmico", icone: "graduation-cap", perfis: ["coordenacao", "professor"] },
    { id: "matriculas", titulo: "Matrículas", grupo: "Acadêmico", icone: "clipboard-list", perfis: ["coordenacao"] },
    { id: "notas", titulo: "Notas", grupo: "Acadêmico", icone: "notebook-pen", perfis: ["coordenacao", "professor"] },
    { id: "boletim", titulo: "Boletim", grupo: "Acadêmico", icone: "file-chart-column", perfis: ["coordenacao", "professor"] },
    { id: "auditoria", titulo: "Auditoria", grupo: "Administração", icone: "history", perfis: ["coordenacao"] }
  ]
};
