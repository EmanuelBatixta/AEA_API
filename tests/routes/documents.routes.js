const { join } = require('path');
const { readFileSync } = require('fs');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config({
    path: process.env.NODE_ENV === 'production' ? '.env' : '.env.development',
});

async function uploadDocument() {
    const path = join(process.cwd(), 'tests', 'mocks', 'pdf_to_sign_in_tests.pdf');
    const file = readFileSync(path);

    const data = new FormData();

    const blob = new Blob([file], { type: 'application/pdf' });
    data.append('file', blob, 'pdf_to_sign_in_tests.pdf');

    const response = await axios.post(
        'http://localhost:3333/v1/documents',
        data,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
                Accept: 'application/json',
                'Authorization': `Bearer ${process.env.TOKEN}`,
            },
        }
    );
    return response;
}

async function addSigner(documentId, payload) {
    const response = await axios.post(
        `http://localhost:3333/v1/documents/${documentId}/signers`,
        payload,
        {
            headers: {
                Accept: 'application/json',
                'Authorization': `Bearer ${process.env.TOKEN}`,
            },
        }
    );

    return response;
}

async function getDocumentData(documentId) {
    const response = await axios.get(
        `http://localhost:3333/v1/documents/${documentId}`,
        {
            headers: {
                'Authorization': `Bearer ${process.env.TOKEN}`,
            },
        }
    );

    return response;
}

module.exports = {
    uploadDocument,
    addSigner,
    getDocumentData,
}
