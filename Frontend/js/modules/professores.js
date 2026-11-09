SE.modulos.registrar({
  id: "professores", titulo: "Professores", grupo: "Cadastros", perfis: ["coordenacao"],
  render: el => SE.ui.crud(el, {
    recurso: "professores", titulo: "Professores", sub: "O e-mail do professor define o acesso dele ao sistema.", novo: "Novo professor", rotulo: "professor",
    colunas: [{ l: "Nome", k: "nome" }, { l: "Identificação funcional", k: "idFuncional" }, { l: "E-mail (login)", k: "email" }, { l: "Telefone", k: "telefone" }],
    campos: [
      { nome: "nome", rotulo: "Nome", obrigatorio: true, largo: true },
      { nome: "idFuncional", rotulo: "Identificação funcional", obrigatorio: true },
      { nome: "telefone", rotulo: "Telefone", tipo: "tel", obrigatorio: true },
      { nome: "email", rotulo: "E-mail institucional", tipo: "email", obrigatorio: true, largo: true, dica: "nome@professor.escola.edu.br" },
      { nome: "senha", rotulo: "Senha inicial", tipo: "password", soCriar: true, obrigatorio: true, largo: true }
    ]
  })
});
