#!/usr/bin/env bash
# Despliegue completo en AWS: infraestructura (SAM/CloudFormation) + frontend (S3/CloudFront).
#
# Requisitos: AWS CLI v2 y AWS SAM CLI configurados con credenciales
#             (aws configure) y Node.js 20 para construir el frontend.
#
# Uso:
#   ./deploy.sh --repo https://github.com/usuario/prueba-tecnica.git \
#               [--branch main] [--stack portal-equipo] [--region us-east-1]
set -euo pipefail

STACK_NAME="portal-equipo"
REGION="${AWS_REGION:-us-east-1}"
BRANCH="main"
REPO=""
JWT_SECRET="${JWT_SECRET:-}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --stack) STACK_NAME="$2"; shift 2 ;;
    --region) REGION="$2"; shift 2 ;;
    *) echo "Parámetro desconocido: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$REPO" ]]; then
  echo "Falta --repo (URL del repositorio que clonará la instancia EC2)." >&2
  exit 1
fi

if [[ -z "$JWT_SECRET" ]]; then
  JWT_SECRET="$(openssl rand -hex 24)"
  echo "JWT_SECRET generado para este despliegue."
fi

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$HERE")"

echo "==> 1/4 sam build"
sam build --template-file "$HERE/template.yaml"

echo "==> 2/4 sam deploy"
sam deploy \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
    ProjectName="$STACK_NAME" \
    RepositoryUrl="$REPO" \
    RepositoryBranch="$BRANCH" \
    JwtSecret="$JWT_SECRET"

get_output() {
  aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

BUCKET="$(get_output FrontendBucketName)"
DISTRIBUTION="$(get_output DistributionId)"
FRONTEND_URL="$(get_output FrontendUrl)"

echo "==> 3/4 build del frontend"
cd "$ROOT/Frontend"
npm ci || npm install
VITE_API_URL=/api npm run build

echo "==> 4/4 subida a S3 e invalidación de CloudFront"
aws s3 sync dist/ "s3://$BUCKET/" --delete --region "$REGION"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION" --paths '/*' >/dev/null

echo
echo "Despliegue terminado."
echo "  Aplicación : $FRONTEND_URL"
echo "  API        : $(get_output ApiHealthUrl)"
echo "  Lambda URL : $(get_output MetricsFunctionUrl)"
echo
echo "La instancia EC2 tarda unos minutos en construir y arrancar la API."
