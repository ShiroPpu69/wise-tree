param([string]$Workspace=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path)
$ErrorActionPreference='Stop'
$root=Join-Path $Workspace 'private/neural-voice'
$source=Join-Path $root 'qwen-cpp'
$revision=git -C $source rev-parse HEAD
if($revision -ne '16bb5afcd06311031c72a8488f8d59660dc2fb46'){throw 'Unexpected Qwen runtime source revision'}
if(-not (Select-String -LiteralPath (Join-Path $source 'build.ps1') -Pattern 'PortableClang' -Quiet)){
 git -C $source apply (Join-Path $PSScriptRoot 'portable-runtime.patch')
 if($LASTEXITCODE -ne 0){throw 'Runtime patch failed'}
}
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'windows-utf8.manifest') -Destination $source -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'windows-utf8.rc') -Destination $source -Force
$compiler=Join-Path $root 'toolchain/llvm-mingw-20261006-ucrt-x86_64'
$env:PATH="$compiler/bin;$root/research/wheels/extracted/cmake/data/bin;$root/research/wheels/extracted/ninja-1.13.0.data/scripts;$env:PATH"
& "$compiler/bin/x86_64-w64-mingw32-clang++.exe" -O2 -march=x86-64 -static (Join-Path $Workspace 'apps/desktop/voice-cpu.cpp') -o (Join-Path $root 'voice-cpu.exe')
if($LASTEXITCODE -ne 0){throw 'CPU detector build failed'}
& "$source/build.ps1" -PortableClang -UseNinja -BuildDir build-portable
if($LASTEXITCODE -ne 0){throw 'Generic CPU build failed'}
& "$source/build.ps1" -PortableClang -PortableAvx2 -UseNinja -BuildDir build-simd
if($LASTEXITCODE -ne 0){throw 'SIMD CPU build failed'}
foreach($dir in @('build-portable','build-simd')){
 foreach($name in @('libc++.dll','libunwind.dll')){Copy-Item -LiteralPath "$compiler/x86_64-w64-mingw32/bin/$name" -Destination "$source/$dir/" -Force}
}
