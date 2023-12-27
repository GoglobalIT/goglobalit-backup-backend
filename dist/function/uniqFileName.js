"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniqFileNameRar = exports.uniqFileName = void 0;
const path_1 = __importDefault(require("path"));
function uniqFileName(file) {
    const fileExtension = path_1.default.extname(file.originalname);
    const filenameWithoutExtension = path_1.default.parse(file.originalname).name;
    return `${filenameWithoutExtension}_${Date.now()}${fileExtension}`;
}
exports.uniqFileName = uniqFileName;
function uniqFileNameRar(inputFileName) {
    const matchResult = inputFileName.match(/^(.+)_([\d-]+_at_[\d_]+)\.(.+)$/);
    if (matchResult) {
        const fileName = matchResult[1];
        const extension = matchResult[2];
        return `${fileName}_${Date.now()}.${extension}`;
    }
    else {
        return `${Date.now()}_`;
    }
}
exports.uniqFileNameRar = uniqFileNameRar;
