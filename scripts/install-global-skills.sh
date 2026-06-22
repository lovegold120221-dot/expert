#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_dir="$repo_root/.agents/skills"
global_dir="${GLOBAL_SKILLS_DIR:-$HOME/.agents/skills}"
opencode_config="${OPENCODE_CONFIG_PATH:-$HOME/.config/opencode/opencode.json}"

if [ ! -d "$source_dir" ]; then
  echo "Missing skill source directory: $source_dir" >&2
  exit 1
fi

mkdir -p "$global_dir"

rsync -a --delete \
  --exclude 'node_modules/' \
  --exclude 'dist/' \
  --exclude '.git/' \
  --exclude '*.jpeg' \
  --exclude '*.jpg' \
  --exclude '*.png' \
  --exclude '*.mp3' \
  --exclude '*.mov' \
  --exclude '*.mp4' \
  --exclude '*.zip' \
  --exclude '*.node' \
  "$source_dir/" "$global_dir/"

if command -v node >/dev/null 2>&1; then
  mkdir -p "$(dirname "$opencode_config")"
  OPENCODE_CONFIG_PATH="$opencode_config" REPO_ROOT="$repo_root" node <<'NODE'
const fs = require("fs");
const path = process.env.OPENCODE_CONFIG_PATH;
const repoRoot = process.env.REPO_ROOT;
let config = {};

if (fs.existsSync(path)) {
  config = JSON.parse(fs.readFileSync(path, "utf8"));
}

config.$schema ??= "https://opencode.ai/config.json";
config.instructions ??= [];
for (const item of ["AGENTS.md", ".agents/AGENTS.md"]) {
  if (!config.instructions.includes(item)) config.instructions.push(item);
}

config.skills ??= {};
config.skills.paths ??= [];
for (const item of [`${repoRoot}/.agents/skills`, "~/.agents/skills"]) {
  if (!config.skills.paths.includes(item)) config.skills.paths.push(item);
}

config.provider ??= {};
config.provider.ollama ??= {};
config.provider.ollama.name ??= "Ollama";
config.provider.ollama.npm ??= "@ai-sdk/openai-compatible";
config.provider.ollama.options ??= {};
config.provider.ollama.options.baseURL ??= "http://127.0.0.1:11434/v1";
config.provider.ollama.models ??= {};
config.provider.ollama.models["eburon/alpha:latest"] ??= {
  name: "eburon/alpha:latest"
};
config.model = process.env.OPENCODE_KEEP_MODEL === "1"
  ? config.model
  : "ollama/eburon/alpha:latest";

fs.writeFileSync(path, JSON.stringify(config, null, 2) + "\n");
NODE
else
  echo "node is not installed; skipped OpenCode config merge." >&2
fi

echo "Installed skills to: $global_dir"
echo "OpenCode config: $opencode_config"
