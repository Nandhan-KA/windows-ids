"""
Test script for multiprocessing monitor
This script tests the multiprocessing implementation to verify it's working correctly
"""

import time
import multiprocessing_monitor
import pprint

def main():
    print("Testing multiprocessing monitor...")
    print(f"Number of CPU cores: {multiprocessing.cpu_count()}")
    
    # Start the monitor
    print("Starting multiprocessing monitor...")
    multiprocessing_monitor.start()
    
    # Wait for data to be collected
    print("Waiting for initial data collection (5 seconds)...")
    time.sleep(5)
    
    # Get system metrics
    print("\n=== System Metrics ===")
    metrics = multiprocessing_monitor.get_metrics()
    if metrics:
        pprint.pprint(metrics)
    else:
        print("No metrics data available yet")
    
    # Get network connections
    print("\n=== Network Connections ===")
    connections = multiprocessing_monitor.get_network_connections()
    if connections:
        print(f"Found {len(connections)} connections")
        # Print first 3 connections
        for i, conn in enumerate(connections[:3]):
            print(f"  Connection {i+1}:")
            pprint.pprint(conn)
        if len(connections) > 3:
            print(f"  ... and {len(connections) - 3} more connections")
    else:
        print("No network connections available yet")
    
    # Get processes
    print("\n=== Processes ===")
    processes = multiprocessing_monitor.get_processes()
    if processes:
        print(f"Found {len(processes)} processes")
        # Print top 3 processes by CPU usage
        sorted_processes = sorted(processes, key=lambda p: p.get('cpu', 0), reverse=True)
        for i, proc in enumerate(sorted_processes[:3]):
            print(f"  Process {i+1}: {proc.get('name')} (PID: {proc.get('pid')})")
            print(f"    CPU: {proc.get('cpu', 0):.1f}%, Memory: {proc.get('memory', 0):.1f} MB")
        if len(processes) > 3:
            print(f"  ... and {len(processes) - 3} more processes")
    else:
        print("No process data available yet")
    
    # Test continuous operation
    print("\n=== Continuous Monitoring Test ===")
    print("Will fetch metrics every second for 10 seconds...")
    start_time = time.time()
    
    while time.time() - start_time < 10:
        metrics = multiprocessing_monitor.get_metrics()
        if metrics:
            cpu = metrics.get('cpu_percent', 0)
            mem = metrics.get('memory_percent', 0)
            net = metrics.get('network_io_mbps', 0)
            print(f"CPU: {cpu:.1f}%, Memory: {mem:.1f}%, Network: {net:.2f} MB/s")
        time.sleep(1)
    
    # Stop the monitor
    print("\nStopping multiprocessing monitor...")
    multiprocessing_monitor.stop()
    print("Test completed")

if __name__ == "__main__":
    # Import multiprocessing for CPU count
    import multiprocessing
    main() 