import { env } from '../config/env.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

const TIMEOUT_MS = 8000;

/**
 * Las métricas del dashboard las calcula siempre la función Lambda.
 * La API solo hace de pasarela para no exponer la Lambda al navegador.
 *
 * - En local la Lambda corre en un contenedor con el Runtime Interface Emulator:
 *   POST http://lambda-metrics:8080/2015-03-31/functions/function/invocations
 * - En AWS se usa la Function URL de la Lambda.
 *
 * Ambos casos responden JSON; el RIE (y API Gateway) devuelven el objeto
 * { statusCode, body } de la Lambda, con "body" serializado como cadena.
 */
async function invokeMetricsLambda() {
  if (!env.lambdaMetricsUrl) {
    throw new ApiError(
      503,
      'LAMBDA_METRICS_URL no está configurada: el dashboard necesita la función Lambda de métricas'
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(env.lambdaMetricsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'api', requestedAt: new Date().toISOString() }),
      signal: controller.signal,
    });
  } catch (error) {
    throw new ApiError(502, `No se pudo invocar la Lambda de métricas: ${error.message}`);
  } finally {
    clearTimeout(timer);
  }

  const raw = await response.text();
  let payload;
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    throw new ApiError(502, 'La Lambda de métricas devolvió una respuesta no válida');
  }

  // Respuesta estilo proxy: { statusCode, body: "<json>" }
  if (payload && typeof payload === 'object' && 'statusCode' in payload && 'body' in payload) {
    const body = typeof payload.body === 'string' ? JSON.parse(payload.body) : payload.body;
    if (payload.statusCode >= 400) {
      throw new ApiError(502, body?.error ?? 'La Lambda de métricas devolvió un error');
    }
    return body;
  }

  if (payload?.errorMessage) {
    throw new ApiError(502, `Error en la Lambda de métricas: ${payload.errorMessage}`);
  }

  return payload;
}

export const getMetrics = asyncHandler(async (_req, res) => {
  const metrics = await invokeMetricsLambda();
  res.json(metrics);
});
