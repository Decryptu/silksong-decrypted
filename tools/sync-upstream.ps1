param([string]$Remote = 'upstream', [string]$Branch = 'main')
$ErrorActionPreference = 'Stop'
$repo = (git rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE) { throw 'Run from the project checkout.' }
$url = (git -C $repo remote get-url $Remote).Trim()
if ($LASTEXITCODE) { throw 'Upstream remote is missing.' }
$root = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$work = [IO.Path]::GetFullPath((Join-Path $root "silksong-sync-$([guid]::NewGuid())"))
$env:SILKSONG_METADATA_CHECKER = Join-Path $repo 'tools/check_public_metadata.py'
$callback = @"
import os
import runpy
prohibited = runpy.run_path(os.environ['SILKSONG_METADATA_CHECKER'])['prohibited']
lines = message.splitlines(keepends=True)
kept = [line for line in lines if not (
    line.lstrip().lower().startswith(b'co-authored-by:')
    and prohibited(line.decode('utf-8', 'replace'))
)]
return b''.join(kept).rstrip() + b'\n' if len(kept) != len(lines) else message
"@
try {
    git clone --bare --single-branch --branch $Branch --no-tags $url $work
    if ($LASTEXITCODE) { throw 'Upstream clone failed.' }
    Push-Location -LiteralPath $work
    try {
        python $env:SILKSONG_METADATA_CHECKER --history "refs/heads/$Branch"
        if ($LASTEXITCODE) {
            python -m git_filter_repo --force --quiet --message-callback $callback
            if ($LASTEXITCODE) { throw 'Upstream metadata rewrite failed.' }
            python $env:SILKSONG_METADATA_CHECKER --history "refs/heads/$Branch"
            if ($LASTEXITCODE) { throw 'Upstream history failed the publication check.' }
        }
    } finally {
        Pop-Location
    }
    $refspec = "+refs/heads/${Branch}:refs/clean/$Remote-$Branch"
    git -C $repo fetch --no-tags $work $refspec
    if ($LASTEXITCODE) { throw 'Import failed.' }
} finally {
    Remove-Item Env:SILKSONG_METADATA_CHECKER
    if ((Split-Path -Parent $work) -eq $root.TrimEnd('\') -and (Test-Path -LiteralPath $work)) {
        Remove-Item -LiteralPath $work -Recurse -Force
    }
}
