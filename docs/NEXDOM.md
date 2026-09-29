# NEXDOM Integration Control Plane

Monitore, diagnostique e controle implantações de integração por meio de uma API GraphQL moderna e observabilidade em tempo real.

## Arquitetura

O Integration Control Plane é composto por:

- **Backend (servidor ICP)**: serviço de API GraphQL desenvolvido em Ballerina, com autenticação, gerenciamento de runtimes e observabilidade;
- **Frontend**: aplicação moderna em React e TypeScript, construída com Vite e componentes Oxygen UI;
- **Bancos de dados compatíveis**: MySQL, PostgreSQL, Microsoft SQL Server e H2 (em memória).

## Início rápido

### Pré-requisitos

- **Java 25** (necessário para executar o bytecode gerado pelo Ballerina 2201.14);
- **Ballerina 2201.14.0-alpha3**;
- **Node.js 20 ou superior** e **pnpm 10 ou superior**;
- **Docker e Docker Compose** (recomendados para o desenvolvimento local).

### Execução com Docker Compose

O arquivo [`docker/docker-compose.yaml`](../docker/docker-compose.yaml) compila a aplicação diretamente a partir deste repositório e inicia todo o ambiente local:

- **nexdom-icp**: backend do NEXDOM ICP e frontend de produção;
- **postgres**: banco de dados PostgreSQL 16;
- **migrations**: migrations do banco para as funcionalidades Audit Logs e Deployments.

Na raiz do projeto, execute:

```bash
docker compose -f docker/docker-compose.yaml up -d --build
```

Acompanhe os logs da aplicação:

```bash
docker compose -f docker/docker-compose.yaml logs -f nexdom-icp
```

Confira o estado de todos os serviços:

```bash
docker compose -f docker/docker-compose.yaml ps
```

A aplicação estará disponível nos seguintes endereços:

- **Console**: https://localhost:9446
- **API GraphQL**: https://localhost:9446/graphql
- **API de autenticação**: https://localhost:9446/auth
- **API de observabilidade**: https://localhost:9446/icp/observability
- **Serviço de runtime**: https://localhost:9445
- **Adaptador do OpenSearch**: https://localhost:9449

Credenciais padrão: `admin` / `admin`.

Para encerrar o ambiente preservando o volume de dados do PostgreSQL:

```bash
docker compose -f docker/docker-compose.yaml down
```

Para excluir também o banco local e recriá-lo pelos scripts de inicialização na próxima execução:

```bash
docker compose -f docker/docker-compose.yaml down -v
```

> **Atenção:** a opção `-v` remove permanentemente o volume local de dados do PostgreSQL.

## Compilação a partir do código-fonte

### Compilação completa

Compile todo o projeto com o Gradle:

```bash
./gradlew build
```

Ou utilize o script de compilação:

```bash
./build.sh
```

O arquivo ZIP da distribuição será criado em:

```text
build/distribution/
```

### Execução da distribuição

Após a compilação, extraia e execute a distribuição empacotada:

```bash
# Extrai a distribuição
unzip build/distribution/*integration-control-plane-<versao>.zip -d build/distribution

# Acessa o diretório bin
cd build/distribution/*integration-control-plane-<versao>/bin

# Inicia o servidor
./icp.sh   # Linux/macOS
icp.bat    # Windows
```

## Configuração do ambiente de desenvolvimento

### Desenvolvimento do backend

Acesse o diretório do backend:

```bash
cd icp_server
```

#### Uso do Docker Compose (recomendado)

```bash
# Inicia com a configuração local e o banco H2
docker compose -f docker-compose.local.yml up --build

# Inicia com MySQL
docker compose -f docker-compose.mysql.yml up --build

# Inicia a estrutura de observabilidade com Prometheus e Grafana
docker compose -f docker-compose.observability.yml up --build
```

#### Execução local com Ballerina

1. Configure o banco de dados em `icp_server/Config.toml`.
2. Execute o serviço:

```bash
bal run
```

O servidor será iniciado na porta 9446.

### Desenvolvimento do frontend

Acesse o diretório do frontend:

```bash
cd frontend
```

#### Instalação das dependências

```bash
pnpm install
```

#### Configuração das URLs do backend

Edite o arquivo `frontend/public/config.json`:

```json
{
  "VITE_GRAPHQL_URL": "https://localhost:9446/graphql",
  "VITE_AUTH_BASE_URL": "https://localhost:9446/auth",
  "VITE_OBSERVABILITY_URL": "https://localhost:9446/icp/observability",
  "VITE_MI_DEPLOYMENTS_URL": "https://localhost:9446/icp/mi_deployments"
}
```

#### Inicialização do servidor de desenvolvimento

```bash
pnpm dev
```

O frontend estará disponível em http://localhost:5173.

#### Compilação para produção

```bash
pnpm build
```

O resultado da compilação de produção ficará em `frontend/dist/`.

## Configuração do banco de dados

O servidor ICP é compatível com diferentes bancos de dados.

### MySQL

```toml
# icp_server/Config.toml
[icp_server.storage]
dbType = "mysql"
host = "localhost"
port = 3306
name = "icp_db"
username = "root"
password = "root"
```

### PostgreSQL

```toml
[icp_server.storage]
dbType = "postgresql"
host = "localhost"
port = 5432
name = "icp_db"
username = "postgres"
password = "postgres"
```

### Microsoft SQL Server

```toml
[icp_server.storage]
dbType = "mssql"
host = "localhost"
port = 1433
name = "icp_db"
username = "SA"
password = "YourStrong@Passw0rd"
```

### H2 (em memória)

```toml
[icp_server.storage]
dbType = "h2"
```

## Testes

### Testes do backend

```bash
# Prepara os bancos H2 de teste e executa `bal test` com cobertura
./gradlew testICP
```

### Testes do frontend

```bash
cd frontend
pnpm test
```

## Autenticação

O NEXDOM ICP aceita diferentes métodos de autenticação:

- **Backend de usuários padrão**: gerenciamento integrado de usuários com tokens JWT;
- **Backend de autenticação personalizado**: integração com provedores externos OAuth2/OIDC;
- **LDAP**: integração com diretórios corporativos.

Consulte [icp_server/custom_auth/AUTH_BACKEND_IMPLEMENTATION.md](../icp_server/custom_auth/AUTH_BACKEND_IMPLEMENTATION.md) para obter mais detalhes.

## Observabilidade

O servidor ICP integra-se com:

- **OpenSearch**: agregação e pesquisa de logs;
- **Prometheus**: coleta de métricas;
- **Grafana**: visualização de dados.

Inicie a estrutura de observabilidade:

```bash
cd icp_server
docker compose -f docker-compose.observability.yml up
```

## Documentação

- [Documentação do backend](../icp_server/README.md)
- [Documentação do frontend](../frontend/README.md)
- [Configuração do runtime](../frontend/RUNTIME_CONFIG.md)
- [Implementação do RBAC v2](../icp_server/rbac_v2_implementation.md)

## Estrutura do projeto

```text
integration-control-plane/
├── icp_server/              # Serviço de backend em Ballerina
│   ├── modules/             # Módulos Ballerina: autenticação, armazenamento e observabilidade
│   ├── tests/               # Testes do backend
│   ├── database/            # Esquemas e migrations do banco de dados
│   └── docker-compose.*.yml # Configurações do Docker Compose do backend
├── docker/                  # Dockerfiles e Compose do ambiente principal
├── frontend/                # Frontend em React e TypeScript
│   ├── src/                 # Código-fonte
│   ├── public/              # Arquivos estáticos e configuração de runtime
│   └── dist/                # Saída da compilação de produção
├── distribution/            # Scripts de empacotamento da distribuição
├── k8s/              # Manifestos de implantação no Kubernetes
└── build.gradle             # Configuração de compilação do Gradle
```
