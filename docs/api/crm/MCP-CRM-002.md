# MCP-CRM-002：勤策员工组合条件查询 MCP Tool

| 项 | 说明 |
|----|------|
| 文档编号 | MCP-CRM-002 |
| MCP Tool | `crm_query_employee` |
| 中台接口 | `POST /api/v1/crm/employees/query` |
| 中台契约 | [crm-employee-query-api.md](../../../../../cacch-integration-platform/docs/api/crm/crm-employee-query-api.md) §3.2 |
| 状态 | 产品化接口 |

## 用途

按勤策 `id`、`empId`（MCP 入参 `emp_id`）或 `empCode`（`emp_code`）之一或组合查询员工；多条命中时与中台一致取**首条**。

## Tool 定义

| 属性 | 值 |
|------|-----|
| 名称 | `crm_query_employee` |
| 入参 | `id`、`emp_id`、`emp_code` 均为可选 string，**至少一项非空** |
| 出参 | 同 MCP-CRM-001 envelope 与 `data` 字段约定 |

### MCP 入参 → 中台 Body

| MCP（snake_case） | 中台（camelCase） |
|-------------------|-------------------|
| `id` | `id` |
| `emp_id` | `empId` |
| `emp_code` | `empCode` |

### 常见 `code`

| code | 含义 |
|------|------|
| `OK` | 成功（含 `data: null`） |
| `INVALID_ARGUMENT` | 三项皆空或类型非法 |
| `PLATFORM_40002` | 中台参数缺失 |
| `PLATFORM_50001` | 集成/勤策失败 |
| `INTEGRATION_ERROR` | 网络或结构异常 |

## 中台调用约定

- `POST {INTEGRATION_BASE_URL}/api/v1/crm/employees/query`
- Body 示例：`{"empCode":"zhangsan"}`

## 验收对照

1. 仅 `emp_code` 可查，返回 VO 与 curl 一致。
2. 三项皆空 → MCP `INVALID_ARGUMENT`（不经中台）。
3. 中台三项皆空 → `PLATFORM_40002`（若请求到达中台）。

## curl 对照

```bash
curl -s -X POST "%INTEGRATION_BASE_URL%/api/v1/crm/employees/query" \
  -H "Content-Type: application/json" \
  -H "X-Trace-Id: manual-test-002" \
  -d "{\"empCode\":\"zhangsan\"}"
```