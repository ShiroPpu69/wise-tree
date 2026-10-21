param([switch]$Reinstall)
$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$version = (Get-Content -LiteralPath (Join-Path $workspace 'package.json') -Raw | ConvertFrom-Json).version
$installer = Join-Path $workspace ('private\releases\personal\智慧树 安装程序 '+$version+'.exe')
$out = Join-Path $workspace 'private\reports\installed-ui'
New-Item -ItemType Directory -Path $out -Force | Out-Null
# Do not silently interrupt an existing user application or replace its installation.
$existing = @(Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -match '^(智慧树|AI Tree of Wisdom|Tree of Wisdom)( |$)' })
if ($existing.Count -gt 0 -and ($existing.Count -ne 1 -or ($existing[0].DisplayVersion -notin @('0.1.3','0.1.4','0.1.5','0.1.6','0.1.7','0.1.8','0.1.9','0.1.10','0.1.11','0.1.12','0.1.13',$version)))) { throw 'Another app installation is present. Preserve its data and perform a deliberate upgrade.' }
$resumed = $existing.Count -eq 1
if ($resumed -and $existing[0].DisplayVersion -ne $version -and -not $Reinstall) { throw 'Use -Reinstall for this deliberate version upgrade' }
$installerExit = $null
if (-not $resumed -or $Reinstall) {
 if (@(Get-Process -Name '智慧树' -ErrorAction SilentlyContinue).Count -gt 0) { throw 'Close the running tree before installing; this script will not terminate user windows' }
 $installed = Start-Process -FilePath $installer -ArgumentList @('/S','--currentuser') -WindowStyle Hidden -Wait -PassThru
 $installerExit = $installed.ExitCode
 if ($installerExit -ne 0) { throw "Installer failed: $installerExit" }
}
$entry = @(Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -eq ('智慧树 '+$version) })
if ($entry.Count -ne 1) { throw 'Expected exactly one installed Tree of Wisdom entry' }
$installDir = if ($entry[0].InstallLocation) { $entry[0].InstallLocation } else { Split-Path -Parent $entry[0].DisplayIcon }
$exe = Join-Path $installDir '智慧树.exe'
if (-not (Test-Path -LiteralPath $exe)) { throw 'Installed executable missing' }
$reference = Join-Path $workspace 'private\releases\personal\win-unpacked\resources\app.asar'
if ((Get-FileHash -LiteralPath (Join-Path $installDir 'resources\app.asar')).Hash -ne (Get-FileHash -LiteralPath $reference).Hash) { throw 'Installed archive differs from tested build' }
$shell = New-Object -ComObject WScript.Shell
$shortcutFiles = @((Join-Path ([Environment]::GetFolderPath('DesktopDirectory')) '智慧树.lnk'),(Join-Path ([Environment]::GetFolderPath('Programs')) '智慧树.lnk'))
$shortcuts = foreach ($shortcut in $shortcutFiles) {
 if (-not (Test-Path -LiteralPath $shortcut)) { throw "Missing shortcut: $shortcut" }
 $link = $shell.CreateShortcut($shortcut)
 if ($link.TargetPath -ne $exe) { throw 'Shortcut does not point at the installed renamed executable' }
 if ($link.IconLocation -and $link.IconLocation -ne ($exe + ',0')) { throw 'Shortcut has an unexpected icon source' }
 @{path=$shortcut;target=$link.TargetPath;icon=$link.IconLocation}
}
Add-Type -AssemblyName System.Drawing
$icons = foreach ($item in @(@{name='executable';path=$exe},@{name='installer';path=$installer},@{name='uninstaller';path=(Join-Path $installDir 'Uninstall 智慧树.exe')})) {
 $icon = [Drawing.Icon]::ExtractAssociatedIcon($item.path)
 $bitmap = $icon.ToBitmap()
 $bitmap.Save((Join-Path $out ($item.name+'-icon.png')),[Drawing.Imaging.ImageFormat]::Png)
 $corner = $bitmap.GetPixel(0,0)
 if ($corner.A -ne 0) { throw 'Extracted icon must have transparent corners' }
 $result = @{kind=$item.name;width=$bitmap.Width;height=$bitmap.Height;transparentCorner=$true}
 $bitmap.Dispose();$icon.Dispose();$result
}
$info = [Diagnostics.FileVersionInfo]::GetVersionInfo($exe)
if ($info.ProductName -ne '智慧树') { throw 'PE product name was not replaced' }
$report = @{scope='Actual per-user NSIS installation, registry/desktop and Start Menu shortcuts, embedded EXE/installer/uninstaller icon extraction. Installation is retained for user trial; no user data deleted.';exitCode=$installerExit;resumedValidationAfterInstall=$resumed;installDir=$installDir;exe=$exe;productName=$info.ProductName;fileDescription=$info.FileDescription;shortcuts=$shortcuts;icons=$icons;archiveMatches=$true}
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $out 'installation.json') -Encoding UTF8
$report | ConvertTo-Json -Depth 5 -Compress
