$ErrorActionPreference = 'Stop'

Write-Host 'Building Phoenix Pro Windows installer...'
pnpm install --frozen-lockfile
pnpm exec tauri build --config src-tauri/tauri.windows.conf.json

$bundle = Join-Path $PSScriptRoot '..\src-tauri\target\release\bundle'
$out = Join-Path $PSScriptRoot '..\release-output'
New-Item -ItemType Directory -Force -Path $out | Out-Null

$setup = Get-ChildItem -Path (Join-Path $bundle 'nsis') -Filter '*-setup.exe' | Select-Object -First 1
if (-not $setup) { throw 'NSIS installer was not generated.' }
Copy-Item $setup.FullName (Join-Path $out 'Phoenix-Pro-Setup.exe') -Force

$msi = Get-ChildItem -Path (Join-Path $bundle 'msi') -Filter '*.msi' | Select-Object -First 1
if ($msi) { Copy-Item $msi.FullName (Join-Path $out 'Phoenix-Pro.msi') -Force }

Get-ChildItem $out -File | ForEach-Object {
  $hash = Get-FileHash $_.FullName -Algorithm SHA256
  "$($hash.Hash.ToLowerInvariant())  $($_.Name)" | Out-File (Join-Path $out "$($_.Name).sha256") -Encoding ascii
}

Write-Host "Artifacts written to $out"
Get-ChildItem $out -File | Select-Object Name, Length
