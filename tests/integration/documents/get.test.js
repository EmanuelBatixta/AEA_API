const dotenv = require('dotenv');
const { uploadDocument, addSigner, getDocumentData } = require('./../../routes/documents.routes');

dotenv.config({
    path: process.env.NODE_ENV === 'production' ? '.env' : '.env.development',
});

test('GET /v1/documents/:documentId should return 200 and signers data', async () => {
    const addDocumentResponse = await uploadDocument();
    const documentId = addDocumentResponse.data.message.documentId;
    const payload = {
        name: 'John Doe',
        email: 'john_doe@mail.com',
        order: 1,
    };
    await addSigner(documentId, payload);

    const response = await getDocumentData(documentId);
    const body = response.data;

    console.log(response.data.message.signers);
    expect(response.status).toBe(200);
    expect(body).toHaveProperty('message');
    expect(body.message).toHaveProperty('documentId');
    expect(body.message.documentId).toBeDefined();
    expect(body.message.status).toBeDefined();
    expect(body.message.signers).toBeDefined();
    expect(body.message.signers.length).toBeGreaterThanOrEqual(1);
});
