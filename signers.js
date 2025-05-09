import { sql } from './db.js';

export class Signer{
    async addSigner(docId, name, email, authcode, orderId){
        try {
            await sql`INSERT INTO signers (document_id, name, email, authcode, order_id) VALUES (${docId}, ${name}, ${email}, ${authcode}, ${orderId})`
            return { status: 200, message: "Signatários adicionados com sucesso."}
        } catch (err){
            return { status: 400, message: "Erro ao adicionar signatário.", error: err.message }
        }
    }

    async complete(authcode){
        try{
            const result = await sql`SELECT name, email FROM signers WHERE authcode = ${authcode}`;
            if (result.length === 0) {
                return { status: 400, message: "Código de autenticação inválido"};
            } else{
                await sql`UPDATE signers SET status = 'signed' WHERE document_id = ${authcode}`;
                return { status: 200, message: "Documento assinado."}
            }
        } catch(err){
            return { status: 400, message: 'Erro ao assinar o documento', error: err.message };        
        }
    }

    async getSigners(docId){
        try{
            const signers = await sql`SELECT * FROM signers WHERE document_id = ${docId}`
            if(signers.length === 0 ){
                return { status: 409, message: "Sem signatarios adicionados para esse documento" }
            } else {
                return { status: 200, message: signers }
            }

        }catch(err){
            return { status: 400, message: "Erro ao buscar os usuarios", error: err.message }
        }
    }
    
}
