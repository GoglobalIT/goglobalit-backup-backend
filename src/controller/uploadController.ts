import express from 'express'
import resp from '../function/resp'
import fs from 'fs'
import { google } from 'googleapis'
import { Readable } from 'stream'
import { MongoClient } from 'mongodb'
import { spawn } from 'child_process'
import { dateFormart } from '../function/dateFormat'
import path from 'path'
import { formatBytes, getRarFileSizeInMB } from '../function/fileSizeInMB'
import { uniqFileName } from '../function/uniqFileName'

export const storageDetail = async (req: express.Request, res: express.Response) => {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: path.resolve(__dirname, '../config/googleDriveServiceKey.json'),
            scopes: ['https://www.googleapis.com/auth/drive']
        });
        const drive = google.drive({ version: 'v3', auth });
        const response = await drive.about.get({
            fields: 'storageQuota'
        });
        // console.log(drive)
        const storageQuota: any = response.data.storageQuota;
        const returnData = {
            totalStorage: formatBytes(storageQuota?.limit),
            usedStorage: formatBytes(parseFloat(storageQuota?.usage)),
            remainingStorage: formatBytes(storageQuota?.limit - storageQuota?.usage),
        }
        // console.log(returnData)
        // const returnData = {
        //     totalStorage: storageQuota?.limit,
        //     usedStorage: storageQuota?.usage,
        //     remainingStorage: storageQuota?.limit - storageQuota?.usage,
        // }
        return resp(res, 200, returnData)
    } catch (error) {
        return resp(res, 400, error)
    }
}

export const dynamicUpload = async (req: express.Request, res: express.Response) => {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: path.resolve(__dirname, '../config/googleDriveServiceKey.json'),
            scopes: ['https://www.googleapis.com/auth/drive']
        });
        const drive = google.drive({ version: 'v3', auth });
        const files: Express.Multer.File[] = req.files as Express.Multer.File[];
        const uploadPromises = files.map(async (file) => {
            const media = {
                mimeType: file.mimetype,
                body: Readable.from(file.buffer),
            };
            try {
                const response = await drive.files.create({
                    requestBody: {
                        name: uniqFileName(file),
                        parents: [`${process.env.GOOGLE_DRIVE_UPLOAD_FOLDER_ID}`]
                    },
                    media,
                });
                return response.data;
            } catch (error) {
                console.error('File upload error:', error.message);
                throw error;
            }
        });
        const uploadedFiles = await Promise.all(uploadPromises);
        const allUploadsSuccessful = uploadedFiles.every((response) => response);
        if (allUploadsSuccessful) {
            return resp(res, 200, 'Uploaded successfully');
        } else {
            return resp(res, 500, 'Some files failed to upload');
        }
    } catch (error) {
        return resp(res, 400, error)
    }
}

export const backupHistory = async (req: express.Request, res: express.Response) => {
    try {
        const { date } = req.body
        const auth = new google.auth.GoogleAuth({
            keyFile: path.resolve(__dirname, '../config/googleDriveServiceKey.json'),
            scopes: ['https://www.googleapis.com/auth/drive']
        });
        const drive = google.drive({ version: 'v3', auth });
        let query = `'${process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID}' in parents and mimeType != 'application/vnd.google-apps.folder'`
        if (date) {
            const fromDate = `${date}T00:00:00.000Z`;
            const toDate = `${date}T16:59:59.000Z`;
            query = `'${process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID}' in parents and mimeType != 'application/vnd.google-apps.folder' and createdTime > '${fromDate}' and createdTime <= '${toDate}'`
        }
        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name, mimeType, createdTime, size, webViewLink)',
            pageToken: null
        });
        const data = response?.data?.files
        return resp(res, 200, data)
    } catch (error) {
        return resp(res, 400, error)
    }
}

export const uploadHistory = async (req: express.Request, res: express.Response) => {
    try {
        const { date } = req.body
        const auth = new google.auth.GoogleAuth({
            keyFile: path.resolve(__dirname, '../config/googleDriveServiceKey.json'),
            scopes: ['https://www.googleapis.com/auth/drive']
        });
        const drive = google.drive({ version: 'v3', auth });
        let query = `'${process.env.GOOGLE_DRIVE_UPLOAD_FOLDER_ID}' in parents and mimeType != 'application/vnd.google-apps.folder'`
        if (date) {
            const fromDate = `${date}T00:00:00.000Z`;
            const toDate = `${date}T16:59:59.000Z`;
            query = `'${process.env.GOOGLE_DRIVE_UPLOAD_FOLDER_ID}' in parents and mimeType != 'application/vnd.google-apps.folder' and createdTime > '${fromDate}' and createdTime <= '${toDate}'`
        }
        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name, mimeType, createdTime, size, webViewLink)',
            pageToken: null
        });
        const data = response?.data?.files
        return resp(res, 200, data)
    } catch (error) {
        return resp(res, 400, error)
    }
}

export const backupJson = async (req: express.Request, res: express.Response) => {
    try {
        const { isDirectToCloud } = req.body
        const globalITdb = new MongoClient(process.env.NODE_DEBUG);
        await globalITdb.connect();
        const getAllDatabase = await globalITdb.db().admin().listDatabases()
        let new_Date = new Date();
        let currentDate = new_Date.toLocaleString();
        const folderNameWithDateTime = "BackupJSON" + "_" + dateFormart(currentDate) + "_at_" + new_Date.getHours() + "_" + new_Date.getMinutes();
        const backupEachDatabaseAndCollection = Promise.all(
            getAllDatabase.databases.map(async database => {
                const getCollectionByDB = await globalITdb.db(database.name).listCollections().toArray()
                getCollectionByDB.map(async collection => {

                    const child = spawn('mongoexport', [
                        `--host=192.168.10.6`,
                        `--port=27018`,
                        `--username=BackupUser`,
                        `--password=0935$Back_upuser`,
                        `--authenticationDatabase=admin`,
                        `--collection=${collection.name}`,
                        `--db=${database.name}`,
                        `--out=../BackupDatabase/${folderNameWithDateTime}/${database.name}/${collection.name}.json`,
                    ]);

                    // child.stdout.on('data', (data) => {
                    //     console.log('stdout:\n', data);
                    // });
                    // child.stderr.on('data', (data) => {
                    //     console.log('stderr:\n', Buffer.from(data).toString());
                    // });
                    // child.on('error', (error) => {
                    //     console.log('error:\n', error);
                    // });
                    // child.on('exit', (code, signal) => {
                    //     if (code) console.log('Process exit with code:', code);
                    //     else if (signal) console.log('Process killed with signal:', signal);
                    // });
                })
            })
        )
        if (await backupEachDatabaseAndCollection) {
            try {
                if (isDirectToCloud) {
                    // convert to rar and store in local machine, for next api to get it and upload to cloud
                    await new Promise((resolve) => setTimeout(resolve, 10000));
                    const child = spawn(process.env.RAR_FOLDER, ['a', `../BackupDatabase/${folderNameWithDateTime}.rar`, `../BackupDatabase/${folderNameWithDateTime}`]);
                    await new Promise((resolve) => setTimeout(resolve, 10000));
                }
                return resp(res, 200, "Backup as JSON is success ✅", folderNameWithDateTime);
            } catch (error) {
                console.error('Error creating RAR archive:', error.message);
                return resp(res, 500, 'Error creating RAR archive');
            }
        }
        return resp(res, 400, 'Backup failed')
    } catch (error) {
        console.log(error)
        return resp(res, 400, error)
    }
}

export const backupBson = async (req: express.Request, res: express.Response) => {
    try {
        let new_Date = new Date();
        let currentDate = new_Date.toLocaleString();

        const DB_NAME = "BackupBSON" + "_" + dateFormart(currentDate) + "_at_" + new_Date.getHours() + "_" + new_Date.getMinutes();
        const child = spawn('mongodump', [
            `--uri=mongodb://BackupUser:0935%24Back_upuser@192.168.10.6:27018/`,
            `--out=../BackupDatabase/${DB_NAME}`,
        ]);

        // child.stdout.on('data', (data) => {
        //     console.log('stdout:\n', data);
        // });
        // child.stderr.on('data', (data) => {
        //     console.log('stderr:\n', Buffer.from(data).toString());
        // });
        // child.on('error', (error) => {
        //     console.log('error:\n', error);
        // });
        child.on('exit', (code, signal) => {
            if (code) {
                console.log('Process exit with code:', code);
                return resp(res, 400, "Backup as BSON is failed ✅", code);
            }
            else if (signal) {
                console.log('Process killed with signal:', signal);
                return resp(res, 400, "Process killed with signal:", signal);
            }
            else {
                console.log('BackupBson is successfull ✅');
                return resp(res, 200, "Backup as BSON is success ✅", `${DB_NAME}`);
            }
        });
        return resp(res, 200, "Backup as BSON is success ✅", `${DB_NAME}`);
    } catch (error) {
        console.log(error)
        return resp(res, 400, error)
    }
}

export const convertJsonFolderToRar = async (req: express.Request, res: express.Response) => {
    try {
        const { backupName } = req.body
        // const backupName = req?.params?.backupName;

        if (!backupName) {
            return resp(res, 400, "Folder name not found");
        }
        const child = spawn(process.env.RAR_FOLDER, ['a', `../BackupDatabase/${backupName}.rar`, `../BackupDatabase/${backupName}`]);
        // child.stdout.on('data', (data) => {
        //     console.log(`stdout: ${data}`);
        // });

        // child.stderr.on('data', (data) => {
        //     console.error(`stderr: ${data}`);
        // });

        // child.on('close', (code) => {
        //     console.log(`RAR process exited with code ${code}`);
        // });
        // console.log("Convert to rar successfully ✅")
        await new Promise((resolve) => setTimeout(resolve, 8000));
        return resp(res, 200, "✅ Convert to rar successfully ✅", `${backupName}.rar`);
    } catch (error) {
        return resp(res, 400, error)
    }
}

export const uploadAfterRar = async (req: express.Request, res: express.Response) => {
    try {
        const { fileRar } = req.body
        if (!fileRar) return resp(res, 400, "File rar required");

        const filePath = `../BackupDatabase/${fileRar}.rar`

        if (!fs.existsSync(filePath))
            return resp(res, 400, "No backup file found");

        const auth = new google.auth.GoogleAuth({
            keyFile: path.resolve(__dirname, '../config/googleDriveServiceKey.json'),
            scopes: ['https://www.googleapis.com/auth/drive']
        });
        const drive = google.drive({ version: 'v3', auth });
        const resource = {
            name: `_${Date.now()}_${fileRar}.rar`,
            parents: [`${process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID}`],
        };
        const media = {
            mimeType: 'application/x-rar-compressed',
            body: fs.createReadStream(filePath),
        };
        const response = await drive.about.get({ fields: 'storageQuota' });
        const storageQuota: any = response?.data?.storageQuota;
        const totalMB = parseFloat(formatBytes(storageQuota?.limit)) * 1024
        const usageMB = parseFloat(formatBytes(storageQuota?.usage))
        const fileSize = await getRarFileSizeInMB(filePath)
        const remain = totalMB - usageMB
        if (remain < fileSize) {
            return resp(
                res, 200,
                "Backup success ✅, But not enough space to upload to G-Drive ❌",
                `Remain: ${(remain / 1024).toFixed(2)} GB | Upload: ${(fileSize / 1024).toFixed(2)} GB`
            );
        }
        try {
            const file = await drive.files.create({
                requestBody: resource,
                media: media,
                fields: 'id'
            });
            return resp(res, 200, "Upload JSON to Google Drive success ✅");
        } catch (err) {
            throw err
        }
    } catch (error) {
        console.log(error)
        return resp(res, 400, `${error} ❌`)
    }
}

export const deleteFile = async (req: express.Request, res: express.Response) => {
    try {
        const { fileId } = req.body
        if (!fileId) return resp(res, 400, "FileId required");
        const auth = new google.auth.GoogleAuth({
            keyFile: path.resolve(__dirname, '../config/googleDriveServiceKey.json'),
            scopes: ['https://www.googleapis.com/auth/drive']
        });
        const drive = google.drive({ version: 'v3', auth });
        try {
            await drive.files.delete({ fileId });
            return resp(res, 200, 'Delete successfully');
        } catch (error) {
            throw error
        }
    } catch (error) {
        return resp(res, 400, error)
    }
}
