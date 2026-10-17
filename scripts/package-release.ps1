$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectRoot
try {
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Production build failed.' }
    & npm.cmd run release:check
    if ($LASTEXITCODE -ne 0) { throw 'Release validation failed.' }
    $releaseManifest = Get-Content -LiteralPath (Join-Path $projectRoot 'dist/manifest.json') -Raw | ConvertFrom-Json
    $releaseDirectory = Join-Path $projectRoot 'release'
    New-Item -ItemType Directory -Path $releaseDirectory -Force | Out-Null
    $releaseZip = Join-Path $releaseDirectory "multiroute-audio-$($releaseManifest.version).zip"
    if (Test-Path -LiteralPath $releaseZip) { throw "Package already exists: $releaseZip. Preserve it or choose a new version before rebuilding." }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory((Join-Path $projectRoot 'dist'), $releaseZip)
    $archive = [System.IO.Compression.ZipFile]::OpenRead($releaseZip)
    try {
        $archivePaths = @($archive.Entries | ForEach-Object { $_.FullName.Replace('\', '/') })
        if ($archivePaths -notcontains 'manifest.json') { throw 'Manifest must be at the ZIP root.' }
        if ($archivePaths -match '(?:^|/)(?:node_modules|\.git|\.claude|dev|tests|fixtures)/|\.map$') { throw 'Unexpected development files in ZIP.' }
    } finally { $archive.Dispose() }
    $releaseHash = (Get-FileHash -LiteralPath $releaseZip -Algorithm SHA256).Hash.ToLowerInvariant()
    Write-Output "Package: $releaseZip"
    Write-Output "SHA256: $releaseHash"
} finally { Pop-Location }
