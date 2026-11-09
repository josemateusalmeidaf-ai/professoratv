# Sistema Escolar

Portal acadêmico modular para coordenação e professores. O front-end não requer build nem dependências: abra `Frontend/index.html` ou publique a pasta `Frontend` em um servidor estático.

## Perfis e acesso

O acesso é identificado pelo domínio do e-mail institucional, sem seletor de perfil:

- `@professor.<dominio>` → Professor
- `@coordenacao.<dominio>` → Coordenação

Não existe perfil, conta ou login de aluno. Os dados de alunos são registros acadêmicos usados pela coordenação em cadastros e matrículas e pelos professores em turmas, notas e boletins. Contas de demonstração funcionam somente com o adaptador local: `coordenacao@coordenacao.escola.edu.br / coord123`, `marina.alves@professor.escola.edu.br / prof123` e `rafael.costa@professor.escola.edu.br / prof123`. Os domínios podem ser ajustados em `Frontend/js/config.js`.

## Módulos e permissões

Cada módulo tem sua própria página HTML em `Frontend/modules/<modulo>/index.html`; a lógica de negócio correspondente fica em `Frontend/js/modules/<modulo>.js`. O carregador reutiliza os serviços centrais e inicializa somente o módulo solicitado. O menu e a autorização de interface são definidos em `config.modulos`.

| Módulo | Coordenação | Professor |
|---|---:|---:|
| Visão geral | ✔ | ✔ |
| Cadastro de alunos (registros, sem acesso ao portal) | ✔ | — |
| Professores | ✔ | — |
| Disciplinas | ✔ | — |
| Turmas | ✔ | Consulta das próprias turmas |
| Matrículas | ✔ | — |
| Notas | Consulta | Lançamento e correção nas próprias turmas |
| Boletim | Consulta | Consulta de alunos das próprias turmas |
| Auditoria | ✔ | — |

## Estrutura

```text
Frontend/
  index.html                    acesso institucional
  app.html                      redirecionamento compatível para a visão geral
  css/style.css                 tokens visuais, componentes, ícones e responsividade
  modules/
    <modulo>/index.html         página, estrutura semântica e área de conteúdo do módulo
  js/
    config.js                   domínios, permissões e catálogo de módulos
    page-loader.js              inicialização das páginas independentes
    core/icons.js               conjunto SVG local e permitido de ícones
    core/                       autenticação, regras, API, interface e navegação
    modules/                    dados, interações e operações de cada módulo
    pages/login.js              comportamento do acesso
docs/
  API.md                        contrato HTTP para integração
  schema.sql                    esquema relacional de referência
```

## Integração com o back-end

1. Implemente e valide no servidor as rotas e regras descritas em `docs/API.md`, usando `docs/schema.sql` como referência.
2. Em `Frontend/js/config.js`, altere `api.modo` para `"http"` e configure `api.baseUrl`.
3. O servidor deve validar sessão, perfil, escopo das turmas e regras de negócio em toda requisição. Menus e validações do navegador não são controles de segurança.
4. As páginas independentes precisam ser servidas por HTTP/HTTPS (por exemplo, servidor local ou hospedagem estática) para o adaptador HTTP e as rotas funcionarem corretamente.

## Criar um módulo

1. Adicione a lógica em `Frontend/js/modules/<id>.js` e registre o renderizador com `SE.modulos.registrar({id, titulo, grupo, perfis, render})`.
2. Adicione `{id, titulo, grupo, icone, perfis}` a `config.modulos`.
3. Crie `Frontend/modules/<id>/index.html` baseado nas páginas de módulo existentes, com `data-module="<id>"`, a estrutura semântica `#app-shell` / `#view`, folha de estilos compartilhada e `js/page-loader.js`. Mantenha nesse HTML o conteúdo inicial e a estrutura visual do módulo; deixe em `Frontend/js/modules/<id>.js` a carga de dados e as interações.
4. Se o módulo acessar novos dados, acrescente o contrato e as permissões em `docs/API.md`, atualize os adaptadores da API e valide as regras também no servidor.

Os ícones são SVGs locais definidos em `Frontend/js/core/icons.js`; use `SE.ui.icone("identificador")` em módulos. O conjunto permitido possui fallback seguro para identificadores desconhecidos e não aceita desenhos fornecidos por dados externos.

## Regras acadêmicas

Matrícula única por aluno e turma; notas de 0 a 10; duas avaliações (N1 e N2); média `(N1 + N2) / 2`; aprovado com média maior ou igual a 6; sem as duas notas, situação “Em andamento”. A correção de nota exige justificativa e autor registrados. Inativar registros preserva o histórico.
