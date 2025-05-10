import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({
    path: process.env.NODE_ENV === 'production' ? '.env' : '.env.development',
})

function getSSLValues() {
    if (process.env.POSTGRES_CA) {
        return {
            ca: process.env.POSTGRES_CA,
        }
    }

    return process.env.NODE_ENV === 'production' ? true : false;
};

console.log(process.env.DATABASE_URL);
export const sql = postgres(
    process.env.DATABASE_URL,
    {
        ssl: getSSLValues(),
    }
);

export class DB {
    async createDB() {
        try {

            await sql`
                CREATE TABLE IF NOT EXISTS db_metadata (
                    id SERIAL PRIMARY KEY,
                    initialized BOOLEAN NOT NULL DEFAULT FALSE
                );
            `;

            const result = await sql`SELECT initialized FROM db_metadata LIMIT 1`;

            if (result.length === 0 || !result[0].initialized) {
                await sql`
                    CREATE TABLE IF NOT EXISTS documents (
                        document_id VARCHAR(50) PRIMARY KEY,
                        status VARCHAR(20) NOT NULL CHECK (status IN ('in_progress', 'completed')) DEFAULT 'in_progress'
                    );
                `;

                await sql`
                    CREATE TABLE IF NOT EXISTS signers(
                        document_id VARCHAR(50) REFERENCES documents(document_id),
                        name VARCHAR(50) NOT NULL,
                        email VARCHAR(50) NOT NULL,
                        authcode VARCHAR(15) PRIMARY KEY,
                        order_id INT NOT NULL,
                        status VARCHAR(30) NOT NULL CHECK(status IN ('pending', 'signed')) DEFAULT 'pending'
                    );
                `;

                await sql`
                    CREATE TABLE IF NOT EXISTS signField(
                        document_id VARCHAR(50) REFERENCES documents(document_id) PRIMARY KEY,
                        signerEmail VARCHAR(50),
                        page INT NOT NULL default 1,
                        x INT NOT NULL,
                        y INT NOT NULL,
                        width FLOAT NOT NULL default 120,
                        height FLOAT NOT NULL default 70
                    );
                `;

                await sql`INSERT INTO db_metadata (initialized) VALUES (TRUE)`;
                console.log("Banco de dados configurado!");
            } else {
                console.log("Banco de dados já inicializado. Nenhuma ação necessária.");
            }
        } catch (err) {
            console.error("Erro ao criar banco de dados:", err);
        }
    }
}
