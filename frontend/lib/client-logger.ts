type LogDetail = unknown;

const isDevelopment = process.env.NODE_ENV !== 'production';

function emit(level: 'error' | 'warn', message: string, detail?: LogDetail) {
  if (!isDevelopment || typeof globalThis === 'undefined') {
    return;
  }

  const sink = globalThis['console'];
  if (!sink) {
    return;
  }

  if (detail === undefined) {
    sink[level](message);
    return;
  }

  sink[level](message, detail);
}

export function logClientError(message: string, detail?: LogDetail) {
  emit('error', message, detail);
}

export function logClientWarning(message: string, detail?: LogDetail) {
  emit('warn', message, detail);
}
