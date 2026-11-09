SE.modulos.registrar({
  id: "matriculas", titulo: "Matrículas", grupo: "Acadêmico", perfis: ["coordenacao"],
  async render(el) {
    const { ui, esc } = SE, turmas = await SE.api.listar("turmas", { ativo: true });
    el.innerHTML = ui.cabecalho("Matrículas", "Matricule alunos nas turmas. Um aluno pode estar em várias turmas, sem repetição na mesma.") +
      `<section class="painel"><div class="barra"><label class="grow">Turma<select id="t"><option value="">Selecione a turma…</option>${turmas.map(t => `<option value="${t.id}">${esc(t.codigo)} · ${esc(t.disciplinaNome)} (${t.anoLetivo})</option>`).join("")}</select></label></div><div id="area"></div></section>`;
    const area = SE.$("#area", el); let alunos = [];
    async function carregar() {
      const id = SE.$("#t", el).value; if (!id) { area.innerHTML = '<p class="vazio">Escolha uma turma.</p>'; return; }
      const [ms, todos] = await Promise.all([SE.api.matriculasDaTurma(id), SE.api.listar("alunos", { ativo: true })]);
      const ativos = new Set(ms.filter(m => m.status === "Ativa").map(m => m.idAluno)); alunos = todos.filter(a => !ativos.has(a.id));
      area.innerHTML = `<div class="barra"><label class="grow" for="al">Matricular aluno<select id="al"><option value="">Selecione o aluno…</option>${alunos.map(a => `<option value="${a.id}">${esc(a.nome)} · ${esc(a.matricula)}</option>`).join("")}</select></label><button id="mat">${ui.icone("plus")}<span>Matricular</span></button></div>` +
        ui.tabela([{ l: "Aluno", k: "alunoNome" }, { l: "Matrícula", k: "alunoMatricula" }, { l: "Data", f: m => SE.fmtData(m.dataMatricula) }, { l: "Status", f: m => `<span class="badge ${m.status === "Ativa" ? "ok" : "inativo"}">${m.status}</span>` }, { l: "", cl: "acoes-col", f: m => m.status === "Ativa" ? `<button class="sec peq dng" data-c="${m.id}">Cancelar</button>` : "" }], ms, "Nenhum aluno matriculado.");
      SE.$("#mat", el).onclick = async () => { const v = SE.$("#al", el).value; if (!v) return ui.toast("Selecione um aluno.", "erro"); try { await SE.api.matricular(id, v); ui.toast("Aluno matriculado."); carregar(); } catch (e) { ui.toast(e.message, "erro"); } };
    }
    SE.$("#t", el).onchange = carregar; carregar();
    area.onclick = async e => { const b = e.target.closest("[data-c]"); if (!b) return; if (await ui.confirmar("Cancelar matrícula", "As notas já lançadas ficam preservadas no histórico.", "Cancelar matrícula")) try { await SE.api.cancelarMatricula(b.dataset.c); ui.toast("Matrícula cancelada."); carregar(); } catch (x) { ui.toast(x.message, "erro"); } };
  }
});
