#!/usr/bin/env python3
import os
import sys
import time
import logging
import subprocess
import threading
import json
import requests
from datetime import datetime
from pathlib import Path
import re
import wmi
import argparse
import random
import uuid
import platform

# Configure logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    handlers=[
                        logging.FileHandler("usb_detector.log"),
                        logging.StreamHandler(sys.stdout)
                    ])
logger = logging.getLogger("IDS-USB-Detector")

class USBMonitor:
    def __init__(self, config=None):
        self.wmi = wmi.WMI()
        self.known_drives = self.get_current_drives()
        self.config = config or {
            "scan_on_insert": True,
            "alert_server": True,
            "server_url": "http://localhost:5000/api/debug/simulate-attack",
            "auto_open": False,
            "check_interval": 2,  # seconds
            "scan_extensions": [".exe", ".bat", ".ps1", ".vbs", ".js", ".dll", ".sys"],
            "max_scan_size_mb": 100,
            "test_mode": False,  # Test mode for simulating suspicious files
        }
        logger.info("USB Monitor initialized")
        logger.info(f"Known drives: {', '.join(self.known_drives)}")

    def get_current_drives(self):
        """Get all currently connected drives"""
        drives = []
        for drive in self.wmi.Win32_LogicalDisk():
            if drive.DriveType == 2:  # 2 = Removable drive
                drives.append(drive.DeviceID)
        return drives

    def detect_new_drives(self):
        """Detect any newly inserted drives"""
        current_drives = self.get_current_drives()
        new_drives = [d for d in current_drives if d not in self.known_drives]
        
        if new_drives:
            for drive in new_drives:
                logger.info(f"New USB drive detected: {drive}")
                self.handle_new_drive(drive)
            
        self.known_drives = current_drives
        return new_drives

    def handle_new_drive(self, drive_letter):
        """Handle a newly inserted drive"""
        drive_info = self.get_drive_info(drive_letter)
        logger.info(f"Drive info: {drive_info}")
        
        # Create an alert to send to the server
        alert_data = {
            "id": f"usb-{int(time.time())}-{drive_letter.replace(':', '')}",
            "timestamp": datetime.now().isoformat(),
            "type": "threat",
            "severity": "medium",
            "source_ip": "USB-Device",
            "target": "System",
            "title": f"USB Device Inserted: {drive_info['volume_name']}",
            "description": f"New USB drive detected: {drive_info['volume_name']} ({drive_info['size_gb']:.2f} GB)",
            "threat_type": "USB-Device",
            "status": "active",
            "details": drive_info
        }
        
        # Alert the server
        if self.config["alert_server"]:
            self.send_alert(alert_data)
        
        # Scan the drive if configured
        if self.config["scan_on_insert"]:
            scan_thread = threading.Thread(target=self.scan_drive, args=(drive_letter, alert_data))
            scan_thread.daemon = True
            scan_thread.start()
        
        # Auto-open the drive if configured
        if self.config["auto_open"]:
            self.open_drive(drive_letter)

    def get_drive_info(self, drive_letter):
        """Get information about a drive"""
        drive_info = {
            "drive_letter": drive_letter,
            "volume_name": "Unknown",
            "size_gb": 0,
            "filesystem": "Unknown",
            "serial_number": "Unknown"
        }
        
        try:
            for drive in self.wmi.Win32_LogicalDisk():
                if drive.DeviceID == drive_letter:
                    drive_info["volume_name"] = drive.VolumeName or "Unnamed Drive"
                    drive_info["size_gb"] = float(drive.Size) / (1024**3) if drive.Size else 0
                    drive_info["filesystem"] = drive.FileSystem or "Unknown"
                    drive_info["serial_number"] = drive.VolumeSerialNumber or "Unknown"
                    break
        except Exception as e:
            logger.error(f"Error getting drive info: {e}")
        
        return drive_info

    def scan_drive(self, drive_letter, alert_data):
        """Scan a drive for potentially malicious files"""
        logger.info(f"Scanning drive {drive_letter}...")
        
        suspicious_files = []
        total_files = 0
        
        try:
            # Get list of files to scan based on extension
            for root, dirs, files in os.walk(drive_letter + os.sep):
                for file in files:
                    total_files += 1
                    
                    # Check file extension
                    _, ext = os.path.splitext(file)
                    if ext.lower() in self.config["scan_extensions"]:
                        file_path = os.path.join(root, file)
                        
                        # Check file size
                        try:
                            size_mb = os.path.getsize(file_path) / (1024**2)
                            if size_mb <= self.config["max_scan_size_mb"]:
                                suspicious_files.append({
                                    "path": file_path,
                                    "name": file,
                                    "size_mb": size_mb,
                                    "extension": ext.lower()
                                })
                        except Exception as e:
                            logger.warning(f"Error checking file {file_path}: {e}")
            
            # In test mode, add some simulated suspicious files
            if self.config.get("test_mode", False):
                logger.info("Test mode enabled: Adding simulated suspicious files")
                suspicious_files.extend([
                    {
                        "path": f"{drive_letter}\\test\\malware.exe",
                        "name": "malware.exe",
                        "size_mb": 2.5,
                        "extension": ".exe"
                    },
                    {
                        "path": f"{drive_letter}\\hidden\\backdoor.ps1",
                        "name": "backdoor.ps1",
                        "size_mb": 0.1,
                        "extension": ".ps1"
                    },
                    {
                        "path": f"{drive_letter}\\System32\\modified-svchost.exe",
                        "name": "modified-svchost.exe",
                        "size_mb": 1.8,
                        "extension": ".exe"
                    }
                ])
            
            # Update the alert with scan results
            scan_alert = alert_data.copy()
            scan_alert["id"] = f"usb-scan-{int(time.time())}"
            scan_alert["title"] = f"USB Scan Complete: {drive_letter}"
            scan_alert["description"] = f"Scanned {total_files} files, found {len(suspicious_files)} potentially suspicious files"
            scan_alert["threat_type"] = "USB-Scan"
            scan_alert["scan_results"] = {
                "total_files": total_files,
                "suspicious_files": len(suspicious_files),
                "suspicious_file_list": suspicious_files[:20]  # Limit to first 20
            }
            
            # Send updated alert
            self.send_alert(scan_alert)
            
            logger.info(f"Scan complete. Found {len(suspicious_files)} suspicious files out of {total_files} total files")
            
        except Exception as e:
            logger.error(f"Error scanning drive {drive_letter}: {e}")

    def open_drive(self, drive_letter):
        """Open the drive in Explorer"""
        try:
            os.startfile(drive_letter)
            logger.info(f"Opened drive {drive_letter} in Explorer")
        except Exception as e:
            logger.error(f"Error opening drive {drive_letter}: {e}")

    def send_alert(self, alert_data):
        """Send an alert to the IDS server"""
        try:
            logger.info(f"Sending alert to {self.config['server_url']}")
            response = requests.post(
                self.config['server_url'],
                json=alert_data,
                headers={
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info(f"Alert sent successfully: {response.status_code}")
            else:
                logger.warning(f"Failed to send alert. Status code: {response.status_code}")
                logger.debug(f"Response: {response.text}")
                
        except Exception as e:
            logger.error(f"Error sending alert: {e}")

    def run(self):
        """Run the USB monitor loop"""
        logger.info("Starting USB monitor...")
        logger.info(f"Monitoring for new USB drives (checking every {self.config['check_interval']} seconds)")
        
        try:
            while True:
                self.detect_new_drives()
                time.sleep(self.config["check_interval"])
        except KeyboardInterrupt:
            logger.info("USB monitor stopped by user")
        except Exception as e:
            logger.error(f"Error in USB monitor: {e}")

    # Simulate a USB insertion (for testing when no actual USB drive is available)
    def simulate_usb_insertion(self, letter="F:", name="TEST USB", size_gb=8.0):
        """Simulate a USB drive insertion for testing"""
        logger.info(f"Simulating insertion of USB drive {letter}")
        
        # Create fake drive info
        drive_info = {
            "drive_letter": letter,
            "volume_name": name,
            "size_gb": size_gb,
            "filesystem": "FAT32",
            "serial_number": "ABCD1234"
        }
        
        # Create an alert to send to the server
        alert_data = {
            "id": f"usb-{int(time.time())}-{letter.replace(':', '')}",
            "timestamp": datetime.now().isoformat(),
            "type": "threat",
            "severity": "medium",
            "source_ip": "USB-Device",
            "target": "System",
            "title": f"USB Device Inserted: {drive_info['volume_name']}",
            "description": f"New USB drive detected: {drive_info['volume_name']} ({drive_info['size_gb']:.2f} GB)",
            "threat_type": "USB-Device",
            "status": "active",
            "details": drive_info
        }
        
        # Alert the server
        if self.config["alert_server"]:
            self.send_alert(alert_data)
        
        # Simulate scanning the drive
        if self.config["scan_on_insert"]:
            time.sleep(2)  # Simulate a delay for scanning
            self.scan_drive(letter, alert_data)

def log_message(message, level="INFO"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

def simulate_usb_insertion():
    device_id = f"USB_{uuid.uuid4().hex[:8].upper()}"
    vendor = random.choice(["Kingston", "SanDisk", "Toshiba", "Lexar", "WD", "Samsung"])
    model = f"{random.choice(['DataTraveler', 'Ultra', 'Flash', 'Jump', 'Expansion'])} {random.randint(1, 100)}"
    capacity = f"{random.choice([2, 4, 8, 16, 32, 64, 128, 256, 512])}GB"
    
    log_message(f"USB Device Detected: {device_id}")
    log_message(f"Vendor: {vendor}")
    log_message(f"Model: {model}")
    log_message(f"Capacity: {capacity}")
    
    return {
        "device_id": device_id,
        "vendor": vendor,
        "model": model,
        "capacity": capacity
    }

def simulate_scan(device_id):
    log_message(f"Starting scan of device {device_id}...")
    
    # Simulate scanning time
    total_files = random.randint(500, 15000)
    log_message(f"Found {total_files} files to scan")
    
    # Progress updates
    for progress in [10, 25, 50, 75, 90]:
        time.sleep(random.uniform(0.5, 1.5))
        log_message(f"Scan progress: {progress}% - Scanned {int(total_files * progress/100)} files")
    
    time.sleep(random.uniform(0.5, 1.5))
    
    # Generate suspicious files
    suspicious_count = random.randint(1, 5)
    suspicious_files = []
    
    for i in range(suspicious_count):
        file_type = random.choice(["executable", "script", "document", "archive"])
        if file_type == "executable":
            filename = random.choice([
                "netcat.exe", "mimikatz.exe", "PsExec.exe", "keylogger.exe", 
                "eicar_test.exe", "LaZagne.exe", "backdoor.exe", "powershell_payload.exe"
            ])
            path = f"/windows/system32/{filename}" if random.random() < 0.3 else f"/{filename}"
        elif file_type == "script":
            filename = random.choice([
                "privilege_escalation.ps1", "data_exfiltration.py", "persistence.bat",
                "reverse_shell.vbs", "enable_rdp.cmd", "disable_defender.ps1"
            ])
            path = f"/scripts/{filename}"
        elif file_type == "document":
            filename = random.choice([
                "invoice_macro.docm", "password_list.xlsx", "network_diagram.docx",
                "confidential.pdf", "credit_cards.csv", "employee_data.xlsx"
            ])
            path = f"/documents/{filename}"
        else:  # archive
            filename = random.choice([
                "tools.zip", "rootkit.rar", "hacking_tools.7z",
                "stolen_data.zip", "crypto_miner.tar.gz"
            ])
            path = f"/downloads/{filename}"
            
        detection = random.choice([
            "Trojan.Generic", "Exploit.PDF", "Backdoor.Win32", "Ransom.Wannacry",
            "Spyware.Keylogger", "HackTool.PassThief", "Malware.Cryptominer"
        ])
        
        risk = random.choice(["Critical", "High", "Medium", "Low"])
        hash_value = uuid.uuid4().hex.upper()
        
        suspicious_file = {
            "path": path,
            "filename": filename,
            "type": file_type,
            "hash": hash_value,
            "detection": detection,
            "risk": risk
        }
        suspicious_files.append(suspicious_file)
        
        log_message(f"Suspicious file detected: {path}/{filename}", "WARNING")
        log_message(f"Detection: {detection}, Risk: {risk}", "WARNING")
    
    log_message(f"Scan completed. Found {suspicious_count} suspicious files")
    
    scan_result = {
        "device_id": device_id,
        "total_files": total_files,
        "scan_time": random.uniform(2.5, 10.0),
        "suspicious_count": suspicious_count,
        "suspicious_files": suspicious_files
    }
    
    return scan_result

def send_alert_to_server(server_url, alert_type, alert_data):
    if not server_url.startswith("http://") and not server_url.startswith("https://"):
        server_url = f"http://{server_url}"
    
    endpoint = f"{server_url}/api/debug/simulate-attack"
    
    payload = {
        "type": alert_type,
        "severity": "Critical" if alert_type == "USB-Scan" and alert_data.get("suspicious_count", 0) > 0 else "Medium",
        "timestamp": datetime.now().isoformat(),
        "source": f"{platform.node()}",
        "data": alert_data
    }
    
    log_message(f"Sending {alert_type} alert to {endpoint}")
    
    try:
        response = requests.post(endpoint, json=payload)
        if response.status_code == 200:
            log_message(f"Alert sent successfully: {response.status_code}")
            return True
        else:
            log_message(f"Failed to send alert: {response.status_code} - {response.text}", "ERROR")
            return False
    except Exception as e:
        log_message(f"Error sending alert: {str(e)}", "ERROR")
        return False

def main():
    print("""
    ╔══════════════════════════════════════════════╗
    ║                                              ║
    ║         Windows IDS USB Monitor              ║
    ║                                              ║
    ╚══════════════════════════════════════════════╝
    """)
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Windows IDS USB Monitor")
    parser.add_argument("--test", action="store_true", help="Enable test mode")
    parser.add_argument("--simulate", action="store_true", help="Simulate a USB insertion")
    parser.add_argument("--server", default="localhost:3000", help="IDS server address (default: localhost:3000)")
    args = parser.parse_args()
    
    # Check if WMI is available
    try:
        import wmi
    except ImportError:
        print("ERROR: WMI module not installed. Please install it with:")
        print("pip install wmi")
        print("You may also need pywin32: pip install pywin32")
        return
    
    print("Starting USB Monitor service...")
    print("This service will detect new USB drives and scan them for potentially malicious files.")
    
    if args.test:
        print("TEST MODE ENABLED: Simulated suspicious files will be added to scan results")
    
    print("Press Ctrl+C to stop monitoring.")
    print("-" * 50)
    
    # Initialize the monitor with custom config
    config = {
        "scan_on_insert": True,
        "alert_server": True,
        "server_url": f"http://{args.server}/api/debug/simulate-attack",
        "auto_open": False,
        "check_interval": 2,
        "scan_extensions": [".exe", ".bat", ".ps1", ".vbs", ".js", ".dll", ".sys"],
        "max_scan_size_mb": 100,
        "test_mode": args.test
    }
    
    monitor = USBMonitor(config)
    
    # Simulate a USB insertion if requested
    if args.simulate:
        print("Simulating USB drive insertion...")
        monitor.simulate_usb_insertion(letter="F:", name="TEST USB", size_gb=8.0)
        print("Simulation complete. Press Ctrl+C to exit.")
    
    # Start the monitor loop
    monitor.run()

if __name__ == "__main__":
    main() 