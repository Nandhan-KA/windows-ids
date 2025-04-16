import re
import socket
import time
import logging
from datetime import datetime, timedelta
from collections import defaultdict, Counter
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("attack_signatures")
class AttackSignature:
    def __init__(self, name, description, severity="medium"):
        self.name = name
        self.description = description
        self.severity = severity  
        self.alerts = []
    def check(self, connection):
        raise NotImplementedError("Subclasses must implement this method")
    def add_alert(self, connection, details):
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
        cutoff_time = datetime.now() - timedelta(minutes=max_age_minutes)
        self.alerts = [alert for alert in self.alerts 
                      if datetime.fromisoformat(alert['timestamp']) > cutoff_time]
class PortScanSignature(AttackSignature):
    def __init__(self):
        super().__init__(
            "Port Scan Detected", 
            "Multiple connection attempts from same source to different ports",
            "high"
        )
        self.connection_history = defaultdict(list)
        self.last_cleanup = datetime.now()
    def check(self, connection):
        if (datetime.now() - self.last_cleanup).total_seconds() > 300:  
            self._cleanup_old_connections()
            self.last_cleanup = datetime.now()
        if 'remote_ip' in connection and connection['remote_ip']:
            source_ip = connection['remote_ip']
        else:
            return None
        if 'local_port' in connection:
            port = connection['local_port']
            timestamp = datetime.now()
            self.connection_history[source_ip].append({
                'port': port,
                'timestamp': timestamp
            })
            recent_connections = [c for c in self.connection_history[source_ip] 
                                 if (timestamp - c['timestamp']).total_seconds() < 60]
            unique_ports = set(c['port'] for c in recent_connections)
            if len(unique_ports) >= 10:  
                return self.add_alert(connection, 
                                    f"Source IP {source_ip} attempted connections to {len(unique_ports)} different ports in 60 seconds")
        return None
    def _cleanup_old_connections(self):
        cutoff_time = datetime.now() - timedelta(minutes=10)
        for ip in list(self.connection_history.keys()):
            self.connection_history[ip] = [c for c in self.connection_history[ip] 
                                          if c['timestamp'] > cutoff_time]
            if not self.connection_history[ip]:
                del self.connection_history[ip]
class BruteForceSignature(AttackSignature):
    def __init__(self):
        super().__init__(
            "Brute Force Attack", 
            "Multiple failed login attempts detected",
            "critical"
        )
        self.auth_failures = defaultdict(list)
        self.auth_ports = {22, 23, 3389, 5900, 21, 25, 110, 143, 443, 80}  
    def check(self, connection):
        if 'local_port' in connection and connection['local_port'] in self.auth_ports:
            if 'remote_ip' in connection and connection['remote_ip']:
                source_ip = connection['remote_ip']
                timestamp = datetime.now()
                self.auth_failures[source_ip].append(timestamp)
                cutoff_time = timestamp - timedelta(minutes=10)
                self.auth_failures[source_ip] = [t for t in self.auth_failures[source_ip] if t > cutoff_time]
                if len(self.auth_failures[source_ip]) >= 5:  
                    return self.add_alert(connection, 
                                        f"Source IP {source_ip} made {len(self.auth_failures[source_ip])} authentication attempts in 10 minutes")
        return None
class MaliciousPortSignature(AttackSignature):
    def __init__(self):
        super().__init__(
            "Malicious Port Connection", 
            "Connection to known malicious port detected",
            "high"
        )
        self.malicious_ports = {
            4444,    
            5555,    
            1337,    
            6666,    
            31337,   
            8080,    
            9090,    
            54321,   
            12345,   
            7777,    
        }
    def check(self, connection):
        if 'remote_port' in connection and connection['remote_port'] in self.malicious_ports:
            return self.add_alert(connection, 
                                f"Connection to known malicious port {connection['remote_port']}")
        elif ('local_port' in connection and connection['local_port'] in self.malicious_ports and
              connection.get('status') == 'LISTEN'):
            return self.add_alert(connection, 
                                f"Listening on known malicious port {connection['local_port']}")
        return None
class UnusualProtocolSignature(AttackSignature):
    def __init__(self):
        super().__init__(
            "Unusual Protocol Activity", 
            "Connection using unusual or unexpected protocol detected",
            "medium"
        )
        self.process_protocols = defaultdict(set)
        self.learning_mode = True
        self.learning_until = datetime.now() + timedelta(minutes=5)
    def check(self, connection):
        if 'process' in connection and 'protocol' in connection and connection['process']:
            process = connection['process']
            protocol = connection['protocol']
            if self.learning_mode:
                self.process_protocols[process].add(protocol)
                if datetime.now() > self.learning_until:
                    self.learning_mode = False
                    logger.info(f"Protocol learning complete. Learned {len(self.process_protocols)} process-protocol mappings")
                return None
            if process in self.process_protocols and protocol not in self.process_protocols[process]:
                return self.add_alert(connection, 
                                    f"Process {process} using unusual protocol {protocol}")
        return None
class DDoSSignature(AttackSignature):
    def __init__(self):
        super().__init__(
            "Potential DDoS Attack", 
            "High volume of connections from multiple sources to same destination",
            "critical"
        )
        self.connections_per_port = defaultdict(list)
        self.last_cleanup = datetime.now()
    def check(self, connection):
        if (datetime.now() - self.last_cleanup).total_seconds() > 60:  
            self._cleanup_old_data()
            self.last_cleanup = datetime.now()
        if 'local_port' in connection:
            local_port = connection['local_port']
            timestamp = datetime.now()
            if 'remote_ip' in connection and connection['remote_ip']:
                source_ip = connection['remote_ip']
                self.connections_per_port[local_port].append({
                    'ip': source_ip,
                    'timestamp': timestamp
                })
                recent_connections = [c for c in self.connections_per_port[local_port] 
                                     if (timestamp - c['timestamp']).total_seconds() < 60]
                unique_sources = len(set(c['ip'] for c in recent_connections))
                if len(recent_connections) > 100 and unique_sources > 5:
                    return self.add_alert(connection, 
                                        f"{len(recent_connections)} connections to port {local_port} from {unique_sources} unique sources in last 60 seconds")
        return None
    def _cleanup_old_data(self):
        cutoff_time = datetime.now() - timedelta(minutes=5)
        for port in list(self.connections_per_port.keys()):
            self.connections_per_port[port] = [c for c in self.connections_per_port[port] 
                                              if c['timestamp'] > cutoff_time]
            if not self.connections_per_port[port]:
                del self.connections_per_port[port]
class SuspiciousProcessNetworkActivity(AttackSignature):
    def __init__(self):
        super().__init__(
            "Suspicious Process Network Activity", 
            "Unusual process making network connections",
            "high"
        )
        self.suspicious_process_patterns = [
            r'cmd\.exe',                   
            r'powershell\.exe',            
            r'ncat\.exe',                  
            r'nc\.exe',                    
            r'psexec\.exe',                
            r'mimikatz\.exe',              
            r'\\temp\\.*\.exe',            
            r'\\windows\\temp\\.*\.exe',   
        ]
        self.patterns = [re.compile(pattern, re.IGNORECASE) for pattern in self.suspicious_process_patterns]
    def check(self, connection):
        if 'process' in connection and connection['process']:
            process = connection['process']
            for i, pattern in enumerate(self.patterns):
                if pattern.search(process):
                    return self.add_alert(connection, 
                                        f"Suspicious process {process} making network connection (matched pattern: {self.suspicious_process_patterns[i]})")
        return None
class ReverseShellSignature(AttackSignature):
    def __init__(self):
        super().__init__(
            "Potential Reverse Shell", 
            "Suspicious outbound connection that may indicate a reverse shell",
            "critical"
        )
        self.reverse_shell_ports = {4444, 1337, 1234, 5555, 6666, 7777, 8888, 9999}
    def check(self, connection):
        if ('remote_port' in connection and connection['remote_port'] in self.reverse_shell_ports and
            'status' in connection and connection['status'] in ('ESTABLISHED', 'SYN_SENT')):
            if 'process' in connection and connection['process']:
                suspicious_processes = ['cmd.exe', 'powershell.exe', 'bash.exe', 'sh.exe', 'python.exe']
                if any(proc.lower() in connection['process'].lower() for proc in suspicious_processes):
                    return self.add_alert(connection, 
                                        f"Potential reverse shell: {connection['process']} connected to remote port {connection['remote_port']}")
        return None
class AttackDetector:
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
        alerts = []
        for signature in self.signatures:
            alert = signature.check(connection)
            if alert:
                alerts.append(alert)
        self.connection_cache.append(connection)
        if len(self.connection_cache) > self.max_cache_size:
            self.connection_cache.pop(0)  
        return alerts
    def check_connections(self, connections):
        all_alerts = []
        for conn in connections:
            alerts = self.check_connection(conn)
            all_alerts.extend(alerts)
        return all_alerts
    def get_all_alerts(self):
        alerts = []
        for signature in self.signatures:
            alerts.extend(signature.alerts)
        alerts.sort(key=lambda x: x['timestamp'], reverse=True)
        return alerts
    def clear_old_alerts(self, max_age_minutes=60):
        for signature in self.signatures:
            signature.clear_old_alerts(max_age_minutes)
detector = AttackDetector()
def check_connection(connection):
    return detector.check_connection(connection)
def check_connections(connections):
    return detector.check_connections(connections)
def get_all_alerts():
    return detector.get_all_alerts()
def clear_old_alerts(max_age_minutes=60):
    detector.clear_old_alerts(max_age_minutes)
def get_signatures():
    signatures = []
    for signature in detector.signatures:
        signatures.append({
            "id": signature.__class__.__name__.lower(),
            "name": signature.name,
            "description": signature.description,
            "severity": signature.severity
        })
    return signatures
__all__ = ['AttackDetector', 'detector', 'check_connection', 
           'check_connections', 'get_all_alerts', 'clear_old_alerts', 'get_signatures'] 