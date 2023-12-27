"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function resp(res, statusCode, message, data) {
    return res.status(statusCode).json({
        status: statusCode === 200 ? true : false,
        message,
        data,
    });
}
exports.default = resp;
