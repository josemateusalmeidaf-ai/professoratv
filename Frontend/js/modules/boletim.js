SE.modulos.registrar({
  id: "boletim", titulo: "Boletim", grupo: "Acadêmico", perfis: ["coordenacao", "professor"],
  async render(el, { perfil }) {
    const { ui, esc } = SE, alunos = await SE.api.listar("alunos", { ativo: undefined });
    el.innerHTML = ui.cabecalho("Boletim individual", perfil === "professor" ? "Mostra as suas disciplinas para os alunos das suas turmas." : "Disciplinas, notas, médias e situação de cada aluno.", `<button class="sec" id="imp" hidden>${ui.icone("printer")}<span>Imprimir</span></button>`) +
      `<section class="painel"><div class="barra"><label class="grow">Aluno<select id="a"><option value="">Selecione o aluno…</option>${alunos.map(a => `<option value="${a.id}">${esc(a.nome)} · ${esc(a.matricula)}${a.ativo ? "" : " (inativo)"}</option>`).join("")}</select></label></div><div id="bol"></div></section>`;
    const box = SE.$("#bol", el), sel = SE.$("#a", el), imp = SE.$("#imp", el);
    let seq = 0;
    imp.onclick = () => print();
    sel.onchange = async e => {
      const idAluno = e.target.value, meu = ++seq;
      imp.hidden = true;
      if (!idAluno) { box.innerHTML = ""; return; }
      box.innerHTML = ui.skeleton.tabela(7, 4);
      try {
        const b = await SE.api.boletim(idAluno);
        if (meu !== seq) return; /* outra seleção chegou depois */
        box.innerHTML = `<div class="boletim"><h2>${esc(b.aluno.nome)}</h2><p>Matrícula ${esc(b.aluno.matricula)}${b.aluno.ativo ? "" : " · cadastro inativo"}</p>` +
          ui.tabela([{ l: "Disciplina", k: "disciplina" }, { l: "Turma", k: "turma" }, { l: "Professor", k: "professor" }, { l: "N1", f: r => SE.fmtNota(r.n1) }, { l: "N2", f: r => SE.fmtNota(r.n2) }, { l: "Média", f: r => SE.fmtNota(r.media) }, { l: "Situação", f: r => SE.badge(r.situacao) }], b.linhas, "O aluno não possui matrículas ativas.") + "</div>";
        imp.hidden = false;
      } catch (x) { if (meu === seq) box.innerHTML = ui.erroInline(x.message); }
    };
    box.onclick = e => { if (e.target.closest("[data-retry]")) sel.dispatchEvent(new Event("change")); };
  }
});