(function () {
  const SE = window.SE, { $, esc } = SE;
  const ui = SE.ui = {};
  ui.toast = (msg, tipo = "ok") => {
    const box = $("#toasts"); if (!box) return;
    const t = document.createElement("div"); t.className = "toast " + tipo; t.textContent = msg; box.appendChild(t);
    setTimeout(() => t.remove(), tipo === "erro" ? 5000 : 2800);
  };
  ui.icone = (id, classe = "") => SE.icons.render(id, classe);

  /* ---------- Estados de carregamento ---------- */
  ui.skeleton = {
    linhas(n = 4) { return `<div role="status" aria-busy="true"><span class="sr-only">Carregando…</span><div aria-hidden="true">${'<span class="sk sk-linha"></span>'.repeat(n)}</div></div>`; },
    tabela(cols = 5, n = 5) {
      const w = (i, j) => 45 + ((i * 37 + j * 23) % 45);
      const th = Array.from({ length: cols }, (_, j) => `<th><span class="sk sk-cab" style="width:${50 + (j * 13) % 30}%"></span></th>`).join("");
      const tr = Array.from({ length: n }, (_, i) => `<tr>${Array.from({ length: cols }, (_, j) => `<td><span class="sk" style="width:${w(i, j)}%"></span></td>`).join("")}</tr>`).join("");
      return `<div class="tabela-wrapper sk-tabela" role="status" aria-busy="true"><span class="sr-only">Carregando registros…</span><table aria-hidden="true"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table></div>`;
    },
    cards(n = 6) {
      return `<div class="indicadores" role="status" aria-busy="true"><span class="sr-only">Carregando indicadores…</span>${'<div class="sk-card" aria-hidden="true"><span class="sk sk-icone"></span><span class="sk-card-txt"><span class="sk" style="width:60%"></span><span class="sk sk-num"></span></span></div>'.repeat(n)}</div>`;
    },
    pagina() {
      return `<span class="sr-only" role="status">Carregando módulo…</span><div class="cab" aria-hidden="true"><div class="cab-titulos"><span class="sk sk-titulo"></span><span class="sk sk-sub"></span></div></div><section class="painel" aria-hidden="true">${ui.skeleton.tabela(5, 5)}</section>`;
    }
  };

  /* Executa fn() com o botão bloqueado e indicador de carregamento. Ignora cliques enquanto ocupado. */
  ui.ocupado = async (btn, fn) => {
    if (!btn) return fn();
    if (btn.dataset.ocupado) return;
    btn.dataset.ocupado = "1"; btn.disabled = true; btn.setAttribute("aria-busy", "true"); btn.classList.add("carregando");
    try { return await fn(); }
    finally {
      if (btn.isConnected) { delete btn.dataset.ocupado; btn.disabled = false; btn.removeAttribute("aria-busy"); btn.classList.remove("carregando"); }
    }
  };

  /* Erro inline com botão "Tentar novamente" (o módulo trata cliques em [data-retry]). */
  ui.erroInline = (msg, retry = true) => `<div class="estado-inline erro" role="alert">${ui.icone("alert-circle")}<span>${esc(msg)}</span>${retry ? `<button type="button" class="sec peq" data-retry>${ui.icone("history")}<span>Tentar novamente</span></button>` : ""}</div>`;

  /* ---------- Formulários e diálogos ---------- */
  const campoHtml = c => {
    const v = c.valor ?? "", req = c.obrigatorio ? " required" : "", id = "f-" + c.nome;
    const hint = c.dica ? `<small class="campo-ajuda" id="${id}-ajuda">${esc(c.dica)}</small>` : "";
    const described = c.dica ? ` aria-describedby="${id}-ajuda"` : "";
    let ctl;
    if (c.tipo === "select") ctl = `<select id="${id}" name="${c.nome}"${req}${described}><option value="">Selecione…</option>${(c._op || []).map(o => `<option value="${esc(o.v)}"${String(o.v) === String(v) ? " selected" : ""}>${esc(o.l)}</option>`).join("")}</select>`;
    else if (c.tipo === "textarea") ctl = `<textarea id="${id}" name="${c.nome}" rows="3"${req}${described} placeholder="${esc(c.dica || "")}">${esc(v)}</textarea>`;
    else ctl = `<input id="${id}" name="${c.nome}" type="${c.tipo || "text"}" value="${esc(v)}"${req}${described} placeholder="${esc(c.placeholder || "")}"${c.min != null ? ` min="${c.min}"` : ""}${c.max != null ? ` max="${c.max}"` : ""}${c.passo ? ` step="${c.passo}"` : ""} autocomplete="off">`;
    return `<label class="campo${c.largo ? " largo" : ""}" for="${id}"><span class="campo-titulo">${esc(c.rotulo)}${c.obrigatorio ? ' <span class="campo-obrigatorio" aria-label="obrigatório">*</span>' : ""}</span>${ctl}${hint}</label>`;
  };

  /* Diálogo de formulário. Resolve true (salvou) ou false (cancelou).
     Só um diálogo por vez (evita abrir dois com duplo clique) e não fecha enquanto salva. */
  let formAberto = false;
  ui.form = async function (o) {
    if (formAberto) return false;
    formAberto = true;
    const campos = [];
    try { for (const c of o.campos || []) campos.push(Object.assign({}, c, { _op: c.opcoes ? await c.opcoes() : null })); }
    catch (e) { formAberto = false; ui.toast(e.message || "Não foi possível abrir o formulário.", "erro"); return false; }
    const focoAnterior = document.activeElement;
    const dlg = document.createElement("dialog"); dlg.className = "modal"; dlg.setAttribute("aria-labelledby", "titulo-modal");
    dlg.innerHTML = `<form novalidate><div class="modal-cabecalho"><span class="modal-icone" aria-hidden="true">${ui.icone(o.icone || "clipboard-list")}</span><div><h2 id="titulo-modal">${esc(o.titulo)}</h2>${o.msg ? `<p class="msg">${esc(o.msg)}</p>` : ""}</div></div><div class="grade-form">${campos.map(campoHtml).join("")}</div><p class="erro-form" role="alert" aria-live="polite"></p><div class="acoes"><button type="button" class="sec" data-x>${ui.icone("x")} Cancelar</button><button type="submit">${ui.icone("check")} ${esc(o.salvar || "Salvar")}</button></div></form>`;
    document.body.appendChild(dlg); dlg.showModal();
    const first = dlg.querySelector("input,select,textarea"); if (first) first.focus();
    return new Promise(res => {
      let salvando = false;
      const cancelar = dlg.querySelector("[data-x]");
      const fim = ok => { formAberto = false; dlg.close(); dlg.remove(); if (focoAnterior && focoAnterior.isConnected) focoAnterior.focus(); res(ok); };
      cancelar.onclick = () => { if (!salvando) fim(false); };
      dlg.addEventListener("cancel", e => { e.preventDefault(); if (!salvando) fim(false); });
      dlg.querySelector("form").onsubmit = async e => {
        e.preventDefault();
        if (salvando) return;
        const f = new FormData(e.target), d = {}; campos.forEach(c => d[c.nome] = String(f.get(c.nome) ?? "").trim());
        const er = dlg.querySelector(".erro-form"), btn = dlg.querySelector("[type=submit]"); er.textContent = "";
        salvando = true; cancelar.disabled = true;
        await ui.ocupado(btn, async () => {
          try { if (o.aoSalvar) await o.aoSalvar(d); fim(true); }
          catch (x) { er.textContent = x.message; cancelar.disabled = false; }
        });
        salvando = false;
      };
    });
  };
  ui.confirmar = (titulo, msg, rotulo = "Confirmar") => ui.form({ titulo, msg, salvar: rotulo, campos: [] });
  ui.pedirTexto = async (titulo, rotulo, msg) => { let v = null; await ui.form({ titulo, msg, campos: [{ nome: "t", rotulo, tipo: "textarea", obrigatorio: true, largo: true }], aoSalvar: async d => { if (d.t.length < 5) throw new SE.Erro("Descreva o motivo (mínimo 5 caracteres)."); v = d.t; } }); return v; };
  ui.cabecalho = (t, sub, acoes = "", icon) => {
    const m = SE.config.modulos.find(x => x.id === (icon || document.body.dataset.module));
    const iconId = m ? m.icone : "layout-dashboard";
    return `<div class="cab"><div class="cab-titulos"><nav class="migalha" aria-label="Você está em"><a href="${SE.router.url("dashboard")}">Início</a><span aria-hidden="true">/</span><span>${esc(m ? m.titulo : t)}</span></nav><div class="cab-titulo-linha"><span class="cab-icone" aria-hidden="true">${ui.icone(iconId)}</span><div><h1>${esc(t)}</h1><p>${esc(sub || "")}</p></div></div></div><div class="cab-acoes">${acoes}</div></div>`;
  };
  ui.tabela = (cols, linhas, vazio = "Nada para mostrar.") => linhas.length
    ? `<div class="tabela-wrapper"><table><thead><tr>${cols.map(c => `<th${c.cl ? ` class="${c.cl}"` : ""}>${esc(c.l)}</th>`).join("")}</tr></thead><tbody>${linhas.map(r => `<tr>${cols.map(c => `<td${c.cl ? ` class="${c.cl}"` : ""}>${c.f ? c.f(r) : esc(r[c.k] ?? "—")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
    : `<p class="vazio">${esc(vazio)}</p>`;
  ui.opcoes = (rec, rot, filtro) => async () => (await SE.api.listar(rec, { ativo: true })).filter(filtro || (() => true)).map(r => ({ v: r.id, l: rot(r) }));

  /* CRUD genérico: lista + busca + criar/editar + inativar/reativar (sem exclusão: histórico preservado).
     - skeleton na primeira carga; nas recargas a tabela atual fica esmaecida (sem "pulo" de layout);
     - respostas atrasadas são descartadas (digitar rápido na busca não sobrescreve resultado mais novo);
     - erro de rede mostra "Tentar novamente"; botões ficam bloqueados durante a operação. */
  ui.crud = async function (el, c) {
    const perfil = SE.auth.sessao().usuario.perfil, edita = c.podeEditar ? c.podeEditar(perfil) : true;
    let busca = "", inativos = false, lista = [], seq = 0, jaCarregou = false;
    el.innerHTML = ui.cabecalho(c.titulo, c.sub, edita ? `<button id="novo">${ui.icone("plus")}<span>${esc(c.novo)}</span></button>` : "") +
      `<section class="painel painel-listagem"><div class="barra barra-listagem"><label class="busca-campo" for="q"><span class="busca-icone" aria-hidden="true">${ui.icone("search")}</span><span class="sr-only">Buscar ${esc(c.titulo.toLowerCase())}</span><input id="q" type="search" placeholder="Buscar por nome ou código…" autocomplete="off"></label><label class="chk"><input id="ina" type="checkbox"> Mostrar inativos</label></div><div id="tab" aria-live="polite"></div></section>`;
    const cols = c.colunas.concat([{ l: "Situação", f: r => `<span class="badge ${r.ativo ? "ok" : "inativo"}">${r.ativo ? "Ativo" : "Inativo"}</span>` }]);
    if (edita) cols.push({ l: "Ações", cl: "acoes-col", f: r => `<button class="sec peq acao-tabela" data-a="ed" data-id="${r.id}" title="Editar ${esc(c.rotulo)}" aria-label="Editar ${esc(c.rotulo)}">${ui.icone("pencil")}<span>Editar</span></button> <button class="sec peq acao-tabela ${r.ativo ? "dng" : ""}" data-a="at" data-id="${r.id}" title="${r.ativo ? "Inativar" : "Reativar"} ${esc(c.rotulo)}" aria-label="${r.ativo ? "Inativar" : "Reativar"} ${esc(c.rotulo)}">${ui.icone(r.ativo ? "archive" : "check")}<span>${r.ativo ? "Inativar" : "Reativar"}</span></button>` });
    const tab = $("#tab", el);
    async function carregar() {
      const meu = ++seq;
      tab.setAttribute("aria-busy", "true");
      if (!jaCarregou) tab.innerHTML = ui.skeleton.tabela(cols.length, 6);
      else tab.classList.add("recarregando");
      try {
        const l = await SE.api.listar(c.recurso, { q: busca, ativo: inativos ? undefined : true });
        if (meu !== seq) return; /* chegou depois de uma busca mais nova */
        lista = l; jaCarregou = true;
        tab.innerHTML = ui.tabela(cols, lista, "Nenhum registro corresponde à busca.");
      } catch (e) {
        if (meu !== seq) return;
        tab.innerHTML = ui.erroInline(e.message);
      } finally {
        if (meu === seq) { tab.classList.remove("recarregando"); tab.removeAttribute("aria-busy"); }
      }
    }
    async function abrir(reg) {
      const campos = c.campos.filter(f => !(reg && f.soCriar)).map(f => Object.assign({}, f, { valor: reg ? reg[f.nome] : f.padrao, ...(reg && f.bloquearEdicao ? { dica: "Não editável" } : {}) }));
      const ok = await ui.form({ titulo: reg ? "Editar " + c.rotulo : "Novo " + c.rotulo, campos, aoSalvar: async d => {
        const erros = SE.rules.validar[c.recurso](Object.assign({}, reg || {}, d), { criando: !reg }); if (erros.length) throw new SE.Erro(erros.join(" "));
        reg ? await SE.api.atualizar(c.recurso, reg.id, d) : await SE.api.criar(c.recurso, d);
      } });
      if (ok) { ui.toast(reg ? "Cadastro atualizado." : "Cadastro criado."); carregar(); }
    }
    $("#q", el).oninput = SE.debounce(e => { busca = e.target.value; carregar(); });
    $("#ina", el).onchange = e => { inativos = e.target.checked; carregar(); };
    if (edita) { const novo = $("#novo", el); novo.onclick = () => ui.ocupado(novo, () => abrir(null)); }
    el.onclick = async e => {
      if (e.target.closest("[data-retry]")) return carregar();
      const b = e.target.closest("[data-a]"); if (!b) return; const reg = lista.find(r => String(r.id) === b.dataset.id);
      if (!reg) return;
      if (b.dataset.a === "ed") return ui.ocupado(b, () => abrir(reg));
      if (b.dataset.a === "at") {
        await ui.ocupado(b, async () => {
          const ok = await ui.confirmar(reg.ativo ? "Inativar cadastro" : "Reativar cadastro", reg.ativo ? "O cadastro deixa de aparecer nas listas ativas, mas o histórico escolar é preservado." : "O cadastro volta a ficar ativo.", reg.ativo ? "Inativar" : "Reativar");
          if (!ok) return;
          try { await SE.api.definirAtivo(c.recurso, reg.id, !reg.ativo); ui.toast("Situação atualizada."); carregar(); } catch (x) { ui.toast(x.message, "erro"); }
        });
      }
    };
    carregar();
  };
})();