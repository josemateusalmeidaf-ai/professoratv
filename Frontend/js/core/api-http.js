/* Adaptador HTTP: mesmo contrato do adaptador local, falando com o back-end real.
   Endpoints, payloads e respostas esperados estão em docs/API.md. */
(function () {
  const SE = window.SE;
  SE.criarHttp = function () {
    const qs = o => { const p = new URLSearchParams(); for (const [k, v] of Object.entries(o || {})) if (v !== undefined && v !== "") p.set(k, v); const s = p.toString(); return s ? "?" + s : ""; };
    async function req(metodo, caminho, corpo) {
      const s = SE.auth && SE.auth.sessao();
      const r = await fetch(SE.config.api.baseUrl + caminho, { method: metodo, headers: Object.assign({ "Content-Type": "application/json" }, s ? { Authorization: "Bearer " + s.token } : {}), body: corpo ? JSON.stringify(corpo) : undefined });
      let j = null; try { j = await r.json(); } catch (e) {}
      if (r.status === 401 && s) { SE.auth.sair(true); }
      if (!r.ok) throw new SE.Erro((j && (j.mensagem || j.message)) || "Erro na requisição (" + r.status + ").", r.status);
      return j;
    }
    return {
      login: (email, senha) => req("POST", "/auth/login", { email, senha }),
      logout: () => req("POST", "/auth/logout").catch(() => {}),
      listar: (rec, f) => req("GET", "/" + rec + qs(f)),
      obter: (rec, id) => req("GET", `/${rec}/${id}`),
      criar: (rec, d) => req("POST", "/" + rec, d),
      atualizar: (rec, id, d) => req("PUT", `/${rec}/${id}`, d),
      definirAtivo: (rec, id, ativo) => req("PATCH", `/${rec}/${id}/ativo`, { ativo }),
      matriculasDaTurma: id => req("GET", `/turmas/${id}/matriculas`),
      matricular: (idTurma, idAluno) => req("POST", `/turmas/${idTurma}/matriculas`, { idAluno }),
      cancelarMatricula: id => req("PATCH", `/matriculas/${id}/cancelar`),
      gradeNotas: id => req("GET", `/turmas/${id}/notas`),
      salvarNota: d => req("PUT", `/matriculas/${d.idMatricula}/notas/${d.avaliacao}`, { valor: d.valor, motivo: d.motivo }),
      historicoNotas: () => req("GET", "/auditoria/notas"),
      logCadastros: () => req("GET", "/auditoria/cadastros"),
      boletim: id => req("GET", `/alunos/${id}/boletim`),
      resumo: () => req("GET", "/dashboard")
    };
  };
})();
