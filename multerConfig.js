import multer from 'multer';
import path from 'path';

export const config = {
    storage: multer.diskStorage({
    destination: (req, file, callback) =>{
        
        callback(null, path.resolve('uploads'))

    },
    filename: (req, file, callback)=>{
        const time = new Date().getTime()
        //const fileName = file.originalname.split(".")

        //callback(null, `${fileName}_${time}.pdf`)
        callback(null, `${time}.pdf`)
    },
}),
    fileFilter: (req, file, callback) =>{
        const filetypes = ["application/pdf"]
        if(filetypes.includes(file.mimetype)){
            callback(null, true)
        } else {
            callback(new Error('Tipo de aquivo inválido'))
        }
    }
}