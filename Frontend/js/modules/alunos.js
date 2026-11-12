SE.modulos.registrar({
  id: "alunos", titulo: "Alunos", grupo: "Cadastros", perfis: ["coordenacao"],
  render: el => SE.ui.crud(el, {
    recurso: "alunos", titulo: "Alunos", sub: "Cadastro de alunos (registros acadêmicos; alunos não acessam o sistema).", novo: "Novo aluno", rotulo: "aluno",
    colunas: [{ l: "Nome", k: "nome" }, { l: "Matrícula", k: "matricula" }, { l: "Nascimento", f: r => SE.fmtData(r.dataNascimento) }, { l: "Responsável", f: r => SE.esc(r.responsavelNome || "—") + (r.responsavelContato ? `<br><small>${SE.esc(r.responsavelContato)}</small>` : "") }],
    campos: [
      { nome: "nome", rotulo: "Nome do aluno", obrigatorio: true, largo: true },
      { nome: "matricula", rotulo: "Matrícula (única)", obrigatorio: true, soCriar: true },
      { nome: "dataNascimento", rotulo: "Data de nascimento", tipo: "date", obrigatorio: true },
      { nome: "responsavelNome", rotulo: "Responsável" },
      { nome: "responsavelContato", rotulo: "Contato do responsável", tipo: "tel", dica: "Obrigatório para menores de 18 anos" }
    ]
  })
});
