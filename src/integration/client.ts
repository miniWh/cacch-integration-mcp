import type { AppConfig } from "../config/env.js";
import { parsePlatformResult } from "./platformParse.js";
import type { CrmOpenApiResponse, PlatformResult } from "./types.js";

const EMPLOYEE_QUERY_BY_ID_PATH = "/api/v1/crm/open-api/employees/query-by-id";
const TRACE_HEADER = "X-Trace-Id";
const API_KEY_HEADER = "X-Api-Key";

export class IntegrationClient {
  constructor(private readonly config: AppConfig) {}

  async queryEmployeeById(
    employeeId: string,
    traceId: string,
  ): Promise<PlatformResult<CrmOpenApiResponse>> {
    const url = `${this.config.integrationBaseUrl}${EMPLOYEE_QUERY_BY_ID_PATH}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          [TRACE_HEADER]: traceId,
          [API_KEY_HEADER]: this.config.integrationApiKey,
        },
        body: JSON.stringify({ employeeId }),
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

    let parsed: PlatformResult<CrmOpenApiResponse>;
    try {
      parsed = parsePlatformResult(raw);
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
    readonly platformResult?: PlatformResult<CrmOpenApiResponse>,
  ) {
    super(message);
    this.name = "IntegrationHttpError";
  }
}