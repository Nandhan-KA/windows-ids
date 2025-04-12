"""
Multiprocessing Monitor Module
Provides efficient multiprocessing implementation for network monitoring and system metrics collection
"""

import os
import time
import json
import socket
import psutil
import threading
import multiprocessing
from datetime import datetime
from multiprocessing import Process, Queue

# Don't import these at the module level, as they can cause pickling issues
# Each process will import what it needs in its own process space

# Data collector processes
class MetricsCollector(Process):
    """Process for collecting system metrics efficiently"""
    
    def __init__(self, metrics_queue, collection_interval=1.0):
        super().__init__()
        self.metrics_queue = metrics_queue
        self.collection_interval = collection_interval
        self.running = multiprocessing.Value('b', True)
        self.daemon = True
        
    def stop(self):
        """Stop the collector process"""
        self.running.value = False
        self.join(timeout=3)
        
    def run(self):
        """Main process loop for collecting metrics"""
        print(f"[MetricsCollector] Starting metrics collection process (PID: {os.getpid()})")
        
        last_io_counters = None
        last_io_time = time.time()
        
        while self.running.value:
            try:
                # Get CPU usage (across all cores)
                cpu_percent = psutil.cpu_percent(interval=0.1)
                
                # Get memory usage
                memory = psutil.virtual_memory()
                memory_percent = memory.percent
                
                # Get disk I/O (calculate rate)
                disk_io = psutil.disk_io_counters()
                disk_io_percent = 0
                
                current_time = time.time()
                if last_io_counters and hasattr(disk_io, 'read_bytes') and hasattr(disk_io, 'write_bytes'):
                    # Calculate I/O rate based on previous measurement
                    time_diff = current_time - last_io_time
                    if time_diff > 0:
                        read_rate = (disk_io.read_bytes - last_io_counters.read_bytes) / time_diff
                        write_rate = (disk_io.write_bytes - last_io_counters.write_bytes) / time_diff
                        total_rate = read_rate + write_rate
                        # Convert to percentage of theoretical max (e.g., 100MB/s)
                        disk_io_percent = min(100, total_rate / (1024 * 1024 * 100) * 100)
                
                last_io_counters = disk_io
                last_io_time = current_time
                
                # Get network I/O
                net_io = psutil.net_io_counters()
                network_io_mbps = 0
                if hasattr(net_io, 'bytes_sent') and hasattr(net_io, 'bytes_recv'):
                    network_io_mbps = (net_io.bytes_sent + net_io.bytes_recv) / (1024 * 1024)
                
                # Create metrics object
                metrics = {
                    'cpu_percent': round(cpu_percent, 1),
                    'memory_percent': round(memory_percent, 1),
                    'disk_io_percent': round(disk_io_percent, 1),
                    'network_io_mbps': round(network_io_mbps, 2),
                    'timestamp': datetime.now().isoformat()
                }
                
                # Put metrics in the queue
                # Use put_nowait to avoid blocking if queue is full
                try:
                    self.metrics_queue.put_nowait(metrics)
                except Exception as e:
                    print(f"[MetricsCollector] Queue error: {e}")
                
                # Sleep for the collection interval
                time.sleep(self.collection_interval)
                
            except Exception as e:
                print(f"[MetricsCollector] Error collecting metrics: {e}")
                time.sleep(5)  # Wait longer on error

class NetworkCollector(Process):
    """Process for collecting network connections efficiently"""
    
    def __init__(self, network_queue, collection_interval=1.0):
        super().__init__()
        self.network_queue = network_queue
        self.collection_interval = collection_interval
        self.running = multiprocessing.Value('b', True)
        self.daemon = True
        
        # Don't create the monitor here - it can't be pickled
        # We'll create it in the run method after the process starts
        
    def stop(self):
        """Stop the collector process"""
        self.running.value = False
        self.join(timeout=3)
        
    def get_network_connections(self, monitor=None):
        """Get current network connections using psutil as fallback"""
        try:
            # Try to use the NetworkMonitor if available
            if monitor and hasattr(monitor, 'get_connections'):
                return monitor.get_connections()
                
            # Fallback to psutil directly
            connections = []
            for conn in psutil.net_connections(kind='all'):
                try:
                    if conn.laddr and len(conn.laddr) >= 2:
                        local_ip = conn.laddr[0]
                        local_port = conn.laddr[1]
                        
                        # Get remote address if available
                        remote_ip = ''
                        remote_port = 0
                        if conn.raddr and len(conn.raddr) >= 2:
                            remote_ip = conn.raddr[0]
                            remote_port = conn.raddr[1]
                        
                        # Determine process name
                        process_name = ''
                        if conn.pid:
                            try:
                                process = psutil.Process(conn.pid)
                                process_name = process.name()
                            except psutil.NoSuchProcess:
                                pass
                        
                        # Create connection object
                        connection = {
                            'pid': conn.pid or 0,
                            'process': process_name,
                            'protocol': 'TCP' if conn.type == socket.SOCK_STREAM else 'UDP',
                            'local_ip': local_ip,
                            'local_port': local_port,
                            'remote_ip': remote_ip,
                            'remote_port': remote_port,
                            'status': conn.status if hasattr(conn, 'status') else 'UNKNOWN',
                            'timestamp': datetime.now().isoformat()
                        }
                        
                        connections.append(connection)
                except Exception as e:
                    print(f"[NetworkCollector] Error processing connection: {e}")
            
            return connections
        except Exception as e:
            print(f"[NetworkCollector] Error getting connections: {e}")
            return []
        
    def run(self):
        """Main process loop for collecting network data"""
        print(f"[NetworkCollector] Starting network collection process (PID: {os.getpid()})")
        
        # Create the NetworkMonitor here, after the process has started
        try:
            from network_monitor import NetworkMonitor
            monitor = NetworkMonitor()
            print("[NetworkCollector] Successfully created NetworkMonitor")
            
            # Start the NetworkMonitor
            if hasattr(monitor, 'start_monitoring'):
                monitor.start_monitoring()
                print("[NetworkCollector] NetworkMonitor started")
        except ImportError:
            print("[NetworkCollector] NetworkMonitor not available, using fallback")
            monitor = None
        
        while self.running.value:
            try:
                # Get network connections
                connections = self.get_network_connections(monitor)
                
                # Put connections in the queue
                # Use put_nowait to avoid blocking if queue is full
                try:
                    if connections:
                        self.network_queue.put_nowait({
                            'connections': connections,
                            'timestamp': datetime.now().isoformat()
                        })
                except Exception as e:
                    print(f"[NetworkCollector] Queue error: {e}")
                
                # Sleep for the collection interval
                time.sleep(self.collection_interval)
                
            except Exception as e:
                print(f"[NetworkCollector] Error collecting network data: {e}")
                time.sleep(5)  # Wait longer on error
                
        # Stop the NetworkMonitor if we were using it
        if monitor and hasattr(monitor, 'stop_monitoring'):
            monitor.stop_monitoring()

class ProcessCollector(Process):
    """Process for collecting process information efficiently"""
    
    def __init__(self, process_queue, collection_interval=2.0):
        super().__init__()
        self.process_queue = process_queue
        self.collection_interval = collection_interval
        self.running = multiprocessing.Value('b', True)
        self.daemon = True
        
        # Don't import and store the module here - modules can't be pickled
        # Instead, we'll import it in the run method after the process starts
        
    def stop(self):
        """Stop the collector process"""
        self.running.value = False
        self.join(timeout=3)
        
    def run(self):
        """Main process loop for collecting process data"""
        print(f"[ProcessCollector] Starting process collection process (PID: {os.getpid()})")
        
        # Import security scanner here instead of in __init__
        try:
            import windows_security_check as security_scanner
            have_security_scanner = True
            print("[ProcessCollector] Successfully imported windows_security_check module")
        except ImportError:
            print("[ProcessCollector] Windows security checker module not available")
            security_scanner = None
            have_security_scanner = False
        
        while self.running.value:
            try:
                processes = []
                for proc in psutil.process_iter(['pid', 'name', 'username', 'memory_info', 'cpu_percent', 'status']):
                    try:
                        # Get process info
                        proc_info = proc.info
                        
                        # Skip system processes with no name
                        if not proc_info['name']:
                            continue
                        
                        # Calculate memory in MB
                        memory_mb = proc_info['memory_info'].rss / (1024 * 1024) if proc_info['memory_info'] else 0
                        
                        # Update CPU usage
                        cpu_percent = proc.cpu_percent(interval=0.1)
                        
                        # Determine if process is suspicious
                        is_suspicious = False
                        reason = ""
                        
                        # Check against list of suspicious process names
                        if have_security_scanner and hasattr(security_scanner, 'is_process_suspicious'):
                            is_suspicious, reason = security_scanner.is_process_suspicious(proc)
                        
                        process = {
                            'pid': proc_info['pid'],
                            'name': proc_info['name'],
                            'username': proc_info['username'],
                            'cpu': cpu_percent,
                            'memory': memory_mb,
                            'status': 'Suspicious' if is_suspicious else 'Running',
                            'reason': reason if is_suspicious else ''
                        }
                        
                        processes.append(process)
                    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                        # Skip processes that can't be accessed
                        pass
                
                # Put processes in the queue
                try:
                    if processes:
                        self.process_queue.put_nowait({
                            'processes': processes,
                            'timestamp': datetime.now().isoformat()
                        })
                except Exception as e:
                    print(f"[ProcessCollector] Queue error: {e}")
                
                # Sleep for the collection interval
                time.sleep(self.collection_interval)
                
            except Exception as e:
                print(f"[ProcessCollector] Error collecting process data: {e}")
                time.sleep(5)  # Wait longer on error

class MultiprocessMonitor:
    """
    Main class that manages the multiprocessing collectors
    and provides data to the application
    """
    
    def __init__(self):
        # Initialize shared queues with limited size to prevent memory issues
        self.metrics_queue = Queue(maxsize=10)
        self.network_queue = Queue(maxsize=10)
        self.process_queue = Queue(maxsize=10)
        
        # Store the latest data
        self.latest_metrics = None
        self.latest_network = None
        self.latest_processes = None
        
        # Collector processes
        self.metrics_collector = None
        self.network_collector = None
        self.process_collector = None
        
        # Data consumer thread
        self.consumer_thread = None
        self.running = False
        
        print("[MultiprocessMonitor] Initialized")
        
    def start(self):
        """Start all collector processes"""
        if self.running:
            print("[MultiprocessMonitor] Already running")
            return
            
        self.running = True
        
        # Start the metric collector process
        self.metrics_collector = MetricsCollector(
            self.metrics_queue, 
            collection_interval=1.0  # Collect metrics every 1 second
        )
        self.metrics_collector.start()
        
        # Start the network collector process
        self.network_collector = NetworkCollector(
            self.network_queue,
            collection_interval=2.0  # Collect network data every 2 seconds
        )
        self.network_collector.start()
        
        # Start the process collector
        self.process_collector = ProcessCollector(
            self.process_queue,
            collection_interval=3.0  # Collect process data every 3 seconds
        )
        self.process_collector.start()
        
        # Start consumer thread to process data from queues
        self.consumer_thread = threading.Thread(target=self._consume_data)
        self.consumer_thread.daemon = True
        self.consumer_thread.start()
        
        print("[MultiprocessMonitor] All collectors started")
        
    def stop(self):
        """Stop all collector processes"""
        self.running = False
        
        # Stop all collectors
        if self.metrics_collector:
            self.metrics_collector.stop()
            
        if self.network_collector:
            self.network_collector.stop()
            
        if self.process_collector:
            self.process_collector.stop()
            
        # Wait for consumer thread to finish
        if self.consumer_thread and self.consumer_thread.is_alive():
            self.consumer_thread.join(timeout=3)
            
        print("[MultiprocessMonitor] All collectors stopped")
        
    def _consume_data(self):
        """Consumer thread that processes data from the queues"""
        while self.running:
            try:
                # Check metrics queue
                try:
                    if not self.metrics_queue.empty():
                        self.latest_metrics = self.metrics_queue.get_nowait()
                except Exception as e:
                    pass
                    
                # Check network queue
                try:
                    if not self.network_queue.empty():
                        self.latest_network = self.network_queue.get_nowait()
                except Exception as e:
                    pass
                    
                # Check process queue
                try:
                    if not self.process_queue.empty():
                        self.latest_processes = self.process_queue.get_nowait()
                except Exception as e:
                    pass
                    
                # Sleep briefly to avoid CPU usage
                time.sleep(0.1)
                
            except Exception as e:
                print(f"[MultiprocessMonitor] Error in consumer thread: {e}")
                time.sleep(1)
    
    def get_metrics(self):
        """Get the latest system metrics"""
        if self.latest_metrics:
            return {
                'cpu_percent': self.latest_metrics.get('cpu_percent', 0),
                'memory_percent': self.latest_metrics.get('memory_percent', 0),
                'disk_io_percent': self.latest_metrics.get('disk_io_percent', 0),
                'network_io_mbps': self.latest_metrics.get('network_io_mbps', 0)
            }
        return None
        
    def get_network_connections(self):
        """Get the latest network connections"""
        if self.latest_network:
            return self.latest_network.get('connections', [])
        return []
        
    def get_processes(self):
        """Get the latest process list"""
        if self.latest_processes:
            return self.latest_processes.get('processes', [])
        return []
        
# Create a singleton instance
monitor = MultiprocessMonitor()

# Export convenience functions
def start():
    """Start the multiprocessing monitor"""
    return monitor.start()
    
def stop():
    """Stop the multiprocessing monitor"""
    return monitor.stop()
    
def get_metrics():
    """Get the latest system metrics"""
    return monitor.get_metrics()
    
def get_network_connections():
    """Get the latest network connections"""
    return monitor.get_network_connections()
    
def get_processes():
    """Get the latest process list"""
    return monitor.get_processes() 