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

# BACKUP_DIR sur un lecteur Google Drive non monté (application fermée) : on la lance et on attend le lecteur
$envFile = Join-Path $root '.env.local'
$backupDir = if (Test-Path $envFile) {
  (Get-Content $envFile -Encoding utf8 | Where-Object { $_ -match '^\s*BACKUP_DIR\s*=' } | Select-Object -Last 1) -replace '^\s*BACKUP_DIR\s*=\s*', '' -replace '^["'']|["'']$', ''
}
if ($backupDir -and [System.IO.Path]::IsPathRooted($backupDir)) {
  $drive = [System.IO.Path]::GetPathRoot($backupDir)
  if (-not (Test-Path $drive)) {
    $driveFs = Get-ChildItem 'C:\Program Files\Google\Drive File Stream' -Recurse -Filter GoogleDriveFS.exe -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($driveFs) {
      "[tâche] lecteur $drive absent : lancement de Google Drive" | Out-File $log -Append -Encoding utf8
      Start-Process $driveFs.FullName
      for ($i = 0; $i -lt 36 -and -not (Test-Path $drive); $i++) { Start-Sleep 5 }
    }
  }
}
$output = & node scripts/firestore-backup.mjs 2>&1
$code = $LASTEXITCODE
$output | ForEach-Object { "$_" } | Out-File $log -Append -Encoding utf8
"[tâche] code de sortie : $code" | Out-File $log -Append -Encoding utf8

# Journal limité aux 2 000 dernières lignes
$lines = Get-Content $log -Encoding utf8
if ($lines.Count -gt 2000) { $lines | Select-Object -Last 2000 | Set-Content $log -Encoding utf8 }
exit $code
