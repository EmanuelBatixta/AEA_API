import { Router } from "express";
import express from 'express'; // criar o servidor
import multer from 'multer';
import dotenv from 'dotenv';                // carregar variaveis de ambiente
import path from 'path';
import { verifyToken } from '../tokens.js'; // autenticar o token
import { config } from '../multerConfig.js'; // configurar o multer 
import { Doc } from '../doc.js';             // manipular documentos no db
import { Signer } from '../signers.js';      // manipular assinantes no db
import { Field } from '../field.js';         // manipular campos no db

dotenv.config()
const router = Router()

const storage = multer(config)
router.use('/documents/uploads', express.static(path.join(process.cwd(), "uploads")))

// GET METHODS -----------------------------------------------
// VISUALIZAR DOC
router.get('/documents/:documentId', verifyToken, async(request, reply)=>{
    const id = request.params.documentId
    const doc = new Doc()
    const status = await doc.getDoc(id)
    status ? reply.send(status) : reply.status(400).send({ message : "Documento nao encontrado"})
})


// ESCOLHER O CAMPO 
router.get('/documents/:documentId/prepare-signature', verifyToken, async(request, reply)=>{ 
    const id = request.params.documentId
    const signer = await new Signer().getSigners(id)
    const signerEmail = signer[0].email
    const signerName = signer[0].name
    const p = path.resolve('index.ejs')
    const token = process.env.TOKEN
    reply.render(p, { id, signerName, signerEmail, token })
})

// BAIXAR DOCUMENTO DEPOIS DE PRONTO
router.get('/documents/:documentId/download', verifyToken, async(request, reply)=>{
    const id = request.params.documentId
    const doc = new Doc()
    const status = await doc.getDoc(id)
    if (status.status === 'completed'){
        reply.download(`uploads/${id}.pdf`, (err)=>{
            if (err) {
                return reply.status(500).send({ error: err })
            }
        })
    } else {
      return reply.status(409).send({ message: "Documento não está completo" })
    }
})


//POST METHODS -------------------------------------------------
// ENVIAR ARQUIVOS 
router.post('/documents', verifyToken, storage.single('file'), async(request, reply)=>{
    const id = request.file.filename.split('.')[0]
    const doc = new Doc()
    doc.addDoc(id)
    return reply.status(200).send({
        documentId: `${id}`,
        status: "uploaded"
    })
})  

//ADICIONAR QUEM ASSINARÁ
router.use(express.json())
router.post('/documents/:documentId/signers', verifyToken, async(request, reply)=> {
    const { name, email, authcode, order } = request.body
    const id = request.params.documentId
    const signer = new Signer()

    signer.addSigner(id, name, email, authcode, order)

    return reply.status(200).send({ "message": "Signatários adicionados com sucesso." })   
})

//ADICIONAR O CAMPO DA ASSINATURA
router.post('/documents/:documentId/signature-fields', verifyToken,  async(request, reply)=> {
    const {x, y, email} = request.body
    const id = request.params.documentId
    const signer = new Field()
    signer.addField(id, email, x, y)
    return reply.status(200).send({ "message": "Campos de assinatura definidos com sucesso." })   
})

//ADICIONAR A ASSINATURA
router.post('/documents/:documentId/sign', verifyToken,  async(request, reply)=> {
    const { authcode, name, email, } = request.body
    const id = request.params.documentId
    const signer = new Signer()
    const doc = new Doc()

    if (await signer.complete(authcode)){
        doc.complete(id, name, email)
        return reply.status(200).send({ "message": "Documento assinado com sucesso." })
    } else {
        return reply.status(401).send({ "message": "Falha ao assinar" })   
    }
})  

// DELETE METHODS ------------------------------------------------
router.delete('/documents/:documentId', verifyToken, async(request, reply)=>{
    const id = request.params.documentId
    const doc = new Doc()
    if(doc.getDoc(id)){
        doc.deleteDoc(id)? reply.status(200).send({ message: "Documento excluido com sucesso" }) : reply.status(500).send({ error: err }) 
    } else {
        reply.status(400).send({ message : "Documento nao encontrado"})
    }
})  


export { router }