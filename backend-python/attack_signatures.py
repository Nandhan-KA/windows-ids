"""
Attack Signatures Module
Provides detection capabilities for common attack patterns across all network traffic
"""

import re
import socket
import time
import logging
from datetime import datetime, timedelta
from collections import defaultdict, Counter

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("attack_signatures")

class AttackSignature:
    """Base class for all attack signatures"""
    def __init__(self, name, description, severity="medium"):
        self.name = name
        self.description = description
        self.severity = severity  # low, medium, high, critical
        self.alerts = []
        
    def check(self, connection):
        """Check if connection matches this signature"""
        raise NotImplementedError("Subclasses must implement this method")
        
    def add_alert(self, connection, details):
        """Add an alert for this signature"""
        alert = {
            'timestamp': datetime.now().isoformat(),
            'signature': self.name,
            'description': self.description,
            'severity': self.severity,
            'connection': connection,
            'details': details
        }
        self.alerts.append(alert)
        logger.warning(f"Attack detected: {self.name} - {details}")
        return alert
        
    def clear_old_alerts(self, max_age_minutes=60):
        """Clear alerts older than specified minutes"""
        cutoff_time = datetime.now() - timedelta(minutes=max_age_minutes)
        self.alerts = [alert for alert in self.alerts 
                      if datetime.fromisoformat(alert['timestamp']) > cutoff_time]

class PortScanSignature(AttackSignature):
    """Detects port scanning activity"""
    def __init__(self):
        super().__init__(
            "Port Scan Detected", 
            "Multiple connection attempts from same source to different ports",
            "high"
        )
        self.connection_history = defaultdict(list)
        self.last_cleanup = datetime.now()
        
    def check(self, connection):
        """Check for port scanning activity"""
        # Periodic cleanup of old connection history
        if (datetime.now() - self.last_cleanup).total_seconds() > 300:  # 5 minutes
            self._cleanup_old_connections()
            self.last_cleanup = datetime.now()
            
        # Extract source IP
        if 'remote_ip' in connection and connection['remote_ip']:
            source_ip = connection['remote_ip']
        else:
            return None
            
        # Log this connection attempt
        if 'local_port' in connection:
            port = connection['local_port']
            timestamp = datetime.now()
            
            # Add to connection history
            self.connection_history[source_ip].append({
                'port': port,
                'timestamp': timestamp
            })
            
            # Check for port scan signature (many different ports in short time)
            recent_connections = [c for c in self.connection_history[source_ip] 
                                 if (timestamp - c['timestamp']).total_seconds() < 60]
            
            # Get unique ports
            unique_ports = set(c['port'] for c in recent_connections)
            
            # Alert if many unique ports in short time
            if len(unique_ports) >= 10:  # Threshold for port scan alert
                return self.add_alert(connection, 
                                    f"Source IP {source_ip} attempted connections to {len(unique_ports)} different ports in 60 seconds")
        return None
        
    def _cleanup_old_connections(self):
        """Clean up old connection history"""
        cutoff_time = datetime.now() - timedelta(minutes=10)
        for ip in list(self.connection_history.keys()):
            self.connection_history[ip] = [c for c in self.connection_history[ip] 
                                          if c['timestamp'] > cutoff_time]
            # Remove empty entries
            if not self.connection_history[ip]:
                del self.connection_history[ip]

class BruteForceSignature(AttackSignature):
    """Detects brute force login attempts"""
    def __init__(self):
        super().__init__(
            "Brute Force Attack", 
            "Multiple failed login attempts detected",
            "critical"
        )
        self.auth_failures = defaultdict(list)
        self.auth_ports = {22, 23, 3389, 5900, 21, 25, 110, 143, 443, 80}  # Common auth ports
        
    def check(self, connection):
        """Check for brute force signature"""
        # Only check connections to authentication services
        if 'local_port' in connection and connection['local_port'] in self.auth_ports:
            if 'remote_ip' in connection and connection['remote_ip']:
                source_ip = connection['remote_ip']
                timestamp = datetime.now()
                
                # Add to authentication failure history
                self.auth_failures[source_ip].append(timestamp)
                
                # Keep only recent failures (last 10 minutes)
                cutoff_time = timestamp - timedelta(minutes=10)
                self.auth_failures[source_ip] = [t for t in self.auth_failures[source_ip] if t > cutoff_time]
                
                # Alert if too many failures
                if len(self.auth_failures[source_ip]) >= 5:  # Threshold for brute force
                    return self.add_alert(connection, 
                                        f"Source IP {source_ip} made {len(self.auth_failures[source_ip])} authentication attempts in 10 minutes")
        return None

class MaliciousPortSignature(AttackSignature):
    """Detects connections to known malicious ports"""
    def __init__(self):
        super().__init__(
            "Malicious Port Connection", 
            "Connection to known malicious port detected",
            "high"
        )
        # Commonly used malicious ports
        self.malicious_ports = {
            4444,    # Metasploit default
            5555,    # Android Debug Bridge
            1337,    # Back Orifice
            6666,    # IRC botnets
            31337,   # Back Orifice 2000
            8080,    # HTTP proxy (not malicious by itself, but commonly used in attacks)
            9090,    # Zeus botnet C&C
            54321,   # Backdoors
            12345,   # NetBus backdoor
            7777,    # Backdoor ports
        }
        
    def check(self, connection):
        """Check for connections to known malicious ports"""
        # Check remote port
        if 'remote_port' in connection and connection['remote_port'] in self.malicious_ports:
            return self.add_alert(connection, 
                                f"Connection to known malicious port {connection['remote_port']}")
        # Also check local port for listening services
        elif ('local_port' in connection and connection['local_port'] in self.malicious_ports and
              connection.get('status') == 'LISTEN'):
            return self.add_alert(connection, 
                                f"Listening on known malicious port {connection['local_port']}")
        return None

class UnusualProtocolSignature(AttackSignature):
    """Detects unusual protocol usage"""
    def __init__(self):
        super().__init__(
            "Unusual Protocol Activity", 
            "Connection using unusual or unexpected protocol detected",
            "medium"
        )
        # Track normal process-to-protocol mappings
        self.process_protocols = defaultdict(set)
        self.learning_mode = True
        self.learning_until = datetime.now() + timedelta(minutes=5)
        
    def check(self, connection):
        """Check for unusual protocol usage"""
        if 'process' in connection and 'protocol' in connection and connection['process']:
            process = connection['process']
            protocol = connection['protocol']
            
            # In learning mode, just gather data
            if self.learning_mode:
                self.process_protocols[process].add(protocol)
                
                # Check if learning period is over
                if datetime.now() > self.learning_until:
                    self.learning_mode = False
                    logger.info(f"Protocol learning complete. Learned {len(self.process_protocols)} process-protocol mappings")
                return None
                
            # In detection mode, check for unusual protocols
            if process in self.process_protocols and protocol not in self.process_protocols[process]:
                return self.add_alert(connection, 
                                    f"Process {process} using unusual protocol {protocol}")
        return None

class DDoSSignature(AttackSignature):
    """Detects potential DDoS attacks"""
    def __init__(self):
        super().__init__(
            "Potential DDoS Attack", 
            "High volume of connections from multiple sources to same destination",
            "critical"
        )
        self.connections_per_port = defaultdict(list)
        self.last_cleanup = datetime.now()
        
    def check(self, connection):
        """Check for DDoS signature"""
        # Periodic cleanup of old connection data
        if (datetime.now() - self.last_cleanup).total_seconds() > 60:  # 1 minute
            self._cleanup_old_data()
            self.last_cleanup = datetime.now()
            
        # Extract local port (target port)
        if 'local_port' in connection:
            local_port = connection['local_port']
            timestamp = datetime.now()
            
            # Add to connections per port with source IP
            if 'remote_ip' in connection and connection['remote_ip']:
                source_ip = connection['remote_ip']
                self.connections_per_port[local_port].append({
                    'ip': source_ip,
                    'timestamp': timestamp
                })
                
                # Check for DDoS signature
                recent_connections = [c for c in self.connections_per_port[local_port] 
                                     if (timestamp - c['timestamp']).total_seconds() < 60]
                
                # Count unique source IPs
                unique_sources = len(set(c['ip'] for c in recent_connections))
                
                # Alert if high connection rate from multiple sources
                if len(recent_connections) > 100 and unique_sources > 5:
                    return self.add_alert(connection, 
                                        f"{len(recent_connections)} connections to port {local_port} from {unique_sources} unique sources in last 60 seconds")
        return None
        
    def _cleanup_old_data(self):
        """Clean up old connection data"""
        cutoff_time = datetime.now() - timedelta(minutes=5)
        for port in list(self.connections_per_port.keys()):
            self.connections_per_port[port] = [c for c in self.connections_per_port[port] 
                                              if c['timestamp'] > cutoff_time]
            # Remove empty entries
            if not self.connections_per_port[port]:
                del self.connections_per_port[port]

class SuspiciousProcessNetworkActivity(AttackSignature):
    """Detects suspicious processes making network connections"""
    def __init__(self):
        super().__init__(
            "Suspicious Process Network Activity", 
            "Unusual process making network connections",
            "high"
        )
        # Suspicious process names or locations
        self.suspicious_process_patterns = [
            r'cmd\.exe',                   # Command prompt (suspicious in some contexts)
            r'powershell\.exe',            # PowerShell (suspicious in some contexts)
            r'ncat\.exe',                  # Netcat
            r'nc\.exe',                    # Netcat
            r'psexec\.exe',                # PsExec
            r'mimikatz\.exe',              # Mimikatz
            r'\\temp\\.*\.exe',            # Executables in temp
            r'\\windows\\temp\\.*\.exe',   # Executables in Windows temp
        ]
        self.patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.suspicious_process_patterns]
        
    def check(self, connection):
        """Check for suspicious process network activity"""
        if 'process' in connection and connection['process']:
            process = connection['process']
            
            # Check against suspicious patterns
            for i, pattern in enumerate(self.patterns):
                if pattern.search(process):
                    return self.add_alert(connection, 
                                        f"Suspicious process {process} making network connection (matched pattern: {self.suspicious_process_patterns[i]})")
        return None

class ReverseShellSignature(AttackSignature):
    """Detects potential reverse shell connections"""
    def __init__(self):
        super().__init__(
            "Potential Reverse Shell", 
            "Suspicious outbound connection that may indicate a reverse shell",
            "critical"
        )
        # Common reverse shell ports
        self.reverse_shell_ports = {4444, 1337, 1234, 5555, 6666, 7777, 8888, 9999}
        
    def check(self, connection):
        """Check for reverse shell signature"""
        # Look for outbound connections to suspicious ports
        if ('remote_port' in connection and connection['remote_port'] in self.reverse_shell_ports and
            'status' in connection and connection['status'] in ('ESTABLISHED', 'SYN_SENT')):
            
            # Check if process is suspicious
            if 'process' in connection and connection['process']:
                suspicious_processes = ['cmd.exe', 'powershell.exe', 'bash.exe', 'sh.exe', 'python.exe']
                if any(proc.lower() in connection['process'].lower() for proc in suspicious_processes):
                    return self.add_alert(connection, 
                                        f"Potential reverse shell: {connection['process']} connected to remote port {connection['remote_port']}")
        return None

class AttackDetector:
    """Main class for detecting attacks based on network connections"""
    def __init__(self):
        self.signatures = [
            PortScanSignature(),
            BruteForceSignature(),
            MaliciousPortSignature(),
            UnusualProtocolSignature(),
            DDoSSignature(),
            SuspiciousProcessNetworkActivity(),
            ReverseShellSignature()
        ]
        self.connection_cache = []
        self.max_cache_size = 10000
        logger.info(f"Attack detector initialized with {len(self.signatures)} signatures")
        
    def check_connection(self, connection):
        """Check a single connection against all signatures"""
        alerts = []
        for signature in self.signatures:
            alert = signature.check(connection)
            if alert:
                alerts.append(alert)
                
        # Add to connection cache
        self.connection_cache.append(connection)
        if len(self.connection_cache) > self.max_cache_size:
            self.connection_cache.pop(0)  # Remove oldest
            
        return alerts
        
    def check_connections(self, connections):
        """Check multiple connections against all signatures"""
        all_alerts = []
        for conn in connections:
            alerts = self.check_connection(conn)
            all_alerts.extend(alerts)
        return all_alerts
    
    def get_all_alerts(self):
        """Get all current alerts from all signatures"""
        alerts = []
        for signature in self.signatures:
            alerts.extend(signature.alerts)
        
        # Sort by timestamp (newest first)
        alerts.sort(key=lambda x: x['timestamp'], reverse=True)
        return alerts
        
    def clear_old_alerts(self, max_age_minutes=60):
        """Clear alerts older than specified minutes from all signatures"""
        for signature in self.signatures:
            signature.clear_old_alerts(max_age_minutes)

# Create a singleton instance
detector = AttackDetector()

# Convenience functions
def check_connection(connection):
    return detector.check_connection(connection)
    
def check_connections(connections):
    return detector.check_connections(connections)
    
def get_all_alerts():
    return detector.get_all_alerts()
    
def clear_old_alerts(max_age_minutes=60):
    detector.clear_old_alerts(max_age_minutes)

def get_signatures():
    """Get information about all available attack signatures"""
    signatures = []
    for signature in detector.signatures:
        signatures.append({
            "id": signature.__class__.__name__.lower(),
            "name": signature.name,
            "description": signature.description,
            "severity": signature.severity
        })
    return signatures

# Export for use in other modules
__all__ = ['AttackDetector', 'detector', 'check_connection', 
           'check_connections', 'get_all_alerts', 'clear_old_alerts', 'get_signatures'] 