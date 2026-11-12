/* Adaptador HTTP: mesmo contrato do adaptador local, falando com o back-end real.
   Endpoints, payloads e respostas esperados estão em docs/API.md.

   Robustez de rede:
   - timeout por requisição (SE.config.api.timeoutMs, padrão 15 s) via AbortController;
   - GET é repetido 1 vez em falha de rede (operações de escrita nunca são repetidas);
   - mensagens amigáveis para queda de conexão, timeout e erros 5xx;
   - 401 não redireciona de imediato: dispara o evento cancelável "se:sessao-expirada".
     Se ninguém chamar preventDefault(), a sessão é encerrada (comportamento anterior).
     Isso deixa o gancho pronto para a Fase 2 (salvar rascunhos antes de sair). */
(function () {
  const SE = window.SE;
  SE.criarHttp = function () {
    const TIMEOUT = (SE.config.api && SE.config.api.timeoutMs) || 15000;
    const qs = o => { const p = new URLSearchParams(); for (const [k, v] of Object.entries(o || {})) if (v !== undefined && v !== "") p.set(k, v); const s = p.toString(); return s ? "?" + s : ""; };
    const erroRede = m => Object.assign(new SE.Erro(m, 0), { codigo: 0, rede: true });
    const espera = ms => new Promise(r => setTimeout(r, ms));
    let expirando = false;

    function sessaoExpirou() {
      if (expirando) return;
      expirando = true;
      const ev = new CustomEvent("se:sessao-expirada", { cancelable: true });
      window.dispatchEvent(ev);
      if (ev.defaultPrevented) expirando = false; /* alguém assumiu o tratamento */
      else SE.auth.sair(true);
    }

    function mensagemPorStatus(status, j) {
      const doServidor = j && (j.mensagem || j.message);
      if (doServidor) return doServidor;
      if (status >= 500) return "O servidor encontrou um problema. Tente novamente em instantes.";
      if (status === 403) return "Você não tem permissão para esta operação.";
      if (status === 404) return "Registro não encontrado.";
      if (status === 409) return "Conflito: o registro foi alterado ou já existe.";
      return "Erro na requisição (" + status + ").";
    }

    async function req(metodo, caminho, corpo, opc = {}) {
      const s = SE.auth && SE.auth.sessao();
      const tentativas = metodo === "GET" ? 2 : 1;
      const init = {
        method: metodo,
        headers: Object.assign({ "Content-Type": "application/json" }, s ? { Authorization: "Bearer " + s.token } : {}),
        body: corpo ? JSON.stringify(corpo) : undefined,
        keepalive: !!opc.keepalive
      };
      let r, j = null;
      for (let i = 1; ; i++) {
        const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), TIMEOUT);
        try {
          r = await fetch(SE.config.api.baseUrl + caminho, Object.assign({ signal: ctl.signal }, init));
          j = await r.json().catch(() => null);
          break;
        } catch (e) {
          if (i < tentativas) { await espera(600); continue; }
          throw erroRede(e.name === "AbortError"
            ? "O servidor demorou para responder. Tente novamente."
            : "Sem conexão com o servidor. Verifique sua internet e tente novamente.");
        } finally { clearTimeout(t); }
      }
      if (r.status === 401 && s) { sessaoExpirou(); throw new SE.Erro("Sua sessão expirou. Entre novamente.", 401); }
      if (!r.ok) throw new SE.Erro(mensagemPorStatus(r.status, j), r.status);
      return j;
    }

    return {
      login: (email, senha) => req("POST", "/auth/login", { email, senha }),
      logout: () => req("POST", "/auth/logout", undefined, { keepalive: true }).catch(() => {}),
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