import socket
import time
import threading
import psutil
from datetime import datetime
class NetworkMonitor:
    def __init__(self):
        self.connections = []
        self.is_monitoring = False
        self.monitor_thread = None
    def start_monitoring(self):
        if self.is_monitoring:
            return
        self.is_monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop)
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
    def stop_monitoring(self):
        self.is_monitoring = False
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=2)
    def _monitor_loop(self):
        while self.is_monitoring:
            try:
                self.update_connections()
                time.sleep(1)
            except Exception as e:
                print(f"Error in network monitor: {e}")
                time.sleep(5)
    def update_connections(self):
        connections = []
        try:
            net_connections = psutil.net_connections(kind='all')
            for conn in net_connections:
                if conn.laddr and (conn.raddr or conn.status == 'LISTEN'):
                    connection = {
                        'ip': conn.raddr.ip if conn.raddr else 'localhost',
                        'port': conn.raddr.port if conn.raddr else conn.laddr.port,
                        'protocol': 'TCP' if conn.type == socket.SOCK_STREAM else 'UDP',
                        'status': conn.status,
                        'pid': conn.pid,
                        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    }
                    connections.append(connection)
        except Exception as e:
            print(f"Error getting network connections: {e}")
        self.connections = connections
        return connections
    def get_connections(self):
        return self.connections
    def get_suspicious_connections(self):
        suspicious = []
        for conn in self.connections:
            if conn['port'] in [4444, 1337, 31337, 6666]:
                conn['reason'] = f"Suspicious port: {conn['port']}"
                suspicious.append(conn)
            if conn['status'] == 'SYN_SENT':
                conn['reason'] = "Outgoing connection attempt"
                suspicious.append(conn)
        return suspicious
monitor = NetworkMonitor()
def start():
    monitor.start_monitoring()
def stop():
    monitor.stop_monitoring()
def get_connections():
    return monitor.get_connections()
def get_suspicious_connections():
    return monitor.get_suspicious_connections()
class SystemNetworkMonitor:
    def __init__(self):
        self.monitor = NetworkMonitor()
        self.callbacks = []
        self.update_thread = None
        self.is_running = False
    def register_callback(self, callback):
        if callback not in self.callbacks:
            self.callbacks.append(callback)
        return True
    def unregister_callback(self, callback):
        if callback in self.callbacks:
            self.callbacks.remove(callback)
        return True
    def start_monitoring(self):
        if self.is_running:
            return True
        self.monitor.start_monitoring()
        self.is_running = True
        self.update_thread = threading.Thread(target=self._update_loop)
        self.update_thread.daemon = True
        self.update_thread.start()
        return True
    def stop_monitoring(self):
        self.is_running = False
        self.monitor.stop_monitoring()
        if self.update_thread and self.update_thread.is_alive():
            self.update_thread.join(timeout=2)
        return True
    def _update_loop(self):
        while self.is_running:
            try:
                connections = self.monitor.get_connections()
                for callback in self.callbacks:
                    try:
                        callback(connections)
                    except Exception as e:
                        print(f"Error in callback: {e}")
                time.sleep(1)
            except Exception as e:
                print(f"Error in update loop: {e}")
                time.sleep(5)
    def get_connections(self):
        return self.monitor.get_connections()
    def get_suspicious_connections(self):
        return self.monitor.get_suspicious_connections()
system_monitor = SystemNetworkMonitor()
__all__ = ['NetworkMonitor', 'SystemNetworkMonitor', 'monitor', 'system_monitor',
           'start', 'stop', 'get_connections', 'get_suspicious_connections'] 