import express from 'express';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage }).array('files');
// custom middleware
export const uploadMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        upload(req, res, (err) => {
            if (err) {
                return res.sendStatus(400);
            }
            next();
        });
    } catch (error) {
        res.sendStatus(500);
    }
};