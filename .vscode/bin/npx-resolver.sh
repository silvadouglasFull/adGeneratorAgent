#!/usr/bin/env bash
set -euo pipefail

run_npx() {
  local npx_path="$1"
  local node_bin
  node_bin="$(dirname "$npx_path")"

  export PATH="$node_bin:$PATH"
  shift
  exec "$npx_path" "$@"
}

if command -v npx >/dev/null 2>&1; then
  run_npx "$(command -v npx)" "$@"
fi

for candidate in "$HOME/.config/nvm/versions/node"/*/bin/npx "$HOME/.nvm/versions/node"/*/bin/npx; do
  if [[ -x "$candidate" ]]; then
    run_npx "$candidate" "$@"
  fi
done

echo "Erro: npx não encontrado no PATH nem em diretórios do NVM." >&2
echo "Dica: instale Node.js via NVM ou ajuste o script .vscode/bin/npx-resolver.sh." >&2
exit 1
