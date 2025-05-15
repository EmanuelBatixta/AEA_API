import axios from "axios";

async function checkApiStatus() {
    try {
        await axios.get('http://localhost:3333/v1/status');
        process.stdout.write('\n API conectada com sucesso!\n');
    } catch (error) {
        process.stdout.write('.');
        await new Promise(resolve => setTimeout(resolve, 1000));
        checkApiStatus();
    }
}

process.stdout.write('\x1b[1m Caso ainda não o tenho feito, execute o comando "npm run dev"!\x1b[0m');
process.stdout.write('\n\n\n Aguardando conexão com a API...');
(async () => {
    await checkApiStatus();
})();
