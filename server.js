import express, { request } from 'express';
import jwt from 'jsonwebtoken';
import { UsuarioToken } from './db_tokens.js';
import dotenv from 'dotenv';

import { config } from './multerConfig.js';
import multer from 'multer';
import unlink from 'fs';
import { error } from 'console';

dotenv.config()
const server = express()
const usuario = new UsuarioToken()

const storage = multer(config)

function verifyToken(req, res, next) {
    const token = req.headers['x-access-token'];
    jwt.verify(token, process.env.JWT_SECRET, (err, decodes)=> {
        if(err) return res.status(401).send()
            
        req.token = decodes.token;
        next()
    })
}

// GET METHODS
server.get('/', verifyToken, async(request, reply)=>{
    const token = request.headers['x-access-token'];
    //console.log(usuario.autenticarToken(token))
})


//POST METHODS
server.post('/documents', verifyToken, storage.single('file'), async(request, reply)=>{
    const id = new Date().getTime()
    console.log(request)
    return reply.status(200).send({
        documentId: `${id}`,
        status: "uploaded"
    })
})  

server.post('/documents/:documentId/signers', verifyToken, async (request, reply)=> {
    const {name, email, authcode, order} = request.body

    

    return reply.status(200).send({ "message": "Signatários adicionados com sucesso." }
    )
})

// DELETE METHODS
server.delete('/documents/:documentId', verifyToken, async(request, reply)=>{
    const id = request.params.documentId
    const filePath = `uploads/${id}.pdf`;
    unlink.unlink(filePath, (err)=>{
        return reply.status(500).send({ error: err.message })
    })      
    
    return reply.status(200).send({ message: "Documento excluido com sucesso" })
})  


server.listen({
    port: process.env.port ?? 3333,
    host: '0.0.0.0',
})