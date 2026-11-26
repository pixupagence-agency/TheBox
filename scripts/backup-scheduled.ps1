# Lancé chaque nuit par la tâche planifiée « TheBox - Sauvegarde » (voir scripts/install-backup-task.ps1).
# Sauvegarde la production (avec rotation) et ajoute le compte rendu à backups/backup.log.
$ErrorActionPreference = 'Continue'
# Node écrit en UTF-8 : sans cela, les accents du compte rendu sont mal décodés
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$logDir = Join-Path $root 'backups'
New-Item -ItemType Directory -Force $logDir | Out-Null
$log = Join-Path $logDir 'backup.log'

"`n===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') =====" | Out-File $log -Append -Encoding utf8
$output = & node scripts/firestore-backup.mjs 2>&1
$code = $LASTEXITCODE
$output | ForEach-Object { "$_" } | Out-File $log -Append -Encoding utf8
"[tâche] code de sortie : $code" | Out-File $log -Append -Encoding utf8

# Journal limité aux 2 000 dernières lignes
$lines = Get-Content $log -Encoding utf8
if ($lines.Count -gt 2000) { $lines | Select-Object -Last 2000 | Set-Content $log -Encoding utf8 }
exit $code
