SE.modulos.registrar({
  id: "disciplinas", titulo: "Disciplinas", grupo: "Cadastros", perfis: ["coordenacao"],
  render: el => SE.ui.crud(el, {
    recurso: "disciplinas", titulo: "Disciplinas", sub: "Nome e carga horária.", novo: "Nova disciplina", rotulo: "disciplina",
    colunas: [{ l: "Código", k: "codigo" }, { l: "Nome", k: "nome" }, { l: "Carga horária", f: r => r.cargaHoraria + " h" }],
    campos: [
      { nome: "codigo", rotulo: "Código", obrigatorio: true },
      { nome: "cargaHoraria", rotulo: "Carga horária (h)", tipo: "number", min: 1, obrigatorio: true },
      { nome: "nome", rotulo: "Nome", obrigatorio: true, largo: true }
    ]
  })
});
