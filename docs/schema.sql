-- Esquema relacional derivado do diagrama ER (PostgreSQL; adapte tipos para MySQL se preciso).
-- ALUNO não é usuário do sistema: não há login de aluno. Só professor e coordenação (ADMINISTRADOR) têm USUARIO.
CREATE TABLE usuario (
  id_usuario    SERIAL PRIMARY KEY,
  login         VARCHAR(120) NOT NULL UNIQUE,          -- e-mail institucional
  senha_hash    VARCHAR(255) NOT NULL,                 -- bcrypt/argon2, nunca texto puro
  perfil        VARCHAR(15)  NOT NULL CHECK (perfil IN ('coordenacao','professor')),  -- derivado do domínio do e-mail
  ativo         BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE administrador (
  id_administrador SERIAL PRIMARY KEY,
  id_usuario  INT NOT NULL UNIQUE REFERENCES usuario(id_usuario),
  nome        VARCHAR(120) NOT NULL,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE professor (
  id_professor SERIAL PRIMARY KEY,
  id_usuario   INT NOT NULL UNIQUE REFERENCES usuario(id_usuario),
  nome         VARCHAR(120) NOT NULL,
  id_funcional VARCHAR(20) NOT NULL UNIQUE,
  email        VARCHAR(120) NOT NULL UNIQUE,
  telefone     VARCHAR(20)  NOT NULL,
  ativo        BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE aluno (
  id_aluno        SERIAL PRIMARY KEY,
  matricula       VARCHAR(20) NOT NULL UNIQUE,         -- matrícula única
  nome            VARCHAR(120) NOT NULL,
  data_nascimento DATE NOT NULL,
  responsavel_nome     VARCHAR(120),
  responsavel_contato  VARCHAR(40),                    -- obrigatório quando menor de 18 (validar na aplicação)
  ativo           BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE disciplina (
  id_disciplina SERIAL PRIMARY KEY,
  codigo        VARCHAR(20) NOT NULL UNIQUE,
  nome          VARCHAR(100) NOT NULL,
  carga_horaria INT NOT NULL CHECK (carga_horaria > 0),
  ativo         BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE turma (
  id_turma      SERIAL PRIMARY KEY,
  id_disciplina INT NOT NULL REFERENCES disciplina(id_disciplina),
  id_professor  INT NOT NULL REFERENCES professor(id_professor),
  codigo        VARCHAR(60) NOT NULL,                  -- nome da turma
  ano_letivo    INT NOT NULL,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (codigo, ano_letivo)
);
CREATE TABLE matricula_turma (
  id_matricula     SERIAL PRIMARY KEY,
  id_aluno         INT NOT NULL REFERENCES aluno(id_aluno),
  id_turma         INT NOT NULL REFERENCES turma(id_turma),
  id_administrador INT NOT NULL REFERENCES administrador(id_administrador),
  data_matricula   DATE NOT NULL DEFAULT CURRENT_DATE,
  status_matricula VARCHAR(15) NOT NULL DEFAULT 'Ativa' CHECK (status_matricula IN ('Ativa','Cancelada')),
  UNIQUE (id_aluno, id_turma)                          -- sem duplicação na mesma turma
);
-- Duas notas por matrícula: N1 e N2 (a coluna "avaliacao" substitui a entidade ATIVIDADE do ER, simplificando o requisito).
CREATE TABLE nota (
  id_nota         SERIAL PRIMARY KEY,
  id_matricula    INT NOT NULL REFERENCES matricula_turma(id_matricula),
  avaliacao       SMALLINT NOT NULL CHECK (avaliacao IN (1,2)),
  valor           NUMERIC(4,2) NOT NULL CHECK (valor BETWEEN 0 AND 10),
  data_lancamento TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (id_matricula, avaliacao)
);
CREATE TABLE historico_nota (
  id_historico   SERIAL PRIMARY KEY,
  id_nota        INT NOT NULL REFERENCES nota(id_nota),
  id_usuario     INT NOT NULL REFERENCES usuario(id_usuario),   -- quem corrigiu
  valor_anterior NUMERIC(4,2) NOT NULL,
  valor_novo     NUMERIC(4,2) NOT NULL,
  data_alteracao TIMESTAMP NOT NULL DEFAULT now(),
  motivo         VARCHAR(255) NOT NULL
);
CREATE TABLE log_cadastro (
  id_log     SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL REFERENCES usuario(id_usuario),
  entidade   VARCHAR(30) NOT NULL,
  id_registro INT NOT NULL,
  acao       VARCHAR(20) NOT NULL,                      -- CRIAR | ATUALIZAR | INATIVAR | REATIVAR | CANCELAR
  data_hora  TIMESTAMP NOT NULL DEFAULT now()
);
-- Média e situação NÃO são colunas: calcule na consulta/serviço: (N1+N2)/2 ; >= 6,0 Aprovado ; < 6,0 Reprovado ; falta nota = Em andamento.
