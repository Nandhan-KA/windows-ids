import os
import sys
import importlib.util
import time
import threading
import json
import socket
from datetime import datetime

# Module variables
analyzer = None
analyzer_thread = None
is_running = False
data_callback = None
network_monitor = None

# Path to the user's network analyzer
NETWORK_ANALYZER_PATH = "C:\\Users\\nandhanka\\Desktop\\ids\\network_analyzer_tkinter.py"
NETWORK_MONITOR_DIR = "C:\\Users\\nandhanka\\Desktop\\ids"

# Add the analyzer directory to the Python path
if NETWORK_MONITOR_DIR not in sys.path:
    sys.path.insert(0, NETWORK_MONITOR_DIR)
    print(f"Added {NETWORK_MONITOR_DIR} to Python path to find network_monitor.py")

# Try to directly access the network_monitor module and SystemNetworkMonitor
try:
    import network_monitor
    from network_monitor import SystemNetworkMonitor
    print(f"Successfully imported SystemNetworkMonitor class from {network_monitor.__file__}")
    
    # Get the singleton instance or create one
    if hasattr(network_monitor, 'system_monitor'):
        network_monitor = network_monitor.system_monitor
    else:
        network_monitor = SystemNetworkMonitor()
    
    print("SystemNetworkMonitor instance is ready to use")
except Exception as e:
    print(f"Error importing SystemNetworkMonitor: {e}")
    network_monitor = None

# Class to integrate the external network analyzer
class NetworkAnalyzerIntegration:
    def __init__(self):
        self.analyzer_module = None
        self.analyzer_instance = None
        self.is_running = False
        self.current_data = {}
        self.lock = threading.Lock()
        self.data_callback = None
        self.direct_monitor = network_monitor
        
    def load_analyzer(self):
        """Load the external network analyzer module"""
        try:
            # If we have direct access to the network monitor, use that instead
            if self.direct_monitor:
                print("Using direct SystemNetworkMonitor instance")
                return True
                
            # Check if file exists
            if not os.path.exists(NETWORK_ANALYZER_PATH):
                print(f"Error: Network analyzer not found at {NETWORK_ANALYZER_PATH}")
                return False
            
            # Load the module dynamically
            print(f"Loading network analyzer from {NETWORK_ANALYZER_PATH}")
            spec = importlib.util.spec_from_file_location("network_analyzer", NETWORK_ANALYZER_PATH)
            self.analyzer_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(self.analyzer_module)
            print("Network analyzer module loaded successfully")
            return True
        except Exception as e:
            print(f"Error loading network analyzer: {str(e)}")
            return False
    
    def start_analyzer(self, data_callback=None):
        """Start the network analyzer in a separate thread"""
        if self.is_running:
            print("Network analyzer is already running")
            return True
        
        self.data_callback = data_callback
        
        # If we have direct access to the network monitor, use that
        if self.direct_monitor:
            try:
                print("Starting SystemNetworkMonitor directly")
                self.direct_monitor.register_callback(self._handle_data_from_monitor)
                result = self.direct_monitor.start_monitoring()
                if result:
                    self.is_running = True
                    print("SystemNetworkMonitor started successfully")
                    return True
            except Exception as e:
                print(f"Error starting direct monitor: {e}")
        
        # Fall back to loading the analyzer module
        if not self.analyzer_module and not self.load_analyzer():
            return False
        
        # Start the analyzer in a separate thread
        self.is_running = True
        threading.Thread(target=self._run_analyzer, daemon=True).start()
        print("Network analyzer started")
        return True
    
    def _handle_data_from_monitor(self, data):
        """Handle data coming from the direct network monitor"""
        self._handle_data({
            'connections': data, 
            'timestamp': datetime.now().isoformat(),
            'source': 'system_monitor'
        })
    
    def _run_analyzer(self):
        """Run the network analyzer and capture its data"""
        try:
            # Try different ways to access the analyzer data based on common patterns
            
            # Option 1: The analyzer might have a start_analysis function
            if hasattr(self.analyzer_module, 'start_analysis'):
                self.analyzer_module.start_analysis(callback=self._handle_data)
            
            # Option 2: The analyzer might have a NetworkAnalyzer class
            elif hasattr(self.analyzer_module, 'NetworkAnalyzer'):
                self.analyzer_instance = self.analyzer_module.NetworkAnalyzer()
                if hasattr(self.analyzer_instance, 'start'):
                    self.analyzer_instance.start(callback=self._handle_data)
                elif hasattr(self.analyzer_instance, 'start_analysis'):
                    self.analyzer_instance.start_analysis(callback=self._handle_data)
                else:
                    print("Could not find start method in NetworkAnalyzer class")
            
            # Option 3: Just run the module (it might have a main() function that runs automatically)
            else:
                print("Running network analyzer module directly")
                # This might launch a Tkinter GUI, so we need to capture its output
                # Redirect stdout to capture output
                original_stdout = sys.stdout
                sys.stdout = NetworkAnalyzerOutputCapture(self._handle_data)
                
                # Run the main function if it exists
                if hasattr(self.analyzer_module, 'main'):
                    self.analyzer_module.main()
                
                # Restore stdout
                sys.stdout = original_stdout
        
        except Exception as e:
            print(f"Error running network analyzer: {str(e)}")
        finally:
            self.is_running = False
    
    def _handle_data(self, data):
        """Handle data coming from the network analyzer"""
        with self.lock:
            # Process the data
            if isinstance(data, str):
                try:
                    # Try to parse as JSON
                    self.current_data = json.loads(data)
                except:
                    # Not JSON, treat as text
                    self.current_data = {
                        'raw_output': data,
                        'timestamp': datetime.now().isoformat()
                    }
            elif isinstance(data, dict):
                self.current_data = data
            else:
                self.current_data = {
                    'raw_output': str(data),
                    'timestamp': datetime.now().isoformat()
                }
            
            # Call the callback if provided
            if self.data_callback:
                self.data_callback(self.current_data)
    
    def get_data(self):
        """Get the current network analyzer data"""
        with self.lock:
            return self.current_data
    
    def stop_analyzer(self):
        """Stop the network analyzer"""
        self.is_running = False
        
        # If we have direct access to the network monitor, stop that
        if self.direct_monitor:
            try:
                self.direct_monitor.stop_monitoring()
                print("SystemNetworkMonitor stopped")
            except Exception as e:
                print(f"Error stopping direct monitor: {e}")
        
        # Also stop any analyzer instance
        if self.analyzer_instance and hasattr(self.analyzer_instance, 'stop'):
            self.analyzer_instance.stop()
            
        print("Network analyzer stopped")

# Helper class to capture output from the network analyzer
class NetworkAnalyzerOutputCapture:
    def __init__(self, callback):
        self.callback = callback
        self.buffer = ""
    
    def write(self, text):
        self.buffer += text
        if '\n' in text:
            self.callback(self.buffer)
            self.buffer = ""
    
    def flush(self):
        if self.buffer:
            self.callback(self.buffer)
            self.buffer = ""

# Function to extract network connections from analyzer data
def extract_connections(analyzer_data):
    """Extract network connection information from analyzer data"""
    connections = []
    
    try:
        # If the data is in a standard format, we process it
        if isinstance(analyzer_data, dict):
            # Look for connections in common formats
            if 'connections' in analyzer_data:
                raw_connections = analyzer_data['connections']
                for conn in raw_connections:
                    if isinstance(conn, dict):
                        connections.append({
                            'ip': conn.get('remote_ip', conn.get('ip', 'unknown')),
                            'port': str(conn.get('remote_port', conn.get('port', 0))),
                            'protocol': conn.get('protocol', 'TCP'),
                            'status': conn.get('status', 'Established')
                        })
        
        # If we don't have any connections yet, try to get them from the global network monitor
        if not connections and network_monitor:
            try:
                monitor_connections = network_monitor.get_connections()
                for conn in monitor_connections:
                    if isinstance(conn, dict):
                        connections.append({
                            'ip': conn.get('ip', 'unknown'),
                            'port': str(conn.get('port', 0)),
                            'protocol': conn.get('protocol', 'TCP'),
                            'status': conn.get('status', 'Established')
                        })
            except Exception as e:
                print(f"Error getting connections from network monitor: {e}")
        
        # Deduplicate connections
        unique_connections = []
        seen = set()
        for conn in connections:
            key = f"{conn['ip']}:{conn['port']}"
            if key not in seen:
                seen.add(key)
                unique_connections.append(conn)
        
        return unique_connections
    except Exception as e:
        print(f"Error extracting connections: {str(e)}")
        return []

# Singleton instance
network_analyzer = NetworkAnalyzerIntegration()

# Test function
if __name__ == "__main__":
    def print_data(data):
        print(f"Received data: {data}")
    
    network_analyzer.start_analyzer(print_data)
    
    # Keep the main thread alive
    try:
        while True:
            import time
            time.sleep(1)
    except KeyboardInterrupt:
        network_analyzer.stop_analyzer()
        print("Exiting...")

def load_analyzer_module(path="C:/Users/nandhanka/Desktop/ids/network_analyzer_tkinter.py"):
    """Load the external network analyzer module dynamically"""
    try:
        print(f"Loading network analyzer from {path}")
        
        # Get the directory containing the analyzer
        analyzer_dir = os.path.dirname(path)
        analyzer_name = os.path.basename(path).replace('.py', '')
        
        # Ensure the directory is in Python path so it can find network_monitor.py
        if analyzer_dir not in sys.path:
            sys.path.insert(0, analyzer_dir)
            print(f"Added {analyzer_dir} to Python path")
        
        # Also try to import network_monitor directly to verify it can be found
        try:
            import network_monitor
            print(f"Successfully imported network_monitor module from {network_monitor.__file__}")
        except ImportError as ie:
            print(f"Warning: Could not import network_monitor module: {ie}")
            # Try to find network_monitor.py in directory
            monitor_path = os.path.join(analyzer_dir, 'network_monitor.py')
            if os.path.exists(monitor_path):
                print(f"Found network_monitor.py at {monitor_path}")
            else:
                print(f"network_monitor.py not found at {monitor_path}")
        
        # Load the analyzer module
        spec = importlib.util.spec_from_file_location(analyzer_name, path)
        if not spec:
            raise ImportError(f"Could not load spec for {path}")
            
        analyzer_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(analyzer_module)
        
        print(f"Successfully loaded network analyzer module")
        return analyzer_module
    except Exception as e:
        print(f"Error loading network analyzer: {e}")
        return None

def start_analyzer_thread():
    """Run the analyzer in a background thread"""
    global analyzer, is_running
    
    while is_running:
        try:
            if hasattr(analyzer, 'run_analysis'):
                # Run the analyzer and get network data
                data = analyzer.run_analysis()
                
                # Call the callback with the data
                if data and data_callback:
                    data_callback(data)
            else:
                print("Analyzer has no run_analysis method")
        except Exception as e:
            print(f"Error in analyzer thread: {e}")
        
        # Sleep before next analysis
        time.sleep(5)

def start_analyzer(callback):
    """Start the external network analyzer"""
    global analyzer, analyzer_thread, is_running, data_callback
    
    if is_running:
        return True  # Already running
    
    # Load the analyzer module
    analyzer = load_analyzer_module()
    if not analyzer:
        return False
    
    # Set the callback
    data_callback = callback
    
    # Start the analyzer thread
    is_running = True
    analyzer_thread = threading.Thread(target=start_analyzer_thread)
    analyzer_thread.daemon = True
    analyzer_thread.start()
    
    return True

def stop_analyzer():
    """Stop the external network analyzer"""
    global is_running
    
    is_running = False
    
    # Wait for the thread to stop
    if analyzer_thread and analyzer_thread.is_alive():
        analyzer_thread.join(timeout=2)
    
    return True

def extract_connections(data):
    """Extract network connections from analyzer data"""
    if not data:
        return []
    
    connections = []
    
    # Handle different data formats that might come from the analyzer
    if isinstance(data, dict):
        # If the analyzer returns a dictionary of connections
        if 'connections' in data:
            raw_connections = data['connections']
            for conn in raw_connections:
                connection = {
                    'ip': conn.get('ip', 'unknown'),
                    'port': str(conn.get('port', 0)),
                    'protocol': conn.get('protocol', 'TCP'),
                    'status': conn.get('status', 'Established')
                }
                connections.append(connection)
        # If the analyzer returns a dictionary with generic network data
        elif 'network_data' in data:
            # Process generic network data
            pass
    elif isinstance(data, list):
        # If the analyzer returns a list of connection dictionaries
        for conn in data:
            if isinstance(conn, dict) and 'ip' in conn:
                connection = {
                    'ip': conn.get('ip', 'unknown'),
                    'port': str(conn.get('port', 0)),
                    'protocol': conn.get('protocol', 'TCP'),
                    'status': conn.get('status', 'Established')
                }
                connections.append(connection)
    
    # Add suspect flag for suspicious connections
    for conn in connections:
        # Check for common malicious ports
        if conn['port'] in ['4444', '1337', '31337', '6666']:
            conn['status'] = 'Suspicious'
        
        # Check for suspicious IPs (just examples)
        if conn['ip'].startswith('10.') and int(conn['port']) > 50000:
            conn['status'] = 'Suspicious'
    
    return connections

# Initialize when module is imported
if __name__ != "__main__":
    # Just prepare the module, don't start automatically
    pass 