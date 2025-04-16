#!/bin/bash

# Enhanced Windows IDS Attack Simulator (Bash version)

# Check if attack type is provided
if [ -z "$1" ]; then
    echo "Usage: $0 [attack_type]"
    echo
    echo "Available attack types:"
    echo "- brute_force or brute"
    echo "- ddos"
    echo "- port_scan or portscan"
    echo "- malware"
    echo "- mitm or man_in_the_middle"
    echo "- trojan"
    exit 1
fi

# Set default values
TARGET="localhost"
PORT=5000
SEVERITY="medium"
ATTACK="$1"

# Check if server is running
echo "Checking connection to $TARGET:$PORT..."
curl -s -m 5 "http://$TARGET:$PORT/api/health" > /dev/null

if [ $? -ne 0 ]; then
    echo "ERROR: Cannot connect to http://$TARGET:$PORT"
    echo "Possible reasons:"
    echo "- Server not running on target"
    echo "- Firewall blocking the connection"
    echo "- Incorrect IP or port"
    exit 1
fi
echo "Connection successful."
echo

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
  local ID=$(date +%s)
  local RANDOM_STRING=$(cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 6 | head -n 1)
  local RANDOM_NUM=$((RANDOM % 10000 + 1000))
  local IP3=$((1 + RANDOM % 254))
  local IP4=$((1 + RANDOM % 254))
  
  # Current timestamp in ISO format
  local TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
  
  # Create JSON payload
  local JSON=$(cat <<EOF
{
  "id": "sim-${ID}-${RANDOM_STRING}-${RANDOM_NUM}",
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

# Simulate the specified attack
simulate_attack "$ATTACK"

# Record end time and calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "--------------------------------------------------"
echo "Attack simulation completed"
echo "Total duration: $DURATION seconds" 