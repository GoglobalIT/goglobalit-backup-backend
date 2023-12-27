import express from 'express'
import uploadRoute from './upload'
const router = express.Router()

export default (): express.Router => {
    uploadRoute(router)
    return router
}