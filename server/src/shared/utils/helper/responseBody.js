class ResponseBody {
  constructor({ success, message = '', data, error, details, meta = {} }) {
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

  static successResponse(message = 'Success', data, meta = {}) {
    return new ResponseBody({ success: true, message, data, meta });
  }

  static errorResponse(message = 'Error', error = 'Request Failed', details, meta = {}) {
    return new ResponseBody({ success: false, message, error, details, meta });
  }
}

module.exports = ResponseBody;
