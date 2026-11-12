SE.modulos.registrar({
  id: "turmas", titulo: "Turmas", grupo: "Acadêmico", perfis: ["coordenacao", "professor"],
  render: el => SE.ui.crud(el, {
    recurso: "turmas", titulo: "Turmas", sub: "Cada turma pertence a uma disciplina e tem um professor responsável.", novo: "Nova turma", rotulo: "turma",
    podeEditar: p => p === "coordenacao",
    colunas: [{ l: "Turma", k: "codigo" }, { l: "Ano letivo", k: "anoLetivo" }, { l: "Disciplina", k: "disciplinaNome" }, { l: "Professor", k: "professorNome" }, { l: "Alunos", k: "totalAlunos" }],
    campos: [
      { nome: "codigo", rotulo: "Nome da turma", obrigatorio: true, largo: true, dica: "Ex.: 7A - Matemática" },
      { nome: "anoLetivo", rotulo: "Ano letivo", tipo: "number", obrigatorio: true, padrao: new Date().getFullYear() },
      { nome: "idDisciplina", rotulo: "Disciplina", tipo: "select", obrigatorio: true, opcoes: SE.ui.opcoes("disciplinas", d => d.codigo + " · " + d.nome) },
      { nome: "idProfessor", rotulo: "Professor responsável", tipo: "select", obrigatorio: true, largo: true, opcoes: SE.ui.opcoes("professores", p => p.nome) }
    ]
  })
});
