import { ObjectId } from "mongoose";

export interface iUploadInfo {
    _id: ObjectId;
    date: Date;
    uploadFiles: [iUploadFiles]
    createdAt: Date;
}

export interface iUploadFiles {
    fileName: string;
    size: number;
}