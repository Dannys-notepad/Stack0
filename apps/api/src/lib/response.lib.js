class ApiResponse {
  static send(res, { success, message, status, data = null }) {
    const payload = { success, message };

    if (data !== null) payload.data = data;

    return res.status(status).json(payload);
  }

  static success(res, message, status = 200, data = null) {
    return this.send(res, { success: true, message, status, data });
  }

  static error(res, message, status = 400 ) {
    return this.send(res, { success: false, message, status });
  }
}

export const success = ApiResponse.success.bind(ApiResponse);
export const error = ApiResponse.error.bind(ApiResponse);

export default ApiResponse;
