# CRM OpenAPI 兼容 MCP — 方案归档（待实施）

> 状态：**首期已在本仓库实施**（`crm_query_employee_by_id` + Streamable HTTP）。  
> 归档日期：2026-11-17 · 实施日期：2026-11-18

## 背景与目标

- 勤策 CRM 能力已通过集成中台封装（`CrmClient` → `ICrmOpenApiService` → `CrmOpenApiController`）。
- 目标：以 **MCP Tools** 形式供远程 Agent 使用；勤策密钥仅保留在中台。
- 约束：**远程 Agent** 可连接；**首期仅 1 个接口**试点，通过后再扩展。

## 架构（两服务）

```
远程 Agent (MCP Client)
    → HTTPS → MCP Server（Streamable HTTP，独立进程）
        → HTTPS + API Key → 集成中台 REST
            → ICrmOpenApiService → CrmClient → 勤策 OpenAPI
```

- **需要单独起一个 MCP 服务**（轻量 Node/TS 等），与现有 Spring Boot 中台并存。
- 中台首期可零业务改动，复用现有 REST。

## 试点接口

| 项目 | 值 |
|------|-----|
| 中台路径 | `POST /api/v1/crm/open-api/employees/query-by-id` |
| 请求体 | `{ "employeeId": "<勤策员工 ID>" }` |
| MCP Tool 名（拟定） | `crm_query_employee_by_id` |
| 选型理由 | 只读、单参、已有 OA 映射在用、易测 |

## MCP Tool（首期唯一）

- **入参**：`employee_id`（string，必填）
- **返回**：MCP 层统一 envelope（success / code / message / data），避免直接把超大 `CrmOpenApiResponse` 塞满上下文
- **描述**：中文，说明何时用、何时不用

## 环境与安全

| 变量 / 项 | 用途 |
|-----------|------|
| `MCP_AUTH_TOKEN` | 远程 Client 访问 MCP 的 Bearer |
| `INTEGRATION_BASE_URL` | 中台基址 |
| `INTEGRATION_API_KEY` | 调中台（待实现 `ApiKeyAuthFilter` 或内网隔离） |
| `X-Trace-Id` | 与中台日志关联 |

**风险**：中台当前 mainly `TraceIdFilter`，无 API Key 过滤器；远程暴露前须 API Key **或** MCP+中台同 VPC。

## 建议仓库结构（独立小项目）

```
cacch-mcp-server-crm/
├── src/mcp/server.ts
├── src/mcp/tools/crmQueryEmployeeById.ts
├── src/integration/client.ts
├── Dockerfile
├── .env.example
└── README.md
```

## 验收标准

1. `list_tools` 仅见 1 个 CRM 工具，描述清晰。
2. 合法 `employeeId` 与中台 curl 结果一致。
3. 无 Token / 非法参数有明确错误，无密钥泄漏。
4. 文档：`docs/api/crm/MCP-CRM-001.md`（实施时编写）。

## 后续扩展（本期不做）

- 订单查询、明细、OA 映射等 Tool
- 中台 `CrmAgentFacade` + 稳定 VO
- 读写 MCP 分实例、按租户 Token

## 关联代码（中台）

- `cacch-integration-web/.../controller/crm/CrmOpenApiController.java`
- `cacch-integration-service/.../ICrmOpenApiService.java`
- `cacch-integration-integration/.../crm/client/CrmClient.java`