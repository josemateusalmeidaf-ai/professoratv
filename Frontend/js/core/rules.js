/* Regras de negócio compartilhadas (validação no front e referência para o back-end). */
(function () {
  const SE = window.SE;
  const C = () => SE.config;
  const R = SE.rules = {
    emailValido: e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || "").trim()),
    perfilDoEmail(email) {
      const e = String(email || "").trim().toLowerCase();
      for (const [p, d] of Object.entries(C().perfis)) if (d.dominio.test(e)) return p;
      return null;
    },
    numero(v) { if (v === "" || v == null) return null; const n = Number(String(v).replace(",", ".")); return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN; },
    validarNota(v) {
      const n = R.numero(v), { notaMin: a, notaMax: b } = C().avaliacao;
      if (n === null) return "Informe a nota.";
      if (Number.isNaN(n)) return "Nota inválida.";
      if (n < a || n > b) return `A nota deve estar entre ${a} e ${b}.`;
      return null;
    },
    media: (n1, n2) => n1 == null || n2 == null ? null : (n1 + n2) / 2,
    situacao(n1, n2) {
      const m = R.media(n1, n2);
      if (m === null) return "Em andamento";
      return m >= C().avaliacao.mediaAprovacao ? "Aprovado" : "Reprovado";
    },
    idade(iso) { const d = new Date(iso); if (isNaN(d)) return null; const h = new Date(); let i = h.getFullYear() - d.getFullYear(); if (h < new Date(h.getFullYear(), d.getMonth(), d.getDate())) i--; return i; },
    /* Cada validador devolve uma lista de mensagens (vazia = ok). */
    validar: {
      alunos(d) {
        const e = [];
        if (!d.nome) e.push("Informe o nome do aluno.");
        if (!d.matricula) e.push("Informe a matrícula.");
        if (!d.dataNascimento || R.idade(d.dataNascimento) === null) e.push("Informe a data de nascimento.");
        else if (R.idade(d.dataNascimento) < 18 && !(d.responsavelContato || "").trim()) e.push("Informe o contato do responsável (aluno menor de idade).");
        return e;
      },
      professores(d, { criando }) {
        const e = [];
        if (!d.nome) e.push("Informe o nome.");
        if (!d.idFuncional) e.push("Informe a identificação funcional.");
        if (!R.emailValido(d.email)) e.push("Informe um e-mail válido.");
        else if (R.perfilDoEmail(d.email) !== "professor") e.push("O e-mail do professor deve ser do domínio de professores (ex.: nome@professor.escola.edu.br).");
        if (!d.telefone) e.push("Informe o telefone.");
        if (criando && String(d.senha || "").length < 6) e.push("A senha inicial deve ter ao menos 6 caracteres.");
        return e;
      },
      disciplinas(d) {
        const e = [];
        if (!d.codigo) e.push("Informe o código.");
        if (!d.nome) e.push("Informe o nome.");
        if (!(Number(d.cargaHoraria) > 0)) e.push("A carga horária deve ser maior que zero.");
        return e;
      },
      turmas(d) {
        const e = [];
        if (!d.codigo) e.push("Informe o nome da turma.");
        if (!(Number(d.anoLetivo) >= 2000)) e.push("Informe o ano letivo.");
        if (!d.idDisciplina) e.push("Selecione a disciplina.");
        if (!d.idProfessor) e.push("Selecione o professor responsável.");
        return e;
      }
    }
  };
})();
