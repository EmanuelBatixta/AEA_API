import { exec } from 'node:child_process';

function checkPostgres() {
    exec('docker exec aea_api_database pg_isready --host localhost', handleReturn)

    function handleReturn(error, stdout) {
        if (stdout.search('accepting connections') === -1) {
            process.stdout.write('.');
            checkPostgres();
            return;
        }

        console.log('\nPostgres está pronto e aceitando conexões!');
    }
}

process.stdout.write('\n\n\n Aguardando conexão com o banco de dados...');
checkPostgres();
