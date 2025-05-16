import axios from 'axios';
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { join } from 'node:path';
import { writeFileSync, readFileSync, unlinkSync } from 'node:fs';

const AWS_ACCESS_KEY_ID = String(process.env.AWS_ACCESS_KEY_ID);
const AWS_SECRET_ACCESS_KEY = String(process.env.AWS_SECRET_ACCESS_KEY);
const AWS_REGION = String(process.env.AWS_REGION);
const AWS_BUCKET_NAME = String(process.env.AWS_BUCKET_NAME);

class UploadAwsFile {
    makeClient() {
        const s3Client = new S3Client({
            region: AWS_REGION, //região selecionada na criação do bucket
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID, //chave de acesso
                secretAccessKey: AWS_SECRET_ACCESS_KEY, //chave de acesso secreta
            },
        });

        return s3Client;
    }

    /**
     * @param {string} key - nome do arquivo ou identificador único para o mesmo
     * @description Monta a URL do arquivo armazenado no S3
     */
    getFileLink(key) {
        return {
            doc: `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`,
            original: `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/original_${key}`,
        }
    }

    /**
     * @param {Express.Multer.File | Buffer} file
     * @param {string} key - nome do arquivo ou identificador único para o mesmo
     * @description Faz o upload do arquivo para o S3
     */
    async upload(file, key) {
        const client = this.makeClient();
        const body = Buffer.isBuffer(file) ? file : file.buffer;

        await client.send(
            new PutObjectCommand({
                Bucket: AWS_BUCKET_NAME,
                Key: key,
                Body: body,
            }),
        );

        return {
            filename: key,
            link: this.getFileLink(key),
        }
    }

    /**
     * @param {string} key - nome do arquivo ou identificador único para o mesmo
     */
    async read(key) {
        const link = this.getFileLink(key);
        console.log(link);

        const response = await axios.get(
            link,
            {
                headers: {
                    Accept: '*/*',
                },
                params: {
                    type: 'PrinterFriendlyVersion',
                },
                responseType: 'arraybuffer',
            }
        );
        const file = Buffer.from(response.data, 'binary');
        return file;
    }

    /**
     * @param {string} key - nome do arquivo ou identificador único para o mesmo
     */
    async remove(key) {
        const client = this.makeClient();
        await client.send(
            new DeleteObjectCommand({
                Bucket: AWS_BUCKET_NAME,
                Key: key,
            }),
        );
    }
}

class UploadLocalFile {
    /**
     * @param {string} filename - nome do arquivo
     */
    makePath(filename) {
        const path = join(process.cwd(), 'uploads', filename);
        return path;
    }

    /**
     * @param {string} filename - nome do arquivo
     */
    getLink(filename) {
        return {
            doc: `http://localhost:3333/documents/uploads/${filename}`,
            original: `http://localhost:3333/documents/uploads/original_${filename}`,
        }
    }

    /**
     * @param {Express.Multer.File | Buffer} file
     * @param {string} filename - nome do arquivo
     */
    async upload(file, filename) {
        const path = this.makePath(filename);

        if (Buffer.isBuffer(file)) {
            writeFileSync(path, file);
            return;
        }

        writeFileSync(path, file.buffer);
    }

    /**
     * @param {string} filename - nome do arquivo
     */
    read(filename) {
        const path = this.makePath(filename);
        const file = readFileSync(path);

        return file.buffer;
    }

    /**
     * @param {string} filename - nome do arquivo
     */
    remove(filename) {
        const path = this.makePath(filename);
        unlinkSync(path);
    }
}

export class UploadFile {
    constructor() {
        this.upload_aws_file = new UploadAwsFile();
        this.upload_local_file = new UploadLocalFile();
    }

    /**
     * @param {Express.Multer.File | Buffer} file
     * @param {string} filename - nome do arquivo ou identificador único para o mesmo
     */
    async upload(file, filename) {
        if (process.env.NODE_ENV === 'production') {
            await this.upload_aws_file.upload(file, filename);
            return;
        }

        await this.upload_local_file.upload(file, filename);
    }

    /**
     * @param {string} filename - nome do arquivo ou identificador único para o mesmo
     */
    async read(filename) {
        if (process.env.NODE_ENV === 'production') {
            const file = await this.upload_aws_file.read(filename);
            return file;
        }

        return this.upload_local_file.read(filename);
    }

    /**
     * @param {string} filename - nome do arquivo ou identificador único para o mesmo
     */
    getLink(filename) {
        if (process.env.NODE_ENV === 'production') {
            return this.upload_aws_file.getFileLink(filename);
        }

        return this.upload_local_file.getLink(filename);
    }

    /**
     * @param {string} filename - nome do arquivo ou identificador único para o mesmo
     */
    async remove(filename) {
        if (process.env.NODE_ENV === 'production') {
            const file = await this.upload_aws_file.remove(filename);
            return file;
        }

        return this.upload_local_file.remove(filename);
    }
}
