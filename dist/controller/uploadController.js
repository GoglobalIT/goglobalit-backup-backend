"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.uploadAfterRar = exports.convertJsonFolderToRar = exports.backupBson = exports.backupJson = exports.uploadHistory = exports.backupHistory = exports.dynamicUpload = exports.storageDetail = void 0;
const resp_1 = __importDefault(require("../function/resp"));
const fs_1 = __importDefault(require("fs"));
const googleapis_1 = require("googleapis");
const stream_1 = require("stream");
const mongodb_1 = require("mongodb");
const child_process_1 = require("child_process");
const dateFormat_1 = require("../function/dateFormat");
const path_1 = __importDefault(require("path"));
const fileSizeInMB_1 = require("../function/fileSizeInMB");
const uniqFileName_1 = require("../function/uniqFileName");
const storageDetail = async (req, res) => {
    try {
        const auth = new googleapis_1.google.auth.GoogleAuth({
            keyFile: path_1.default.resolve(__dirname, '../config/googleDriveServiceKey.json'),
            scopes: ['https://www.googleapis.com/auth/drive']
        });
        const drive = googleapis_1.google.drive({ version: 'v3', auth });
        const response = await drive.about.get({
            fields: 'storageQuota'
        });
        const storageQuota = response.data.storageQuota;
        const returnData = {
            totalStorage: (0, fileSizeInMB_1.formatBytes)(storageQuota?.limit),
            usedStorage: (0, fileSizeInMB_1.formatBytes)(parseFloat(storageQuota?.usage)),
            remainingStorage: (0, fileSizeInMB_1.formatBytes)(storageQuota?.limit - storageQuota?.usage),
        };
        return (0, resp_1.default)(res, 200, returnData);
    }
    catch (error) {
        return (0, resp_1.default)(res, 400, error);
    }
};
exports.storageDetail = storageDetail;
const dynamicUpload = async (req, res) => {
    try {
        const auth = new googleapis_1.google.auth.GoogleAuth({
            keyFile: path_1.default.resolve(__dirname, '../config/googleDriveServiceKey.json'),
            scopes: ['https://www.googleapis.com/auth/drive']
        });
        const drive = googleapis_1.google.drive({ version: 'v3', auth });
        const files = req.files;
        const uploadPromises = files.map(async (file) => {
            const media = {
                mimeType: file.mimetype,
                body: stream_1.Readable.from(file.buffer),
            };
            try {
                const response = await drive.files.create({
                    requestBody: {
                        name: (0, uniqFileName_1.uniqFileName)(file),
                        parents: [`${process.env.GOOGLE_DRIVE_UPLOAD_FOLDER_ID}`]
                    },
                    media,
                });
                return response.data;
            }
            catch (error) {
                console.error('File upload error:', error.message);
                throw error;
            }
        });
        const uploadedFiles = await Promise.all(uploadPromises);
        const allUploadsSuccessful = uploadedFiles.every((response) => response);
        if (allUploadsSuccessful) {
            return (0, resp_1.default)(res, 200, 'Uploaded successfully');
        }
        else {
            return (0, resp_1.default)(res, 500, 'Some files failed to upload');
        }
    }
    catch (error) {
        return (0, resp_1.default)(res, 400, error);
    }
};
exports.dynamicUpload = dynamicUpload;
const backupHistory = async (req, res) => {
    try {
        const { date } = req.body;
        const auth = new googleapis_1.google.auth.GoogleAuth({
            keyFile: path_1.default.resolve(__dirname, '../config/googleDriveServiceKey.json'),
            scopes: ['https://www.googleapis.com/auth/drive']
        });
        const drive = googleapis_1.google.drive({ version: 'v3', auth });
        let query = `'${process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID}' in parents and mimeType != 'application/vnd.google-apps.folder'`;
        if (date) {
            const fromDate = `${date}T00:00:00.000Z`;
            const toDate = `${date}T16:59:59.000Z`;
            query = `'${process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID}' in parents and mimeType != 'application/vnd.google-apps.folder' and createdTime > '${fromDate}' and createdTime <= '${toDate}'`;
        }
        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name, mimeType, createdTime, size, webViewLink)',
            pageToken: null
        });
        const data = response?.data?.files;
        return (0, resp_1.default)(res, 200, data);
    }
    catch (error) {
        return (0, resp_1.default)(res, 400, error);
    }
};
exports.backupHistory = backupHistory;
const uploadHistory = async (req, res) => {
    try {
        const { date } = req.body;
        const auth = new googleapis_1.google.auth.GoogleAuth({
            keyFile: path_1.default.resolve(__dirname, '../config/googleDriveServiceKey.json'),
            scopes: ['https://www.googleapis.com/auth/drive']
        });
        const drive = googleapis_1.google.drive({ version: 'v3', auth });
        let query = `'${process.env.GOOGLE_DRIVE_UPLOAD_FOLDER_ID}' in parents and mimeType != 'application/vnd.google-apps.folder'`;
        if (date) {
            const fromDate = `${date}T00:00:00.000Z`;
            const toDate = `${date}T16:59:59.000Z`;
            query = `'${process.env.GOOGLE_DRIVE_UPLOAD_FOLDER_ID}' in parents and mimeType != 'application/vnd.google-apps.folder' and createdTime > '${fromDate}' and createdTime <= '${toDate}'`;
        }
        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name, mimeType, createdTime, size, webViewLink)',
            pageToken: null
        });
        const data = response?.data?.files;
        return (0, resp_1.default)(res, 200, data);
    }
    catch (error) {
        return (0, resp_1.default)(res, 400, error);
    }
};
exports.uploadHistory = uploadHistory;
const backupJson = async (req, res) => {
    try {
        const { isDirectToCloud } = req.body;
        const globalITdb = new mongodb_1.MongoClient(process.env.NODE_DEBUG);
        await globalITdb.connect();
        const getAllDatabase = await globalITdb.db().admin().listDatabases();
        let new_Date = new Date();
        let currentDate = new_Date.toLocaleString();
        const folderNameWithDateTime = "BackupJSON" + "_" + (0, dateFormat_1.dateFormart)(currentDate) + "_at_" + new_Date.getHours() + "_" + new_Date.getMinutes();
        const backupEachDatabaseAndCollection = Promise.all(getAllDatabase.databases.map(async (database) => {
            const getCollectionByDB = await globalITdb.db(database.name).listCollections().toArray();
            getCollectionByDB.map(async (collection) => {
                const child = (0, child_process_1.spawn)('mongoexport', [
                    `--host=192.168.10.6`,
                    `--port=27018`,
                    `--username=BackupUser`,
                    `--password=0935$Back_upuser`,
                    `--authenticationDatabase=admin`,
                    `--collection=${collection.name}`,
                    `--db=${database.name}`,
                    `--out=../BackupDatabase/${folderNameWithDateTime}/${database.name}/${collection.name}.json`,
                ]);
            });
        }));
        if (await backupEachDatabaseAndCollection) {
            try {
                if (isDirectToCloud) {
                    await new Promise((resolve) => setTimeout(resolve, 10000));
                    const child = (0, child_process_1.spawn)(process.env.RAR_FOLDER, ['a', `../BackupDatabase/${folderNameWithDateTime}.rar`, `../BackupDatabase/${folderNameWithDateTime}`]);
                    await new Promise((resolve) => setTimeout(resolve, 10000));
                }
                return (0, resp_1.default)(res, 200, "Backup as JSON is success ✅", folderNameWithDateTime);
            }
            catch (error) {
                console.error('Error creating RAR archive:', error.message);
                return (0, resp_1.default)(res, 500, 'Error creating RAR archive');
            }
        }
        return (0, resp_1.default)(res, 400, 'Backup failed');
    }
    catch (error) {
        console.log(error);
        return (0, resp_1.default)(res, 400, error);
    }
};
exports.backupJson = backupJson;
const backupBson = async (req, res) => {
    try {
        let new_Date = new Date();
        let currentDate = new_Date.toLocaleString();
        const DB_NAME = "BackupBSON" + "_" + (0, dateFormat_1.dateFormart)(currentDate) + "_at_" + new_Date.getHours() + "_" + new_Date.getMinutes();
        const child = (0, child_process_1.spawn)('mongodump', [
            `--uri=mongodb://BackupUser:0935%24Back_upuser@192.168.10.6:27018/`,
            `--out=../BackupDatabase/${DB_NAME}`,
        ]);
        child.on('exit', (code, signal) => {
            if (code) {
                console.log('Process exit with code:', code);
                return (0, resp_1.default)(res, 400, "Backup as BSON is failed ✅", code);
            }
            else if (signal) {
                console.log('Process killed with signal:', signal);
                return (0, resp_1.default)(res, 400, "Process killed with signal:", signal);
            }
            else {
                console.log('BackupBson is successfull ✅');
                return (0, resp_1.default)(res, 200, "Backup as BSON is success ✅", `${DB_NAME}`);
            }
        });
        return (0, resp_1.default)(res, 200, "Backup as BSON is success ✅", `${DB_NAME}`);
    }
    catch (error) {
        console.log(error);
        return (0, resp_1.default)(res, 400, error);
    }
};
exports.backupBson = backupBson;
const convertJsonFolderToRar = async (req, res) => {
    try {
        const { backupName } = req.body;
        if (!backupName) {
            return (0, resp_1.default)(res, 400, "Folder name not found");
        }
        const child = (0, child_process_1.spawn)(process.env.RAR_FOLDER, ['a', `../BackupDatabase/${backupName}.rar`, `../BackupDatabase/${backupName}`]);
        await new Promise((resolve) => setTimeout(resolve, 8000));
        return (0, resp_1.default)(res, 200, "✅ Convert to rar successfully ✅", `${backupName}.rar`);
    }
    catch (error) {
        return (0, resp_1.default)(res, 400, error);
    }
};
exports.convertJsonFolderToRar = convertJsonFolderToRar;
const uploadAfterRar = async (req, res) => {
    try {
        const { fileRar } = req.body;
        if (!fileRar)
            return (0, resp_1.default)(res, 400, "File rar required");
        const filePath = `../BackupDatabase/${fileRar}.rar`;
        if (!fs_1.default.existsSync(filePath))
            return (0, resp_1.default)(res, 400, "No backup file found");
        const auth = new googleapis_1.google.auth.GoogleAuth({
            keyFile: path_1.default.resolve(__dirname, '../config/googleDriveServiceKey.json'),
            scopes: ['https://www.googleapis.com/auth/drive']
        });
        const drive = googleapis_1.google.drive({ version: 'v3', auth });
        const resource = {
            name: `_${Date.now()}_${fileRar}.rar`,
            parents: [`${process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID}`],
        };
        const media = {
            mimeType: 'application/x-rar-compressed',
            body: fs_1.default.createReadStream(filePath),
        };
        const response = await drive.about.get({ fields: 'storageQuota' });
        const storageQuota = response?.data?.storageQuota;
        const totalMB = parseFloat((0, fileSizeInMB_1.formatBytes)(storageQuota?.limit)) * 1024;
        const usageMB = parseFloat((0, fileSizeInMB_1.formatBytes)(storageQuota?.usage));
        const fileSize = await (0, fileSizeInMB_1.getRarFileSizeInMB)(filePath);
        const remain = totalMB - usageMB;
        if (remain < fileSize) {
            return (0, resp_1.default)(res, 200, "Backup success ✅, But not enough space to upload to G-Drive ❌", `Remain: ${(remain / 1024).toFixed(2)} GB | Upload: ${(fileSize / 1024).toFixed(2)} GB`);
        }
        try {
            const file = await drive.files.create({
                requestBody: resource,
                media: media,
                fields: 'id'
            });
            return (0, resp_1.default)(res, 200, "Upload JSON to Google Drive success ✅");
        }
        catch (err) {
            throw err;
        }
    }
    catch (error) {
        console.log(error);
        return (0, resp_1.default)(res, 400, `${error} ❌`);
    }
};
exports.uploadAfterRar = uploadAfterRar;
const deleteFile = async (req, res) => {
    try {
        const { fileId } = req.body;
        if (!fileId)
            return (0, resp_1.default)(res, 400, "FileId required");
        const auth = new googleapis_1.google.auth.GoogleAuth({
            keyFile: path_1.default.resolve(__dirname, '../config/googleDriveServiceKey.json'),
            scopes: ['https://www.googleapis.com/auth/drive']
        });
        const drive = googleapis_1.google.drive({ version: 'v3', auth });
        try {
            await drive.files.delete({ fileId });
            return (0, resp_1.default)(res, 200, 'Delete successfully');
        }
        catch (error) {
            throw error;
        }
    }
    catch (error) {
        return (0, resp_1.default)(res, 400, error);
    }
};
exports.deleteFile = deleteFile;
