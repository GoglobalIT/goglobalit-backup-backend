"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatBytes = exports.getRarFileSizeInMB = void 0;
const fs_1 = __importDefault(require("fs"));
async function getRarFileSizeInMB(filePath) {
    try {
        const stats = await fs_1.default.promises.stat(filePath);
        const fileSizeInBytes = stats.size;
        const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
        return parseFloat(fileSizeInMB.toFixed(2));
    }
    catch (error) {
        console.error(`Error getting file size: ${error.message}`);
        return 0;
    }
}
exports.getRarFileSizeInMB = getRarFileSizeInMB;
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
exports.formatBytes = formatBytes;
