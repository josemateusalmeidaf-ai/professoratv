const CHAVE = "sistema-escolar-alunos";

const form = document.querySelector("#form-aluno");
const lista = document.querySelector("#lista-alunos");
const campoBusca = document.querySelector("#busca");

let alunos = JSON.parse(localStorage.getItem(CHAVE) || "[]");

function salvar() {
  localStorage.setItem(CHAVE, JSON.stringify(alunos));
}

function situacaoDo(aluno) {
  if (aluno.n1 === null || aluno.n2 === null) {
    return { texto: "Em andamento", classe: "" };
  }

  const media = (aluno.n1 + aluno.n2) / 2;

  if (media >= 7) return { texto: "Aprovado", classe: "aprovado" };
  if (media >= 5) return { texto: "Recuperação", classe: "recuperacao" };
  return { texto: "Reprovado", classe: "reprovado" };
}

function renderizar() {
  const termo = campoBusca.value.trim().toLowerCase();

  const filtrados = alunos.filter((aluno) =>
    aluno.nome.toLowerCase().includes(termo) ||
    aluno.matricula.toLowerCase().includes(termo)
  );

  lista.innerHTML = filtrados.map((aluno) => {
    const media = aluno.n1 !== null && aluno.n2 !== null
      ? ((aluno.n1 + aluno.n2) / 2).toFixed(1)
      : "—";

    const situacao = situacaoDo(aluno);

    return `
      <tr>
        <td>${escaparHTML(aluno.nome)}</td>
        <td>${escaparHTML(aluno.matricula)}</td>
        <td>${aluno.n1 ?? "—"}</td>
        <td>${aluno.n2 ?? "—"}</td>
        <td>${media}</td>
        <td><span class="situacao \({situacao.classe}">\){situacao.texto}</span></td>
        <td>
          <button class="remover" data-id="${aluno.id}" type="button">
            Excluir
          </button>
        </td>
      </tr>
    `;
  }).join("");

  document.querySelector("#vazio").style.display =
    filtrados.length ? "none" : "block";

  document.querySelector("#total-alunos").textContent = alunos.length;

  document.querySelector("#total-aprovados").textContent =
    alunos.filter((aluno) => situacaoDo(aluno).texto === "Aprovado").length;

  document.querySelector("#total-pendentes").textContent =
    alunos.filter((aluno) => situacaoDo(aluno).texto === "Em andamento").length;
}

// Evita inserir texto digitado diretamente como HTML.
function escaparHTML(texto) {
  return String(texto).replace(/[&<>"']/g, (caractere) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[caractere]);
}

form.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const nome = document.querySelector("#nome").value.trim();
  const matricula = document.querySelector("#matricula").value.trim();
  const valorN1 = document.querySelector("#n1").value;
  const valorN2 = document.querySelector("#n2").value;

  if (alunos.some((aluno) => aluno.matricula === matricula)) {
    alert("Já existe um aluno com essa matrícula.");
    return;
  }

  const validarNota = (valor) => {
    if (valor === "") return null;

    const nota = Number(valor);
    return nota >= 0 && nota <= 10 ? nota : null;
  };

  alunos.push({
    id: crypto.randomUUID(),
    nome,
    matricula,
    n1: validarNota(valorN1),
    n2: validarNota(valorN2)
  });

  salvar();
  form.reset();
  renderizar();
});

lista.addEventListener("click", (evento) => {
  const botao = evento.target.closest(".remover");
  if (!botao) return;

  alunos = alunos.filter((aluno) => aluno.id !== botao.dataset.id);
  salvar();
  renderizar();
});

campoBusca.addEventListener("input", renderizar);

renderizar();
