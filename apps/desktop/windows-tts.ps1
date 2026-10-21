$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$request = [Console]::In.ReadToEnd() | ConvertFrom-Json
Add-Type -AssemblyName System.Speech
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $voices = @($speaker.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Name -like 'Microsoft *' } | ForEach-Object {
        @{ name=$_.VoiceInfo.Name; language=$_.VoiceInfo.Culture.Name; gender=$_.VoiceInfo.Gender.ToString(); local=$true }
    })
    if ($voices.Count -eq 0) { throw 'No installed Windows speech voices' }
    $prefix = if ($request.language -match '^en') { '^en' } else { '^zh' }
    $chosen = $voices | Where-Object { $_.language -match $prefix -and $_.gender -eq 'Male' } | Select-Object -First 1
    if (-not $chosen) { $chosen = $voices | Where-Object { $_.language -match $prefix } | Select-Object -First 1 }
    if (-not $chosen) { $chosen = $voices[0] }
    $speaker.SelectVoice($chosen.name)
    $speaker.Rate = [int]$request.rate
    if ($request.text.Length -gt 0) {
        $speaker.SetOutputToWaveFile($request.output)
        $escaped = [System.Security.SecurityElement]::Escape([string]$request.text)
        $ssml = '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="' + $chosen.language + '"><prosody pitch="low">' + $escaped + '</prosody></speak>'
        $speaker.SpeakSsml($ssml)
        $speaker.SetOutputToNull()
    }
    @{ voice=$chosen; voices=$voices } | ConvertTo-Json -Depth 4 -Compress | Write-Output
} finally { $speaker.Dispose() }
