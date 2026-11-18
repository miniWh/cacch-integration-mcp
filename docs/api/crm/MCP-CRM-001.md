# MCP-CRM-001：勤策员工按 ID 查询 MCP Tool

| 项 | 说明 |
|----|------|
| 文档编号 | MCP-CRM-001 |
| MCP Tool | `crm_query_employee_by_id` |
| 中台接口 | `POST /api/v1/crm/employees/query-by-id` |
| 中台契约 | [crm-employee-query-api.md](../../../../../cacch-integration-platform/docs/api/crm/crm-employee-query-api.md) §3.1 |
| 状态 | 产品化接口 |

## 用途

远程 Agent 通过 MCP 调用集成中台**产品化**员工查询，按勤策员工 ID 获取帐号信息（重点 `empCode`）。勤策密钥仅保留在中台。

## 连接方式

- 传输：**Streamable HTTP**（MCP 规范）
- 路径：环境变量 `MCP_PATH`，默认 `/mcp`
- 鉴权：`Authorization: Bearer <MCP_AUTH_TOKEN>`

## Tool 定义

| 属性 | 值 |
|------|-----|
| 名称 | `crm_query_employee_by_id` |
| 入参 | `employee_id`（string，必填）勤策员工 ID |
| 出参 | JSON 文本，统一 envelope：`success` / `code` / `message` / `data` |

### 成功 `data` 字段（有中台员工时）

与中台 `CrmEmployeeVO` 一致（camelCase），并附加：

| 字段 | 说明 |
|------|------|
| `id` | 勤策员工唯一标识 |
| `empId` | 第三方员工 ID |
| `empCode` | 员工登录帐号 |
| `empName` | 员工姓名 |
| `mobile` | 手机号 |
| `status` | 在职状态 |
| `trace_id` | 本次 MCP 调用链路 ID |

中台 `code=0` 且 `data=null`（查无员工）时，MCP 返回 `success: true`，`data: null`，`message` 为「查无匹配员工」。

### 常见 `code`

| code | 含义 |
|------|------|
| `OK` | 成功（含 `data: null` 查无员工） |
| `INVALID_ARGUMENT` | `employee_id` 缺失、类型错误或为空 |
| `PLATFORM_40002` | 中台参数缺失（如 employeeId 为空） |
| `PLATFORM_50001` | 中台集成/勤策业务失败 |
| `PLATFORM_*` | 其他中台 `Result.code` 非 0 |
| `INTEGRATION_ERROR` | 网络、HTTP 或响应结构异常 |

## 中台调用约定

- `POST {INTEGRATION_BASE_URL}/api/v1/crm/employees/query-by-id`
- Body：`{"employeeId":"<id>"}`
- Header：`X-Trace-Id`、`Content-Type: application/json`；中台需 API Key 时再配 `X-Api-Key`（环境变量 `INTEGRATION_API_KEY`）

## 验收对照

1. `tools/list` 含本 Tool 与 `crm_query_employee`，描述为中文。
2. 合法 `employee_id` 返回的 `empCode` 与中台 curl 一致。
3. 查无员工：`success` + `data: null`，非 `CRM_NO_EMPLOYEE`。
4. 无 MCP Token 返回 HTTP 401，响应不含密钥。

## 本地启动

```bash
cp .env.example .env
npm install
npm run dev
```

## 与中台 curl 对照示例

```bash
curl -s -X POST "%INTEGRATION_BASE_URL%/api/v1/crm/employees/query-by-id" \
  -H "Content-Type: application/json" \
  -H "X-Trace-Id: manual-test-001" \
  -d "{\"employeeId\":\"<勤策员工ID>\"}"
```