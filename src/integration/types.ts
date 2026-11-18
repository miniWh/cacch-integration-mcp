/** 集成中台统一 Result 包装 */
export interface PlatformResult<T> {
  code: number;
  message: string;
  data: T | null;
}

/** 中台 CrmEmployeeVO（对外产品化接口 data） */
export interface CrmEmployeeVO {
  id: string;
  empId: string | null;
  empCode: string | null;
  empName: string | null;
  mobile: string | null;
  status: string | null;
}

/** MCP 成功时 data：员工 VO + 链路 ID */
export type CrmEmployeeToolData = CrmEmployeeVO & { trace_id: string };