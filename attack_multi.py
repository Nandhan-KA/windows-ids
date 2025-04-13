#!/usr/bin/env python3
import argparse
import random
import time
import requests
import logging
import json
import socket
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("Enhanced-Attack-Simulator")

def check_connection(target_ip, port):
    """Check if the target is reachable and if the port is open"""
    # Check if host is reachable
    try:
        socket.gethostbyname(target_ip)
        logger.info(f"Host {target_ip} is reachable")
    except socket.gaierror:
        logger.error(f"ERROR: Cannot resolve hostname {target_ip}")
        return False
    
    # Check if port is open
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)
        result = sock.connect_ex((target_ip, port))
        sock.close()
        
        if result == 0:
            logger.info(f"Port {port} is open on {target_ip}")
            # Try to access the server
            try:
                response = requests.get(f"http://{target_ip}:{port}/", timeout=3)
                logger.info(f"Server responded with status code: {response.status_code}")
                return True
            except requests.RequestException as e:
                logger.warning(f"Could not access web server: {e}")
                return False
        else:
            logger.error(f"ERROR: Port {port} is not open on {target_ip}")
            return False
    except Exception as e:
        logger.error(f"Connection test failed: {e}")
        return False

def simulate_attack(target_ip, port, attack_type, severity="medium", intensity=5):
    """Simulate an attack directly using the new API endpoint we just created"""
    
    # Map attack types
    attack_type_map = {
        "brute_force": "Brute Force",
        "brute": "Brute Force",
        "ddos": "DDoS", 
        "port_scan": "Port Scan",
        "portscan": "Port Scan",
        "malware": "Malware",
        "man_in_the_middle": "Man in the Middle",
        "mitm": "Man in the Middle",
        "trojan": "Trojan"
    }
    
    # Map severity values
    severity_map = {
        1: "low",
        2: "low",
        3: "medium",
        4: "medium",
        5: "high",
        6: "high",
        7: "high",
        8: "critical",
        9: "critical",
        10: "critical"
    }
    
    # If severity is provided as number, convert it
    if isinstance(severity, int):
        severity = severity_map.get(severity, "medium")
    
    # Use mapped attack type or the original if not in map
    actual_attack_type = attack_type_map.get(attack_type.lower(), attack_type)
    
    # Create attack event (exactly matches the structure in enhanced-attack-tester.tsx)
    attack_event = {
        "id": f"sim-{int(time.time() * 1000)}-{random.randint(1000, 9999)}",
        "timestamp": datetime.now().isoformat(),
        "type": "threat",
        "severity": severity,
        "source_ip": f"192.168.{random.randint(1, 254)}.{random.randint(1, 254)}",
        "target": "System",
        "title": f"{actual_attack_type} Attack Detected",
        "description": get_description_for_type(actual_attack_type),
        "threat_type": actual_attack_type,
        "status": "active"
    }
    
    logger.info(f"Simulating {actual_attack_type} attack with severity {severity}")
    
    # Try all possible API endpoints in priority order
    success = False
    
    # 1. Try new API endpoint
    try:
        logger.info(f"Sending attack to API endpoint: /api/debug/simulate-attack")
        response = requests.post(
            f"http://{target_ip}:{port}/api/debug/simulate-attack", 
            json=attack_event,
            timeout=5,
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        )
        
        if response.status_code == 200:
            logger.info(f"Successfully simulated {actual_attack_type} attack via new API")
            logger.debug(f"Response: {response.text}")
            return True
        else:
            logger.warning(f"API returned status code: {response.status_code}")
            logger.debug(f"Response: {response.text}")
            
    except Exception as e:
        logger.warning(f"Error using new API endpoint: {e}")
    
    # 2. Try attack-tester API
    try:
        logger.info(f"Trying fallback endpoint: /debug/attack-tester/api/simulate")
        response = requests.post(
            f"http://{target_ip}:{port}/debug/attack-tester/api/simulate", 
            json={"attack": attack_event, "simulateOnly": False},
            timeout=5,
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        )
        
        if response.status_code == 200:
            logger.info(f"Successfully simulated {actual_attack_type} attack via attack-tester API")
            return True
        else:
            logger.warning(f"Attack-tester API returned status code: {response.status_code}")
            
    except Exception as e:
        logger.warning(f"Error using attack-tester API: {e}")
    
    # 3. Final fallback - direct page visit
    try:
        logger.info("Using fallback method - direct page visit")
        response = requests.get(
            f"http://{target_ip}:{port}/debug/attack-tester", 
            timeout=5
        )
        
        if response.status_code == 200:
            logger.info(f"Successfully loaded attack-tester page, attack may be simulated")
            return True
        else:
            logger.warning(f"Failed to load attack-tester page: {response.status_code}")
            return False
        
    except Exception as e:
        logger.error(f"All attack simulation methods failed: {e}")
        return False

def get_description_for_type(attack_type):
    """Get attack description - exact match to the function in enhanced-attack-tester.tsx"""
    if attack_type == "Brute Force":
        return "Multiple failed login attempts detected from single source"
    elif attack_type == "Port Scan":
        return "Systematic scan of multiple ports detected"
    elif attack_type == "DDoS":
        return "Unusual traffic pattern consistent with distributed denial of service"
    elif attack_type == "Man in the Middle":
        return "Abnormal network routing detected, possible man-in-the-middle attack"
    elif attack_type == "Malware":
        return "Suspicious process behavior consistent with malware activity detected"
    elif attack_type == "Trojan":
        return "Suspicious outbound connection from trusted application detected"
    else:
        return "Suspicious activity detected"

def main():
    parser = argparse.ArgumentParser(description="Enhanced IDS Attack Simulator")
    parser.add_argument("--target", "-t", required=True, help="Target IP address")
    parser.add_argument("--port", "-p", type=int, default=3000, help="Target port (default: 3000)")
    parser.add_argument("--attack", "-a", default="all", 
                        choices=["brute_force", "ddos", "port_scan", "malware", "mitm", "trojan", "all"],
                        help="Attack type to simulate (default: all)")
    parser.add_argument("--severity", "-s", default="medium",
                        choices=["low", "medium", "high", "critical"],
                        help="Attack severity (default: medium)")
    parser.add_argument("--intensity", "-i", type=int, default=5,
                        help="Attack intensity level 1-10 (default: 5)")
    
    args = parser.parse_args()
    
    # Banner
    print("""
    ╔══════════════════════════════════════════════╗
    ║                                              ║
    ║         Windows IDS Attack Simulator         ║
    ║                                              ║
    ╚══════════════════════════════════════════════╝
    """)
    
    # Log connection info
    print(f"Target: {args.target}:{args.port}")
    print(f"Attack type: {args.attack}")
    print(f"Severity: {args.severity}")
    print("-" * 50)
    
    # Check connection first
    if not check_connection(args.target, args.port):
        print("ERROR: Cannot establish connection to the target.")
        print("Please check your network settings and ensure the server is running.")
        print("Hint: Try accessing http://{args.target}:{args.port}/ in your browser")
        return
    
    # Log start time
    start_time = datetime.now()
    print(f"Starting attack simulation at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    if args.attack.lower() == "all":
        attack_types = ["brute_force", "ddos", "port_scan", "malware", "mitm", "trojan"]
        
        for attack in attack_types:
            simulate_attack(args.target, args.port, attack, args.severity, args.intensity)
            time.sleep(2)  # Wait between attacks
    else:
        simulate_attack(args.target, args.port, args.attack, args.severity, args.intensity)
    
    # Log end time
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    print("-" * 50)
    print(f"Attack simulation completed at: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Total duration: {duration:.2f} seconds")

if __name__ == "__main__":
    main()