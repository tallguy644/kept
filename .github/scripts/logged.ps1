# Runs a command; if it fails, publishes the end of its output as a GitHub annotation so it can be read through the API.
param([string]$title, [Parameter(ValueFromRemainingArguments = $true)][string[]]$cmd)
$log = Join-Path $env:RUNNER_TEMP "step-$PID.log"
& $cmd[0] $cmd[1..($cmd.Length - 1)] 2>&1 | Tee-Object -FilePath $log
if ($LASTEXITCODE -ne 0) {
  $lines = Get-Content $log
  $err = ($lines | Select-String -Pattern 'error|Error|warning: unused' | Select-Object -Last 40 | ForEach-Object { $_.Line }) -join "`n"
  $tail = ($lines | Select-Object -Last 40) -join "`n"
  $msg = ($err + "`n-----`n" + $tail) -replace '%', '%25' -replace "`r", '' -replace "`n", '%0A'
  if ($msg.Length -gt 60000) { $msg = $msg.Substring(0, 60000) }
  Write-Output "::error title=$title::$msg"
  exit 1
}
