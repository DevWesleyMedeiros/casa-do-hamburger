import { app } from './app.js';
import { connection } from './db.js';
import { validateRuntimeEnvironment } from './config/runtimeEnvironment.js';

validateRuntimeEnvironment(process.env);

connection()
  .then(() => {
    app.listen(3000, () => {
      console.warn('Server is running on port 3000');
    });
  })
  .catch(() => {
    console.error('Falha ao iniciar servidor: banco indisponível');
    process.exitCode = 1;
  });
// index.ts — middlewares globais (rodam em TODA requisição)
// separa o app da porta para deixá-lo testável sem precisar de uma porta real ocupada, e sem risco de dois testes rodando em paralelo brigarem pela mesma porta.
