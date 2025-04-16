import os
import time
import logging
import threading
from datetime import datetime
from collections import deque
import socket
import attack_signatures
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("attack_integration")
class AttackMonitor:
    def __init__(self):
        self.running = False
        self.monitor_thread = None
        self.alerts = deque(maxlen=1000)  
        self.check_interval = 1.0  
        self.history_minutes = 60  
        self.callbacks = []
        high_performance = os.getenv('ENABLE_HIGH_PERFORMANCE', 'true').lower() in ('true', '1', 'yes')
        if high_performance:
            self.check_interval = 0.5  
        logger.info(f"Attack monitor initialized with check interval: {self.check_interval}s")
    def start(self):
        if self.running:
            return False
        self.running = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop)
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
        logger.info("Attack monitoring started")
        return True
    def stop(self):
        if not self.running:
            return False
        self.running = False
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=3)
        logger.info("Attack monitoring stopped")
        return True
    def register_callback(self, callback):
        if callback not in self.callbacks:
            self.callbacks.append(callback)
        return True
    def unregister_callback(self, callback):
        if callback in self.callbacks:
            self.callbacks.remove(callback)
        return True
    def _monitor_loop(self):
        try:
            import multiprocessing_monitor
            logger.info("Using multiprocessing_monitor for connection data")
            use_multiprocessing = True
        except ImportError:
            logger.warning("multiprocessing_monitor not available, using fallback")
            import network_monitor
            use_multiprocessing = False
        last_cleanup = datetime.now()
        while self.running:
            try:
                if use_multiprocessing:
                    connections = multiprocessing_monitor.get_network_connections()
                else:
                    connections = network_monitor.get_connections()
                if connections:
                    new_alerts = attack_signatures.check_connections(connections)
                    if new_alerts:
                        for alert in new_alerts:
                            self.alerts.append(alert)
                        self._notify_callbacks(new_alerts)
                if (datetime.now() - last_cleanup).total_seconds() > 300:
                    attack_signatures.clear_old_alerts(self.history_minutes)
                    last_cleanup = datetime.now()
                time.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Error in attack monitor loop: {e}")
                time.sleep(5)  
    def _notify_callbacks(self, alerts):
        for callback in self.callbacks:
            try:
                callback(alerts)
            except Exception as e:
                logger.error(f"Error in callback: {e}")
    def get_alerts(self, limit=100, severity=None):
        all_alerts = attack_signatures.get_all_alerts()
        if severity:
            all_alerts = [alert for alert in all_alerts if alert['severity'] == severity]
        return all_alerts[:limit]
    def simulate_attack(self, attack_type, target_ip=None, duration=10):
        supported_attacks = ["portscan", "bruteforce", "ddos", "malicious_port"]
        if attack_type not in supported_attacks:
            return {"status": "error", "message": f"Unsupported attack type: {attack_type}"}
        if not target_ip:
            return {"status": "error", "message": "Target IP is required"}
        def execute_attack():
            logger.info(f"Executing {attack_type} attack against {target_ip}")
            try:
                from attack_simulator_integration import execute_attack as simulator_execute
                has_simulator = True
                logger.info(f"Using attack simulator integration module")
            except ImportError:
                has_simulator = False
                logger.warning(f"Attack simulator integration not available, falling back to basic implementation")
            start_time = time.time()
            if has_simulator:
                result = simulator_execute(attack_type, target_ip, duration)
                logger.info(f"Attack simulator execution result: {result}")
            else:
                while time.time() - start_time < duration:
                    if attack_type == "portscan":
                        for port in [21, 22, 23, 25, 80, 443, 445, 3389, 8080, 8443]:
                            try:
                                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                                s.settimeout(0.1)
                                s.connect((target_ip, port))
                                s.close()
                                logger.info(f"Port {port} on {target_ip} is open")
                            except:
                                pass
                    elif attack_type == "bruteforce":
                        try:
                            import requests
                            for _ in range(5):
                                try:
                                    requests.get(f"http://{target_ip}/admin", 
                                                auth=('admin', 'invalid_password'),
                                                timeout=1)
                                except:
                                    pass
                        except ImportError:
                            logger.warning("Requests module not available for bruteforce attack")
                    elif attack_type == "ddos":
                        try:
                            import requests
                            for _ in range(20):
                                try:
                                    requests.get(f"http://{target_ip}", timeout=0.5)
                                except:
                                    pass
                        except ImportError:
                            logger.warning("Requests module not available for DDoS attack")
                    elif attack_type == "malicious_port":
                        for port in [4444, 31337, 1337]:
                            try:
                                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                                s.settimeout(0.1)
                                s.connect((target_ip, port))
                                s.close()
                                logger.info(f"Malicious port {port} on {target_ip} is open")
                            except:
                                pass
                    time.sleep(0.2)
            logger.info(f"Completed {attack_type} attack against {target_ip}")
        attack_thread = threading.Thread(target=execute_attack)
        attack_thread.daemon = True
        attack_thread.start()
        return {
            "status": "success", 
            "message": f"Started {attack_type} attack against {target_ip} for {duration} seconds",
            "attack_type": attack_type,
            "target": target_ip,
            "duration": duration,
            "timestamp": datetime.now().isoformat()
        }
monitor = AttackMonitor()
def start():
    return monitor.start()
def stop():
    return monitor.stop()
def get_recent_alerts(limit=100, severity=None):
    return monitor.get_alerts(limit, severity)
def register_callback(callback):
    return monitor.register_callback(callback)
def unregister_callback(callback):
    return monitor.unregister_callback(callback)
def simulate_attack(attack_type, target_ip=None, duration=10):
    return monitor.simulate_attack(attack_type, target_ip, duration)
__all__ = ['AttackMonitor', 'monitor', 'start', 'stop', 'get_recent_alerts', 
           'register_callback', 'unregister_callback', 'simulate_attack'] 