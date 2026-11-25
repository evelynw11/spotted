#!/bin/bash
# Double-click this file in Finder to set up (first time only) and open Spotted.

cd "$(dirname "$0")" || exit 1

bold=$'\033[1m'; dim=$'\033[2m'; red=$'\033[31m'; green=$'\033[32m'; reset=$'\033[0m'
say()  { printf '%s\n' "$*"; }
step() { printf '\n%s▸ %s%s\n' "$bold" "$*" "$reset"; }
ok()   { printf '  %s✓%s %s\n' "$green" "$reset" "$*"; }
fail() {
  printf '\n  %s✗ %s%s\n' "$red" "$1" "$reset"
  shift
  for line in "$@"; do printf '    %s\n' "$line"; done
  printf '\nPress Return to close this window.'
  read -r _
  exit 1
}

PROFILE_FILE=".spotted-aws-profile"
REGION="${AWS_REGION:-us-east-1}"
PORT="${PORT:-4173}"

clear
say "${bold}Spotted${reset}  ${dim}Find second-hand clothes from a photo${reset}"

# --- 1. Check the tools Spotted needs -------------------------------------------------------
step "Checking your Mac"

[ "$(uname)" = "Darwin" ] || fail "Spotted only runs on macOS." "It uses Apple's Vision framework for image matching."
major=$(sw_vers -productVersion | cut -d. -f1)
[ "$major" -ge 14 ] 2>/dev/null || fail "Spotted needs macOS 14 (Sonoma) or later." "Update macOS in System Settings → General → Software Update."
ok "macOS $(sw_vers -productVersion)"

if ! xcode-select -p >/dev/null 2>&1; then
  xcode-select --install >/dev/null 2>&1
  fail "Apple Command Line Tools are not installed." \
       "An installer window should have opened. Finish it, then double-click Start Spotted again."
fi
ok "Apple Command Line Tools"

command -v node >/dev/null 2>&1 || fail "Node.js is not installed." \
  "Download the LTS installer from https://nodejs.org, run it, then double-click Start Spotted again."
node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>16||(a===16&&b>=9)?0:1)' \
  || fail "Node.js $(node -v) is too old. Spotted needs 16.9 or later." "Install the LTS version from https://nodejs.org."
ok "Node.js $(node -v)"

command -v python3 >/dev/null 2>&1 || fail "Python 3 is not installed." \
  "Download it from https://www.python.org/downloads/, run the installer, then try again."
ok "Python $(python3 -c 'import platform;print(platform.python_version())')"

command -v aws >/dev/null 2>&1 || fail "The AWS command line tool is not installed." \
  "Download the macOS installer from https://aws.amazon.com/cli/, run it, then try again."
ok "AWS CLI"

# --- 2. Is Spotted already open? -------------------------------------------------------------
if curl -s --max-time 2 "http://127.0.0.1:$PORT/" | grep -q "<title>Spotted"; then
  step "Spotted is already running"
  open "http://127.0.0.1:$PORT"
  say "  Opened it in your browser. You can close this window."
  exit 0
fi
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  for candidate in $(seq $((PORT + 1)) $((PORT + 20))); do
    lsof -nP -iTCP:"$candidate" -sTCP:LISTEN >/dev/null 2>&1 || { PORT=$candidate; break; }
  done
fi

# --- 3. Clothing dataset (first run only) ----------------------------------------------------
step "Clothing dataset"
if [ -f reference-data/catalog.json ] && [ -f reference-data/features-v3.archive ] && [ -x reference-data/reference-search ]; then
  ok "Ready ($(python3 -c "import json; print(format(len(json.load(open('reference-data/catalog.json'))), ','))") items)"
else
  say "  Spotted searches a free collection of about 3,000 real second-hand clothes"
  say "  (the Clothing Dataset for Second-Hand Fashion, CC BY 4.0)."
  say "  The first run downloads it once: about 2.3 GB, needing about 5 GB of free space."
  free_gb=$(df -g . | awk 'NR==2 {print $4}')
  [ "${free_gb:-0}" -ge 5 ] || fail "Only ${free_gb} GB free. Free up at least 5 GB and try again."
  printf '\n  Download and set it up now? [Y/n] '
  read -r answer
  case "$answer" in [nN]*) fail "Spotted can't search without the dataset." "Double-click Start Spotted again when you're ready.";; esac
  say ""
  python3 scripts/prepare-dataset.py || fail "Setting up the dataset did not finish." \
    "Check your internet connection and free disk space, then double-click Start Spotted again."
  ok "Dataset ready"
fi

# --- 4. AWS sign-in --------------------------------------------------------------------------
step "AWS sign-in"
profile="${AWS_PROFILE:-$(cat "$PROFILE_FILE" 2>/dev/null)}"
if [ -z "$profile" ]; then
  say "  Spotted uses Amazon Bedrock with your own AWS account to identify the garment in your photo."
  profiles=$(aws configure list-profiles 2>/dev/null)
  if [ -n "$profiles" ]; then
    say "  Profiles on this Mac: $(echo "$profiles" | paste -sd ' ' -)"
  fi
  printf '  AWS profile name to use [spotted]: '
  read -r profile
  profile="${profile:-spotted}"
  printf '%s\n' "$profile" > "$PROFILE_FILE"
fi

if aws sts get-caller-identity --profile "$profile" >/dev/null 2>&1; then
  ok "Signed in (profile \"$profile\")"
else
  say "  You need to sign in to AWS. A browser window will open; sign in there and come back."
  aws login --profile "$profile" --region "$REGION" \
    || fail "AWS sign-in did not finish." "Double-click Start Spotted to try again."
  aws sts get-caller-identity --profile "$profile" >/dev/null 2>&1 \
    || fail "Still not signed in to AWS with profile \"$profile\"." \
            "To use a different profile, delete the file $PROFILE_FILE in the Spotted folder and try again."
  ok "Signed in (profile \"$profile\")"
fi

# --- 5. Start Spotted ------------------------------------------------------------------------
step "Starting Spotted"
BEDROCK_VISION=1 AWS_PROFILE="$profile" AWS_REGION="$REGION" PORT="$PORT" node server.js &
server=$!
trap 'kill "$server" 2>/dev/null; exit 0' INT TERM HUP EXIT

for _ in $(seq 1 50); do
  curl -s --max-time 1 "http://127.0.0.1:$PORT/" >/dev/null && break
  kill -0 "$server" 2>/dev/null || fail "Spotted stopped while starting. See the message above."
  sleep 0.2
done

open "http://127.0.0.1:$PORT"
say ""
say "  ${green}Spotted is open in your browser:${reset} http://127.0.0.1:$PORT"
say "  ${dim}Keep this window open while you use Spotted. Close it (or press Control-C) to quit.${reset}"
wait "$server"
