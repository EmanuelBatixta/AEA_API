import { sql } from './db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config()


export class UsuarioToken {
    async novoToken(nome){
        const token = jwt.sign({nome}, process.env.JWT_SECRET)
        await sql`INSERT INTO tokens (id, nome, token) VALUES 
        (DEFAULT,${nome}, ${token})`
        console.log("Token Criado com sucesso!")
    }

    async removerToken(token){
        await sql`DELETE FROM tokens WHERE token = ${token}`
        console.log("Token deletado com sucesso!")
    }

    async autenticarToken(token){
        const user = await sql`SELECT * FROM tokens WHERE token = ${token}`

        if(user.length > 0) {
            user[0].token === token ? true : false
        } else {
            return false
        }
    }
}
