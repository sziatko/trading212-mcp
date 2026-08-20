#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACK_DIR="$(mktemp -d)"
trap 'rm -rf "$PACK_DIR"' EXIT

cd "$ROOT_DIR"
npm run build

cp -r dist "$PACK_DIR/"
cp package.json package-lock.json manifest.json "$PACK_DIR/"

cd "$PACK_DIR"
npm ci --omit=dev

rm -f "$ROOT_DIR/trading212-mcp.mcpb"
mcpb pack "$PACK_DIR" "$ROOT_DIR/trading212-mcp.mcpb"

echo "Built $ROOT_DIR/trading212-mcp.mcpb"
