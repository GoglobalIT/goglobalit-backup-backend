import express from 'express'

export default function resp(res: express.Response, statusCode: number, message?: any, data?: any): express.Response {
    return res.status(statusCode).json({
        status: statusCode === 200 ? true : false,
        message,
        data,
    })
}