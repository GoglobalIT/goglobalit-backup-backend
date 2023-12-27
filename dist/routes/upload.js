"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uploadController_1 = require("../controller/uploadController");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware ");
exports.default = (router) => {
    router.get('/storage/detail', uploadController_1.storageDetail);
    router.post('/backupJson', uploadController_1.backupJson);
    router.post('/backupBson', uploadController_1.backupBson);
    router.post('/convertToRar', uploadController_1.convertJsonFolderToRar);
    router.post('/uploadAfterRar', uploadController_1.uploadAfterRar);
    router.post('/dynamicUpload', uploadMiddleware_1.uploadMiddleware, uploadController_1.dynamicUpload);
    router.post('/backupHistory', uploadController_1.backupHistory);
    router.post('/uploadHistory', uploadController_1.uploadHistory);
    router.post('/deleteFile', uploadController_1.deleteFile);
    return router;
};
