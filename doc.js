import fs from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import unlink from 'fs';

import { sql } from './db.js';
import { Field } from './field.js'
import { UploadFile } from './src/shared/upload.js';

export class Doc {
    constructor() {
        this.uploadFile = new UploadFile();
    }

    /**
     *
     * @param {string} docId
     * @param {Express.Multer.File} file
     */
    async addDoc(docId, file) {
        try {
            const filename = `${docId}.pdf`;
            await this.uploadFile.upload(file, `original_${filename}`);

            const doc = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
            const newDoc = await doc.save();
            await this.uploadFile.upload(Buffer.from(newDoc), filename);

            await sql`INSERT INTO documents (document_id, status) VALUES (${docId}, 'in_progress')`

            return {
                status: 200, message: {
                    "documentId": `${docId}`,
                    "status": "uploaded"
                }
            }
        } catch (err) {
            console.log(err);
            return { status: 400, message: "Não foi possivel adicionar o documento" }
        }

    }

    async complete(docId, name, email) {
        const now = new Date();
        const field = await new Field().getField(docId);
        const date = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

        const filename = `${docId}.pdf`;
        const buffer = await this.uploadFile.read(filename);
        const pdfDoc = await PDFDocument.load(buffer);
        const page = pdfDoc.getPages()[0];

        page.drawText(`Assinado digitalmente por:\n${name.toUpperCase()}\n${email}\nData: ${date}`, {
            x: field[0].x,
            y: field[0].y,
            size: 14,
        });

        // pdfDoc.getPermissions().set
        const modifiedPdfBytes = await pdfDoc.save();
        await this.uploadFile.upload(Buffer.from(modifiedPdfBytes), filename);

        await sql`UPDATE documents SET status = 'completed' WHERE document_id = ${docId}` ? true : false
    }

    async deleteDoc(docId) {
        try {
            await this.uploadFile.remove(`original_${docId}.pdf`);
            await this.uploadFile.remove(`${docId}.pdf`);

            await sql`DELETE FROM signField WHERE document_id = ${docId}`;
            await sql`DELETE FROM signers WHERE document_id = ${docId}`;
            await sql`DELETE FROM documents WHERE document_id = ${docId}`;

            return { status: 200, message: "Documento deletado com sucesso" };
        } catch (error) {
            return {
                status: 400,
                message: "Não foi possível deletar o documento: " + error.message
            };
        }
    }

    async getDoc(docId) {
        const doc = await sql`SELECT d.document_id AS doc_id, d.status AS d_status, email, s.status AS s_status FROM documents d JOIN signers s ON d.document_id = s.document_id WHERE d.document_id = ${docId}`
        const links = this.uploadFile.getLink(`${docId}.pdf`);

        if (doc.length) {
            const docFormated = {
                documentId: doc[0].doc_id,
                status: doc[0].d_status,
                signers: [{
                    email: doc[0].email,
                    status: doc[0].s_status
                }],
                links
            };

            return { status: 200, message: docFormated };
        } else {
            return { status: 400, message: "Documento nao encontrado" }
        }
    }
}
