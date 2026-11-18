# cacch-integration-mcp

勤策 CRM 能力的 **MCP Server**（Streamable HTTP），供远程 Agent 调用；业务请求转发至集成中台**产品化** REST（`/api/v1/crm/employees/*`），勤策密钥不离开中台。

## 已注册 Tool

| Tool | 说明 | 文档 |
|------|------|------|
| `crm_query_employee_by_id` | 按勤策员工 ID 查询 | [MCP-CRM-001](docs/api/crm/MCP-CRM-001.md) |
| `crm_query_employee` | 按 id / emp_id / emp_code 组合查询 | [MCP-CRM-002](docs/api/crm/MCP-CRM-002.md) |

## 架构

```
远程 Agent (MCP Client)
  → HTTPS + Bearer MCP_AUTH_TOKEN → 本服务 (Streamable HTTP /mcp)
    → HTTPS + X-Api-Key → 集成中台 POST /api/v1/crm/employees/*
      → 勤策 OpenAPI（仅中台内部）
```

## 快速开始

```bash
cp .env.example .env
# 配置 MCP_AUTH_TOKEN、INTEGRATION_BASE_URL、INTEGRATION_API_KEY

npm install
npm run dev
```

健康检查：`GET /health`  
MCP 端点：`POST /mcp`（需 `Authorization: Bearer <MCP_AUTH_TOKEN>`）

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `MCP_AUTH_TOKEN` | 是 | Client 访问 MCP 的 Bearer Token |
| `INTEGRATION_BASE_URL` | 是 | 中台根地址 |
| `INTEGRATION_API_KEY` | 是 | 调中台 API Key |
| `MCP_PORT` | 否 | 默认 `3100` |
| `MCP_HOST` | 否 | 默认 `0.0.0.0` |
| `MCP_PATH` | 否 | 默认 `/mcp` |
| `MCP_ALLOWED_HOSTS` | 否 | 逗号分隔 Host 白名单（`0.0.0.0` 绑定时可选） |

## 目录

```
src/
  index.ts
  config/env.ts
  http/mcpAuth.ts
  integration/client.ts
  integration/platformParse.ts
  integration/types.ts
  mcp/crmEmployeePlatform.ts
  mcp/envelope.ts
  mcp/server.ts
  mcp/tools/crmQueryEmployeeById.ts
  mcp/tools/crmQueryEmployee.ts
```

## Docker

```bash
docker build -t cacch-integration-mcp .
docker run --rm -p 3100:3100 --env-file .env cacch-integration-mcp
```

## 开发

```bash
npm run build
npm start
```

## 关联中台代码

- `CrmEmployeeController` — `/api/v1/crm/employees/query-by-id`、`/query`
- 接口说明：`cacch-integration-platform/docs/api/crm/crm-employee-query-api.md`