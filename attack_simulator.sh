#!/bin/bash

# Enhanced Windows IDS Attack Simulator (Bash version)

# Default values
TARGET="localhost"
PORT=3000
ATTACK="all"
SEVERITY="medium"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --target|-t)
      TARGET="$2"
      shift
      shift
      ;;
    --port|-p)
      PORT="$2"
      shift
      shift
      ;;
    --attack|-a)
      ATTACK="$2"
      shift
      shift
      ;;
    --severity|-s)
      SEVERITY="$2"
      shift
      shift
      ;;
    *)
      shift
      ;;
  esac
done

# Display banner
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║                                              ║"
echo "║         Windows IDS Attack Simulator         ║"
echo "║                                              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Target: $TARGET:$PORT"
echo "Attack: $ATTACK"
echo "Severity: $SEVERITY"
echo "--------------------------------------------------"

# Record start time
START_TIME=$(date +%s)

# Function to simulate an attack
simulate_attack() {
  local ATTACK_TYPE="$1"
  local FULL_TYPE=""
  
  echo "Simulating $ATTACK_TYPE attack..."
  
  # Map attack types
  case ${ATTACK_TYPE} in
    brute_force|brute) FULL_TYPE="Brute Force" ;;
    ddos) FULL_TYPE="DDoS" ;;
    port_scan|portscan) FULL_TYPE="Port Scan" ;;
    malware) FULL_TYPE="Malware" ;;
    mitm|man_in_the_middle) FULL_TYPE="Man in the Middle" ;;
    trojan) FULL_TYPE="Trojan" ;;
    *) FULL_TYPE="$ATTACK_TYPE" ;;
  esac
  
  # Get description for attack type
  local DESCRIPTION=""
  case ${FULL_TYPE} in
    "Brute Force") 
      DESCRIPTION="Multiple failed login attempts detected from single source" ;;
    "Port Scan") 
      DESCRIPTION="Systematic scan of multiple ports detected" ;;
    "DDoS") 
      DESCRIPTION="Unusual traffic pattern consistent with distributed denial of service" ;;
    "Man in the Middle") 
      DESCRIPTION="Abnormal network routing detected, possible man-in-the-middle attack" ;;
    "Malware") 
      DESCRIPTION="Suspicious process behavior consistent with malware activity detected" ;;
    "Trojan") 
      DESCRIPTION="Suspicious outbound connection from trusted application detected" ;;
    *) 
      DESCRIPTION="Suspicious activity detected" ;;
  esac
  
  # Generate random values
  local ID="$RANDOM$RANDOM"
  local IP3=$((1 + RANDOM % 254))
  local IP4=$((1 + RANDOM % 254))
  
  # Current timestamp in ISO format
  local TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
  
  # Create JSON payload
  local JSON=$(cat <<EOF
{
  "id": "sim-$(date +%s)-$ID",
  "timestamp": "$TIMESTAMP",
  "type": "threat",
  "severity": "$SEVERITY",
  "source_ip": "192.168.$IP3.$IP4",
  "target": "System",
  "title": "$FULL_TYPE Attack Detected",
  "description": "$DESCRIPTION",
  "threat_type": "$FULL_TYPE",
  "status": "active"
}
EOF
)
  
  # Send attack to API endpoint
  curl -s -X POST "http://$TARGET:$PORT/api/debug/simulate-attack" \
    -H "Content-Type: application/json" \
    -d "$JSON" > /dev/null
  
  echo "$FULL_TYPE attack simulation successful"
  echo ""
}

# Run all attacks or specific attack
if [[ "$ATTACK" == "all" ]]; then
  simulate_attack "brute_force"
  sleep 2
  simulate_attack "ddos"
  sleep 2
  simulate_attack "port_scan"
  sleep 2
  simulate_attack "malware"
  sleep 2
  simulate_attack "mitm"
  sleep 2
  simulate_attack "trojan"
else
  simulate_attack "$ATTACK"
fi

# Record end time and calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "--------------------------------------------------"
echo "Attack simulation completed"
echo "Total duration: $DURATION seconds" 