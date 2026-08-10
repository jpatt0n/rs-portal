<#
.SYNOPSIS
    Mirrors the canonical RenderStreaming receiver client into this repo.

.DESCRIPTION
    UnityRenderStreaming/WebApp/client/public  ->  rs-portal/public/rs
    UnityRenderStreaming/WebApp/client/src     ->  rs-portal/public/rs/module

    UnityRenderStreaming is the source of truth. Anything edited only under
    public/rs is overwritten here, so fixes belong upstream first - that is how
    the portal's mobile layout sat unmirrored in main.css from March to August
    2026.

.PARAMETER SourceRepo
    Path to the UnityRenderStreaming repo. Defaults to $env:UNITY_RENDER_STREAMING_DIR,
    then to ../UnityRenderStreaming beside this repo.

.PARAMETER Check
    Report drift and exit 1 without writing anything. Suitable for CI.

.EXAMPLE
    ./scripts/sync-renderstreaming-client.ps1

.EXAMPLE
    ./scripts/sync-renderstreaming-client.ps1 -Check
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string] $SourceRepo,

    [switch] $Check
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot

if (-not $SourceRepo) {
    $SourceRepo = if ($env:UNITY_RENDER_STREAMING_DIR) {
        $env:UNITY_RENDER_STREAMING_DIR
    } else {
        Join-Path (Split-Path -Parent $repoRoot) 'UnityRenderStreaming'
    }
}

$clientDir = Join-Path $SourceRepo 'WebApp/client'
if (-not (Test-Path (Join-Path $clientDir 'public')) -or -not (Test-Path (Join-Path $clientDir 'src'))) {
    Write-Error "Could not find WebApp/client/{public,src} under: $SourceRepo`nPass the UnityRenderStreaming repo path, or set UNITY_RENDER_STREAMING_DIR."
}

$script:drift = 0

function Get-RelativeFiles {
    param([string] $Root)

    if (-not (Test-Path $Root)) { return @() }

    $prefix = (Resolve-Path $Root).Path.TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
    Get-ChildItem -LiteralPath $Root -File -Recurse |
        ForEach-Object { $_.FullName.Substring($prefix.Length).Replace('\', '/') } |
        Sort-Object
}

function Test-SameFile {
    param([string] $A, [string] $B)

    $infoA = Get-Item -LiteralPath $A
    $infoB = Get-Item -LiteralPath $B
    if ($infoA.Length -ne $infoB.Length) { return $false }

    (Get-FileHash -LiteralPath $A -Algorithm SHA256).Hash -eq
    (Get-FileHash -LiteralPath $B -Algorithm SHA256).Hash
}

# The Ignore parameter exists because public/rs/module is itself a mirror of a
# different source tree; without it the public mirror would delete the whole
# module directory as an unknown extra.
function Sync-Tree {
    param(
        [string] $Source,
        [string] $Destination,
        [string] $Label,
        [string] $Ignore
    )

    foreach ($rel in @(Get-RelativeFiles $Source)) {
        $from = Join-Path $Source $rel
        $to = Join-Path $Destination $rel

        if (Test-Path -LiteralPath $to) {
            if (Test-SameFile $from $to) { continue }
            Write-Host ('  {0,-8} {1}/{2}' -f 'differs', $Label, $rel)
        } else {
            Write-Host ('  {0,-8} {1}/{2}' -f 'missing', $Label, $rel)
        }

        if (-not $Check) {
            $parent = Split-Path -Parent $to
            if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
            Copy-Item -LiteralPath $from -Destination $to -Force
        }
        $script:drift++
    }

    foreach ($rel in @(Get-RelativeFiles $Destination)) {
        if ($Ignore -and $rel.StartsWith("$Ignore/")) { continue }
        if (Test-Path -LiteralPath (Join-Path $Source $rel)) { continue }

        Write-Host ('  {0,-8} {1}/{2}' -f 'extra', $Label, $rel)
        if (-not $Check) {
            Remove-Item -LiteralPath (Join-Path $Destination $rel) -Force
        }
        $script:drift++
    }
}

if ($Check) {
    Write-Host "Checking receiver client mirror against $SourceRepo"
} else {
    Write-Host "Syncing receiver client from $SourceRepo"
}

$moduleDir = Join-Path $repoRoot 'public/rs/module'
if (-not (Test-Path $moduleDir)) { New-Item -ItemType Directory -Path $moduleDir -Force | Out-Null }

Sync-Tree -Source (Join-Path $clientDir 'public') -Destination (Join-Path $repoRoot 'public/rs') -Label 'public/rs' -Ignore 'module'
Sync-Tree -Source (Join-Path $clientDir 'src') -Destination $moduleDir -Label 'public/rs/module'

if ($script:drift -eq 0) {
    Write-Host 'In sync - no files changed.'
    exit 0
}

if ($Check) {
    Write-Host "$($script:drift) file(s) out of sync. Run without -Check to mirror them."
    exit 1
}

Write-Host "$($script:drift) file(s) updated. Review with 'git diff' before committing."
