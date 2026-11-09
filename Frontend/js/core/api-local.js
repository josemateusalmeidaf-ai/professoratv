/* Adaptador LOCAL (demonstração): guarda tudo no localStorage e aplica as mesmas regras que o
   back-end terá de aplicar. Serve de referência de contrato; substitua por api-http.js em produção. */
(function () {
  const SE = window.SE, R = () => SE.rules;
  const KEY = "se.db.v1", Erro = SE.Erro;
  let db;
  const vazio = () => ({ seq: {}, usuarios: [], alunos: [], professores: [], disciplinas: [], turmas: [], matriculas: [], notas: [], historicoNotas: [], logCadastros: [] });
  const commit = () => localStorage.setItem(KEY, JSON.stringify(db));
  const nid = t => (db.seq[t] = (db.seq[t] || 0) + 1);
  const agora = () => new Date().toISOString(), hoje = () => agora().slice(0, 10);
  const norm = s => String(s || "").trim().toLowerCase();
  const ator = () => { try { return JSON.parse(sessionStorage.getItem("se.sessao")).usuario; } catch (e) { return null; } };
  function exigir(...perfis) { const a = ator(); if (!a || !perfis.includes(a.perfil)) throw new Erro("Sem permissão para esta operação.", 403); return a; }
  const profAtual = () => { const a = exigir("professor"); return db.professores.find(p => p.idUsuario === a.id); };
  function log(entidade, idRegistro, acao) { const a = ator(); db.logCadastros.unshift({ id: nid("log"), dataHora: agora(), idUsuario: a?.id, usuarioNome: a?.nome || "—", entidade, idRegistro, acao }); }

  function carregar() {
    try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { db = null; }
    if (!db) { db = vazio(); if (SE.config.seedDemo) semear(); commit(); }
  }
  function semear() {
    const u = (login, senha, perfil, nome) => { const x = { id: nid("usuarios"), login, senha, perfil, nome, ativo: true }; db.usuarios.push(x); return x; };
    u("coordenacao@coordenacao.escola.edu.br", "coord123", "coordenacao", "Coordenação Pedagógica");
    const prof = (nome, idf, email, tel) => { const us = u(email, "prof123", "professor", nome); const p = { id: nid("professores"), idUsuario: us.id, nome, idFuncional: idf, email, telefone: tel, ativo: true }; db.professores.push(p); return p; };
    const p1 = prof("Marina Alves", "PF-1001", "marina.alves@professor.escola.edu.br", "(83) 99100-1001");
    const p2 = prof("Rafael Costa", "PF-1002", "rafael.costa@professor.escola.edu.br", "(83) 99100-1002");
    const dis = (codigo, nome, ch) => { const d = { id: nid("disciplinas"), codigo, nome, cargaHoraria: ch, ativo: true }; db.disciplinas.push(d); return d; };
    const mat = dis("MAT101", "Matemática", 80), por = dis("POR101", "Língua Portuguesa", 80), cie = dis("CIE101", "Ciências", 60);
    const ano = new Date().getFullYear();
    const tur = (codigo, d, p) => { const t = { id: nid("turmas"), codigo, anoLetivo: ano, idDisciplina: d.id, idProfessor: p.id, ativo: true }; db.turmas.push(t); return t; };
    const t1 = tur("7A - Matemática", mat, p1), t2 = tur("7A - Português", por, p2), t3 = tur("8B - Ciências", cie, p1);
    const nomes = ["Ana Souza", "Bruno Lima", "Carla Dias", "Diego Rocha", "Elisa Pires", "Felipe Nunes"];
    const alunos = nomes.map((n, i) => { const a = { id: nid("alunos"), matricula: String(2026001 + i), nome: n, dataNascimento: `${2012 + (i % 2)}-0${i + 1}-15`, responsavelNome: "Responsável de " + n.split(" ")[0], responsavelContato: `(83) 98800-00${i}${i}`, ativo: true }; db.alunos.push(a); return a; });
    const mt = (a, t) => { const m = { id: nid("matriculas"), idAluno: a.id, idTurma: t.id, dataMatricula: hoje(), status: "Ativa", idAdministrador: 1 }; db.matriculas.push(m); return m; };
    const nt = (m, av, v) => db.notas.push({ id: nid("notas"), idMatricula: m.id, avaliacao: av, valor: v, dataLancamento: agora() });
    alunos.forEach(a => mt(a, t1)); alunos.slice(0, 4).forEach(a => mt(a, t2)); alunos.slice(0, 3).forEach(a => mt(a, t3));
    [[8, 7.5], [5, 6], [9, 9.5], [4, 5.5], [7, null], [null, null]].forEach(([a, b], i) => { const m = db.matriculas.find(x => x.idAluno === alunos[i].id && x.idTurma === t1.id); if (a != null) nt(m, 1, a); if (b != null) nt(m, 2, b); });
  }

  const REC = {
    alunos: { campos: ["matricula", "nome", "dataNascimento", "responsavelNome", "responsavelContato"], unicos: [["matricula", "Já existe um aluno com esta matrícula."]], rot: "aluno" },
    professores: { campos: ["nome", "idFuncional", "email", "telefone"], unicos: [["idFuncional", "Já existe um professor com esta identificação funcional."], ["email", "Já existe um professor com este e-mail."]], rot: "professor" },
    disciplinas: { campos: ["codigo", "nome", "cargaHoraria"], unicos: [["codigo", "Já existe uma disciplina com este código."]], rot: "disciplina" },
    turmas: { campos: ["codigo", "anoLetivo", "idDisciplina", "idProfessor"], unicos: [], rot: "turma" }
  };
  const coagir = (rec, d) => { const o = {}; REC[rec].campos.forEach(c => { let v = d[c]; if (["cargaHoraria", "anoLetivo", "idDisciplina", "idProfessor"].includes(c)) v = Number(v); else v = String(v ?? "").trim(); o[c] = v; }); return o; };
  function conferir(rec, o, id) {
    const e = R().validar[rec](Object.assign({}, o, rec === "professores" ? { senha: arguments[3] } : {}), { criando: !id });
    if (e.length) throw new Erro(e.join(" "));
    for (const [c, msg] of REC[rec].unicos) if (db[rec].some(x => x.id !== id && norm(x[c]) === norm(o[c]))) throw new Erro(msg);
    if (rec === "turmas") {
      if (!db.disciplinas.some(d => d.id === o.idDisciplina && d.ativo)) throw new Erro("Disciplina inválida ou inativa.");
      if (!db.professores.some(p => p.id === o.idProfessor && p.ativo)) throw new Erro("Professor inválido ou inativo.");
      if (db.turmas.some(t => t.id !== id && norm(t.codigo) === norm(o.codigo) && t.anoLetivo === o.anoLetivo)) throw new Erro("Já existe uma turma com este nome neste ano letivo.");
    }
  }
  const enriquecer = (rec, x) => {
    if (rec !== "turmas") return x;
    const d = db.disciplinas.find(d => d.id === x.idDisciplina), p = db.professores.find(p => p.id === x.idProfessor);
    return Object.assign({}, x, { disciplinaNome: d?.nome || "—", professorNome: p?.nome || "—", totalAlunos: db.matriculas.filter(m => m.idTurma === x.id && m.status === "Ativa").length });
  };
  const turmasDoProf = () => { const p = profAtual(); return db.turmas.filter(t => t.idProfessor === p.id).map(t => t.id); };
  const mediaDe = ms => { const g = n => db.notas.find(x => x.idMatricula === ms && x.avaliacao === n)?.valor ?? null; return [g(1), g(2)]; };

  SE.criarLocal = function () {
    return {
      async login(email, senha) {
        carregar();
        const u = db.usuarios.find(x => norm(x.login) === norm(email));
        if (!u || u.senha !== senha) throw new Erro("E-mail ou senha incorretos.", 401);
        if (!u.ativo) throw new Erro("Cadastro inativo. Procure a coordenação.", 403);
        return { token: "local-" + u.id, usuario: { id: u.id, nome: u.nome, email: u.login, perfil: u.perfil } };
      },
      async logout() {},
      async listar(rec, { q = "", ativo } = {}) {
        carregar();
        const a = ator();
        if (!a) throw new Erro("Sessão expirada.", 401);
        let l = db[rec].slice();
        if (a.perfil === "professor") {
          if (rec === "turmas") { const ids = turmasDoProf(); l = l.filter(t => ids.includes(t.id)); }
          else if (rec === "alunos") { const ids = turmasDoProf(); const al = new Set(db.matriculas.filter(m => ids.includes(m.idTurma) && m.status === "Ativa").map(m => m.idAluno)); l = l.filter(x => al.has(x.id)); }
          else if (rec === "professores") l = l.filter(p => p.idUsuario === a.id);
          else if (rec === "disciplinas") { const ids = turmasDoProf(); const ds = new Set(db.turmas.filter(t => ids.includes(t.id)).map(t => t.idDisciplina)); l = l.filter(d => ds.has(d.id)); }
        }
        if (ativo !== undefined) l = l.filter(x => x.ativo === ativo);
        const termo = norm(q);
        l = l.map(x => enriquecer(rec, x));
        if (termo) l = l.filter(x => norm(Object.values(x).join(" ")).includes(termo));
        return l.sort((x, y) => String(x.nome || x.codigo).localeCompare(String(y.nome || y.codigo), "pt-BR"));
      },
      async obter(rec, id) { carregar(); const x = db[rec].find(r => r.id === Number(id)); if (!x) throw new Erro("Registro não encontrado.", 404); return enriquecer(rec, x); },
      async criar(rec, d) {
        carregar(); exigir("coordenacao");
        const o = coagir(rec, d); conferir(rec, o, null, d.senha);
        const novo = Object.assign({ id: nid(rec) }, o, { ativo: true });
        if (rec === "professores") { const us = { id: nid("usuarios"), login: o.email, senha: d.senha, perfil: "professor", nome: o.nome, ativo: true }; db.usuarios.push(us); novo.idUsuario = us.id; }
        db[rec].push(novo); log(REC[rec].rot, novo.id, "CRIAR"); commit(); return enriquecer(rec, novo);
      },
      async atualizar(rec, id, d) {
        carregar(); exigir("coordenacao"); id = Number(id);
        const x = db[rec].find(r => r.id === id); if (!x) throw new Erro("Registro não encontrado.", 404);
        const o = coagir(rec, Object.assign({}, x, d)); if (rec === "alunos") o.matricula = x.matricula;
        conferir(rec, o, id, "x");
        Object.assign(x, o);
        if (rec === "professores") { const us = db.usuarios.find(u => u.id === x.idUsuario); if (us) { us.login = o.email; us.nome = o.nome; } }
        log(REC[rec].rot, id, "ATUALIZAR"); commit(); return enriquecer(rec, x);
      },
      async definirAtivo(rec, id, ativo) {
        carregar(); exigir("coordenacao"); id = Number(id);
        const x = db[rec].find(r => r.id === id); if (!x) throw new Erro("Registro não encontrado.", 404);
        x.ativo = !!ativo;
        if (rec === "professores") { const us = db.usuarios.find(u => u.id === x.idUsuario); if (us) us.ativo = !!ativo; }
        log(REC[rec].rot, id, ativo ? "REATIVAR" : "INATIVAR"); commit(); return x; /* histórico (matrículas, notas) é preservado */
      },
      async matriculasDaTurma(idTurma) {
        carregar(); const a = ator(); idTurma = Number(idTurma);
        if (a.perfil === "professor" && !turmasDoProf().includes(idTurma)) throw new Erro("Esta turma não é sua.", 403);
        return db.matriculas.filter(m => m.idTurma === idTurma).map(m => { const al = db.alunos.find(x => x.id === m.idAluno); return { id: m.id, idAluno: m.idAluno, alunoNome: al.nome, alunoMatricula: al.matricula, dataMatricula: m.dataMatricula, status: m.status }; })
          .sort((x, y) => x.alunoNome.localeCompare(y.alunoNome, "pt-BR"));
      },
      async matricular(idTurma, idAluno) {
        carregar(); const a = exigir("coordenacao"); idTurma = Number(idTurma); idAluno = Number(idAluno);
        const t = db.turmas.find(x => x.id === idTurma && x.ativo), al = db.alunos.find(x => x.id === idAluno && x.ativo);
        if (!t) throw new Erro("Turma inválida ou inativa."); if (!al) throw new Erro("Aluno inválido ou inativo.");
        const ex = db.matriculas.find(m => m.idTurma === idTurma && m.idAluno === idAluno);
        if (ex && ex.status === "Ativa") throw new Erro("O aluno já está matriculado nesta turma.");
        if (ex) { ex.status = "Ativa"; ex.dataMatricula = hoje(); ex.idAdministrador = a.id; log("matricula", ex.id, "REATIVAR"); commit(); return ex; }
        const m = { id: nid("matriculas"), idAluno, idTurma, dataMatricula: hoje(), status: "Ativa", idAdministrador: a.id };
        db.matriculas.push(m); log("matricula", m.id, "CRIAR"); commit(); return m;
      },
      async cancelarMatricula(id) { carregar(); exigir("coordenacao"); const m = db.matriculas.find(x => x.id === Number(id)); if (!m) throw new Erro("Matrícula não encontrada.", 404); m.status = "Cancelada"; log("matricula", m.id, "CANCELAR"); commit(); return m; },
      async gradeNotas(idTurma) {
        carregar(); const a = ator(); idTurma = Number(idTurma);
        if (a.perfil === "professor" && !turmasDoProf().includes(idTurma)) throw new Erro("Esta turma não é sua.", 403);
        return db.matriculas.filter(m => m.idTurma === idTurma && m.status === "Ativa").map(m => {
          const al = db.alunos.find(x => x.id === m.idAluno), nt = n => { const x = db.notas.find(y => y.idMatricula === m.id && y.avaliacao === n); return x ? { id: x.id, valor: x.valor } : null; };
          return { idMatricula: m.id, aluno: { id: al.id, nome: al.nome, matricula: al.matricula }, n1: nt(1), n2: nt(2) };
        }).sort((x, y) => x.aluno.nome.localeCompare(y.aluno.nome, "pt-BR"));
      },
      async salvarNota({ idMatricula, avaliacao, valor, motivo }) {
        carregar(); const a = exigir(...SE.config.permissoes.notas.escrita); idMatricula = Number(idMatricula); avaliacao = Number(avaliacao);
        const m = db.matriculas.find(x => x.id === idMatricula && x.status === "Ativa"); if (!m) throw new Erro("Matrícula inválida.", 404);
        if (a.perfil === "professor" && !turmasDoProf().includes(m.idTurma)) throw new Erro("Você só pode lançar notas nas suas turmas.", 403);
        if (![1, 2].includes(avaliacao)) throw new Erro("Avaliação inválida (use 1 ou 2).");
        const er = R().validarNota(valor); if (er) throw new Erro(er);
        const v = R().numero(valor), ex = db.notas.find(x => x.idMatricula === idMatricula && x.avaliacao === avaliacao);
        if (!ex) { const n = { id: nid("notas"), idMatricula, avaliacao, valor: v, dataLancamento: agora() }; db.notas.push(n); commit(); return n; }
        if (ex.valor === v) return ex;
        if (!String(motivo || "").trim()) throw new Erro("Informe o motivo da correção.");
        db.historicoNotas.unshift({ id: nid("hist"), idNota: ex.id, idUsuario: a.id, usuarioNome: a.nome, valorAnterior: ex.valor, valorNovo: v, dataAlteracao: agora(), motivo: String(motivo).trim() });
        ex.valor = v; commit(); return ex;
      },
      async historicoNotas() {
        carregar(); exigir("coordenacao");
        return db.historicoNotas.map(h => { const n = db.notas.find(x => x.id === h.idNota), m = db.matriculas.find(x => x.id === n.idMatricula), al = db.alunos.find(x => x.id === m.idAluno), t = db.turmas.find(x => x.id === m.idTurma); return { id: h.id, dataAlteracao: h.dataAlteracao, alunoNome: al.nome, turma: t.codigo, avaliacao: "N" + n.avaliacao, valorAnterior: h.valorAnterior, valorNovo: h.valorNovo, usuarioNome: h.usuarioNome, motivo: h.motivo }; });
      },
      async logCadastros() { carregar(); exigir("coordenacao"); return db.logCadastros.slice(0, 300); },
      async boletim(idAluno) {
        carregar(); const a = ator(); idAluno = Number(idAluno);
        const al = db.alunos.find(x => x.id === idAluno); if (!al) throw new Erro("Aluno não encontrado.", 404);
        const meus = a.perfil === "professor" ? turmasDoProf() : null;
        const linhas = db.matriculas.filter(m => m.idAluno === idAluno && m.status === "Ativa" && (!meus || meus.includes(m.idTurma))).map(m => {
          const t = db.turmas.find(x => x.id === m.idTurma), d = db.disciplinas.find(x => x.id === t.idDisciplina), p = db.professores.find(x => x.id === t.idProfessor), [n1, n2] = mediaDe(m.id);
          return { turma: t.codigo, anoLetivo: t.anoLetivo, disciplina: d.nome, professor: p.nome, n1, n2, media: R().media(n1, n2), situacao: R().situacao(n1, n2) };
        });
        if (meus && !linhas.length) throw new Erro("Aluno fora das suas turmas.", 403);
        return { aluno: { id: al.id, nome: al.nome, matricula: al.matricula, ativo: al.ativo }, linhas };
      },
      async resumo() {
        carregar(); const a = ator(); const ativas = db.matriculas.filter(m => m.status === "Ativa");
        const pend = ms => ms.filter(m => { const [x, y] = mediaDe(m.id); return x == null || y == null; }).length;
        if (a.perfil === "coordenacao") return { perfil: "coordenacao", alunos: db.alunos.filter(x => x.ativo).length, professores: db.professores.filter(x => x.ativo).length, disciplinas: db.disciplinas.filter(x => x.ativo).length, turmas: db.turmas.filter(x => x.ativo).length, matriculas: ativas.length, notasPendentes: pend(ativas) };
        const ids = turmasDoProf(), ms = ativas.filter(m => ids.includes(m.idTurma)), sit = ms.map(m => R().situacao(...mediaDe(m.id)));
        return { perfil: "professor", turmas: ids.length, alunos: new Set(ms.map(m => m.idAluno)).size, notasPendentes: pend(ms), aprovados: sit.filter(s => s === "Aprovado").length, reprovados: sit.filter(s => s === "Reprovado").length };
      }
    };
  };
})();
