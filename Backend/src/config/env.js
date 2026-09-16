import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const required = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required('MONGODB_URI', 'mongodb://localhost:27017/team_portal'),
  jwtSecret: required('JWT_SECRET', 'dev-secret-cambiar-en-produccion'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  // URL de invocación de la Lambda de métricas.
  // Local (RIE): http://lambda-metrics:8080/2015-03-31/functions/function/invocations
  // AWS (Function URL): https://xxxx.lambda-url.<region>.on.aws/
  lambdaMetricsUrl: process.env.LAMBDA_METRICS_URL ?? '',
  seedOnStart: process.env.SEED_ON_START === 'true',
  demoAdminPassword: process.env.DEMO_ADMIN_PASSWORD ?? 'Admin123!',
  demoUserPassword: process.env.DEMO_USER_PASSWORD ?? 'User123!',
};
