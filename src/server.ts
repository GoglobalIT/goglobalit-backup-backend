import express from 'express'
import cors from 'cors'
import http from 'http'
import bodyParser from 'body-parser'
import 'dotenv/config'
// import mongoose from 'mongoose'
import router from './routes'

const app = express()

// connect db
// mongoose.Promise = Promise
// mongoose.connect(process.env.MONGO_URI)
// mongoose.connection.on('error:', (error: Error) => console.log(error));


// middleware
app.use(bodyParser.json())
app.use(cors({ credentials: true }))
// const port: string | number = process.env.PORT || 7000
const port = process.env.PORT
const server = http.createServer(app)
server.listen(port, () => {
    console.log(`server is running on http://localhost:${port}/`)
})

app.use('/', router())