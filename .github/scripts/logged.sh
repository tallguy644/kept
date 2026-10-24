#!/usr/bin/env bash
# Runs a command; if it fails, publishes the end of its output as a GitHub annotation so it can be read through the API.
title="$1"; shift
log="$RUNNER_TEMP/step-$$.log"
set -o pipefail
if ! "$@" 2>&1 | tee "$log"; then
  msg=$(grep -E "error|Error|ERROR|FAILED|What went wrong|PATCH FAILED|> " "$log" | tail -40; echo '-----'; tail -60 "$log")
  msg=$(printf '%s' "$msg" | sed -e 's/%/%25/g' -e 's/\r//g' | awk 'BEGIN{ORS="%0A"}{print}')
  echo "::error title=${title}::${msg:0:60000}"
  exit 1
fi
