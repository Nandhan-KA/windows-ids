import os
import sys
import time
import json
from datetime import datetime
print("Script starting...")
print(f"Current working directory: {os.getcwd()}")
print(f"Python path: {sys.path}")
script_dir = os.path.dirname(os.path.abspath(__file__))
print(f"Script directory: {script_dir}")
if script_dir not in sys.path:
    sys.path.append(script_dir)
    print(f"Added {script_dir} to Python path")
try:
    print("Attempting to import network_monitor...")
    import network_monitor
    print(f"Successfully imported network_monitor from {network_monitor.__file__}")
    print("Attempting to import network_analyzer from network_integration...")
    from network_integration import network_analyzer
    print("Successfully imported network_analyzer")
except Exception as e:
    print(f"Error importing modules: {e}")
    sys.exit(1)
connection_updates = 0
last_connections = []
def print_status(message, success=True):
    if success:
        print(f"\033[92m[SUCCESS]\033[0m {message}")
    else:
        print(f"\033[91m[FAILED]\033[0m {message}")
def monitor_callback(data):
    global connection_updates, last_connections
    connection_updates += 1
    if isinstance(data, dict) and 'connections' in data:
        connections = data['connections']
        last_connections = connections
    elif isinstance(data, list):
        connections = data
        last_connections = connections
    else:
        connections = []
        print(f"\nUpdate 
        print(f"Data sample: {str(data)[:200]}...")
        return
    print(f"\nUpdate 
    if connections:
        print("\nSample connections:")
        for i, conn in enumerate(connections[:3]):  
            conn_str = f"  {conn.get('ip', 'unknown')}:{conn.get('port', '?')} - {conn.get('protocol', '?')} - {conn.get('status', '?')}"
            print(conn_str)
        if len(connections) > 3:
            print(f"  ... and {len(connections) - 3} more connections")
    else:
        print_status("No connections detected yet, waiting...", False)
def test_direct_monitoring():
    print("\n=== Testing NetworkMonitor ===")
    try:
        print("Getting NetworkMonitor instance...")
        monitor_instance = network_monitor.monitor
        print(f"Got monitor instance: {monitor_instance}")
    except Exception as e:
        print(f"Error getting monitor instance: {e}")
        return False
    print("Starting monitoring...")
    monitor_instance.start_monitoring()
    print("Started monitoring")
    print("\nWaiting for network data (10 seconds)...")
    start_time = time.time()
    connection_count = 0
    try:
        while time.time() - start_time < 10:
            time.sleep(1)
            connections = monitor_instance.get_connections()
            if connections:
                connection_count = len(connections)
                print(f"\nFound {connection_count} network connections")
                for i, conn in enumerate(connections[:3]):  
                    conn_str = f"  {conn.get('ip', 'unknown')}:{conn.get('port', '?')} - {conn.get('protocol', '?')} - {conn.get('status', '?')}"
                    print(conn_str)
                if len(connections) > 3:
                    print(f"  ... and {len(connections) - 3} more connections")
                global last_connections
                last_connections = connections
                break
            sys.stdout.write(".")
            sys.stdout.flush()
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    print("\n\nStopping monitoring...")
    monitor_instance.stop_monitoring()
    print_status("Stopped monitoring", True)
    if connection_count > 0:
        print_status(f"Received network data with {connection_count} connections")
        return True
    else:
        print_status("No network connections received", False)
        return False
def test_analyzer_integration():
    print("\n=== Testing NetworkAnalyzerIntegration ===")
    connections_received = []
    def analyzer_callback(data):
        if isinstance(data, dict) and 'connections' in data:
            connections = data['connections']
        elif isinstance(data, list):
            connections = data
        else:
            print(f"Received unexpected data format: {type(data)}")
            return
        connections_received.append(connections)
        print(f"\nReceived {len(connections)} connections")
        if connections:
            print("\nSample connections:")
            for i, conn in enumerate(connections[:3]):  
                conn_str = f"  {conn.get('ip', 'unknown')}:{conn.get('port', '?')} - {conn.get('protocol', '?')} - {conn.get('status', '?')}"
                print(conn_str)
            if len(connections) > 3:
                print(f"  ... and {len(connections) - 3} more connections")
        global last_connections
        last_connections = connections
    print("Starting network analyzer...")
    try:
        result = network_analyzer.start_analyzer(analyzer_callback)
        print_status("Started network analyzer", result)
    except Exception as e:
        print_status(f"Failed to start network analyzer: {e}", False)
        return False
    print("\nWaiting for network data (10 seconds)...")
    start_time = time.time()
    try:
        while time.time() - start_time < 10 and not connections_received:
            time.sleep(1)
            sys.stdout.write(".")
            sys.stdout.flush()
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    print("\n\nStopping network analyzer...")
    try:
        network_analyzer.stop_analyzer()
        print_status("Stopped network analyzer", True)
    except Exception as e:
        print_status(f"Failed to stop network analyzer: {e}", False)
    if connections_received:
        print_status(f"Received {len(connections_received)} updates with network data")
        return True
    else:
        print_status("No network data updates received", False)
        return False
def dump_connections_to_file():
    if not last_connections:
        print_status("No connections to dump", False)
        return
    try:
        filename = f"connection_dump_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(last_connections, f, indent=2)
        print_status(f"Dumped {len(last_connections)} connections to {filename}")
    except Exception as e:
        print_status(f"Failed to dump connections: {e}", False)
def main():
    print("=== WINDOWS IDS REAL-TIME MONITORING TEST ===")
    print(f"Starting test at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    direct_success = test_direct_monitoring()
    analyzer_success = test_analyzer_integration()
    dump_connections_to_file()
    print("\n=== TEST SUMMARY ===")
    if direct_success:
        print_status("NetworkMonitor is working correctly")
    else:
        print_status("NetworkMonitor is NOT working correctly", False)
    if analyzer_success:
        print_status("NetworkAnalyzerIntegration is working correctly")
    else:
        print_status("NetworkAnalyzerIntegration is NOT working correctly", False)
    if direct_success or analyzer_success:
        print_status("OVERALL: Real-time monitoring is working")
    else:
        print_status("OVERALL: Real-time monitoring is NOT working", False)
        print("\nTroubleshooting tips:")
        print(" - Check if psutil is installed: pip install psutil")
        print(" - Verify network_monitor.py is in the correct directory")
        print(" - Ensure you have the necessary permissions to monitor network connections")
if __name__ == "__main__":
    main() 