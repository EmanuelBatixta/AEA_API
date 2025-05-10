import { Router } from "express";
import express from 'express';               // criar o servidor
import multer from 'multer';
import dotenv from 'dotenv';                 // carregar variaveis de ambiente
import path from 'path';
import { verifyToken } from '../tokens.js';  // autenticar o token
import { config } from '../multerConfig.js'; // configurar o multer
import { Doc } from '../doc.js';             // manipular documentos no db
import { Signer } from '../signers.js';      // manipular assinantes no db
import { Field } from '../field.js';         // manipular campos no db

dotenv.config({
    path: process.env.NODE_ENV === 'production' ? '.env' : '.env.development',
})
const router = Router()

const storage = multer(config)
router.use('/documents/uploads', express.static(path.join(process.cwd(), "uploads")))

// GET METHODS -----------------------------------------------
// VISUALIZAR DOC
router.get('/documents/:documentId', verifyToken, async (request, reply) => {
    const id = request.params.documentId
    const doc = new Doc()
    const status = await doc.getDoc(id)
    status.status === 200 ? reply.send(status.message) : reply.status(status.status).send({ message: status.message })
})


// ESCOLHER O CAMPO
router.get('/documents/:documentId/prepare-signature', async (request, reply) => {
    const id = request.params.documentId
    const signer = await new Signer().getSigners(id)
    if (signer.status === 200) {
        const signerEmail = signer.message[0].email
        const signerName = signer.message[0].name
        const p = path.resolve('src/index.ejs')
        const token = process.env.TOKEN
        reply.render(p, { id, signerName, signerEmail, token })
    }
})

// BAIXAR DOCUMENTO DEPOIS DE PRONTO
router.get('/documents/:documentId/download', verifyToken, async (request, reply) => {
    const id = request.params.documentId
    const doc = new Doc()
    const status = await doc.getDoc(id)
    if (status.status === 'completed') {
        reply.download(`uploads/${id}.pdf`, (err) => {
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
router.post('/documents', verifyToken, storage.single('file'), async (request, reply) => {
    const id = request.file.filename.split('.')[0]
    const doc = new Doc()
    const result = doc.addDoc(id) ? reply.status(result.status).send({ message: result.message }) : reply.status(result.status).send({ message: result.message })
})

//ADICIONAR QUEM ASSINARÁ
router.use(express.json())
router.post('/documents/:documentId/signers', verifyToken, async (request, reply) => {
    const { name, email, authcode, order } = request.body
    const id = request.params.documentId
    const signer = new Signer()

    const result = await signer.addSigner(id, name, email, authcode, order)

    return reply.status(result.status).send({ message: result.message })
})

//ADICIONAR O CAMPO DA ASSINATURA
router.post('/documents/:documentId/signature-fields', verifyToken, async (request, reply) => {
    const { x, y, email } = request.body
    const id = request.params.documentId
    const signer = new Field()
    const result = signer.addField(id, email, x, y)
    return reply.status(result.status).send({ message: result.message })
})

//ADICIONAR A ASSINATURA
router.post('/documents/:documentId/sign', verifyToken, async (request, reply) => {
    const { authcode, name, email, } = request.body
    const id = request.params.documentId
    const signer = new Signer()
    const doc = new Doc()
    const result = await signer.complete(authcode)

    if (result.status === 200) {
        doc.complete(id, name, email)
        return reply.status(result.status).send({ message: result.message })
    } else {
        return reply.status(result.status).send({ message: result.message })
    }
})

// DELETE METHODS ------------------------------------------------
router.delete('/documents/:documentId', verifyToken, async (request, reply) => {
    const id = request.params.documentId
    const doc = new Doc()
    const result = await doc.getDoc(id)
    console.log(result)
    if (result.status === 200) {
        const resultDoc = await doc.deleteDoc(id)
        result.status === 200 ? reply.status(resultDoc.status).send({ message: resultDoc.message })
            : reply.status(resultDoc.status).send({ message: resultDoc.message })
        console.log(resultDoc)
    } else {
        reply.status(result.status).send({ message: result.message })
    }
})


export { router }
