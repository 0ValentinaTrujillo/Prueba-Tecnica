# Despliegue en AWS desde Windows (PowerShell). Equivalente a deploy.sh.
#
# Uso:
#   .\deploy.ps1 -Repo https://github.com/usuario/prueba-tecnica.git `
#                [-Branch main] [-Stack portal-equipo] [-Region us-east-1]
param(
  [Parameter(Mandatory = $true)][string]$Repo,
  [string]$Branch = 'main',
  [string]$Stack = 'portal-equipo',
  [string]$Region = 'us-east-1',
  [string]$JwtSecret = ''
)

$ErrorActionPreference = 'Stop'

if (-not $JwtSecret) {
  $bytes = New-Object byte[] 24
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $JwtSecret = ($bytes | ForEach-Object { $_.ToString('x2') }) -join ''
  Write-Host 'JWT_SECRET generado para este despliegue.'
}

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here

Write-Host '==> 1/4 sam build'
sam build --template-file "$here\template.yaml"

Write-Host '==> 2/4 sam deploy'
sam deploy --stack-name $Stack --region $Region --capabilities CAPABILITY_IAM `
  --resolve-s3 --no-confirm-changeset --no-fail-on-empty-changeset `
  --parameter-overrides "ProjectName=$Stack" "RepositoryUrl=$Repo" "RepositoryBranch=$Branch" "JwtSecret=$JwtSecret"

function Get-StackOutput([string]$Key) {
  aws cloudformation describe-stacks --stack-name $Stack --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='$Key'].OutputValue" --output text
}

$bucket = Get-StackOutput 'FrontendBucketName'
$distribution = Get-StackOutput 'DistributionId'

Write-Host '==> 3/4 build del frontend'
Set-Location "$root\Frontend"
npm install
$env:VITE_API_URL = '/api'
npm run build

Write-Host '==> 4/4 subida a S3 e invalidacion de CloudFront'
aws s3 sync dist/ "s3://$bucket/" --delete --region $Region
aws cloudfront create-invalidation --distribution-id $distribution --paths '/*' | Out-Null

Write-Host ''
Write-Host "Aplicacion : $(Get-StackOutput 'FrontendUrl')"
Write-Host "API        : $(Get-StackOutput 'ApiHealthUrl')"
Write-Host "Lambda URL : $(Get-StackOutput 'MetricsFunctionUrl')"
