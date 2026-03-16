type LogContext = Record<string, unknown>;
type Transport = (level: string, message: string, extra?: unknown) => void;

let transport: Transport | null = null;

const PREFIX = "[HE]";

function emit(level: string, message: string, extra?: unknown): void {
  if (transport) {
    transport(level, message, extra);
    return;
  }
  if (import.meta.env.DEV) {
    const args = extra !== undefined ? [extra] : [];
    switch (level) {
      case "debug": console.log(PREFIX, message, ...args); break;
      case "info":  console.info(PREFIX, message, ...args); break;
      case "warn":  console.warn(PREFIX, message, ...args); break;
      case "error": console.error(PREFIX, message, ...args); break;
    }
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    emit("debug", message, context);
  },
  info(message: string, context?: LogContext): void {
    emit("info", message, context);
  },
  warn(message: string, context?: LogContext): void {
    emit("warn", message, context);
  },
  error(message: string, error?: unknown, context?: LogContext): void {
    const extra =
      error !== undefined && context !== undefined
        ? { error, ...context }
        : error ?? context;
    emit("error", message, extra);
  },
  /** Substitui o transporte por defeito. Usar para integração futura com Sentry, LogRocket, etc. */
  setTransport(fn: Transport): void {
    transport = fn;
  },
};
