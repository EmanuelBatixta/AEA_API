import fs from 'node:fs';
import {sql} from './db.js';
import { PDFDocument } from 'pdf-lib';

export class Doc{
    async addDoc(docId){
        const path = `uploads/${docId}.pdf`
        const data = fs.readFileSync(path)
        //await unlink(path)

        const doc = await PDFDocument.load(data, { ignoreEncryption: true });

        const newDoc = await doc.save();
        fs.writeFileSync(path, newDoc);

        await sql`INSERT INTO documents (document_id, status) VALUES (${docId}, 'in_progress')`
    }

    async complete(docId){
        await sql`UPDATE documents SET status = 'completed' WHERE document_id = ${docId}`
    }

    async deleteDoc(docId){
        await sql`DELETE FROM signField WHERE document_id = ${docId}`
        await sql`DELETE FROM signers WHERE document_id = ${docId}`
        await sql`DELETE FROM documents WHERE document_id = ${docId}`
    }

    async getDoc(docId){
        const doc = await sql`SELECT d.document_id AS doc_id, d.status AS d_status, email, s.status AS s_status FROM documents d JOIN signers s ON d.document_id = s.document_id WHERE d.document_id = ${docId}`
        const docFormated =  {
            documentId: doc[0].doc_id, 
            status: doc[0].d_status,
            signers: [{
                email: doc[0].email,
                status: doc[0].s_status
            }]
        };
        return docFormated
    }
}

