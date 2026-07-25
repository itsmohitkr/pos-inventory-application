interface ResponseBodyInit {
  success?: boolean;
  message?: string;
  data?: unknown;
  error?: unknown;
  details?: unknown;
  /** Extra top-level fields merged into the body. */
  meta?: Record<string, unknown>;
}

class ResponseBody {
  success: boolean;
  message: string;
  data?: unknown;
  error?: unknown;
  details?: unknown;
  [key: string]: unknown;

  constructor({ success, message = '', data, error, details, meta = {} }: ResponseBodyInit) {
    this.success = Boolean(success);
    this.message = message;

    if (data !== undefined) {
      this.data = data;
    }

    if (error !== undefined) {
      this.error = error;
    }

    if (details !== undefined) {
      this.details = details;
    }

    if (meta && typeof meta === 'object') {
      Object.assign(this, meta);
    }
  }

  static successResponse(message = 'Success', data?: unknown, meta: Record<string, unknown> = {}) {
    return new ResponseBody({ success: true, message, data, meta });
  }

  static errorResponse(
    message = 'Error',
    error: unknown = 'Request Failed',
    details?: unknown,
    meta: Record<string, unknown> = {}
  ) {
    return new ResponseBody({ success: false, message, error, details, meta });
  }
}

export = ResponseBody;
