# Contrato da API (front-end ⇄ back-end)

O front-end acessa uma camada comum em `Frontend/js/core/`. Cada módulo possui sua própria página HTML em `Frontend/modules/<modulo>/index.html`, mas usa os mesmos adaptadores da API.

Para conectar o servidor, defina `api.modo` como `"http"` e configure `api.baseUrl` em `Frontend/js/config.js`. O adaptador `api-http.js` usa JSON para requisições e respostas. Erros devem retornar `{ "mensagem": "texto exibível" }` com status HTTP apropriado (400 validação, 401 sessão, 403 permissão ou 404).

> **Acesso e segurança:** existem somente os perfis `professor` e `coordenacao`. Aluno não é usuário do sistema, não possui login nem endpoint de autenticação. Registros de alunos são dados acadêmicos usados pela equipe escolar. A navegação e validação no navegador são conveniência: todas as permissões e regras precisam ser verificadas pelo servidor.

## Acesso

O perfil é identificado pelo domínio institucional do e-mail, sem escolha de perfil na tela:

- `@professor.<dominio>` → `professor`
- `@coordenacao.<dominio>` → `coordenacao`

Os domínios são configuráveis no front-end. O servidor deve aplicar a regra ao criar usuários e devolver o perfil correspondente no login.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | `{email, senha}` → `{token, usuario:{id,nome,email,perfil}}` (401 para credenciais inválidas; 403 para conta inativa) |
| POST | `/auth/logout` | Encerra a sessão |

As demais rotas exigem `Authorization: Bearer <token>` com o token retornado no login.

## Cadastros

Somente `coordenacao` pode gravar cadastros. Não use DELETE: inative para preservar o histórico. Recursos: `alunos`, `professores`, `disciplinas` e `turmas`.

| Método | Rota | Observação |
|---|---|---|
| GET | `/{recurso}?q=&ativo=true` | Busca textual; omitindo `ativo`, retorna todos. Professor só consulta suas turmas, alunos dessas turmas e seus próprios dados |
| GET | `/{recurso}/{id}` | Consulta um registro |
| POST | `/{recurso}` | Cria registro e valida unicidade |
| PUT | `/{recurso}/{id}` | Atualiza registro; matrícula de aluno é imutável |
| PATCH | `/{recurso}/{id}/ativo` | `{ativo:boolean}`; inativação preserva matrículas, notas e histórico; inativar professor também inativa o usuário |

Campos:

- **Aluno:** `{matricula (única), nome, dataNascimento, responsavelNome, responsavelContato}`. Contato do responsável é obrigatório se o aluno for menor de 18 anos.
- **Professor:** `{nome, idFuncional (único), email (único, domínio professor), telefone, senha (somente na criação)}`. Criar professor também cria o usuário de acesso.
- **Disciplina:** `{codigo (único), nome, cargaHoraria (> 0)}`.
- **Turma:** `{codigo, anoLetivo, idDisciplina, idProfessor}`. Nome é único por ano; disciplina e professor devem estar ativos. A resposta inclui `disciplinaNome`, `professorNome` e `totalAlunos`.

## Matrículas (`coordenacao`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/turmas/{id}/matriculas` | Retorna `[{id,idAluno,alunoNome,alunoMatricula,dataMatricula,status}]`; professor só pode consultar turma própria |
| POST | `/turmas/{id}/matriculas` | `{idAluno}`; retorna 400 se já estiver ativa na turma; reativa matrícula cancelada quando aplicável |
| PATCH | `/matriculas/{id}/cancelar` | Define status `Cancelada`, preservando notas |

## Notas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/turmas/{id}/notas` | `[{idMatricula,aluno:{id,nome,matricula},n1:{id,valor}\|null,n2:{id,valor}\|null}]`; somente matrículas ativas |
| PUT | `/matriculas/{id}/notas/{1\|2}` | `{valor,motivo?}`; somente o professor responsável pela turma pode gravar |

Notas devem estar entre 0 e 10. Se uma nota existente mudar, `motivo` é obrigatório e o servidor grava, na mesma transação, o valor anterior e novo, usuário, data e justificativa em `historico_nota`. Coordenação consulta notas sem alterá-las, conforme `config.permissoes.notas.escrita`.

## Boletim e painel

- `GET /alunos/{id}/boletim` → `{aluno:{id,nome,matricula,ativo},linhas:[{turma,anoLetivo,disciplina,professor,n1,n2,media,situacao}]}`. Calcule `media=(n1+n2)/2`; situação: `Aprovado` (média ≥ 6), `Reprovado` (média < 6) ou `Em andamento` (falta nota). Professor só consulta linhas das suas turmas.
- `GET /dashboard` → coordenação: `{perfil,alunos,professores,disciplinas,turmas,matriculas,notasPendentes}`; professor: `{perfil,turmas,alunos,notasPendentes,aprovados,reprovados}`.

## Auditoria (`coordenacao`)

- `GET /auditoria/notas` → `[{id,dataAlteracao,alunoNome,turma,avaliacao:"N1",valorAnterior,valorNovo,usuarioNome,motivo}]`.
- `GET /auditoria/cadastros` → `[{id,dataHora,usuarioNome,entidade,idRegistro,acao}]`. Registre criar, atualizar, inativar, reativar e cancelar.
