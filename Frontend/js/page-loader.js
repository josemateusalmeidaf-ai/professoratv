(function () {
  const script = document.currentScript;
  const base = script.dataset.base;
  /* Incremente a cada publicação: força o navegador a baixar os scripts novos em vez de usar cache antigo. */
  const VERSAO = "1.1.0";
  const carregar = src => new Promise((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = base + src + "?v=" + VERSAO;
    tag.onload = resolve;
    tag.onerror = () => reject(new Error("Não foi possível carregar " + src + ". Verifique sua conexão e recarregue a página."));
    document.body.appendChild(tag);
  });
  const nucleo = [
    "config.js", "core/utils.js", "core/rules.js", "core/api-local.js",
    "core/api-http.js", "core/icons.js", "core/auth.js", "core/ui.js"
  ];

  (async () => {
    const id = document.body.dataset.module;
    try {
      if (!id) throw new Error("Esta página não declarou seu módulo.");
      for (const arquivo of nucleo) await carregar(arquivo);
      await carregar("core/router.js");
      await carregar("modules/" + id + ".js");
      SE.router.iniciar(id);
    } catch (e) {
      const box = document.createElement("main");
      box.className = "erro-inicializacao";
      const titulo = document.createElement("h1"), mensagem = document.createElement("p"), voltar = document.createElement("a");
      titulo.textContent = "Não foi possível abrir o módulo";
      mensagem.textContent = e.message;
      voltar.href = "../../index.html";
      voltar.textContent = "Voltar ao acesso";
      box.append(titulo, mensagem, voltar);
      document.body.replaceChildren(box);
    }
  })();
})();