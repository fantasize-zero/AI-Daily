#!/bin/bash
# AI Daily Briefing Launcher
# Run this script to generate the daily AI briefing report
# Recommended crontab: 0 9 * * 1-5 /path/to/ai-daily-briefing.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPORT_DIR="$SCRIPT_DIR/reports"
mkdir -p "$REPORT_DIR"
/usr/bin/node "$SCRIPT_DIR/ai-daily-briefing.js" "$REPORT_DIR"
