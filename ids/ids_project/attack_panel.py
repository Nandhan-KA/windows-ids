#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
IDS Attack Panel - A graphical interface for manually injecting network attacks
"""

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import socket
import json
import time
import random
import logging
import threading
import argparse
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('IDS-AttackPanel')

# Attack types and their corresponding colors
ATTACK_TYPES = {
    'dos': '#e74c3c',     # Red
    'probe': '#3498db',   # Blue
    'r2l': '#2ecc71',     # Green
    'u2r': '#f39c12',     # Orange
    'normal': '#95a5a6',  # Gray
}

class AttackPanel:
    def __init__(self, root, bridge_host="localhost", bridge_port=5000, light_mode=False):
        self.root = root
        self.bridge_host = bridge_host
        self.bridge_port = bridge_port
        self.light_mode = light_mode
        self.socket = None
        self.connected = False
        
        # Attack parameters
        self.selected_attack = tk.StringVar(value="dos")
        self.intensity = tk.DoubleVar(value=0.5)
        self.packet_count = tk.IntVar(value=10)
        self.advanced_mode = tk.BooleanVar(value=False)
        
        # Source IP and port
        self.src_ip = tk.StringVar(value="192.168.1." + str(random.randint(100, 254)))
        self.src_port = tk.IntVar(value=random.randint(10000, 65000))
        
        # Destination IP and port
        self.dst_ip = tk.StringVar(value="10.0.0." + str(random.randint(1, 100)))
        self.dst_port = tk.IntVar(value=random.randint(1, 1024))
        
        # Setup UI
        self.setup_ui()
        
        # Set window title and icon
        self.root.title("IDS Attack Panel")
        self.root.geometry("700x560")
        self.root.minsize(600, 500)
        
        # Configure the theme
        self.set_theme(light_mode)
        
        # Try to connect on startup
        self.connect_to_bridge()
    
    def set_theme(self, light_mode):
        """Set the UI theme based on light/dark mode preference."""
        # Define colors for light and dark mode
        if light_mode:
            bg_color = "#f5f5f5"         # Light gray background
            fg_color = "#212121"         # Near black text
            entry_bg = "#ffffff"         # White entry background
            entry_fg = "#000000"         # Black entry text
            button_bg = "#4a86e8"        # Blue button
            button_fg = "#ffffff"        # White button text
            frame_bg = "#e0e0e0"         # Slightly darker gray for frames
            label_bg = "#f5f5f5"         # Match main background
            log_bg = "#ffffff"           # White log background
            log_fg = "#212121"           # Dark log text
        else:
            bg_color = "#2d2d2d"         # Dark gray background
            fg_color = "#f0f0f0"         # Light gray text
            entry_bg = "#3d3d3d"         # Darker entry background
            entry_fg = "#f0f0f0"         # Light entry text
            button_bg = "#5294e2"        # Blue button
            button_fg = "#ffffff"        # White button text
            frame_bg = "#383838"         # Slightly lighter gray for frames
            label_bg = "#2d2d2d"         # Match main background
            log_bg = "#3d3d3d"           # Dark log background
            log_fg = "#f0f0f0"           # Light log text
        
        # Configure ttk styles
        style = ttk.Style()
        style.configure("TFrame", background=bg_color)
        style.configure("TLabelframe", background=bg_color)
        style.configure("TLabelframe.Label", background=bg_color, foreground=fg_color)
        style.configure("TLabel", background=label_bg, foreground=fg_color)
        
        # Configure radiobutton and checkbox styles with explicit colors
        style.configure("TRadiobutton", background=bg_color, foreground=fg_color)
        style.map("TRadiobutton",
                 background=[('active', bg_color)],
                 foreground=[('active', fg_color)])
                 
        style.configure("TCheckbutton", background=bg_color, foreground=fg_color)
        style.map("TCheckbutton",
                 background=[('active', bg_color)],
                 foreground=[('active', fg_color)])
        
        # Configure button styles
        style.configure("TButton", background=button_bg, foreground=button_fg)
        style.map("TButton", 
                 background=[('active', button_bg), ('pressed', button_bg)],
                 foreground=[('active', button_fg), ('pressed', button_fg)])
        
        # Configure entry style
        style.configure("TEntry", fieldbackground=entry_bg, foreground=entry_fg)
        style.configure("TSpinbox", fieldbackground=entry_bg, foreground=entry_fg)
        
        # Configure scale style
        style.configure("Horizontal.TScale", background=bg_color, troughcolor=entry_bg)
        
        # Configure special button style
        style.configure("Accent.TButton", font=("Arial", 11, "bold"), 
                       background=button_bg, foreground=button_fg)
        
        # Configure root window and text widget which are not ttk
        self.root.configure(bg=bg_color)
        
        # Configure the log text widget
        self.log_text.config(bg=log_bg, fg=log_fg, insertbackground=fg_color)
        
        # Configure status bar
        try:
            style.configure("Status.TLabel", background=frame_bg, foreground=fg_color)
            self.status_bar.configure(style="Status.TLabel")
        except:
            pass
        
        # Update any custom text tags
        for level, color in {
            "INFO": "#2ecc71",    # Green
            "ERROR": "#e74c3c",   # Red
            "WARNING": "#f39c12", # Orange
            "SUCCESS": "#3498db"  # Blue
        }.items():
            self.log_text.tag_configure(level, foreground=color)
            
        # Apply direct styling to all widgets to ensure proper color
        self._apply_direct_styling(bg_color, fg_color, entry_bg, entry_fg)
    
    def _apply_direct_styling(self, bg_color, fg_color, entry_bg, entry_fg):
        """Apply styling directly to all widgets for maximum compatibility."""
        # Instead of using custom findall_children which may have issues,
        # let's directly style widgets we already have references to
        
        # Style connection frame elements
        self.conn_status.configure(foreground="red" if not self.connected else "green")
        
        # Style all labels in the attack configuration frame
        for widget in self.root.winfo_children():
            if isinstance(widget, ttk.LabelFrame):
                for child in widget.winfo_children():
                    if isinstance(child, ttk.Label):
                        child.configure(background=bg_color, foreground=fg_color)
        
        # Style log text explicitly
        self.log_text.config(bg=entry_bg, fg=fg_color)
        
        # Style any entries directly
        self.host_entry.configure(style="TEntry")
        self.port_entry.configure(style="TEntry")
        
        # Make the connection status label more visible
        if hasattr(self, 'conn_status'):
            self.conn_status.configure(foreground="red" if not self.connected else "green")
    
    def setup_ui(self):
        """Setup the user interface."""
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Title
        title_label = ttk.Label(
            main_frame, 
            text="IDS Attack Panel", 
            font=("Arial", 16, "bold")
        )
        title_label.pack(pady=(0, 10))
        
        # Connection Frame
        conn_frame = ttk.LabelFrame(main_frame, text="Bridge Connection", padding="5")
        conn_frame.pack(fill=tk.X, padx=5, pady=5)
        
        ttk.Label(conn_frame, text="Host:").grid(row=0, column=0, padx=5, pady=2, sticky=tk.W)
        self.host_entry = ttk.Entry(conn_frame, width=15)
        self.host_entry.insert(0, self.bridge_host)
        self.host_entry.grid(row=0, column=1, padx=5, pady=2, sticky=tk.W)
        
        ttk.Label(conn_frame, text="Port:").grid(row=0, column=2, padx=5, pady=2, sticky=tk.W)
        self.port_entry = ttk.Entry(conn_frame, width=8)
        self.port_entry.insert(0, str(self.bridge_port))
        self.port_entry.grid(row=0, column=3, padx=5, pady=2, sticky=tk.W)
        
        self.conn_button = ttk.Button(conn_frame, text="Connect", command=self.connect_to_bridge)
        self.conn_button.grid(row=0, column=4, padx=5, pady=2)
        
        self.conn_status = ttk.Label(conn_frame, text="Not Connected", foreground="red")
        self.conn_status.grid(row=0, column=5, padx=5, pady=2)
        
        # Attack Configuration Frame
        attack_frame = ttk.LabelFrame(main_frame, text="Attack Configuration", padding="5")
        attack_frame.pack(fill=tk.X, padx=5, pady=5)
        
        # Attack Type
        ttk.Label(attack_frame, text="Attack Type:").grid(row=0, column=0, padx=5, pady=5, sticky=tk.W)
        attack_types_frame = ttk.Frame(attack_frame)
        attack_types_frame.grid(row=0, column=1, columnspan=3, padx=5, pady=5, sticky=tk.W)
        
        # Add radio buttons for attack types
        for i, (attack_type, color) in enumerate(ATTACK_TYPES.items()):
            if attack_type != "normal":  # Don't include normal as an attack option
                rb = ttk.Radiobutton(
                    attack_types_frame,
                    text=attack_type.upper(),
                    value=attack_type,
                    variable=self.selected_attack
                )
                rb.grid(row=0, column=i, padx=10)
        
        # Intensity slider
        ttk.Label(attack_frame, text="Intensity:").grid(row=1, column=0, padx=5, pady=5, sticky=tk.W)
        intensity_scale = ttk.Scale(
            attack_frame,
            from_=0.1,
            to=1.0,
            orient=tk.HORIZONTAL,
            variable=self.intensity,
            length=200
        )
        intensity_scale.grid(row=1, column=1, columnspan=2, padx=5, pady=5, sticky=tk.W)
        
        intensity_label = ttk.Label(attack_frame, textvariable=tk.StringVar(value="0.5"))
        intensity_label.grid(row=1, column=3, padx=5, pady=5, sticky=tk.W)
        
        # Update intensity label when slider changes
        def update_intensity(*args):
            intensity_label.config(text=f"{self.intensity.get():.1f}")
        
        self.intensity.trace_add("write", update_intensity)
        
        # Number of packets
        ttk.Label(attack_frame, text="Packets:").grid(row=2, column=0, padx=5, pady=5, sticky=tk.W)
        packets_spinner = ttk.Spinbox(
            attack_frame,
            from_=1,
            to=100,
            textvariable=self.packet_count,
            width=5
        )
        packets_spinner.grid(row=2, column=1, padx=5, pady=5, sticky=tk.W)
        
        # Advanced mode checkbox
        advanced_check = ttk.Checkbutton(
            attack_frame,
            text="Advanced Mode",
            variable=self.advanced_mode,
            command=self.toggle_advanced_mode
        )
        advanced_check.grid(row=2, column=2, padx=5, pady=5, sticky=tk.W)
        
        # Advanced options frame (hidden by default)
        self.advanced_frame = ttk.LabelFrame(main_frame, text="Advanced Options", padding="5")
        
        # Source IP/Port
        ttk.Label(self.advanced_frame, text="Source IP:").grid(row=0, column=0, padx=5, pady=2, sticky=tk.W)
        src_ip_entry = ttk.Entry(self.advanced_frame, textvariable=self.src_ip, width=15)
        src_ip_entry.grid(row=0, column=1, padx=5, pady=2, sticky=tk.W)
        
        ttk.Label(self.advanced_frame, text="Port:").grid(row=0, column=2, padx=5, pady=2, sticky=tk.W)
        src_port_entry = ttk.Entry(self.advanced_frame, textvariable=self.src_port, width=8)
        src_port_entry.grid(row=0, column=3, padx=5, pady=2, sticky=tk.W)
        
        # Destination IP/Port
        ttk.Label(self.advanced_frame, text="Dest IP:").grid(row=1, column=0, padx=5, pady=2, sticky=tk.W)
        dst_ip_entry = ttk.Entry(self.advanced_frame, textvariable=self.dst_ip, width=15)
        dst_ip_entry.grid(row=1, column=1, padx=5, pady=2, sticky=tk.W)
        
        ttk.Label(self.advanced_frame, text="Port:").grid(row=1, column=2, padx=5, pady=2, sticky=tk.W)
        dst_port_entry = ttk.Entry(self.advanced_frame, textvariable=self.dst_port, width=8)
        dst_port_entry.grid(row=1, column=3, padx=5, pady=2, sticky=tk.W)
        
        # Randomize button
        randomize_btn = ttk.Button(
            self.advanced_frame,
            text="Randomize",
            command=self.randomize_ips
        )
        randomize_btn.grid(row=1, column=4, padx=5, pady=2)
        
        # Custom features (for advanced users)
        ttk.Label(self.advanced_frame, text="Custom Features:").grid(row=2, column=0, padx=5, pady=5, sticky=tk.W)
        self.features_entry = ttk.Entry(self.advanced_frame, width=40)
        self.features_entry.grid(row=2, column=1, columnspan=3, padx=5, pady=5, sticky=tk.EW)
        
        ttk.Label(
            self.advanced_frame,
            text="Format: feature1=value1,feature2=value2",
            font=("Arial", 8)
        ).grid(row=3, column=1, columnspan=3, padx=5, pady=0, sticky=tk.W)
        
        # Launch Attack button
        attack_btn_frame = ttk.Frame(main_frame)
        attack_btn_frame.pack(fill=tk.X, padx=5, pady=10)
        
        self.attack_button = ttk.Button(
            attack_btn_frame,
            text="LAUNCH ATTACK",
            command=self.launch_attack,
            style="Accent.TButton"
        )
        self.attack_button.pack(pady=5)
        
        # Style the attack button to stand out
        style = ttk.Style()
        style.configure("Accent.TButton", font=("Arial", 11, "bold"))
        
        # Log area
        log_frame = ttk.LabelFrame(main_frame, text="Attack Log", padding="5")
        log_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        self.log_text = scrolledtext.ScrolledText(
            log_frame,
            wrap=tk.WORD,
            width=40,
            height=10
        )
        self.log_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.log_text.config(state=tk.DISABLED)
        
        # Status bar
        self.status_var = tk.StringVar(value="Ready")
        self.status_bar = ttk.Label(
            self.root,
            textvariable=self.status_var,
            relief=tk.SUNKEN,
            anchor=tk.W
        )
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
    
    def toggle_advanced_mode(self):
        """Toggle visibility of advanced options."""
        if self.advanced_mode.get():
            self.advanced_frame.pack(fill=tk.X, padx=5, pady=5)
        else:
            self.advanced_frame.pack_forget()
    
    def randomize_ips(self):
        """Randomize IP addresses and ports."""
        self.src_ip.set(f"192.168.{random.randint(1, 254)}.{random.randint(1, 254)}")
        self.src_port.set(random.randint(10000, 65000))
        self.dst_ip.set(f"10.0.{random.randint(1, 254)}.{random.randint(1, 254)}")
        self.dst_port.set(random.randint(1, 1024))
    
    def log_message(self, message, level="INFO"):
        """Log a message to both the console and log widget."""
        # Log to logger
        log_func = getattr(logger, level.lower(), logger.info)
        log_func(message)
        
        # Log to widget
        timestamp = datetime.now().strftime('%H:%M:%S')
        
        self.log_text.config(state=tk.NORMAL)
        self.log_text.insert(tk.END, f"[{timestamp}] ", "timestamp")
        
        # Use appropriate tag for the level
        level_tag = level.upper()
        if level_tag not in ["INFO", "ERROR", "WARNING", "SUCCESS", "DEBUG"]:
            level_tag = "INFO"
            
        level_str = f"[{level_tag}] "
        self.log_text.insert(tk.END, level_str, level_tag)
        self.log_text.insert(tk.END, f"{message}\n")
        
        # Make sure all tags are configured
        if not hasattr(self, '_tags_configured'):
            self.log_text.tag_configure("INFO", foreground="#3498db")     # Blue
            self.log_text.tag_configure("ERROR", foreground="#e74c3c")    # Red
            self.log_text.tag_configure("WARNING", foreground="#f39c12")  # Orange
            self.log_text.tag_configure("SUCCESS", foreground="#2ecc71")  # Green
            self.log_text.tag_configure("DEBUG", foreground="#95a5a6")    # Gray
            self.log_text.tag_configure("timestamp", foreground="#666666")
            self._tags_configured = True
        
        # Scroll to bottom
        self.log_text.see(tk.END)
        self.log_text.config(state=tk.DISABLED)
    
    def connect_to_bridge(self):
        """Connect to the IDS bridge."""
        # Update host and port from UI
        try:
            self.bridge_host = self.host_entry.get()
            self.bridge_port = int(self.port_entry.get())
        except ValueError:
            self.log_message("Invalid port number", "ERROR")
            return
        
        # If already connected, disconnect first
        if self.connected:
            self.log_message("Disconnecting from current bridge...", "INFO")
            try:
                if self.socket:
                    self.socket.close()
                self.socket = None
                self.connected = False
                self.conn_status.config(text="Not Connected", foreground="red")
                self.conn_button.config(text="Connect")
                self.status_var.set("Disconnected from IDS Bridge")
                time.sleep(0.5)  # Brief delay to ensure socket closes properly
            except Exception as e:
                self.log_message(f"Error disconnecting: {str(e)}", "ERROR")
            return
        
        try:
            # Create a new socket
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.settimeout(5)
            
            # Connect to the Bridge Command port (bridge_port + 1)
            actual_port = self.bridge_port + 1
            self.log_message(f"Connecting to command port on {self.bridge_host}:{actual_port}", "INFO")
            
            self.socket.connect((self.bridge_host, actual_port))
            self.connected = True
            
            # Update UI elements
            self.conn_status.config(text="Connected", foreground="green")
            self.conn_button.config(text="Disconnect")
            self.log_message(f"Connected to IDS Bridge at {self.bridge_host}:{actual_port}", "SUCCESS")
            self.status_var.set("Connected to IDS Bridge")
            
            # Test connection with a heartbeat
            self.heartbeat_thread = threading.Thread(target=self.heartbeat, daemon=True)
            self.heartbeat_thread.start()
            
            return True
        except Exception as e:
            self.connected = False
            self.conn_status.config(text="Not Connected", foreground="red")
            self.conn_button.config(text="Connect")
            self.log_message(f"Connection failed: {str(e)}", "ERROR")
            self.status_var.set("Connection failed")
            if self.socket:
                self.socket.close()
                self.socket = None
            return False
    
    def heartbeat(self):
        """Send periodic heartbeats to keep the connection alive."""
        heartbeat_interval = 3  # Send heartbeat every 3 seconds
        retry_count = 0
        max_retries = 3
        
        while self.connected and self.socket:
            try:
                # Send heartbeat message
                self.socket.sendall(b'{"type": "heartbeat"}\n')
                self.log_message("Sent heartbeat", "DEBUG")
                
                # Try to receive a response
                self.socket.settimeout(2.0)
                try:
                    response = self.socket.recv(1024)
                    if not response:
                        raise Exception("Empty response")
                    
                    # Try to parse response
                    try:
                        resp_data = json.loads(response.decode('utf-8'))
                        self.log_message(f"Heartbeat response: {resp_data.get('status', 'unknown')}", "DEBUG")
                        
                        # Reset retry count on successful response
                        retry_count = 0
                    except json.JSONDecodeError:
                        self.log_message(f"Invalid JSON in heartbeat response: {response}", "DEBUG")
                except socket.timeout:
                    # Increment retry count on timeout
                    retry_count += 1
                    self.log_message(f"Heartbeat timeout ({retry_count}/{max_retries})", "DEBUG")
                    
                    if retry_count >= max_retries:
                        raise Exception(f"No response after {max_retries} attempts")
                    
                # Sleep before next heartbeat
                time.sleep(heartbeat_interval)
                
            except Exception as e:
                # Only log if we haven't already detected disconnection
                if self.connected:
                    self.connected = False
                    self.log_message(f"Connection check failed: {str(e)}", "ERROR")
                    # Update UI from main thread
                    self.root.after(0, lambda: self.conn_status.config(text="Not Connected", foreground="red"))
                    self.root.after(0, lambda: self.conn_button.config(text="Connect"))
                    # Try to close the socket cleanly
                    try:
                        self.socket.close()
                    except:
                        pass
                    self.socket = None
                break
    
    def launch_attack(self):
        """Launch an attack with configured parameters."""
        if not self.connected:
            # Attempt to reconnect
            self.log_message("Not connected. Attempting to connect...", "WARNING")
            if not self.connect_to_bridge():
                self.log_message("Cannot launch attack: Not connected to IDS Bridge", "ERROR")
                messagebox.showerror("Connection Error", "Failed to connect to the IDS Bridge. Please check connection settings and try again.")
                return
        
        # Now proceed with attack launch
        attack_type = self.selected_attack.get()
        intensity = self.intensity.get()
        packet_count = self.packet_count.get()
        
        # Create attack data with timestamp in ISO format for better parsing
        attack_data = {
            "type": "attack",
            "attack_type": attack_type,
            "intensity": float(intensity),  # Ensure it's a float
            "count": int(packet_count),     # Ensure it's an integer
            "timestamp": datetime.now().isoformat()
        }
        
        # Add advanced options if enabled
        if self.advanced_mode.get():
            attack_data["src_ip"] = self.src_ip.get()
            attack_data["src_port"] = int(self.src_port.get())
            attack_data["dst_ip"] = self.dst_ip.get()
            attack_data["dst_port"] = int(self.dst_port.get())
            
            # Parse custom features
            custom_features = {}
            if self.features_entry.get().strip():
                try:
                    for feature_str in self.features_entry.get().split(','):
                        name, value = feature_str.split('=')
                        custom_features[name.strip()] = float(value.strip())
                    attack_data["custom_features"] = custom_features
                except Exception as e:
                    self.log_message(f"Invalid custom features format: {str(e)}", "ERROR")
                    return
        
        try:
            # Disable the button to prevent multiple attacks while processing
            self.attack_button.config(state=tk.DISABLED)
            
            # Send attack data to bridge
            json_data = json.dumps(attack_data)
            self.socket.sendall(f"{json_data}\n".encode())
            self.log_message(f"Attack request sent for {attack_type.upper()}", "INFO")
            
            # Try to receive response with timeout
            self.socket.settimeout(5.0)
            try:
                response = self.socket.recv(1024)
                if response:
                    try:
                        resp_data = json.loads(response.decode('utf-8'))
                        if resp_data.get('status') == 'success':
                            self.log_message(
                                f"Launched {attack_type.upper()} attack with intensity {intensity:.1f}, {packet_count} packets",
                                "SUCCESS"
                            )
                        else:
                            self.log_message(f"Attack response: {resp_data.get('message', 'Unknown response')}", "WARNING")
                    except json.JSONDecodeError:
                        self.log_message(f"Invalid response from server", "WARNING")
                        self.log_message(f"Raw response: {response}", "DEBUG")
            except socket.timeout:
                # No response received but attack might still have been processed
                self.log_message(
                    f"No confirmation received, but {attack_type.upper()} attack may have been processed",
                    "WARNING"
                )
            except Exception as e:
                self.log_message(f"Error receiving attack confirmation: {str(e)}", "ERROR")
                
            # Reset socket timeout to default
            self.socket.settimeout(2.0)
            
            # Update status bar
            self.status_var.set(f"Attack sent: {attack_type.upper()}")
            
        except Exception as e:
            self.log_message(f"Failed to send attack: {str(e)}", "ERROR")
            self.connected = False
            self.conn_status.config(text="Not Connected", foreground="red")
            self.conn_button.config(text="Connect")
            messagebox.showerror("Send Error", f"Failed to send attack: {str(e)}")
        finally:
            # Re-enable the button after a short delay
            self.root.after(1000, lambda: self.attack_button.config(state=tk.NORMAL))


def main():
    """Main entry point for the attack panel."""
    parser = argparse.ArgumentParser(description='IDS Attack Panel')
    parser.add_argument('--bridge-host', default='localhost', help='IDS Bridge host')
    parser.add_argument('--bridge-port', type=int, default=5000, 
                      help='IDS Bridge monitor port (attack commands will use port+1)')
    parser.add_argument('--light-mode', action='store_true', help='Use light mode instead of dark mode')
    args = parser.parse_args()
    
    # Log startup information
    logger.info(f"Starting Attack Panel connecting to {args.bridge_host}:{args.bridge_port} (commands on port {args.bridge_port+1})")
    
    root = tk.Tk()
    app = AttackPanel(root, args.bridge_host, args.bridge_port, args.light_mode)
    
    # Set window icon if available
    try:
        root.iconbitmap("assets/attack_icon.ico")
    except:
        pass
    
    root.mainloop()


if __name__ == "__main__":
    main() 