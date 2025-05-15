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

/**
 * @typedef {Object} SignPosition
 * @property {number} x
 * @property {number} y
 * @property {string} email
 *
 * @param {string} documentId
 * @param {SignPosition} payload
 */
async function addSignPositionToDocument(documentId, payload) {
    const response = await axios.post(
        `http://localhost:3333/v1/documents/${documentId}/signature-fields`,
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

/**
 * @typedef {Object} SignerPayload
 * @property {string} name
 * @property {string} email
 *
 * @param {string} documentId
 * @param {SignerPayload} payload
 */
async function signDocument(documentId, payload) {
    const response = await axios.post(
        `http://localhost:3333/v1/documents/${documentId}/sign`,
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

async function downloadDocument(documentId) {
    const response = await axios.get(
        `http://localhost:3333/v1/documents/${documentId}/download`,
        {
            headers: {
                'Authorization': `Bearer ${process.env.TOKEN}`,
                Accept: '*/*',
            },
            params: {
                type: 'PrinterFriendlyVersion',
            },
            responseType: 'arraybuffer',
        }
    );

    return response;
}

module.exports = {
    uploadDocument,
    addSigner,
    getDocumentData,
    addSignPositionToDocument,
    signDocument,
    downloadDocument,
}
