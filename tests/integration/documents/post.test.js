const { join } = require('path');
const { readFileSync } = require('fs');
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config({
    path: process.env.NODE_ENV === 'production' ? '.env' : '.env.development',
});

test('POST to /v1/documents should return 200 and documentId', async () => {
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
    const body = response.data;

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('message');
    expect(body.message).toHaveProperty('documentId');
    expect(body.message.documentId).toBeDefined();
    expect(body.message.status).toBe('uploaded');
});

test('POST to /v1/documents/:documentId/signers (to add signer) should return 200', async () => {
    const path = join(process.cwd(), 'tests', 'mocks', 'pdf_to_sign_in_tests.pdf');
    const file = readFileSync(path);
    const data = new FormData();
    const blob = new Blob([file], { type: 'application/pdf' });
    data.append('file', blob, 'pdf_to_sign_in_tests.pdf');
    const addDocumentResponse = await axios.post(
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
    const documentId = addDocumentResponse.data.message.documentId;
    const payload = {
        name: 'John Doe',
        email: 'john_doe@mail.com',
        order: 1,
    };

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

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('message');
});
