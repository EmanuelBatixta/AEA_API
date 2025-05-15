const dotenv = require('dotenv');
const {
    uploadDocument,
    addSigner,
    getDocumentData,
    addSignPositionToDocument,
    signDocument,
    downloadDocument
} = require('./../../routes/documents.routes');

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

    expect(response.status).toBe(200);
    expect(body).toHaveProperty('message');
    expect(body.message).toHaveProperty('documentId');
    expect(body.message.documentId).toBeDefined();
    expect(body.message.status).toBeDefined();
    expect(body.message.signers).toBeDefined();
    expect(body.message.signers.length).toBeGreaterThanOrEqual(1);
});

test('GET /v1/documents/:documentId/download should return 200 and PDF file', async () => {
    const addDocumentResponse = await uploadDocument();
    const documentId = addDocumentResponse.data.message.documentId;
    const addSignerPayload = {
        name: 'John Doe',
        email: 'john_doe@mail.com',
        order: 1,
    };
    await addSigner(documentId, addSignerPayload);
    const addSignPositionToDocumentPayload = {
        x: 500,
        y: 500,
        email: addSignerPayload.email,
    };
    await addSignPositionToDocument(documentId, addSignPositionToDocumentPayload);
    const payload = {
        name: addSignerPayload.name,
        email: addSignerPayload.email,
    };
    await signDocument(documentId, payload);

    const response = await downloadDocument(documentId);

    expect(response.status).toBe(200);
    expect(Buffer.isBuffer(response.data)).toBe(true);
    expect(
        response.headers['content-type'] || response.headers['Content-Type']
    ).toBe('application/pdf');
});
