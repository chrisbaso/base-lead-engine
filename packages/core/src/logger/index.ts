export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogContext = Record<string, string | number | boolean | null | undefined>;

type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: string;
  tenant_id?: string;
  context?: LogContext;
};

function serializeError(error: unknown): LogContext {
  if (error instanceof Error) {
    return {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack
    };
  }

  return {
    error_message: String(error)
  };
}

export function createLogEntry(
  level: LogLevel,
  message: string,
  context: LogContext = {}
): LogEntry {
  const { tenant_id: tenantId, ...rest } = context;
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: rest
  };

  if (typeof tenantId === "string") {
    entry.tenant_id = tenantId;
  }

  return entry;
}

export function logEvent(level: LogLevel, message: string, context: LogContext = {}) {
  const entry = createLogEntry(level, message, context);
  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}

export function logError(message: string, error: unknown, context: LogContext = {}) {
  logEvent("error", message, {
    ...context,
    ...serializeError(error)
  });
}
