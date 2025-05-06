import {sql} from './db.js';

export class Signer{
    async addSigner(docId, name, email, authcode, orderId){
        await sql`INSERT INTO signers (document_id, name, email, authcode, order_id) VALUES (${docId}, ${name}, ${email}, ${authcode}, ${orderId})`
    }

    async complete(authcode){
        const result = await sql`SELECT name, email FROM signers WHERE authcode = ${authcode}`;
        if (result.length === 0) {
            return false;
        } else{
            await sql`UPDATE signers SET status = 'signed' WHERE document_id = ${authcode}`;
            return true
        }
    }

    async getSigners(docId){
        const signers = await sql`SELECT * FROM signers WHERE document_id = ${docId}`
        return signers
    }
}
