# Installe (ou met à jour) la tâche planifiée Windows « TheBox - Sauvegarde » : sauvegarde de la
# production chaque nuit à 3 h, rattrapée à l'ouverture de session si le PC était éteint.
#   powershell -ExecutionPolicy Bypass -File scripts/install-backup-task.ps1 [-Time 03:00]
#   Désinstaller : Unregister-ScheduledTask -TaskName 'TheBox - Sauvegarde' -Confirm:$false
param([string]$Time = '03:00')

$runner = Join-Path $PSScriptRoot 'backup-scheduled.ps1'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$runner`"" `
  -WorkingDirectory (Split-Path -Parent $PSScriptRoot)
$trigger = New-ScheduledTaskTrigger -Daily -At $Time
# StartWhenAvailable : heure manquée (PC éteint ou en veille) → lancée dès que possible
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 1) -RestartCount 2 -RestartInterval (New-TimeSpan -Minutes 30)
# Session de l'utilisateur (sans mot de passe enregistré) : la connexion Firebase CLI de ce compte sert à l'export Auth
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName 'TheBox - Sauvegarde' -Description 'Sauvegarde chiffrée de la base The Box (Firestore + comptes), avec rotation. Journal : backups/backup.log' `
  -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
Write-Host "Tâche 'TheBox - Sauvegarde' installée : chaque jour à $Time."
