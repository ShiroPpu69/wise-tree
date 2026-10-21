$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$target = [IO.Path]::GetFullPath((Join-Path $workspace 'private\installer-acceptance'))
if (-not $target.StartsWith($workspace + '\private\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Installer test target outside workspace' }
if (Test-Path -LiteralPath $target) { throw 'Refusing to reuse an existing installation test folder' }
$existing = @(Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -eq 'AI Tree of Wisdom' })
if ($existing.Count -gt 0) { throw 'Existing app installation detected; refusing to overwrite or uninstall it' }
$releaseVersion = (Get-Content -LiteralPath (Join-Path $workspace 'package.json') -Raw | ConvertFrom-Json).version
if ($releaseVersion -notmatch '^\d+\.\d+\.\d+$') { throw 'Invalid release version' }
$installer = Join-Path $workspace ('private\releases\AI Tree of Wisdom Setup ' + $releaseVersion + '.exe')
$reference = Join-Path $workspace 'private\releases\win-unpacked\resources\app.asar'
$arguments = @('/S', '--currentuser', '--no-desktop-shortcut', "/D=$target")
$first = Start-Process -FilePath $installer -ArgumentList $arguments -WindowStyle Hidden -Wait -PassThru
if ($first.ExitCode -ne 0) { throw "Installer failed: $($first.ExitCode)" }
$installedArchive = Join-Path $target 'resources\app.asar'
if ((Get-FileHash -LiteralPath $installedArchive).Hash -ne (Get-FileHash -LiteralPath $reference).Hash) { throw 'Installed ASAR differs from release' }
$second = Start-Process -FilePath $installer -ArgumentList $arguments -WindowStyle Hidden -Wait -PassThru
if ($second.ExitCode -ne 0) { throw "Reinstall failed: $($second.ExitCode)" }
if ((Get-FileHash -LiteralPath $installedArchive).Hash -ne (Get-FileHash -LiteralPath $reference).Hash) { throw 'Reinstalled ASAR differs' }
$uninstaller = Join-Path $target 'Uninstall AI Tree of Wisdom.exe'
if (-not (Test-Path -LiteralPath $uninstaller)) { throw 'Expected uninstaller missing' }
$removed = Start-Process -FilePath $uninstaller -ArgumentList '/S' -WindowStyle Hidden -Wait -PassThru
if ($removed.ExitCode -ne 0) { throw "Uninstaller failed: $($removed.ExitCode)" }
$deadline = [DateTime]::UtcNow.AddSeconds(45)
while ((Test-Path -LiteralPath $installedArchive) -and [DateTime]::UtcNow -lt $deadline) { Start-Sleep -Milliseconds 200 }
if (Test-Path -LiteralPath $installedArchive) { throw 'Application files still present after uninstall' }
$report = @{time=[DateTime]::UtcNow.ToString('o');scope='Actual NSIS silent per-user installation and same-version reinstall in a new verified workspace folder, followed by uninstall. No real user installation overwritten; no application-data deletion flag used. Not cross-version migration acceptance.';installExit=$first.ExitCode;reinstallExit=$second.ExitCode;uninstallExit=$removed.ExitCode;installedArchiveMatched=$true;uninstalledArchiveRemoved=$true;target=$target}
$out = Join-Path $workspace 'private\reports\installer'
New-Item -ItemType Directory -Path $out -Force | Out-Null
$report | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $out 'result.json') -Encoding UTF8
$report | ConvertTo-Json -Compress
