const dotenv = require('dotenv');

const { uploadDocument, addSigner } = require('./../../routes/documents.routes');

dotenv.config({
    path: process.env.NODE_ENV === 'production' ? '.env' : '.env.development',
});

test('POST to /v1/documents should return 200 and documentId', async () => {
    const response = await uploadDocument();
    const body = response.data;

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('message');
    expect(body.message).toHaveProperty('documentId');
    expect(body.message.documentId).toBeDefined();
    expect(body.message.status).toBe('uploaded');
});

test('POST to /v1/documents/:documentId/signers (to add signer) should return 200', async () => {
    const addDocumentResponse = await uploadDocument();
    const documentId = addDocumentResponse.data.message.documentId;
    const payload = {
        name: 'John Doe',
        email: 'john_doe@mail.com',
        order: 1,
    };

    const response = await addSigner(documentId, payload);

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('message');
});
