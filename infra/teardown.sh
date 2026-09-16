#!/usr/bin/env bash
# Retira todos los recursos creados por la aplicación en AWS.
#
# Uso: ./teardown.sh [--stack portal-equipo] [--region us-east-1]
set -euo pipefail

STACK_NAME="portal-equipo"
REGION="${AWS_REGION:-us-east-1}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stack) STACK_NAME="$2"; shift 2 ;;
    --region) REGION="$2"; shift 2 ;;
    *) echo "Parámetro desconocido: $1" >&2; exit 1 ;;
  esac
done

BUCKET="$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text 2>/dev/null || true)"

if [[ -n "$BUCKET" && "$BUCKET" != "None" ]]; then
  echo "==> Vaciando el bucket $BUCKET (CloudFormation no borra buckets con objetos)"
  aws s3 rm "s3://$BUCKET" --recursive --region "$REGION" || true
fi

echo "==> Eliminando la pila $STACK_NAME"
sam delete --stack-name "$STACK_NAME" --region "$REGION" --no-prompts

echo "Recursos retirados."
