/** 集成中台统一 Result 包装 */
export interface PlatformResult<T> {
  code: number;
  message: string;
  data: T | null;
}

/** 勤策 OpenAPI 响应（挂载在中台 Result.data 上） */
export interface CrmOpenApiResponse {
  return_code?: string;
  return_msg?: string;
  msg_id?: string;
  response_data?: unknown;
}

/** 精简后的员工信息，供 MCP 返回 */
export interface CrmEmployeeSummary {
  employee_id: string;
  emp_code: string | null;
  emp_id: string | null;
  emp_name: string | null;
}