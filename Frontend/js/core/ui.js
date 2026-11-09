(function () {
  const SE = window.SE, { $, esc } = SE;
  const ui = SE.ui = {};
  ui.toast = (msg, tipo = "ok") => {
    const box = $("#toasts"); if (!box) return;
    const t = document.createElement("div"); t.className = "toast " + tipo; t.textContent = msg; box.appendChild(t);
    setTimeout(() => t.remove(), tipo === "erro" ? 5000 : 2800);
  };
  ui.icone = (id, classe = "") => SE.icons.render(id, classe);
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
  /* Diálogo de formulário. Resolve true (salvou) ou false (cancelou). */
  ui.form = async function (o) {
    const campos = [];
    for (const c of o.campos || []) campos.push(Object.assign({}, c, { _op: c.opcoes ? await c.opcoes() : null }));
    const dlg = document.createElement("dialog"); dlg.className = "modal"; dlg.setAttribute("aria-labelledby", "titulo-modal");
    dlg.innerHTML = `<form novalidate><div class="modal-cabecalho"><span class="modal-icone" aria-hidden="true">${ui.icone(o.icone || "clipboard-list")}</span><div><h2 id="titulo-modal">${esc(o.titulo)}</h2>${o.msg ? `<p class="msg">${esc(o.msg)}</p>` : ""}</div></div><div class="grade-form">${campos.map(campoHtml).join("")}</div><p class="erro-form" role="alert" aria-live="polite"></p><div class="acoes"><button type="button" class="sec" data-x>${ui.icone("x")} Cancelar</button><button type="submit">${ui.icone("check")} ${esc(o.salvar || "Salvar")}</button></div></form>`;
    document.body.appendChild(dlg); dlg.showModal();
    const focoAnterior = document.activeElement;
    const first = dlg.querySelector("input,select,textarea"); if (first) first.focus();
    return new Promise(res => {
      const fim = ok => { dlg.close(); dlg.remove(); if (focoAnterior && focoAnterior.isConnected) focoAnterior.focus(); res(ok); };
      dlg.querySelector("[data-x]").onclick = () => fim(false);
      dlg.addEventListener("cancel", e => { e.preventDefault(); fim(false); });
      dlg.querySelector("form").onsubmit = async e => {
        e.preventDefault();
        const f = new FormData(e.target), d = {}; campos.forEach(c => d[c.nome] = String(f.get(c.nome) ?? "").trim());
        const er = dlg.querySelector(".erro-form"), btn = dlg.querySelector("[type=submit]"); er.textContent = ""; btn.disabled = true;
        try { if (o.aoSalvar) await o.aoSalvar(d); fim(true); } catch (x) { er.textContent = x.message; btn.disabled = false; }
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

  /* CRUD genérico: lista + busca + criar/editar + inativar/reativar (sem exclusão: histórico preservado). */
  ui.crud = async function (el, c) {
    const perfil = SE.auth.sessao().usuario.perfil, edita = c.podeEditar ? c.podeEditar(perfil) : true;
    let busca = "", inativos = false, lista = [];
    el.innerHTML = ui.cabecalho(c.titulo, c.sub, edita ? `<button id="novo">${ui.icone("plus")}<span>${esc(c.novo)}</span></button>` : "") +
      `<section class="painel painel-listagem"><div class="barra barra-listagem"><label class="busca-campo" for="q"><span class="busca-icone" aria-hidden="true">${ui.icone("search")}</span><span class="sr-only">Buscar ${esc(c.titulo.toLowerCase())}</span><input id="q" type="search" placeholder="Buscar por nome ou código…" autocomplete="off"></label><label class="chk"><input id="ina" type="checkbox"> Mostrar inativos</label></div><div id="tab" aria-live="polite"><p class="vazio" role="status">Carregando registros…</p></div></section>`;
    const cols = c.colunas.concat([{ l: "Situação", f: r => `<span class="badge ${r.ativo ? "ok" : "inativo"}">${r.ativo ? "Ativo" : "Inativo"}</span>` }]);
    if (edita) cols.push({ l: "Ações", cl: "acoes-col", f: r => `<button class="sec peq acao-tabela" data-a="ed" data-id="${r.id}" title="Editar ${esc(c.rotulo)}" aria-label="Editar ${esc(c.rotulo)}">${ui.icone("pencil")}<span>Editar</span></button> <button class="sec peq acao-tabela ${r.ativo ? "dng" : ""}" data-a="at" data-id="${r.id}" title="${r.ativo ? "Inativar" : "Reativar"} ${esc(c.rotulo)}" aria-label="${r.ativo ? "Inativar" : "Reativar"} ${esc(c.rotulo)}">${ui.icone(r.ativo ? "archive" : "check")}<span>${r.ativo ? "Inativar" : "Reativar"}</span></button>` });
    async function carregar() {
      $("#tab", el).innerHTML = '<p class="vazio" role="status">Carregando registros…</p>';
      try { lista = await SE.api.listar(c.recurso, { q: busca, ativo: inativos ? undefined : true }); $("#tab", el).innerHTML = ui.tabela(cols, lista, "Nenhum registro corresponde à busca."); }
      catch (e) { $("#tab", el).innerHTML = `<div class="estado-inline erro" role="alert">${ui.icone("alert-circle")}<span>${esc(e.message)}</span></div>`; ui.toast(e.message, "erro"); }
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
    if (edita) $("#novo", el).onclick = () => abrir(null);
    el.onclick = async e => {
      const b = e.target.closest("[data-a]"); if (!b) return; const reg = lista.find(r => String(r.id) === b.dataset.id);
      if (b.dataset.a === "ed") abrir(reg);
      if (b.dataset.a === "at") {
        const ok = await ui.confirmar(reg.ativo ? "Inativar cadastro" : "Reativar cadastro", reg.ativo ? "O cadastro deixa de aparecer nas listas ativas, mas o histórico escolar é preservado." : "O cadastro volta a ficar ativo.", reg.ativo ? "Inativar" : "Reativar");
        if (ok) try { await SE.api.definirAtivo(c.recurso, reg.id, !reg.ativo); ui.toast("Situação atualizada."); carregar(); } catch (x) { ui.toast(x.message, "erro"); }
      }
    };
    carregar();
  };
})();
