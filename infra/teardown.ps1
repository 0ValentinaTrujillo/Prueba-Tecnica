# Retirada de los recursos AWS desde Windows (PowerShell). Equivalente a teardown.sh.
#
# Uso: .\teardown.ps1 [-Stack portal-equipo] [-Region us-east-1]
param(
  [string]$Stack = 'portal-equipo',
  [string]$Region = 'us-east-1'
)

$ErrorActionPreference = 'Stop'

$bucket = aws cloudformation describe-stacks --stack-name $Stack --region $Region `
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text

if ($bucket -and $bucket -ne 'None') {
  Write-Host "==> Vaciando el bucket $bucket"
  aws s3 rm "s3://$bucket" --recursive --region $Region
}

Write-Host "==> Eliminando la pila $Stack"
sam delete --stack-name $Stack --region $Region --no-prompts

Write-Host 'Recursos retirados.'
