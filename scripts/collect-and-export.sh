#!/bin/bash
# Continuous collect-metrics with periodic exports

cd "$(dirname "$0")/.."

echo "============================================================"
echo "Continuous Collect & Export"
echo "============================================================"
echo "Started at: $(date)"
echo ""

RUN_COUNT=0
EXPORT_INTERVAL=1  # Export after every N runs

while true; do
  RUN_COUNT=$((RUN_COUNT + 1))
  echo ""
  echo "============================================================"
  echo "Run #$RUN_COUNT at $(date)"
  echo "============================================================"

  # Run collect-metrics
  npm run collect-metrics 2>&1 | tee -a "logs/collect-metrics-full-continuous.log"

  # Check if any shards were processed
  if grep -q "Fetched.*metrics records" "logs/collect-metrics-full-continuous.log" 2>/dev/null; then
    echo ""
    echo "------------------------------------------------------------"
    echo "Running export after run #$RUN_COUNT..."
    echo "------------------------------------------------------------"
    npm run export 2>&1 | tee -a "logs/export-full-continuous.log"
  fi

  # Check if all shards are done
  if grep -q "No pending or retry shards found" "logs/collect-metrics-full-continuous.log" 2>/dev/null; then
    echo ""
    echo "============================================================"
    echo "All shards completed! Final export..."
    echo "============================================================"
    npm run export
    echo ""
    echo "Completed at: $(date)"
    echo "Total runs: $RUN_COUNT"
    break
  fi

  # Short pause before next run
  echo ""
  echo "Pausing 2 seconds before next run..."
  sleep 2
done
