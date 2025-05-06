import express, { request } from 'express'; // criar o servidor
import jwt from 'jsonwebtoken';             // autenticar o token
import { UsuarioToken } from './tokens.js'; // autenticar o token
import dotenv from 'dotenv';                // carregar variaveis de ambiente
import { Doc } from './doc.js';             // manipular documentos
import unlink from 'fs';
import { config } from './multerConfig.js'; // configurar o multer 
import multer from 'multer';
import { Signer } from './signers.js';
import path from 'path';
import { Field } from './field.js';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

dotenv.config()
const server = express()
const usuario = new UsuarioToken()

const storage = multer(config)

function verifyToken(request, reply, next) {
    const token = request.headers.authorization ? request.headers.authorization.split(' ')[1] : null
       
    if(usuario.autenticarToken(token)) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decodes)=> {
            if(err) return reply.status(401).send({ message: "Token Invalido" })
                
            request.token = decodes.token;
            next()
        })
    } else{
        return reply.status(401).send({ message: "Token Invalido" })
    }
}

// GET METHODS -----------------------------------------------
server.get('/v1/documents/:documentId', verifyToken, async(request, reply)=>{
    const id = request.params.documentId
    const doc = new Doc()
    const status = await doc.getDoc(id)
    console.log("terminou")
    return reply.send(status)
})

// VISUALIZAR DOC
server.use('/v1/documents/uploads', express.static(path.join(process.cwd(), "uploads")))
server.set("view engine", "ejs");

// ESCOLHER O CAMPO 
server.get('/v1/documents/:documentId/prepare-signature',  async(request, reply)=>{ 
    const id = request.params.documentId
    const signer = await new Signer().getSigners(id)
    const signerEmail = signer[0].email
    const signerName = signer[0].name
    const p = path.resolve('index.ejs')
    const token = process.env.TOKEN
    reply.render(p, { id, signerName, signerEmail, token })
})

// BAIXAR DOCUMENTO DEPOIS DE PRONTO
server.get('/v1/documents/:documentId/download', verifyToken, async(request, reply)=>{
    const id = request.params.documentId
    const doc = new Doc()
    const status = await doc.getDoc(id)
    if (status.status === 'completed'){
        reply.download(`uploads/${id}.pdf`, (err)=>{
            if (err) {
                return reply.status(500).send({ error: err })
            } else {
                return reply.status(200).send({ message: "Download realizado com sucesso" })
            }
        })
    } else {
        return reply.status(409).send({ message: "Documento não está completo" })
    }
})


//POST METHODS -------------------------------------------------
// ENVIAR ARQUIVOS 
server.post('/v1/documents', verifyToken, storage.single('file'), async(request, reply)=>{
    const id = request.file.filename.split('.')[0]
    const doc = new Doc()
    doc.addDoc(id)
    return reply.status(200).send({
        documentId: `${id}`,
        status: "uploaded"
    })
})  

//ADICIONAR QUEM ASSINARÁ
server.use(express.json())
server.post('/v1/documents/:documentId/signers', verifyToken, async(request, reply)=> {
    const { name, email, authcode, order } = request.body
    const id = request.params.documentId
    const signer = new Signer()

    signer.addSigner(id, name, email, authcode, order)

    return reply.status(200).send({ "message": "Signatários adicionados com sucesso." })   
})

//ADICIONAR O CAMPO DA ASSINATURA
server.post('/v1/documents/:documentId/signature-fields', verifyToken,  async(request, reply)=> {
    const {id, x, y, email,} = request.body
    const signer = new Field()
    signer.addField(id, email, x, y)
    return reply.status(200).send({ "message": "Campos de assinatura definidos com sucesso." })   
})

//ADICIONAR A ASSINATURA
server.post('/v1/documents/:documentId/sign', verifyToken,  async(request, reply)=> {
    const {id, authcode, name, email, } = request.body
    const signer = new Signer()
    const now = new Date();
    const doc = new Doc()
    const field = await new Field().getField(id)
    const date =  `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`

    const pdfBytes = fs.readFileSync(`uploads/${id}.pdf`);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPages()[0];

    page.drawText(`Nome: ${name}\nEmail: ${email}\nData: ${date}`, {
        x: field[0].x,
        y: field[0].y,
        size: 14,
    });

    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(`uploads/${id}.pdf`, modifiedPdfBytes);

    if (await signer.complete(authcode)){
        doc.complete(id)
        return reply.status(200).send({ "message": "Documento assinado com sucesso." })
    } else {
        return reply.status(401).send({ "message": "Falha ao assinar" })   
    }
})  

// DELETE METHODS ------------------------------------------------
server.delete('/v1/documents/:documentId', verifyToken, async(request, reply)=>{
    const id = request.params.documentId
    const filePath = `uploads/${id}.pdf`;
    const doc = new Doc()
    unlink.unlink(filePath, (err)=>{
        if (err){
            return reply.status(500).send({ error: err })
        } else {
            doc.deleteDoc(id, filePath)
            return reply.status(200).send({ message: "Documento excluido com sucesso" })
        }
    })      
})  


server.listen({
    port: process.env.PORT ?? 3333,
    host: '0.0.0.0',
})