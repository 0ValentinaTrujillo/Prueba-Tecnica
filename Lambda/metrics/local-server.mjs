/**
 * Emulador local del Runtime Interface Emulator (RIE), solo para desarrollo.
 *
 * Expone el mismo contrato que la imagen oficial de AWS Lambda:
 *   POST /2015-03-31/functions/function/invocations
 * y responde con el objeto { statusCode, headers, body } que devuelve el handler,
 * igual que hacen el RIE y una Function URL con integración proxy.
 *
 * Sirve para levantar la Lambda sin Docker ni AWS SAM. El handler que se ejecuta
 * es exactamente el mismo `index.mjs` que se despliega en AWS: este fichero no
 * forma parte del artefacto de la Lambda (no se copia en el Dockerfile).
 *
 *   node --env-file=../../Backend/.env local-server.mjs
 */
import { createServer } from 'node:http';
import { handler } from './index.mjs';

const PORT = Number(process.env.LAMBDA_LOCAL_PORT ?? 9000);
const INVOKE_PATH = '/2015-03-31/functions/function/invocations';

if (!process.env.MONGODB_URI) {
  console.error(
    '[lambda-local] Falta MONGODB_URI. Arranca con:\n' +
      '  node --env-file=../../Backend/.env local-server.mjs'
  );
  process.exit(1);
}

const server = createServer(async (req, res) => {
  if (req.method !== 'POST' || !req.url.startsWith(INVOKE_PATH)) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Usa POST ${INVOKE_PATH}` }));
    return;
  }

  // El cuerpo es el evento de la invocación; este handler no lo utiliza,
  // pero se consume igualmente para no dejar el socket a medias.
  for await (const _chunk of req) void _chunk;

  try {
    const result = await handler();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (error) {
    // El RIE devuelve los errores no capturados con esta forma.
    console.error('[lambda-local] error:', error);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({ errorType: error.name, errorMessage: error.message, trace: [] })
    );
  }
});

server.listen(PORT, () => {
  console.log(`[lambda-local] RIE escuchando en http://localhost:${PORT}${INVOKE_PATH}`);
});
