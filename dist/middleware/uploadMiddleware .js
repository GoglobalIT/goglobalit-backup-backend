"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage }).array('files');
const uploadMiddleware = (req, res, next) => {
    try {
        upload(req, res, (err) => {
            if (err) {
                return res.sendStatus(400);
            }
            next();
        });
    }
    catch (error) {
        res.sendStatus(500);
    }
};
exports.uploadMiddleware = uploadMiddleware;
