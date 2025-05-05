#!/usr/bin/env bash
# shellcheck disable=SC2148

git pull --rebase origin main
git pull --rebase yosit-origin main
git push yosit-origin main
