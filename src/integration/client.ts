import type { AppConfig } from "../config/env.js";
import { parsePlatformEmployeeResult } from "./platformParse.js";
import type { CrmEmployeeVO, PlatformResult } from "./types.js";

const EMPLOYEE_QUERY_BY_ID_PATH = "/api/v1/crm/employees/query-by-id";
const EMPLOYEE_QUERY_PATH = "/api/v1/crm/employees/query";
const TRACE_HEADER = "X-Trace-Id";
const API_KEY_HEADER = "X-Api-Key";

export interface CrmEmployeeQueryBody {
  id?: string;
  empId?: string;
  empCode?: string;
}

export class IntegrationClient {
  constructor(private readonly config: AppConfig) {}

  async queryEmployeeById(
    employeeId: string,
    traceId: string,
  ): Promise<PlatformResult<CrmEmployeeVO | null>> {
    return this.postEmployeeApi(
      EMPLOYEE_QUERY_BY_ID_PATH,
      { employeeId },
      traceId,
    );
  }

  async queryEmployee(
    query: CrmEmployeeQueryBody,
    traceId: string,
  ): Promise<PlatformResult<CrmEmployeeVO | null>> {
    return this.postEmployeeApi(EMPLOYEE_QUERY_PATH, query, traceId);
  }

  private async postEmployeeApi(
    path: string,
    body: { employeeId: string } | CrmEmployeeQueryBody,
    traceId: string,
  ): Promise<PlatformResult<CrmEmployeeVO | null>> {
    const url = `${this.config.integrationBaseUrl}${path}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          [TRACE_HEADER]: traceId,
          ...(this.config.integrationApiKey
            ? { [API_KEY_HEADER]: this.config.integrationApiKey }
            : {}),
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new IntegrationHttpError(
        `无法连接集成中台: ${message}`,
        traceId,
      );
    }

    const bodyText = await response.text();
    let raw: unknown;
    try {
      raw = JSON.parse(bodyText) as unknown;
    } catch {
      throw new IntegrationHttpError(
        `中台返回非 JSON（HTTP ${response.status}）`,
        traceId,
      );
    }

    let parsed: PlatformResult<CrmEmployeeVO | null>;
    try {
      parsed = parsePlatformEmployeeResult(raw);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new IntegrationHttpError(message, traceId);
    }

    if (!response.ok) {
      throw new IntegrationHttpError(
        `中台 HTTP ${response.status}: ${parsed.message ?? response.statusText}`,
        traceId,
        parsed,
      );
    }

    return parsed;
  }
}

export class IntegrationHttpError extends Error {
  constructor(
    message: string,
    readonly traceId: string,
    readonly platformResult?: PlatformResult<CrmEmployeeVO | null>,
  ) {
    super(message);
    this.name = "IntegrationHttpError";
  }
}