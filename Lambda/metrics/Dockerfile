# Imagen base oficial de Lambda para Node.js 20.
# Incluye el Runtime Interface Emulator, así que el contenedor se invoca en local
# igual que en AWS: POST /2015-03-31/functions/function/invocations
FROM public.ecr.aws/lambda/nodejs:20

COPY package.json ${LAMBDA_TASK_ROOT}/
RUN npm install --omit=dev

COPY index.mjs ${LAMBDA_TASK_ROOT}/

CMD ["index.handler"]
