import express from 'express';              // criar o servidor
import { router } from './src/router.js'
import swaggerUi from 'swagger-ui-express';
import swaggerDocs from './src/swagger.json' with { type: "json"}
import { DB } from './db.js';

const server = express()
await new DB().createDB()
//server.use(express.json())

server.use('/v1', router)
server.use('/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

server.listen({
    port: process.env.PORT ?? 3333,
    host: '0.0.0.0',
})