import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config()


export class UsuarioToken {
    async novoToken(keyword){
        const token = jwt.sign({keyword}, process.env.JWT_SECRET)
        console.log(token)
        console.log("Token Criado com sucesso!")
    }

    async autenticarToken(token){
        const user = process.env.TOKEN

        if(user.length > 0) {
            user[0].token === token ? true : false
        } else {
            return false
        }
    }
}

