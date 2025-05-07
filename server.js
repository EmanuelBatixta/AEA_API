import express from 'express';              // criar o servidor
import {router} from './src/router.js'
import path from 'path';

const server = express()
server.use('/v1', router)


server.listen({
    port: process.env.PORT ?? 3333,
    host: '0.0.0.0',
})