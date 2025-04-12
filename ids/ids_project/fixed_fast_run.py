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
    
    def __init__(self, model_path, norm_params_path=None, threshold=0.7):
        """
        Initialize the Fast IDS system.
        
        Args:
            model_path: Path to the trained model
            norm_params_path: Path to normalization parameters
            threshold: Detection threshold (0.0-1.0)
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
        self.buffer_max_len = 100
        
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

    def start(self):
        """Start the detection process."""
        if self.running:
            logger.warning("FastIDS is already running.")
            return
            
        self.running = True
        logger.info("FastIDS started.")
        
    def stop(self):
        """Stop the detection process."""
        if not self.running:
            logger.warning("FastIDS is not running.")
            return
            
        self.running = False
        logger.info("FastIDS stopped.")
    
    def get_stats(self):
        """Get current statistics."""
        stats = self.stats.copy()
        stats['uptime'] = time.time() - stats['start_time']
        return stats

class FastIDSGUI:
    """GUI for FastIDS."""
    
    def __init__(self, model_path, norm_params_path=None, threshold=0.7):
        """Initialize the GUI."""
        self.root = tk.Tk()
        self.root.title("FastIDS - Optimized Intrusion Detection System")
        self.root.geometry("1200x700")
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)
        
        # Create FastIDS instance
        self.ids = FastIDS(
            model_path=model_path,
            norm_params_path=norm_params_path,
            threshold=threshold
        )
        
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
        
        # Alert list
        self.alert_text = scrolledtext.ScrolledText(right_frame, wrap=tk.WORD)
        self.alert_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
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
        
    def update_task(self):
        """Update the GUI with latest data."""
        if self.ids.running:
            # Update stats
            stats = self.ids.get_stats()
            self.uptime_label.config(text=f"Uptime: {int(stats['uptime'])}s")
            self.packets_label.config(text=f"Packets: {stats['total_packets']}")
            self.alerts_label.config(text=f"Alerts: {stats['alerts']}")
            
            # Process alerts from queue
            while not self.ids.alert_queue.empty():
                alert = self.ids.alert_queue.get()
                self.alert_text.insert(tk.END, f"{alert}\n")
                self.alert_text.see(tk.END)
                
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
    """Main entry point for FastIDS."""
    parser = argparse.ArgumentParser(description="FastIDS - Optimized Intrusion Detection System")
    parser.add_argument("--model", type=str, required=True, help="Path to trained model")
    parser.add_argument("--norm-params", type=str, help="Path to normalization parameters")
    parser.add_argument("--threshold", type=float, default=0.7, help="Detection threshold (0.5-0.99)")
    
    args = parser.parse_args()
    
    # Validate model path
    if not os.path.exists(args.model):
        logger.error(f"Model file not found: {args.model}")
        return 1
    
    # Check for normalization parameters
    if not args.norm_params:
        # Try to find normalization parameters in same directory as model
        model_dir = os.path.dirname(args.model)
        default_norm_path = os.path.join(model_dir, 'normalization_params.json')
        if os.path.exists(default_norm_path):
            args.norm_params = default_norm_path
            logger.info(f"Using normalization parameters from {default_norm_path}")
    
    # Start GUI
    logger.info("Starting FastIDS GUI...")
    gui = FastIDSGUI(
        model_path=args.model,
        norm_params_path=args.norm_params,
        threshold=args.threshold
    )
    gui.run()
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 