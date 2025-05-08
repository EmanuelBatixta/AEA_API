import express from 'express';              // criar o servidor
import {router} from './src/router.js'
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from './src/swagger.json' with { type: "json"}

const server = express()
//server.use(express.json())

server.use('/v1', router)
server.use('/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

server.listen({
    port: process.env.PORT ?? 3333,
    host: '0.0.0.0',
})