SE.modulos.registrar({
  id: "auditoria", titulo: "Auditoria", grupo: "Administração", perfis: ["coordenacao"],
  async render(el) {
    const { ui } = SE;
    el.innerHTML = ui.cabecalho("Auditoria", "Quem alterou o quê: correções de notas e registro de cadastros.") +
      `<section class="painel"><div class="abas"><button class="on" data-t="n">Correções de notas</button><button data-t="c">Log de cadastros</button></div><div id="a" aria-live="polite"></div></section>`;
    const a = SE.$("#a", el);
    let seq = 0, atual = "n";
    async function mostrar(t) {
      atual = t; const meu = ++seq;
      SE.$$(".abas button", el).forEach(b => b.classList.toggle("on", b.dataset.t === t));
      a.innerHTML = ui.skeleton.tabela(t === "n" ? 7 : 5, 6);
      try {
        const html = t === "n"
          ? ui.tabela([{ l: "Data", f: r => SE.fmtDataHora(r.dataAlteracao) }, { l: "Aluno", k: "alunoNome" }, { l: "Turma", k: "turma" }, { l: "Aval.", k: "avaliacao" }, { l: "De → Para", f: r => `${SE.fmtNota(r.valorAnterior)} → ${SE.fmtNota(r.valorNovo)}` }, { l: "Alterado por", k: "usuarioNome" }, { l: "Motivo", k: "motivo" }], await SE.api.historicoNotas(), "Nenhuma correção registrada.")
          : ui.tabela([{ l: "Data", f: r => SE.fmtDataHora(r.dataHora) }, { l: "Usuário", k: "usuarioNome" }, { l: "Entidade", k: "entidade" }, { l: "Registro", k: "idRegistro" }, { l: "Ação", k: "acao" }], await SE.api.logCadastros(), "Nenhum registro.");
        if (meu === seq) a.innerHTML = html; /* descarta resposta de aba que já foi trocada */
      } catch (e) { if (meu === seq) a.innerHTML = ui.erroInline(e.message); }
    }
    el.querySelector(".abas").onclick = e => { const b = e.target.closest("button"); if (b) mostrar(b.dataset.t); };
    a.onclick = e => { if (e.target.closest("[data-retry]")) mostrar(atual); };
    mostrar("n");
  }
});