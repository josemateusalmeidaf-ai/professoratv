SE.modulos.registrar({
  id: "notas", titulo: "Notas", grupo: "Acadêmico", perfis: ["coordenacao", "professor"],
  async render(el, { perfil }) {
    const { ui, esc, rules } = SE, escreve = SE.config.permissoes.notas.escrita.includes(perfil), turmas = await SE.api.listar("turmas", { ativo: true });
    el.innerHTML = ui.cabecalho("Notas", escreve ? "Lance N1 e N2 das suas turmas. Correções exigem justificativa e ficam registradas." : "Consulta de notas por turma (somente leitura).") +
      `<section class="painel"><div class="barra"><label class="grow">Turma<select id="t"><option value="">Selecione a turma…</option>${turmas.map(t => `<option value="${t.id}">${esc(t.codigo)} · ${esc(t.disciplinaNome)} (${t.anoLetivo})</option>`).join("")}</select></label></div><div id="grade"></div></section>`;
    let grade = [], idTurma = "", seq = 0;
    const val = n => n ? n.valor : null, inp = (av, n) => `<input class="nota" data-av="${av}" inputmode="decimal" value="${n ? SE.fmtNota(n.valor) : ""}" ${escreve ? "" : "disabled"} aria-label="Nota N${av}">`;
    const linha = (g, i) => { const m = rules.media(val(g.n1), val(g.n2)); return `<tr data-i="${i}"><td>${esc(g.aluno.nome)}</td><td>${esc(g.aluno.matricula)}</td><td>${inp(1, g.n1)}</td><td>${inp(2, g.n2)}</td><td class="media">${SE.fmtNota(m)}</td><td class="sit">${SE.badge(rules.situacao(val(g.n1), val(g.n2)))}</td>${escreve ? `<td class="acoes-col"><button class="peq" data-s aria-label="Salvar notas de ${esc(g.aluno.nome)}" title="Salvar notas">${SE.ui.icone("check")}<span>Salvar</span></button></td>` : ""}</tr>`; };
    const area = SE.$("#grade", el);
    function desenhar() {
      area.innerHTML = !idTurma ? '<p class="vazio">Escolha uma turma.</p>' : grade.length
        ? `<div class="tabela-wrapper"><table><thead><tr><th>Aluno</th><th>Matrícula</th><th>N1</th><th>N2</th><th>Média</th><th>Situação</th>${escreve ? "<th></th>" : ""}</tr></thead><tbody>${grade.map(linha).join("")}</tbody></table></div><p class="dica">Média = (N1 + N2) ÷ 2 · Aprovado com média ≥ ${SE.config.avaliacao.mediaAprovacao} · Sem as duas notas: Em andamento.</p>` : '<p class="vazio">Nenhum aluno matriculado nesta turma.</p>';
    }
    async function carregar() {
      idTurma = SE.$("#t", el).value; const meu = ++seq;
      if (!idTurma) { grade = []; desenhar(); return; }
      area.innerHTML = ui.skeleton.tabela(escreve ? 7 : 6, 6);
      try {
        const g = await SE.api.gradeNotas(idTurma);
        if (meu !== seq) return; /* o usuário já trocou de turma */
        grade = g; desenhar();
      } catch (e) { if (meu === seq) area.innerHTML = ui.erroInline(e.message); }
    }
    SE.$("#t", el).onchange = carregar;
    area.addEventListener("input", e => { // pré-visualiza média e situação
      if (!e.target.classList.contains("nota")) return; const tr = e.target.closest("tr"), [a, b] = SE.$$(".nota", tr).map(x => { const n = rules.numero(x.value); return Number.isNaN(n) ? null : n; });
      tr.querySelector(".media").textContent = SE.fmtNota(rules.media(a, b)); tr.querySelector(".sit").innerHTML = SE.badge(rules.situacao(a, b));
    });
    area.addEventListener("click", async e => {
      if (e.target.closest("[data-retry]")) return carregar();
      const bt = e.target.closest("[data-s]"); if (!bt) return;
      await ui.ocupado(bt, async () => {
        const tr = bt.closest("tr"), reg = grade[+tr.dataset.i], mud = [], turmaDoSalvar = idTurma;
        for (const inpt of SE.$$(".nota", tr)) {
          const av = +inpt.dataset.av, atual = reg["n" + av], novo = rules.numero(inpt.value);
          if (inpt.value.trim() === "") { if (atual) return ui.toast(`N${av}: não é possível apagar uma nota lançada. Corrija o valor.`, "erro"); continue; }
          const er = rules.validarNota(inpt.value); if (er) return ui.toast(`N${av}: ${er}`, "erro");
          if (!atual || atual.valor !== novo) mud.push({ av, novo, corrige: !!atual });
        }
        if (!mud.length) return ui.toast("Nenhuma alteração para salvar.");
        let motivo = ""; if (mud.some(m => m.corrige)) { motivo = await ui.pedirTexto("Correção de nota", "Motivo da correção", `${reg.aluno.nome}: a alteração ficará registrada com seu nome, data e motivo.`); if (!motivo) return; }
        try {
          for (const m of mud) await SE.api.salvarNota({ idMatricula: reg.idMatricula, avaliacao: m.av, valor: m.novo, motivo });
          ui.toast("Notas salvas.");
          const nova = await SE.api.gradeNotas(turmaDoSalvar);
          if (turmaDoSalvar !== idTurma) return;
          grade = nova; const i = nova.findIndex(x => x.idMatricula === reg.idMatricula);
          if (i >= 0 && tr.isConnected) tr.outerHTML = linha(nova[i], i);
        } catch (x) {
          ui.toast(x.message, "erro");
          /* Falha parcial (ex.: N1 gravou e N2 não): sincroniza os dados em memória sem apagar o que o usuário digitou,
             para que um novo "Salvar" envie só o que realmente falta. */
          try { const nova = await SE.api.gradeNotas(turmaDoSalvar); if (turmaDoSalvar === idTurma) grade = nova; } catch (_) {}
        }
      });
    });
    desenhar();
  }
});