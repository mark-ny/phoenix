$ErrorActionPreference = 'Stop'

Write-Host 'Building Phoenix Pro Windows installer...'
pnpm install --frozen-lockfile
pnpm exec tauri build --config src-tauri/tauri.windows.conf.json

$bundle = Join-Path $PSScriptRoot '..\src-tauri\target\release\bundle'
$out = Join-Path $PSScriptRoot '..\release-output'
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Force -Path $out | Out-Null

$setup = Get-ChildItem -Path (Join-Path $bundle 'nsis') -Filter '*-setup.exe' | Select-Object -First 1
if (-not $setup) { throw 'NSIS installer was not generated.' }
Copy-Item $setup.FullName (Join-Path $out 'Phoenix-Pro-Setup.exe') -Force

$msiDir = Join-Path $bundle 'msi'
if (Test-Path $msiDir) {
  $msi = Get-ChildItem -Path $msiDir -Filter '*.msi' | Select-Object -First 1
  if ($msi) { Copy-Item $msi.FullName (Join-Path $out 'Phoenix-Pro.msi') -Force }
} else {
  Write-Warning 'MSI was not generated; the NSIS installer is still available.'
}

Get-ChildItem $out -File | Where-Object { $_.Extension -in @('.exe', '.msi') } | ForEach-Object {
  $hash = Get-FileHash $_.FullName -Algorithm SHA256
  "$($hash.Hash.ToLowerInvariant())  $($_.Name)" | Out-File (Join-Path $out "$($_.Name).sha256") -Encoding ascii
}

Write-Host "Artifacts written to $out"
Get-ChildItem $out -File | Select-Object Name, Length
