SE.modulos.registrar({
  id: "boletim", titulo: "Boletim", grupo: "Acadêmico", perfis: ["coordenacao", "professor"],
  async render(el, { perfil }) {
    const { ui, esc } = SE, alunos = await SE.api.listar("alunos", { ativo: undefined });
    el.innerHTML = ui.cabecalho("Boletim individual", perfil === "professor" ? "Mostra as suas disciplinas para os alunos das suas turmas." : "Disciplinas, notas, médias e situação de cada aluno.", `<button class="sec" id="imp" hidden>${ui.icone("printer")}<span>Imprimir</span></button>`) +
      `<section class="painel"><div class="barra"><label class="grow">Aluno<select id="a"><option value="">Selecione o aluno…</option>${alunos.map(a => `<option value="${a.id}">${esc(a.nome)} · ${esc(a.matricula)}${a.ativo ? "" : " (inativo)"}</option>`).join("")}</select></label></div><div id="bol"></div></section>`;
    const box = SE.$("#bol", el);
    SE.$("#imp", el).onclick = () => print();
    SE.$("#a", el).onchange = async e => {
      SE.$("#imp", el).hidden = !e.target.value; if (!e.target.value) { box.innerHTML = ""; return; }
      try {
        const b = await SE.api.boletim(e.target.value);
        box.innerHTML = `<div class="boletim"><h2>${esc(b.aluno.nome)}</h2><p>Matrícula ${esc(b.aluno.matricula)}${b.aluno.ativo ? "" : " · cadastro inativo"}</p>` +
          ui.tabela([{ l: "Disciplina", k: "disciplina" }, { l: "Turma", k: "turma" }, { l: "Professor", k: "professor" }, { l: "N1", f: r => SE.fmtNota(r.n1) }, { l: "N2", f: r => SE.fmtNota(r.n2) }, { l: "Média", f: r => SE.fmtNota(r.media) }, { l: "Situação", f: r => SE.badge(r.situacao) }], b.linhas, "O aluno não possui matrículas ativas.") + "</div>";
      } catch (x) { box.innerHTML = `<p class="vazio erro">${esc(x.message)}</p>`; }
    };
  }
});
