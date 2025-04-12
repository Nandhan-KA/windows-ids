#!/usr/bin/env python
"""
Fixed version of fast_run.py that corrects the NameError
in the FastIDSGUI._create_widgets method.
"""

import os
import sys
import time
import argparse
import logging
import json
import numpy as np
import tensorflow as tf
from datetime import datetime
import threading
import queue
import psutil
from scapy.all import sniff, IP, TCP, UDP, ICMP, Raw
import tkinter as tk
from tkinter import ttk, scrolledtext
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import socket
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("deepids.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("DeepIDS")

class FastIDS:
    """Fast Intrusion Detection System using optimized neural network model."""
    
    def __init__(self, model_path, norm_params_path=None, threshold=0.7, 
                 buffer_max_len=100, bridge_host="localhost", bridge_port=5000):
        """
        Initialize the FastIDS.
        
        Args:
            model_path: Path to trained IDS model
            norm_params_path: Path to normalization parameters
            threshold: Detection threshold (0.5-0.99)
            buffer_max_len: Maximum number of items to keep in history buffers
            bridge_host: Host of the IDS Bridge
            bridge_port: Port of the IDS Bridge
        """
        # Create log directory if it doesn't exist
        os.makedirs('logs', exist_ok=True)
        self.log_dir = 'logs'
        
        # Load the model
        logger.info(f"Loading model from {model_path}")
        self.model = tf.keras.models.load_model(model_path)
        
        # Load normalization parameters if provided
        self.feature_mean = None
        self.feature_std = None
        if norm_params_path and os.path.exists(norm_params_path):
            logger.info(f"Loading normalization parameters from {norm_params_path}")
            with open(norm_params_path, 'r') as f:
                norm_params = json.load(f)
                self.feature_mean = np.array(norm_params['mean'])
                self.feature_std = np.array(norm_params['std'])
        
        # Set detection threshold
        self.threshold = threshold
        
        # Feature buffer
        self.feature_buffer = []
        self.buffer_max_len = buffer_max_len
        
        # Statistics
        self.stats = {
            'total_packets': 0,
            'alerts': 0,
            'start_time': time.time(),
            'last_alert_time': None,
            'confidence_history': [],
            'alert_history': []
        }
        
        # Create alert queue for GUI
        self.alert_queue = queue.Queue()
        
        # Initialize detection thread
        self.running = False
        self.detection_thread = None
        
        # Socket for receiving external traffic (bridge connection)
        self.socket = None
        self.socket_thread = None
        self.bridge_connected = False
        
        # Bridge connection
        self.bridge_host = bridge_host
        self.bridge_port = bridge_port

    def connect_to_bridge(self):
        """Connect to the IDS Bridge for receiving traffic data."""
        if self.socket:
            logger.warning("Already connected to bridge")
            return True
        
        try:
            # Create a socket connection to the bridge
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect((self.bridge_host, self.bridge_port))
            
            # Start thread to receive traffic data
            self.bridge_connected = True
            self.socket_thread = threading.Thread(target=self._receive_traffic)
            self.socket_thread.daemon = True
            self.socket_thread.start()
            
            logger.info(f"Connected to IDS Bridge at {self.bridge_host}:{self.bridge_port}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to IDS Bridge: {e}")
            self.socket = None
            self.bridge_connected = False
            return False
    
    def _receive_traffic(self):
        """Receive traffic data from IDS Bridge via socket."""
        if not self.socket:
            logger.error("Socket not initialized")
            return
            
        logger.info("Starting traffic receiver thread")
        self.socket.settimeout(1.0)  # Non-blocking with timeout
        
        buffer = ""
        messages_received = 0
        
        while self.running:
            try:
                # Receive data
                logger.debug("Waiting for data from bridge...")
                chunk = self.socket.recv(4096).decode('utf-8')
                if not chunk:
                    # Connection closed
                    logger.warning("Bridge connection closed")
                    self.bridge_connected = False
                    break
                    
                logger.debug(f"Received chunk of size {len(chunk)}")
                # Add to buffer and process complete messages
                buffer += chunk
                
                # Process lines (assuming each message is on a separate line)
                lines = buffer.split('\n')
                # The last line might be incomplete, so keep it in the buffer
                buffer = lines.pop() if lines else ""
                
                logger.debug(f"Processing {len(lines)} complete lines")
                
                # Process each complete line
                for line in lines:
                    if not line.strip():
                        continue  # Skip empty lines
                        
                    try:
                        # Try to parse as JSON
                        traffic_data = json.loads(line)
                        
                        # Process the traffic data
                        messages_received += 1
                        attack_type = traffic_data.get('attack_type', 'unknown')
                        
                        # Log warning if --disable-attacks is set but attacks are coming in
                        if hasattr(self, 'disable_attacks') and self.disable_attacks and attack_type != "normal":
                            logger.warning(f"WARNING: Received attack traffic ({attack_type}) even though --disable-attacks is set!")
                            logger.warning(f"This may indicate another process is generating attacks independently.")
                            
                        logger.info(f"Received traffic message #{messages_received}: {attack_type}")
                        self._process_traffic_data(traffic_data)
                    except json.JSONDecodeError as e:
                        logger.error(f"Invalid JSON data: {e} - Data: {line[:100]}...")
                    except Exception as e:
                        logger.error(f"Error processing traffic data: {e}")
                    
            except socket.timeout:
                # Timeout - no data received
                continue
            except Exception as e:
                logger.error(f"Error receiving traffic data: {e}")
                self.bridge_connected = False
                break
                
        # Clean up
        if self.socket:
            try:
                self.socket.close()
            except:
                pass
            self.socket = None
            
        self.bridge_connected = False
        logger.info("Traffic receiver thread stopped")

    def _process_traffic_data(self, traffic_data):
        """
        Process traffic data received from bridge.
        
        Args:
            traffic_data: Dictionary containing traffic data
        """
        try:
            # Extract features and attack type
            features = traffic_data.get('features', [])
            attack_type = traffic_data.get('attack_type', 'unknown')
            
            if not features:
                logger.warning("Received traffic data without features")
                return
            
            # Check if disable_attacks flag is set and if this is an attack
            if hasattr(self, 'disable_attacks') and self.disable_attacks and attack_type != "normal":
                logger.warning(f"Ignoring {attack_type} traffic due to --disable-attacks flag")
                return
                
            logger.info(f"Processing {attack_type} traffic data with {len(features)} features")
            
            # Convert to numpy array
            features = np.array(features, dtype=np.float32)
            
            # Handle feature dimension mismatch
            if self.feature_mean is not None:
                expected_features = len(self.feature_mean)
                if len(features) != expected_features:
                    logger.warning(f"Feature dimension mismatch: got {len(features)}, expected {expected_features}. Adjusting...")
                    if len(features) > expected_features:
                        # Truncate features to expected size
                        features = features[:expected_features]
                    else:
                        # Pad with zeros
                        padded = np.zeros(expected_features, dtype=np.float32)
                        padded[:len(features)] = features
                        features = padded
            
            # Apply normalization if available
            if self.feature_mean is not None and self.feature_std is not None:
                features = (features - self.feature_mean) / self.feature_std
                
            # Make prediction
            features = features.reshape(1, -1)  # Add batch dimension
            confidence = self.model.predict(features, verbose=0)[0][0]
            logger.info(f"Prediction confidence: {confidence:.4f} (threshold: {self.threshold:.4f})")
            
            # Update statistics
            self.stats['total_packets'] += 1
            self.stats['confidence_history'].append(float(confidence))
            
            # Check if alert should be triggered
            if confidence > self.threshold:
                self.stats['alerts'] += 1
                self.stats['last_alert_time'] = time.time()
                
                # Create alert
                alert = {
                    'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'confidence': float(confidence),
                    'attack_type': attack_type,
                    'features': features.tolist()
                }
                
                # Add to alert history and queue
                self.stats['alert_history'].append(alert)
                self.alert_queue.put(alert)
                logger.info(f"ALERT! Attack detected: {attack_type} with confidence {confidence:.4f}")
                
            # Trim confidence history if needed
            if len(self.stats['confidence_history']) > self.buffer_max_len:
                self.stats['confidence_history'] = self.stats['confidence_history'][-self.buffer_max_len:]
                
            # Trim alert history if needed
            if len(self.stats['alert_history']) > self.buffer_max_len:
                self.stats['alert_history'] = self.stats['alert_history'][-self.buffer_max_len:]
                
        except Exception as e:
            logger.error(f"Error processing traffic data: {e}")
            logger.error(f"Stack trace: {traceback.format_exc()}")

    def start(self):
        """Start the detection process."""
        if self.running:
            logger.warning("FastIDS is already running.")
            return
            
        logger.info("Starting FastIDS...")
        self.running = True
        
        # Ensure we're connected to the bridge before starting
        if not self.bridge_connected:
            logger.info("Attempting to connect to IDS Bridge...")
            if self.connect_to_bridge():
                logger.info("Successfully connected to IDS Bridge")
            else:
                logger.warning("Failed to connect to IDS Bridge - will continue anyway")
                
        logger.info("FastIDS started.")
        
    def stop(self):
        """Stop the detection process."""
        if not self.running:
            logger.warning("FastIDS is not running.")
            return
            
        self.running = False
        logger.info("FastIDS stopped.")
        
        # Wait for threads to finish if needed
        if self.socket_thread and self.socket_thread.is_alive():
            self.socket_thread.join(timeout=2.0)
            
        # Close socket if open
        if self.socket:
            try:
                self.socket.close()
            except:
                pass
            self.socket = None
            
        self.bridge_connected = False
    
    def get_stats(self):
        """Get current statistics."""
        stats = self.stats.copy()
        stats['uptime'] = time.time() - stats['start_time']
        stats['bridge_connected'] = self.bridge_connected
        return stats

class FastIDSGUI:
    """GUI for FastIDS."""
    
    def __init__(self, ids):
        """
        Initialize the GUI.
        
        Args:
            ids: FastIDS instance
        """
        self.root = tk.Tk()
        self.root.title("FastIDS - Optimized Intrusion Detection System")
        self.root.geometry("1200x700")
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)
        
        # Store FastIDS instance
        self.ids = ids
        
        # Create GUI components
        self._create_widgets()
        
        # Initialize update task
        self.update_task()
        
    def _create_widgets(self):
        """Create GUI widgets."""
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Top control frame
        control_frame = ttk.Frame(main_frame)
        control_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Title
        title_label = ttk.Label(
            control_frame, 
            text="FastIDS: Optimized Intrusion Detection System",
            font=("Helvetica", 16, "bold")
        )
        title_label.pack(side=tk.LEFT, padx=5)
        
        # Start/Stop buttons
        self.start_button = ttk.Button(
            control_frame, 
            text="Start Monitoring", 
            command=self.start_ids
        )
        self.start_button.pack(side=tk.RIGHT, padx=5)
        
        self.stop_button = ttk.Button(
            control_frame, 
            text="Stop Monitoring", 
            command=self.stop_ids,
            state=tk.DISABLED
        )
        self.stop_button.pack(side=tk.RIGHT, padx=5)
        
        # Add bridge connection button
        self.connect_button = ttk.Button(
            control_frame, 
            text="Connect to Bridge", 
            command=self.connect_to_bridge
        )
        self.connect_button.pack(side=tk.RIGHT, padx=5)
        
        # Split frame for stats and alerts
        split_frame = ttk.Frame(main_frame)
        split_frame.pack(fill=tk.BOTH, expand=True)
        
        # Left frame for stats
        left_frame = ttk.LabelFrame(split_frame, text="Statistics & Visualization")
        left_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 5))
        
        # Stats frame
        stats_frame = ttk.Frame(left_frame)
        stats_frame.pack(fill=tk.X, padx=10, pady=10)
        
        # Stats labels
        self.uptime_label = ttk.Label(stats_frame, text="Uptime: 0s")
        self.uptime_label.grid(row=0, column=0, sticky=tk.W, padx=5, pady=2)
        
        self.packets_label = ttk.Label(stats_frame, text="Packets: 0")
        self.packets_label.grid(row=0, column=1, sticky=tk.W, padx=5, pady=2)
        
        self.alerts_label = ttk.Label(stats_frame, text="Alerts: 0")
        self.alerts_label.grid(row=1, column=0, sticky=tk.W, padx=5, pady=2)
        
        # Fixed line - using self.ids.threshold instead of threshold
        self.threshold_label = ttk.Label(stats_frame, text=f"Threshold: {self.ids.threshold:.2f}")
        self.threshold_label.grid(row=1, column=1, sticky=tk.W, padx=5, pady=2)
        
        # Add bridge connection status label
        self.bridge_label = ttk.Label(stats_frame, text="Bridge: Disconnected", foreground="red")
        self.bridge_label.grid(row=2, column=0, columnspan=2, sticky=tk.W, padx=5, pady=2)
        
        # Threshold slider
        threshold_frame = ttk.Frame(left_frame)
        threshold_frame.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Label(threshold_frame, text="Detection Threshold:").pack(side=tk.LEFT)
        
        # Fixed line - using self.ids.threshold for the value
        self.threshold_slider = ttk.Scale(
            threshold_frame, 
            from_=0.5, 
            to=0.99, 
            orient=tk.HORIZONTAL,
            value=self.ids.threshold,
            length=200,
            command=self.on_threshold_change
        )
        self.threshold_slider.pack(side=tk.LEFT, padx=5)
        
        # Visualization
        self.fig = plt.figure(figsize=(6, 4), dpi=100)
        self.ax = self.fig.add_subplot(111)
        self.ax.set_ylim(0, 1)
        self.ax.set_title("Detection Confidence")
        self.ax.set_xlabel("Time")
        self.ax.set_ylabel("Confidence")
        self.line, = self.ax.plot([], [], 'b-')
        
        # Fixed line - using self.ids.threshold
        self.threshold_line = self.ax.axhline(y=self.ids.threshold, color='r', linestyle='--')
        
        self.canvas = FigureCanvasTkAgg(self.fig, left_frame)
        self.canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Right frame for alerts
        right_frame = ttk.LabelFrame(split_frame, text="Alerts")
        right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=(5, 0))
        
        # Alert list with tags for coloring
        self.alert_text = scrolledtext.ScrolledText(right_frame, wrap=tk.WORD)
        self.alert_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        self.alert_text.tag_configure("alert", foreground="red", font=("Helvetica", 10, "bold"))
        
        # Status bar
        self.status_var = tk.StringVar()
        self.status_var.set("Status: Ready")
        status_bar = ttk.Label(main_frame, textvariable=self.status_var, relief=tk.SUNKEN, anchor=tk.W)
        status_bar.pack(fill=tk.X, pady=(10, 0))
        
    def start_ids(self):
        """Start the IDS monitoring."""
        self.ids.start()
        self.start_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        self.status_var.set("Status: Monitoring network traffic")
        
    def stop_ids(self):
        """Stop the IDS monitoring."""
        self.ids.stop()
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)
        self.status_var.set("Status: Monitoring stopped")
        
    def on_threshold_change(self, value):
        """Handle threshold slider change."""
        threshold = float(value)
        self.ids.threshold = threshold
        self.threshold_label.config(text=f"Threshold: {threshold:.2f}")
        self.threshold_line.set_ydata([threshold, threshold])
        self.canvas.draw()
        
    def connect_to_bridge(self):
        """Connect to IDS Bridge."""
        # Try to connect to bridge
        if self.ids.connect_to_bridge():
            self.bridge_label.config(text="Bridge: Connected", foreground="green")
            self.connect_button.config(state=tk.DISABLED)
            self.status_var.set("Status: Connected to IDS Bridge")
        else:
            self.bridge_label.config(text="Bridge: Disconnected", foreground="red")
            self.status_var.set("Status: Failed to connect to IDS Bridge")
        
    def update_task(self):
        """Update GUI periodically."""
        # Get current stats
        stats = self.ids.get_stats()
        
        # Update stat labels
        self.uptime_label.config(text=f"Uptime: {int(stats['uptime'])}s")
        self.packets_label.config(text=f"Packets: {stats['total_packets']}")
        self.alerts_label.config(text=f"Alerts: {stats['alerts']}")
        
        # Update bridge connection status
        if stats.get('bridge_connected', False):
            self.bridge_label.config(text="Bridge: Connected", foreground="green")
            self.connect_button.config(state=tk.DISABLED)
        else:
            self.bridge_label.config(text="Bridge: Disconnected", foreground="red")
            self.connect_button.config(state=tk.NORMAL)
        
        # Process alerts from queue
        alerts_processed = 0
        while not self.ids.alert_queue.empty():
            alert = self.ids.alert_queue.get()
            alert_text = f"[{alert['timestamp']}] {alert['attack_type'].upper()} attack detected! Confidence: {alert['confidence']:.4f}\n"
            self.alert_text.insert(tk.END, alert_text, "alert")
            self.alert_text.see(tk.END)
            alerts_processed += 1
        
        if alerts_processed > 0:
            logger.info(f"Displayed {alerts_processed} new alerts in GUI")
        
        # Update visualization if we have data
        if len(stats['confidence_history']) > 0:
            self.line.set_xdata(range(len(stats['confidence_history'])))
            self.line.set_ydata(stats['confidence_history'])
            
            if len(stats['confidence_history']) > 1:
                self.ax.set_xlim(0, len(stats['confidence_history']))
            
            self.canvas.draw()
            logger.debug(f"Updated visualization with {len(stats['confidence_history'])} data points")
        
        # Schedule next update
        self.root.after(500, self.update_task)
        
    def on_close(self):
        """Handle window close event."""
        if self.ids.running:
            self.ids.stop()
        self.root.destroy()
        
    def run(self):
        """Run the GUI application."""
        self.root.mainloop()

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="FastIDS - Optimized Intrusion Detection System")
    
    parser.add_argument("--model", type=str, required=True,
                      help="Path to trained IDS model")
    parser.add_argument("--norm-params", type=str, required=True,
                      help="Path to normalization parameters")
    parser.add_argument("--threshold", type=float, default=0.7,
                      help="Detection threshold (0.5-0.99)")
    parser.add_argument("--bridge-host", type=str, default="localhost",
                      help="IDS Bridge host")
    parser.add_argument("--bridge-port", type=int, default=5000,
                      help="IDS Bridge port")
    
    args = parser.parse_args()
    
    # Create and run FastIDS
    ids = FastIDS(
        model_path=args.model,
        norm_params_path=args.norm_params,
        threshold=args.threshold,
        bridge_host=args.bridge_host,
        bridge_port=args.bridge_port
    )
    
    # Create and run GUI
    gui = FastIDSGUI(ids)
    gui.run()
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 