$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$request = [Console]::In.ReadToEnd() | ConvertFrom-Json
Add-Type -AssemblyName System.Speech
$installed = @([System.Speech.Recognition.SpeechRecognitionEngine]::InstalledRecognizers())
$prefix = if ($request.language -match '^en') { '^en' } else { '^zh' }
$chosen = $installed | Where-Object { $_.Culture.Name -match $prefix } | Select-Object -First 1
if (-not $chosen) { throw 'Requested offline recognition language is not installed' }
$engine = [System.Speech.Recognition.SpeechRecognitionEngine]::new($chosen)
try {
    $engine.LoadGrammar([System.Speech.Recognition.DictationGrammar]::new())
    $engine.InitialSilenceTimeout = [TimeSpan]::FromSeconds(3)
    $engine.BabbleTimeout = [TimeSpan]::FromSeconds(15)
    $engine.EndSilenceTimeout = [TimeSpan]::FromMilliseconds(600)
    $engine.SetInputToWaveFile([string]$request.input)
    $parts = @()
    while ($true) {
        try { $result = $engine.Recognize() }
        catch {
            # SAPI releases its WAV input at EOF; a subsequent synchronous call may throw.
            if ($parts.Count -gt 0 -and $_.Exception.InnerException -is [System.InvalidOperationException] -and $engine.AudioState -eq [System.Speech.Recognition.AudioState]::Stopped) { break }
            throw
        }
        if ($null -eq $result) { break }
        if ($result.Text) { $parts += $result.Text }
    }
    @{text=($parts -join ' ');recognizer=@{id=$chosen.Id;language=$chosen.Culture.Name};local=$true} | ConvertTo-Json -Depth 4 -Compress | Write-Output
} finally { $engine.Dispose() }
