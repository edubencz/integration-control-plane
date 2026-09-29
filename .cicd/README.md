# CI/CD do Integration Control Plane

A esteira mantém o fluxo do projeto-modelo e possui os estágios `build`, `security`,
`docker`, `container-security` e `deploy`.

## Fluxo de publicação

- `develop`, `feature/*` e `fix/*`: testes, imagem e análise de container; deploy manual em DEV.
- tags `X.Y.Z-RC.NNN`: testes, imagem e análise; deploy manual em RLS ou HML.
- tags `X.Y.Z`: testes, imagem e análise; deploy manual em HML ou PRD.
- PRD aceita somente tags estáveis marcadas como protegidas no GitLab.

A imagem é publicada no Container Registry do GitLab para o scanning e também em
`docker.nexdom.tec.br/tecnologia/framework/integration-control-plane` para o Kubernetes.

## Variáveis do GitLab

Cadastre as variáveis abaixo em **Settings > CI/CD > Variables**. Secrets devem ser
`Masked` e `Protected` nos ambientes protegidos. Substitua `<ENV>` por `DEV`, `HML`,
`RLS` e `PRD`.

Obrigatórias por ambiente:

- `ICP_INGRESS_URL_<ENV>`: hostname público do Ingress, sem `http://` ou `https://`.
- `ICP_DB_HOST_<ENV>`: hostname do PostgreSQL externo.
- `ICP_DB_PORT_<ENV>`: porta, normalmente `5432`.
- `ICP_DB_NAME_<ENV>`: database do ICP.
- `ICP_DB_USERNAME_<ENV>`: usuário do banco.
- `ICP_DB_PASSWORD_<ENV>`: senha do banco (`Masked`).
- `ICP_ADMIN_PASSWORD_<ENV>`: senha inicial do usuário `admin`, com ao menos 12 caracteres (`Masked`).
- `ICP_FRONTEND_JWT_HMAC_SECRET_<ENV>`: secret aleatório com ao menos 32 caracteres (`Masked`).
- `ICP_USER_SERVICE_JWT_HMAC_SECRET_<ENV>`: secret aleatório com ao menos 32 caracteres (`Masked`).
- `ICP_OBSERVABILITY_JWT_HMAC_SECRET_<ENV>`: secret aleatório com ao menos 32 caracteres (`Masked`).

OpenSearch é opcional. Quando as variáveis não forem informadas, o adaptor embarcado
usa os defaults locais da aplicação:

- `ICP_OPENSEARCH_URL_<ENV>`
- `ICP_OPENSEARCH_USERNAME_<ENV>`
- `ICP_OPENSEARCH_PASSWORD_<ENV>` (`Masked`)

O modelo também aceita estes kubeconfigs em Base64:

- `KUBECONFIG_BASE64_INTEGRATION_DEV`
- `KUBECONFIG_BASE64_INTEGRATION_HML`
- `KUBECONFIG_BASE64_INTEGRATION_RLS`
- `KUBECONFIG_BASE64_INTEGRATION_PRD`

Eles podem ficar vazios quando o runner já possui kubeconfig e acesso aos contexts
declarados nos jobs. Os contexts esperados são `gitlab-ci-integration-dev`,
`gitlab-ci-integration-hml`, `gitlab-ci-integration-rls` e
`gitlab-ci-integration-prd`.

As credenciais do Nexus permanecem as mesmas do projeto-modelo:

- `NEXUS_REGISTRY_URL`
- `NEXUS_REGISTRY_USER`
- `NEXUS_REGISTRY_PASSWORD`

## PostgreSQL e usuário inicial

Antes do rollout, um Job idempotente verifica o PostgreSQL externo, cria os schemas
principal e de credenciais quando ainda não existem e aplica as migrations atuais.
O usuário local `admin` é criado como superadministrador e recebe a senha de
`ICP_ADMIN_PASSWORD_<ENV>`, armazenada com Bcrypt.

Uma senha que já tenha sido alterada pela aplicação não é redefinida em deploys
posteriores. O Secret temporário que contém a senha inicial é removido assim que o
bootstrap termina.

Por padrão, o banco principal também armazena as tabelas de credenciais. O TLS do
PostgreSQL fica desabilitado em DEV/HML e obrigatório em RLS/PRD.
Na primeira execução, o usuário configurado precisa ter permissão para criar tabelas,
índices, funções, triggers e views no schema de destino.

## Kubernetes

O namespace `integration` deve existir. O Ingress usa nginx e o Secret TLS existente
`tls-secret`. As portas expostas são:

- `9446`: console, GraphQL, autenticação e APIs principais.
- `9445`: heartbeats dos runtimes.
- `9449`: adaptor de observabilidade.
