#!/bin/bash
set -a
source "$(dirname "$0")/.env"
set +a
exec npx n8n-mcp
