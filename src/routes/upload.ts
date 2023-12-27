import express from 'express'
import {
    backupBson,
    backupJson,
    convertJsonFolderToRar,
    deleteFile,
    storageDetail,
    dynamicUpload,
    uploadAfterRar,
    uploadHistory,
    backupHistory
} from '../controller/uploadController'
import { uploadMiddleware } from '../middleware/uploadMiddleware '

export default (router: express.Router) => {
    router.get('/storage/detail', storageDetail)
    router.post('/backupJson', backupJson)
    router.post('/backupBson', backupBson)
    router.post('/convertToRar', convertJsonFolderToRar)
    router.post('/uploadAfterRar', uploadAfterRar)
    router.post('/dynamicUpload', uploadMiddleware, dynamicUpload)
    router.post('/backupHistory', backupHistory)
    router.post('/uploadHistory', uploadHistory)
    router.post('/deleteFile', deleteFile)
    return router
}