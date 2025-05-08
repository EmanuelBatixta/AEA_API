import fs from 'node:fs';
import { sql } from './db.js';
import { PDFDocument } from 'pdf-lib';
import unlink from 'fs';
import { Field } from './field.js'

export class Doc{
    async addDoc(docId){
        const path = `uploads/${docId}.pdf`
        const data = fs.readFileSync(path)
        //await unlink(path)

        const doc = await PDFDocument.load(data, { ignoreEncryption: true });

        const newDoc = await doc.save();
        fs.writeFileSync(path, newDoc);

        await sql`INSERT INTO documents (document_id, status) VALUES (${docId}, 'in_progress')` ? true : false
    }

    async complete(docId, name, email){
        const now = new Date();
        const field = await new Field().getField(docId)
        const date =  `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
        const pdfBytes = fs.readFileSync(`uploads/${docId}.pdf`);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const page = pdfDoc.getPages()[0];
    
        page.drawText(`Assinado digitalmente por:\n${name.toUpperCase()}\n${email}\nData: ${date}`, {
            x: field[0].x,
            y: field[0].y,
            size: 14,
        });
    
        const modifiedPdfBytes = await pdfDoc.save();

        fs.writeFileSync(`uploads/${docId}.pdf`, modifiedPdfBytes);
        await sql`UPDATE documents SET status = 'completed' WHERE document_id = ${docId}` ? true : false
    }

    async deleteDoc(docId){
        unlink.unlink(`uploads/${docId}.pdf`, async (err)=>{
            if (err){
                return false
            } else {
                await sql`DELETE FROM signField WHERE document_id = ${docId}`
                await sql`DELETE FROM signers WHERE document_id = ${docId}`
                await sql`DELETE FROM documents WHERE document_id = ${docId}`               
                return true
            }
        })      
    }

    async getDoc(docId){
        const doc = await sql`SELECT d.document_id AS doc_id, d.status AS d_status, email, s.status AS s_status FROM documents d JOIN signers s ON d.document_id = s.document_id WHERE d.document_id = ${docId}`
        if (doc.length) {
            const docFormated =  {
                documentId: doc[0].doc_id, 
                status: doc[0].d_status,
                signers: [{
                    email: doc[0].email,
                    status: doc[0].s_status
                }]
            };
            return docFormated

        } else {
            
            return false
        }
    }
}

const doc = new Doc()
doc.getDoc("001")