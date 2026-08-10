#!/usr/bin/env bash
#
# Mirrors the canonical RenderStreaming receiver client into this repo.
#
#   UnityRenderStreaming/WebApp/client/public  ->  rs-portal/public/rs
#   UnityRenderStreaming/WebApp/client/src     ->  rs-portal/public/rs/module
#
# UnityRenderStreaming is the source of truth. Anything edited only under
# public/rs is overwritten here, so fixes belong upstream first - that is how the
# portal's mobile layout sat unmirrored in main.css from March to August 2026.
#
# Usage:
#   ./scripts/sync-renderstreaming-client.sh [--check] [path-to-UnityRenderStreaming]
#
#   --check   Report drift and exit 1 without writing anything. Suitable for CI.
#
# The source repo is found in this order: the positional argument, then
# $UNITY_RENDER_STREAMING_DIR, then ../UnityRenderStreaming beside this repo.

set -euo pipefail

CHECK=0
SOURCE_REPO=""

while [ $# -gt 0 ]; do
    case "$1" in
        --check)
            CHECK=1
            shift
            ;;
        -h|--help)
            sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
            exit 0
            ;;
        -*)
            echo "Unknown option: $1" >&2
            exit 2
            ;;
        *)
            SOURCE_REPO="$1"
            shift
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -z "$SOURCE_REPO" ]; then
    SOURCE_REPO="${UNITY_RENDER_STREAMING_DIR:-$REPO_ROOT/../UnityRenderStreaming}"
fi

CLIENT_DIR="$SOURCE_REPO/WebApp/client"
if [ ! -d "$CLIENT_DIR/public" ] || [ ! -d "$CLIENT_DIR/src" ]; then
    echo "Could not find WebApp/client/{public,src} under: $SOURCE_REPO" >&2
    echo "Pass the UnityRenderStreaming repo path, or set UNITY_RENDER_STREAMING_DIR." >&2
    exit 2
fi

DRIFT=0

report() {
    local state="$1" label="$2" rel="$3"
    if [ "$CHECK" -eq 1 ]; then
        printf '  %-8s %s/%s\n' "$state" "$label" "$rel"
    else
        printf '  %-8s %s/%s\n' "$state" "$label" "$rel"
    fi
}

# mirror <source-dir> <dest-dir> <label> [dest-subdir-to-ignore]
#
# The ignore argument exists because public/rs/module is itself a mirror of a
# different source tree; without it the public mirror would delete the whole
# module directory as an unknown extra.
mirror() {
    local src="$1" dest="$2" label="$3" ignore="${4:-}"
    local rel from to

    while IFS= read -r rel; do
        from="$src/$rel"
        to="$dest/$rel"

        if [ -f "$to" ]; then
            if cmp -s "$from" "$to"; then
                continue
            fi
            report "differs" "$label" "$rel"
        else
            report "missing" "$label" "$rel"
        fi

        if [ "$CHECK" -eq 0 ]; then
            mkdir -p "$(dirname "$to")"
            cp "$from" "$to"
        fi
        DRIFT=$((DRIFT + 1))
    done < <(cd "$src" && find . -type f | sed 's|^\./||' | sort)

    while IFS= read -r rel; do
        if [ -n "$ignore" ]; then
            case "$rel" in
                "$ignore"/*) continue ;;
            esac
        fi

        if [ -f "$src/$rel" ]; then
            continue
        fi

        report "extra" "$label" "$rel"
        if [ "$CHECK" -eq 0 ]; then
            rm "$dest/$rel"
        fi
        DRIFT=$((DRIFT + 1))
    done < <(cd "$dest" && find . -type f | sed 's|^\./||' | sort)
}

if [ "$CHECK" -eq 1 ]; then
    echo "Checking receiver client mirror against $SOURCE_REPO"
else
    echo "Syncing receiver client from $SOURCE_REPO"
fi

mkdir -p "$REPO_ROOT/public/rs/module"

mirror "$CLIENT_DIR/public" "$REPO_ROOT/public/rs" "public/rs" "module"
mirror "$CLIENT_DIR/src" "$REPO_ROOT/public/rs/module" "public/rs/module"

if [ "$DRIFT" -eq 0 ]; then
    echo "In sync - no files changed."
    exit 0
fi

if [ "$CHECK" -eq 1 ]; then
    echo "$DRIFT file(s) out of sync. Run without --check to mirror them."
    exit 1
fi

echo "$DRIFT file(s) updated. Review with 'git diff' before committing."
