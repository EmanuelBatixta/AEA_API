import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { request, response } from 'express';

dotenv.config({
    path: process.env.NODE_ENV === 'production' ? '.env' : '.env.development',
})


export class UsuarioToken {
    async novoToken(keyword) {
        const token = jwt.sign({ keyword }, process.env.JWT_SECRET)
        console.log(token)
        console.log("Token Criado com sucesso!")
    }

    async autenticarToken(token) {
        const user = process.env.TOKEN

        if (user.length > 0) {
            user[0].token === token ? true : false
        } else {
            return false
        }
    }

    verify(request, response, next) {
        const token = request.headers.authorization ? request.headers.authorization.split(' ')[1] : null

        if (this.autenticarToken(token)) {
            jwt.verify(token, process.env.JWT_SECRET, (err, decodes) => {
                if (err) return response.status(401).send({ message: "Token Invalido" })

                request.token = decodes.token;
                next()
            })
        } else {
            return response.status(401).send({ message: "Token Invalido" })
        }
    }
}

const usuario = new UsuarioToken();
export const verifyToken = usuario.verify.bind(usuario);
