import type { CrmEmployeeSummary } from "./types.js";

const CRM_SUCCESS = "0";

export function isCrmBusinessSuccess(returnCode: string | undefined): boolean {
  return returnCode === CRM_SUCCESS;
}

/**
 * 从勤策 response_data 解析首条员工节点（对齐中台 CrmEmployeeSupport）
 */
export function firstEmployeeNode(raw: unknown): Record<string, unknown> | null {
  if (raw == null) {
    return null;
  }
  if (Array.isArray(raw)) {
    return raw.length > 0 && typeof raw[0] === "object" && raw[0] !== null
      ? (raw[0] as Record<string, unknown>)
      : null;
  }
  if (typeof raw !== "object") {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  if ("emp_code" in obj || "id" in obj || "emp_id" in obj) {
    return obj;
  }
  for (const key of ["data", "list", "rows", "records", "employees"] as const) {
    if (key in obj) {
      const nested = firstEmployeeNode(obj[key]);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}

function textField(node: Record<string, unknown> | null, field: string): string | null {
  if (!node) {
    return null;
  }
  const value = node[field];
  if (value === undefined || value === null) {
    return null;
  }
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

export function toEmployeeSummary(
  employeeId: string,
  responseData: unknown,
): CrmEmployeeSummary | null {
  const node = firstEmployeeNode(responseData);
  if (!node) {
    return null;
  }
  return {
    employee_id: employeeId,
    emp_code: textField(node, "emp_code"),
    emp_id: textField(node, "emp_id") ?? textField(node, "id"),
    emp_name: textField(node, "emp_name") ?? textField(node, "name"),
  };
}