param(
    [string]$RepoRoot = (Split-Path -Parent $PSScriptRoot)
)

function Get-KaggleToken {
    param(
        [string[]]$EnvFiles
    )

    foreach ($envFile in $EnvFiles) {
        if (-not (Test-Path -LiteralPath $envFile)) {
            continue
        }

        foreach ($line in Get-Content -LiteralPath $envFile) {
            if ($line -match '^\s*(?:export\s+)?KAGGLE_API_TOKEN\s*=\s*(.+?)\s*$') {
                $token = $matches[1].Trim()
                if (
                    ($token.StartsWith('"') -and $token.EndsWith('"')) -or
                    ($token.StartsWith("'") -and $token.EndsWith("'"))
                ) {
                    $token = $token.Substring(1, $token.Length - 2)
                }
                if ($token) {
                    return $token
                }
            }
        }
    }

    throw "KAGGLE_API_TOKEN was not found in backend/.env or chatbot_service/.env."
}

$envFiles = @(
    (Join-Path $RepoRoot 'backend\.env'),
    (Join-Path $RepoRoot 'chatbot_service\.env')
)

$token = Get-KaggleToken -EnvFiles $envFiles
$kaggleDir = Join-Path $HOME '.kaggle'
$accessTokenPath = Join-Path $kaggleDir 'access_token'
$repoDatasetDir = Join-Path $RepoRoot 'backend\datasets\accidents\kaggle'

New-Item -ItemType Directory -Force -Path $kaggleDir | Out-Null
Set-Content -LiteralPath $accessTokenPath -Value $token -NoNewline
New-Item -ItemType Directory -Force -Path $repoDatasetDir | Out-Null

Write-Output "Configured Kaggle token file: $accessTokenPath"
Write-Output "Confirmed dataset folder: $repoDatasetDir"
Write-Output "Authentication is configured, but datasets still need an explicit download command."
