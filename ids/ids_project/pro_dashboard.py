#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
DeepIDS Professional Dashboard
A comprehensive monitoring and analytics dashboard for the DeepIDS system.
"""

import os
import sys
import time
import json
import math
import random
import logging
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import numpy as np
import subprocess
import threading
import traceback
import argparse
from datetime import datetime
from matplotlib.figure import Figure
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import matplotlib
matplotlib.use("TkAgg")  # Set the backend before importing pyplot
import queue

# Import Pillow for better image handling
try:
    from PIL import Image, ImageTk
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("Consider installing Pillow for better graphics: pip install pillow")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('IDS-Dashboard')

# Modern color scheme
THEME_COLORS = {
    'dark': {
        'bg': '#1e1e2e',             # Background color
        'card_bg': '#313244',        # Card background color
        'fg': '#cdd6f4',             # Text color
        'accent': '#89b4fa',         # Accent color
        'highlight': '#f5c2e7',      # Highlight color
        'success': '#a6e3a1',        # Success color
        'warning': '#f9e2af',        # Warning color
        'danger': '#f38ba8',         # Danger color
        'info': '#89dceb',           # Info color
        'border': '#6c7086',         # Border color
        'entry_bg': '#313244',       # Entry background
        'entry_fg': '#cdd6f4',       # Entry text
        'chart_bg': '#1e1e2e',       # Chart background
        'grid_color': '#45475a'      # Chart grid color
    },
    'light': {
        'bg': '#f5f5fa',             # Background color
        'card_bg': '#ffffff',        # Card background color
        'fg': '#24273a',             # Text color
        'accent': '#7287fd',         # Accent color
        'highlight': '#ea76cb',      # Highlight color
        'success': '#40a02b',        # Success color
        'warning': '#df8e1d',        # Warning color
        'danger': '#d20f39',         # Danger color
        'info': '#209fb5',           # Info color
        'border': '#8c8fa1',         # Border color
        'entry_bg': '#ffffff',       # Entry background
        'entry_fg': '#24273a',       # Entry text
        'chart_bg': '#f5f5fa',       # Chart background
        'grid_color': '#cad3f5'      # Chart grid color
    }
}

# Attack colors for visual identification
ATTACK_COLORS = {
    'normal': '#a6e3a1',  # Green
    'dos': '#f38ba8',     # Red
    'probe': '#89b4fa',   # Blue
    'r2l': '#f9e2af',     # Yellow
    'u2r': '#f5c2e7'      # Pink
}

# Animation durations in milliseconds
ANIMATIONS = {
    'counter': 300,       # Duration for counter animations
    'flash': 150,         # Duration for flash animations
    'transition': 200     # Duration for tab transitions
}

# Try to import ttkthemes for better styling
try:
    from ttkthemes import ThemedTk
    USE_THEMED_TK = True
except ImportError:
    USE_THEMED_TK = False
    
# Import the FastIDS class from fast_run.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ids_project.fast_run import FastIDS

# Import for Windows notifications
try:
    from win10toast import ToastNotifier
    TOAST_AVAILABLE = True
except ImportError:
    TOAST_AVAILABLE = False
    print("ToastNotifier not available. Install with: pip install win10toast")

class AttackLogger:
    """Logs and analyzes attack patterns."""
    
    def __init__(self, log_dir="logs"):
        """Initialize attack logger."""
        self.log_dir = log_dir
        os.makedirs(log_dir, exist_ok=True)
        
        # Create attack database file if it doesn't exist
        self.db_file = os.path.join(log_dir, "attack_database.json")
        if not os.path.exists(self.db_file):
            with open(self.db_file, 'w') as f:
                json.dump({
                    "known_attacks": {},
                    "unknown_attacks": [],
                    "stats": {
                        "total_logged": 0,
                        "by_type": {}
                    }
                }, f)
        
        # Load attack database
        self.load_database()
        
        # Current day's log file
        self.today = datetime.now().strftime('%Y-%m-%d')
        self.log_file = os.path.join(log_dir, f"attacks_{self.today}.csv")
        
        # Create log file with header if it doesn't exist
        if not os.path.exists(self.log_file):
            with open(self.log_file, 'w') as f:
                f.write("timestamp,attack_type,confidence,is_known,signature_hash\n")
    
    def load_database(self):
        """Load attack database from file."""
        try:
            with open(self.db_file, 'r') as f:
                self.database = json.load(f)
        except Exception as e:
            logger.error(f"Error loading attack database: {e}")
            self.database = {
                "known_attacks": {},
                "unknown_attacks": [],
                "stats": {
                    "total_logged": 0,
                    "by_type": {}
                }
            }
    
    def save_database(self):
        """Save attack database to file."""
        try:
            with open(self.db_file, 'w') as f:
                json.dump(self.database, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving attack database: {e}")
    
    def log_attack(self, attack_data):
        """
        Log attack to database and analyze for new patterns.
        
        Args:
            attack_data: Dictionary containing attack information
        """
        # Calculate signature hash based on feature patterns
        features = np.array(attack_data.get('features', []))
        signature = self._calculate_signature(features)
        
        # Check if this is a known attack signature
        attack_type = attack_data.get('attack_type', 'unknown')
        is_known = signature in self.database["known_attacks"].get(attack_type, [])
        
        # Log to CSV file
        self._log_to_file(attack_data, signature, is_known)
        
        # Update database
        if not is_known:
            self._add_to_database(attack_data, signature)
        
        # Update statistics
        self._update_statistics(attack_type)
        
        return is_known
    
    def _calculate_signature(self, features):
        """Calculate a signature hash for the attack pattern."""
        # Simple signature based on feature patterns
        if len(features) == 0:
            return "empty"
            
        # Normalize and quantize features to create a stable pattern
        try:
            features = features.flatten()
            min_val = np.min(features)
            max_val = np.max(features)
            if max_val > min_val:
                features = ((features - min_val) / (max_val - min_val) * 10).astype(int)
            signature = hash(features.tobytes())
            
            # Convert to a positive hex string
            return hex(abs(signature))[2:10]
        except Exception as e:
            logger.error(f"Error calculating signature: {e}")
            return "error"
    
    def _log_to_file(self, attack_data, signature, is_known):
        """Log attack to CSV file."""
        try:
            # Check if we need to create a new day's log file
            today = datetime.now().strftime('%Y-%m-%d')
            if today != self.today:
                self.today = today
                self.log_file = os.path.join(self.log_dir, f"attacks_{self.today}.csv")
                
                # Create new log file with header
                if not os.path.exists(self.log_file):
                    with open(self.log_file, 'w') as f:
                        f.write("timestamp,attack_type,confidence,is_known,signature_hash\n")
            
            # Append to log file
            with open(self.log_file, 'a') as f:
                f.write(f"{attack_data['timestamp']},{attack_data['attack_type']},{attack_data['confidence']},{1 if is_known else 0},{signature}\n")
                
        except Exception as e:
            logger.error(f"Error logging attack to file: {e}")
    
    def _add_to_database(self, attack_data, signature):
        """Add a new attack signature to the database."""
        attack_type = attack_data.get('attack_type', 'unknown')
        
        # Initialize attack type list if not present
        if attack_type not in self.database["known_attacks"]:
            self.database["known_attacks"][attack_type] = []
        
        # Add signature to known attacks
        if signature not in self.database["known_attacks"][attack_type]:
            self.database["known_attacks"][attack_type].append(signature)
            
            # Add to unknown_attacks list with metadata
            self.database["unknown_attacks"].append({
                "timestamp": attack_data['timestamp'],
                "attack_type": attack_type,
                "signature": signature,
                "confidence": attack_data['confidence'],
                "analyzed": False
            })
            
            # Save database
            self.save_database()
    
    def _update_statistics(self, attack_type):
        """Update attack statistics."""
        self.database["stats"]["total_logged"] += 1
        
        if attack_type not in self.database["stats"]["by_type"]:
            self.database["stats"]["by_type"][attack_type] = 0
            
        self.database["stats"]["by_type"][attack_type] += 1
        
        # Save database periodically (every 10 attacks)
        if self.database["stats"]["total_logged"] % 10 == 0:
            self.save_database()
    
    def get_stats(self):
        """Get attack statistics."""
        return self.database["stats"]
    
    def get_unknown_attacks(self, limit=10):
        """Get list of unknown attack patterns."""
        return self.database["unknown_attacks"][-limit:]
    
    def mark_as_analyzed(self, signature):
        """Mark an unknown attack as analyzed."""
        for attack in self.database["unknown_attacks"]:
            if attack["signature"] == signature:
                attack["analyzed"] = True
                
        self.save_database()

class ProDashboard:
    """
    Professional Dashboard for DeepIDS.
    Features a modern UI with real-time monitoring capabilities.
    """
    
    def __init__(self, ids_instance, dark_mode=True):
        """Initialize the dashboard."""
        self.ids = ids_instance
        self.dark_mode = dark_mode
        self.theme = THEME_COLORS['dark'] if dark_mode else THEME_COLORS['light']
        self.alert_queue = queue.Queue()
        self.attack_counts = {attack_type: 0 for attack_type in ATTACK_COLORS.keys()}
        self.running = True
        self.max_data_points = 30  # Show max 30 points on graphs
        self.confidence_queue = []
        
        # Create attack logger
        self.attack_logger = AttackLogger()
        
        # Create root window with fixed minimum size
        if hasattr(tk, 'Tk'):
            self.root = tk.Tk()
        else:
            logger.error("Tkinter initialization failed!")
            return
            
        # Set window title and size
        self.root.title("DeepIDS Professional Dashboard")
        self.root.geometry("1280x800")
        self.root.minsize(1024, 768)
        
        # Add window icon if available
        self._set_window_icon()
        
        # Setup style
        self.style = ttk.Style()
        self._setup_style(dark_mode)
        
        # Create dashboard UI
        self._create_dashboard()
        
        # Set up window close handler
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)
        
        # Auto-connect to bridge
        self._auto_connect()
        
        # Schedule periodic UI update
        self.update_task()
        
    def _set_window_icon(self):
        """Set window icon if available."""
        if not HAS_PIL:
            return
            
        # Try to load icon from various locations
        icon_paths = [
            "assets/ids_icon.png",
            "ids_project/assets/ids_icon.png",
            os.path.join(os.path.dirname(__file__), "assets/ids_icon.png")
        ]
        
        for path in icon_paths:
            try:
                if os.path.exists(path):
                    icon = ImageTk.PhotoImage(Image.open(path))
                    self.root.iconphoto(True, icon)
                    return
            except Exception as e:
                logger.debug(f"Could not load icon from {path}: {e}")
        
    def _setup_style(self, dark_mode):
        """Configure ttk styles for the dashboard."""
        # Set theme base
        self._apply_theme_basics()
        
        # Apply specific theme styles
        if dark_mode:
            self._configure_dark_style()
        else:
            self._configure_light_style()
        
        # Apply theme
        self._apply_theme()
        
    def _apply_theme_basics(self):
        """Apply basic theme settings."""
        # Configure fonts
        default_font = ("Segoe UI", 10)
        title_font = ("Segoe UI", 18, "bold")
        header_font = ("Segoe UI", 14, "bold")
        subheader_font = ("Segoe UI", 12, "bold")
        stat_font = ("Segoe UI", 24, "bold")
        
        # Store fonts for later use
        self.fonts = {
            'default': default_font,
            'title': title_font,
            'header': header_font,
            'subheader': subheader_font,
            'stat': stat_font
        }
        
        # Apply basic theme settings
        self.style.configure(".", font=default_font)
        
        # Override default theme settings
        self.style.configure("TButton", padding=6)
        self.style.configure("TFrame", borderwidth=0)
        self.style.configure("TNotebook", tabmargins=[2, 5, 2, 0])
        self.style.configure("TNotebook.Tab", padding=[10, 5], font=default_font)
            
    def _apply_theme(self):
        """Apply theme to root window."""
        self.root.configure(background=self.theme["bg"])
        
    def _create_dashboard(self):
        """Create the main dashboard UI."""
        # Main container with padding
        self.main_container = ttk.Frame(self.root, padding="10", style="MainFrame.TFrame")
        self.main_container.pack(fill=tk.BOTH, expand=True)
        
        # Add a header with logo and title
        self._create_header(self.main_container)
        
        # Main content area with tabs
        self.notebook = ttk.Notebook(self.main_container)
        self.notebook.pack(fill=tk.BOTH, expand=True, pady=10)
        
        # Create tabs
        self.overview_tab = ttk.Frame(self.notebook, style="Tab.TFrame")
        self.stats_tab = ttk.Frame(self.notebook, style="Tab.TFrame")
        self.analytics_tab = ttk.Frame(self.notebook, style="Tab.TFrame")
        self.settings_tab = ttk.Frame(self.notebook, style="Tab.TFrame")
        
        # Add tabs to notebook with icons if available
        self.notebook.add(self.overview_tab, text="Overview")
        self.notebook.add(self.stats_tab, text="Statistics")
        self.notebook.add(self.analytics_tab, text="Analytics")
        self.notebook.add(self.settings_tab, text="Settings")
        
        # Set up tab content
        self._create_overview()
        self._create_stats_panel(self.stats_tab)
        self._create_analytics()
        self._create_settings()
        
        # Add tab change event handler
        self.notebook.bind("<<NotebookTabChanged>>", self._on_tab_changed)
        
        # Status bar
        status_frame = ttk.Frame(self.root, style="StatusBar.TFrame")
        status_frame.pack(side=tk.BOTTOM, fill=tk.X)
        
        self.status_var = tk.StringVar(value="Ready")
        status_label = ttk.Label(status_frame, textvariable=self.status_var, padding=(10, 5), style="Status.TLabel")
        status_label.pack(side=tk.LEFT)
        
        # Version info
        version_label = ttk.Label(status_frame, text="DeepIDS v2.1", padding=(10, 5), style="Status.TLabel")
        version_label.pack(side=tk.RIGHT)
        
        # Connection status
        self.connection_status = ttk.Label(status_frame, text="Not Connected", foreground="red", padding=(10, 5), style="Status.TLabel")
        self.connection_status.pack(side=tk.RIGHT, padx=10)

    def _create_header(self, parent):
        """Create header with logo and title."""
        header_frame = ttk.Frame(parent, style="Header.TFrame")
        header_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Add logo if available
        if HAS_PIL:
            try:
                logo_paths = [
                    "assets/ids_logo.png",
                    "ids_project/assets/ids_logo.png",
                    os.path.join(os.path.dirname(__file__), "assets/ids_logo.png")
                ]
                
                for path in logo_paths:
                    if os.path.exists(path):
                        # Load and resize logo
                        logo_img = Image.open(path)
                        logo_img = logo_img.resize((40, 40), Image.LANCZOS)
                        logo_photo = ImageTk.PhotoImage(logo_img)
                        
                        # Store reference to prevent garbage collection
                        self.logo_photo = logo_photo
                        
                        # Create logo label
                        logo_label = ttk.Label(header_frame, image=logo_photo, style="Logo.TLabel")
                        logo_label.pack(side=tk.LEFT, padx=(0, 10))
                        break
            except Exception as e:
                logger.debug(f"Could not load logo: {e}")
        
        # Title
        title_label = ttk.Label(
            header_frame, 
            text="DeepIDS Professional Dashboard",
            font=self.fonts['title'],
            style="Title.TLabel"
        )
        title_label.pack(side=tk.LEFT)
        
        # Add control buttons to header right side
        controls_frame = ttk.Frame(header_frame, style="Header.TFrame")
        controls_frame.pack(side=tk.RIGHT)
        
        # Start/Stop button with icon
        self.start_stop_var = tk.StringVar(value="Start")
        self.start_stop_btn = ttk.Button(
            controls_frame,
            textvariable=self.start_stop_var,
            command=self._toggle_monitoring,
            style="Control.TButton",
            width=10
        )
        self.start_stop_btn.pack(side=tk.RIGHT, padx=5)
        
        # Connect button
        self.connect_btn = ttk.Button(
            controls_frame,
            text="Connect",
            command=self.connect_to_bridge,
            style="Control.TButton",
            width=10
        )
        self.connect_btn.pack(side=tk.RIGHT, padx=5)

    def _toggle_monitoring(self):
        """Toggle IDS monitoring on/off."""
        if self.start_stop_var.get() == "Start":
            self.start_ids()
            self.start_stop_var.set("Stop")
        else:
            self.stop_ids()
            self.start_stop_var.set("Start")

    def _create_overview(self):
        """Create the overview tab with dashboard elements."""
        # Create overview container
        overview_frame = ttk.Frame(self.overview_tab, padding=20)
        overview_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(overview_frame, text="IDS Dashboard Overview", style="Title.TLabel").pack(anchor="w", pady=10)
        ttk.Label(overview_frame, text="Real-time network security monitoring", style="Subheader.TLabel").pack(anchor="w", pady=5)
        
        # Stats cards row
        stats_frame = ttk.Frame(overview_frame)
        stats_frame.pack(fill=tk.X, pady=10)
        
        # Create stat cards with equal width
        stats_frame.columnconfigure(0, weight=1)
        stats_frame.columnconfigure(1, weight=1)
        stats_frame.columnconfigure(2, weight=1)
        
        # Uptime card
        uptime_card = self._create_card(stats_frame)
        uptime_card.grid(row=0, column=0, padx=5, sticky="ew")
        
        ttk.Label(uptime_card, text="System Uptime", font=("Segoe UI", 11, "bold")).pack(anchor="w")
        self.uptime_label = ttk.Label(uptime_card, text="0s", font=("Segoe UI", 20))
        self.uptime_label.pack(anchor="w", pady=5)
        
        # Traffic card
        traffic_card = self._create_card(stats_frame)
        traffic_card.grid(row=0, column=1, padx=5, sticky="ew")
        
        ttk.Label(traffic_card, text="Traffic Analyzed", font=("Segoe UI", 11, "bold")).pack(anchor="w")
        self.packets_label = ttk.Label(traffic_card, text="0", font=("Segoe UI", 20))
        self.packets_label.pack(anchor="w", pady=5)
        
        # Alerts card
        alerts_card = self._create_card(stats_frame)
        alerts_card.grid(row=0, column=2, padx=5, sticky="ew")
        
        ttk.Label(alerts_card, text="Alerts Detected", font=("Segoe UI", 11, "bold")).pack(anchor="w")
        self.alerts_label = ttk.Label(alerts_card, text="0", font=("Segoe UI", 20))
        self.alerts_label.pack(anchor="w", pady=5)
        
        # Visualization section
        viz_frame = ttk.Frame(overview_frame)
        viz_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        # Left panel - Confidence visualization
        conf_panel = ttk.LabelFrame(viz_frame, text="Detection Confidence")
        conf_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 5))
        
        # Set up the matplotlib figure for the confidence graph
        self.confidence_fig = Figure(figsize=(5, 3), dpi=100)
        self.confidence_ax = self.confidence_fig.add_subplot(111)
        self.confidence_ax.set_title("Detection Confidence")
        self.confidence_ax.set_ylim(0, 1)
        self.confidence_ax.set_ylabel("Confidence")
        self.confidence_ax.grid(True, alpha=0.3)
        
        # Create the canvas
        self.confidence_canvas = FigureCanvasTkAgg(self.confidence_fig, master=conf_panel)
        self.confidence_canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Initialize empty confidence data
        self.confidence_queue = []
        self.max_data_points = 20  # Show max 20 points on graph
        
        # Right panel - Alerts
        alerts_panel = ttk.LabelFrame(viz_frame, text="Recent Alerts")
        alerts_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=(5, 0))
        alerts_panel.alert_container = True  # Mark as alert container for flash effects
        
        # Add scrollable text widget for alerts
        self.alert_text = scrolledtext.ScrolledText(alerts_panel, wrap=tk.WORD, height=10)
        self.alert_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # Configure text tags for different alert types
        self.alert_text.tag_configure("timestamp", foreground="#666666")
        for attack_type, color in ATTACK_COLORS.items():
            self.alert_text.tag_configure(attack_type, foreground=color)

        # Add a small note at the bottom
        note_frame = ttk.Frame(overview_frame)
        note_frame.pack(fill=tk.X, pady=5)
        ttk.Label(
            note_frame,
            text="Note: Launch Attack Panel from the Settings tab to manually inject attacks.",
            font=("Segoe UI", 9, "italic")
        ).pack(anchor=tk.W)

    def _on_tab_changed(self, event):
        """Handle tab change events to update the UI accordingly."""
        tab_id = self.notebook.select()
        tab_name = self.notebook.tab(tab_id, "text")
        
        # Update status bar
        self.status_var.set(f"Viewing {tab_name} tab")
        
        # Perform tab-specific refresh actions
        if tab_name == "Overview":
            # Refresh overview data
            self.update_attack_distribution()
        elif tab_name == "Statistics":
            # Refresh statistics
            self._update_stats_tab()
        elif tab_name == "Analytics":
            # Refresh analytics
            self.update_new_patterns()
        
        # Apply custom styling to highlight the active tab
        self._highlight_active_tab(tab_id)
        
    def _highlight_active_tab(self, tab_id):
        """Highlight the active tab with custom styling."""
        # Reset all tabs to default style
        for tab in self.notebook.tabs():
            self.notebook.tab(tab, padding=(10, 5))
        
        # Highlight active tab with different padding and style
        self.notebook.tab(tab_id, padding=(15, 8))

    def _create_stats_panel(self, parent):
        """Create the statistics panel with data display."""
        # Create stats container
        stats_frame = ttk.Frame(parent, padding=20)
        stats_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(stats_frame, text="System Statistics", style="Title.TLabel").pack(anchor="w", pady=10)
        ttk.Label(stats_frame, text="Detailed system performance and detection metrics", style="Subheader.TLabel").pack(anchor="w", pady=5)
        
        # Create stats treeview
        tree_frame = ttk.Frame(stats_frame)
        tree_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        # Create columns for the treeview
        columns = ("metric", "value")
        self.stats_tree = ttk.Treeview(tree_frame, columns=columns, show="headings", height=15)
        
        # Configure columns
        self.stats_tree.heading("metric", text="Metric")
        self.stats_tree.heading("value", text="Value")
        self.stats_tree.column("metric", width=200)
        self.stats_tree.column("value", width=300)
        
        # Add scrollbar
        tree_scroll = ttk.Scrollbar(tree_frame, orient="vertical", command=self.stats_tree.yview)
        self.stats_tree.configure(yscrollcommand=tree_scroll.set)
        
        # Pack tree and scrollbar
        self.stats_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        tree_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Initialize with empty data
        self._update_stats_tab()

    def _update_stats_tab(self):
        """Update content in the statistics tab."""
        # This method refreshes data in the statistics tab
        if hasattr(self, 'stats_tree'):
            stats = self.ids.get_stats()
            
            # Clear existing items
            for item in self.stats_tree.get_children():
                self.stats_tree.delete(item)
                
            # Add updated stats
            for key, value in stats.items():
                if key not in ['confidence_history', 'alert_history']:
                    self.stats_tree.insert('', 'end', values=(key, value))
                    
        # Update charts if they exist
        if hasattr(self, 'confidence_chart'):
            self.update_confidence_chart()
    
    def _create_analytics(self):
        """Create analytics page."""
        analytics_frame = ttk.Frame(self.analytics_tab, padding=20)
        analytics_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(analytics_frame, text="Analytics Dashboard", style="Title.TLabel").pack(anchor="w", pady=10)
        ttk.Label(analytics_frame, text="Advanced attack pattern analysis and network traffic metrics", style="Subheader.TLabel").pack(anchor="w", pady=5)
        
        # Create a card for attack analytics
        analytics_card = self._create_card(analytics_frame, title="Attack Analytics")
        analytics_card.pack(fill=tk.BOTH, expand=True, pady=15)
        
        # Create content frame for attack analytics
        content_frame = ttk.Frame(analytics_card)
        content_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Create attack distribution section
        ttk.Label(content_frame, text="Attack Type Distribution", style="Subheader.TLabel").pack(anchor="w", pady=(0, 5))
        
        # Create matplotlib figure for attack distribution
        self.attack_fig = Figure(figsize=(8, 3), dpi=100)
        self.attack_ax = self.attack_fig.add_subplot(111)
        self.attack_bars = None
        
        self.attack_canvas = FigureCanvasTkAgg(self.attack_fig, master=content_frame)
        self.attack_canvas.get_tk_widget().pack(fill=tk.X, expand=False, pady=(0, 20))
        
        # Add separator between sections
        ttk.Separator(content_frame, orient=tk.HORIZONTAL).pack(fill=tk.X, pady=10)
        
        # Create new attack patterns section
        ttk.Label(content_frame, text="New Attack Patterns", style="Subheader.TLabel").pack(anchor="w", pady=(10, 5))
        
        # Create frame for treeview and scrollbar
        tree_frame = ttk.Frame(content_frame)
        tree_frame.pack(fill=tk.BOTH, expand=True)
        
        # Create treeview for new attack patterns
        columns = ("timestamp", "type", "confidence", "signature", "status")
        self.new_patterns_tree = ttk.Treeview(tree_frame, columns=columns, show="headings", height=10)
        
        # Define column headings
        self.new_patterns_tree.heading("timestamp", text="Timestamp")
        self.new_patterns_tree.heading("type", text="Attack Type")
        self.new_patterns_tree.heading("confidence", text="Confidence")
        self.new_patterns_tree.heading("signature", text="Signature")
        self.new_patterns_tree.heading("status", text="Status")
        
        # Define column widths
        self.new_patterns_tree.column("timestamp", width=150)
        self.new_patterns_tree.column("type", width=100)
        self.new_patterns_tree.column("confidence", width=80)
        self.new_patterns_tree.column("signature", width=100)
        self.new_patterns_tree.column("status", width=80)
        
        # Add scrollbar
        tree_scroll = ttk.Scrollbar(tree_frame, orient="vertical", command=self.new_patterns_tree.yview)
        self.new_patterns_tree.configure(yscrollcommand=tree_scroll.set)
        
        # Pack tree and scrollbar
        self.new_patterns_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        tree_scroll.pack(side=tk.RIGHT, fill=tk.Y)
    
    def _create_settings(self):
        """Create settings page."""
        # Create settings container
        settings_frame = ttk.Frame(self.settings_tab, padding=20)
        settings_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(settings_frame, text="Settings", style="Title.TLabel").pack(anchor="w", pady=10)
        ttk.Label(settings_frame, text="Configure dashboard behavior and IDS parameters", style="Subheader.TLabel").pack(anchor="w", pady=5)
        
        # Attack Panel section
        attack_panel_frame = ttk.LabelFrame(settings_frame, text="Attack Panel", padding=10)
        attack_panel_frame.pack(fill=tk.X, pady=10)
        
        # Add button to manually launch attack panel
        launch_panel_btn = ttk.Button(
            attack_panel_frame,
            text="Launch Attack Panel",
            command=self._launch_attack_panel
        )
        launch_panel_btn.pack(anchor="w", pady=5)
        
        ttk.Label(
            attack_panel_frame,
            text="Opens a separate window for manually injecting attacks",
            font=("Segoe UI", 9, "italic")
        ).pack(anchor="w", pady=2)
        
        # Detection Settings section
        detection_frame = ttk.LabelFrame(settings_frame, text="Detection Settings", padding=10)
        detection_frame.pack(fill=tk.X, pady=10)
        
        # Threshold control
        threshold_control = ttk.Frame(detection_frame)
        threshold_control.pack(fill=tk.X, pady=5)
        
        ttk.Label(threshold_control, text="Detection Threshold:").pack(side=tk.LEFT)
        
        self.threshold_slider = ttk.Scale(
            threshold_control,
            from_=0.5,
            to=0.99,
            orient=tk.HORIZONTAL,
            value=self.ids.threshold,
            command=self.on_threshold_change,
            length=200
        )
        self.threshold_slider.pack(side=tk.LEFT, padx=5)
        
        self.threshold_value_label = ttk.Label(threshold_control, text=f"{self.ids.threshold:.2f}")
        self.threshold_value_label.pack(side=tk.LEFT)
        
        # About section
        about_frame = ttk.LabelFrame(settings_frame, text="About", padding=10)
        about_frame.pack(fill=tk.X, pady=10)
        
        ttk.Label(
            about_frame,
            text="DeepIDS Professional Dashboard",
            font=("Segoe UI", 12, "bold")
        ).pack(anchor="w")
        
        ttk.Label(
            about_frame,
            text="Version 1.0.0",
            font=("Segoe UI", 9, "italic")
        ).pack(anchor="w", pady=5)
    
    def _create_card(self, parent, title=None):
        """Create a card widget with title."""
        card = ttk.Frame(parent, style="Card.TFrame", padding=15)
        
        if title:
            card_header = ttk.Frame(card, style="CardHeader.TFrame")
            card_header.pack(fill=tk.X, pady=(0, 10))
            
            ttk.Label(
                card_header, 
                text=title, 
                style="Header.TLabel",
                font=self.fonts['header']
            ).pack(anchor="w")
            
            ttk.Separator(card, orient=tk.HORIZONTAL).pack(fill=tk.X, pady=5)
            
        return card
        
    def start_ids(self):
        """Start IDS monitoring."""
        try:
            self.ids.start()
            self.running = True
            logger.info("Started IDS monitoring")
            self.status_var.set("IDS monitoring started - Analyzing network traffic")
        except Exception as e:
            logger.error(f"Error starting IDS: {e}")
            self.status_var.set(f"Error starting IDS: {str(e)}")
            
    def stop_ids(self):
        """Stop IDS monitoring."""
        try:
            self.ids.stop()
            self.running = False
            logger.info("Stopped IDS monitoring")
            self.status_var.set("IDS monitoring stopped")
        except Exception as e:
            logger.error(f"Error stopping IDS: {e}")
            self.status_var.set(f"Error stopping IDS: {str(e)}")
        
    def on_threshold_change(self, value):
        """Handle threshold slider change."""
        threshold = float(value)
        self.ids.threshold = threshold
        
        # Update the threshold value label if it exists
        if hasattr(self, 'threshold_value_label'):
            self.threshold_value_label.config(text=f"{threshold:.2f}")
        
        # Update the threshold line in the confidence graph if it exists
        if hasattr(self, 'confidence_ax') and hasattr(self, 'confidence_canvas'):
            # Check if we have existing threshold line
            threshold_line = None
            for line in self.confidence_ax.get_lines():
                if hasattr(line, '_label') and line._label == 'threshold':
                    threshold_line = line
                    break
            
            # If we have a threshold line, update it, otherwise create it
            if threshold_line:
                threshold_line.set_ydata([threshold, threshold])
            else:
                self.confidence_ax.axhline(y=threshold, color='r', linestyle='--', label='threshold')
            
            # Redraw the canvas
            self.confidence_canvas.draw()
    
    def connect_to_bridge(self):
        """Connect to IDS Bridge."""
        # Try to connect to bridge
        if self.ids.connect_to_bridge():
            self.status_var.set("Connected to IDS Bridge: Receiving real-time attack data")
            self.connect_btn.config(state=tk.DISABLED)
        else:
            self.status_var.set("Failed to connect to IDS Bridge")
    
    def _auto_connect(self):
        """Automatically connect to the IDS bridge on startup."""
        # Use a flag to track if we've already tried connecting
        if hasattr(self, '_connection_started') and self._connection_started:
            return
            
        self._connection_started = True
        
        if not self.ids.bridge_connected:
            logger.info("Auto-connecting to IDS Bridge...")
            
            # First try to connect
            if self.ids.connect_to_bridge():
                logger.info("Successfully connected to IDS Bridge")
                self.status_var.set("Connected to IDS Bridge: Receiving real-time attack data")
                if hasattr(self, 'connect_btn'):
                    self.connect_btn.config(state=tk.DISABLED)
                
                # Auto-start monitoring
                self.start_ids()
                
                # DO NOT automatically launch attack panel - require manual launch
                # self._launch_attack_panel()
            else:
                # If connection fails, try to start the bridge
                logger.warning("Failed to connect to IDS Bridge, attempting to start it")
                if self._start_bridge():
                    # Wait a bit for the bridge to start
                    self.root.after(2000, self._retry_connect)
                else:
                    logger.error("Failed to start IDS Bridge")
                    self.status_var.set("Failed to connect to IDS Bridge. Please check if it's installed.")
                    
    def _retry_connect(self):
        """Retry connecting to the bridge after starting it."""
        # Prevent multiple connection attempts
        if self.ids.bridge_connected:
            logger.info("Already connected to IDS Bridge")
            return
            
        if self.ids.connect_to_bridge():
            logger.info("Successfully connected to IDS Bridge after starting it")
            self.status_var.set("Connected to IDS Bridge: Receiving real-time attack data")
            if hasattr(self, 'connect_btn'):
                self.connect_btn.config(state=tk.DISABLED)
            
            # Auto-start monitoring
            self.start_ids()
            
            # DO NOT automatically launch attack panel - require manual launch
            # self._launch_attack_panel()
        else:
            logger.warning("Failed to connect to IDS Bridge even after starting it")
            self.status_var.set("Failed to connect to IDS Bridge. Please connect manually.")
    
    def _start_bridge(self):
        """Start the IDS bridge and monitor."""
        try:
            # Check if disable-attacks was passed as a command-line argument
            disable_attacks = getattr(self.ids, 'disable_attacks', False)
            
            # First, try to start the IDS monitor
            monitor_cmd = f"python ids_monitor.py{' --disable-attacks' if disable_attacks else ''}"
            logger.info(f"Starting IDS Monitor: {monitor_cmd}")
            monitor_process = subprocess.Popen(
                monitor_cmd,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                start_new_session=True
            )
            
            # Get model paths
            model_path = self.ids.model_path if hasattr(self.ids, 'model_path') else 'models/best_fast_model.h5'
            norm_params = self.ids.norm_params_path if hasattr(self.ids, 'norm_params_path') else 'models/normalization_params.json'
            
            # ALWAYS start bridge with ALL attack functionality completely disabled
            # Flag explanation:
            # --disable-attacks: Prevents ALL automatic traffic generation
            # --traffic-rate 0.0: Redundant but kept as extra safety
            # --attack-probability 0.0: Redundant but kept as extra safety
            # --no-auto-attacks: Redundant but kept as extra safety
            bridge_cmd = (
                f"python ids_bridge.py --model {model_path} "
                f"--norm-params {norm_params} "
                f"--traffic-rate 0.0 --attack-probability 0.0 --no-auto-attacks "
            )
            
            # Add disable-attacks flag if specified
            if disable_attacks:
                bridge_cmd += " --disable-attacks"
            else:
                # Ensure the flag is always set for consistency with the user's command line argument
                bridge_cmd += " --disable-attacks"
            
            logger.info(f"Starting IDS Bridge with AUTO-ATTACKING COMPLETELY DISABLED: {bridge_cmd}")
            bridge_process = subprocess.Popen(
                bridge_cmd,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                start_new_session=True
            )
            
            # Store flag to check later when launching attack panel
            bridge_process.disable_attacks = disable_attacks
            self.bridge_process = bridge_process
            logger.info(f"Started IDS Bridge with PID {bridge_process.pid}")
            return True
        except Exception as e:
            logger.error(f"Error starting IDS Bridge: {e}")
            return False
    
    def _launch_attack_panel(self):
        """Launch the attack panel window."""
        # Check if we've already launched an attack panel
        if hasattr(self, '_attack_panel_launched') and self._attack_panel_launched:
            logger.info("Attack panel already launched")
            return
            
        self._attack_panel_launched = True
        
        try:
            # Warn the user if attacks have been disabled
            if hasattr(self.bridge_process, 'disable_attacks') and self.bridge_process.disable_attacks:
                tk.messagebox.showinfo(
                    "Attacks Disabled",
                    "Note: The IDS Bridge is running with attacks disabled.\n\n"
                    "You can launch the attack panel, but any attack commands sent will be ignored by the bridge."
                )
            
            # Start the attack panel as a separate process
            bridge_host = self.ids.bridge_host if hasattr(self.ids, "bridge_host") else "localhost"
            bridge_port = self.ids.bridge_port if hasattr(self.ids, "bridge_port") else 5000
            
            attack_panel_cmd = (
                f"python -m ids_project.attack_panel "
                f"--bridge-host {bridge_host} "
                f"--bridge-port {bridge_port} "
                f"{'--light-mode' if not self.dark_mode else ''}"
            )
            
            logger.info(f"Launching attack panel: {attack_panel_cmd}")
            attack_panel_process = subprocess.Popen(
                attack_panel_cmd,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                start_new_session=True
            )
            
            logger.info(f"Started Attack Panel with PID {attack_panel_process.pid}")
        except Exception as e:
            logger.error(f"Error starting Attack Panel: {e}")
            self.status_var.set("Failed to launch Attack Panel. Please start it manually.")
    
    def update_task(self):
        """Periodic task to update UI elements."""
        try:
            # Skip updates if app is closing
            if not hasattr(self, 'running') or not self.running:
                return
                
            # Check for alerts in queue
            try:
                while not self.ids.alert_queue.empty():
                    alert = self.ids.alert_queue.get_nowait()
                    self._process_alert(alert)
            except Exception as e:
                logger.error(f"Error processing alerts: {e}")
                
            # Update statistics (uptime, packet count, etc.)
            if hasattr(self, 'uptime_label'):
                stats = self.ids.get_stats()
                uptime = stats.get('uptime', 0)
                packets = stats.get('total_packets', 0)
                alerts = stats.get('alerts', 0)
                
                # Only update if values have changed significantly
                if hasattr(self, '_last_stats'):
                    last_stats = self._last_stats
                    # Only update if values changed by more than 1%
                    if abs(last_stats.get('uptime', 0) - uptime) / max(1, uptime) < 0.01 and \
                       last_stats.get('total_packets', 0) == packets and \
                       last_stats.get('alerts', 0) == alerts:
                        # Skip this update if not much has changed
                        pass
                    else:
                        # Update values
                        self.uptime_label.config(text=self._format_uptime(uptime))
                        
                        if hasattr(self, 'packets_label') and \
                           self.packets_label.cget('text') != f"{packets:,}":
                            self._animate_counter(self.packets_label, 
                                                int(self.packets_label.cget('text').replace(',', '')), 
                                                packets)
                                                
                        if hasattr(self, 'alerts_label') and \
                           self.alerts_label.cget('text') != f"{alerts:,}":
                            self._animate_counter(self.alerts_label, 
                                                int(self.alerts_label.cget('text').replace(',', '')), 
                                                alerts)
                else:
                    # First time update
                    self.uptime_label.config(text=self._format_uptime(uptime))
                    if hasattr(self, 'packets_label'):
                        self.packets_label.config(text=f"{packets:,}")
                    if hasattr(self, 'alerts_label'):
                        self.alerts_label.config(text=f"{alerts:,}")
                
                # Store current stats
                self._last_stats = {
                    'uptime': uptime,
                    'total_packets': packets,
                    'alerts': alerts
                }
                
            # Update confidence visualization
            self._update_confidence_visualization()
            
            # Update stats tab if it's visible
            if hasattr(self, 'notebook') and \
               self.notebook.index(self.notebook.select()) == 1:  # Stats tab
                self._update_stats_tab()
                
            # Check connection status
            self._check_bridge_connection()
                
        except Exception as e:
            logger.error(f"Error in update task: {e}")
            traceback.print_exc()
            
        # Schedule next update, at a reduced frequency (increase interval from 100ms to 500ms)
        if hasattr(self, 'root') and self.root:
            self.root.after(500, self.update_task)
            
    def _check_bridge_connection(self):
        """Check bridge connection status and update UI accordingly."""
        # Only check every few seconds to reduce overhead
        if not hasattr(self, '_last_connection_check'):
            self._last_connection_check = time.time()
        elif time.time() - self._last_connection_check < 5:  # Check every 5 seconds
            return
            
        self._last_connection_check = time.time()
        
        # Check connection status
        if hasattr(self, 'ids') and hasattr(self.ids, 'bridge_connected'):
            is_connected = self.ids.bridge_connected
            
            # Update connection status display
            if hasattr(self, 'connection_status'):
                text = "Connected to Bridge" if is_connected else "Not Connected"
                color = "green" if is_connected else "red"
                self.connection_status.config(text=text, foreground=color)
    
    def _send_notification(self, alert):
        """Send a Windows notification for the alert."""
        try:
            # Only proceed if on Windows (toast notification)
            if not sys.platform.startswith('win'):
                return
                
            # Extract alert info
            attack_type = alert.get('attack_type', 'unknown').lower()
            confidence = alert.get('confidence', 0)
            
            # Format notification text
            title = f"DeepIDS Security Alert: {attack_type.upper()}"
            msg = f"Attack detected with {confidence:.2f} confidence!"
            
            # Safer approach to notifications - log the alert instead of using win10toast
            # which is causing the classAtom error
            logger.warning(f"NOTIFICATION: {title} - {msg}")
            
            # We'll skip using win10toast to avoid the error with classAtom
            # Just log the alert and display it in the UI without desktop notifications
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
            # Don't let notification failures affect the dashboard
    
    def on_close(self):
        """Handle window close event."""
        if self.ids.running:
            self.ids.stop()
            
        # Kill bridge process if we started it
        if self.bridge_process and self.bridge_process.poll() is None:
            try:
                self.bridge_process.terminate()
                logger.info("Terminated IDS Bridge process")
            except:
                pass
                
        self.root.destroy()
        
    def run(self):
        """Run the dashboard."""
        # Center the window on screen
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry('{}x{}+{}+{}'.format(width, height, x, y))
        
        # Apply colors to ensure everything is visible
        self._apply_widget_colors()
        
        # Auto-connect to bridge if available (only once)
        self.root.after(1000, self._auto_connect)
        
        # Start the main loop
        self.root.mainloop()

    def update_attack_distribution(self):
        """Update attack distribution chart."""
        # Get attack statistics
        stats = self.attack_logger.get_stats()
        by_type = stats.get("by_type", {})
        
        if not by_type:
            return
            
        # Prepare data for bar chart
        types = list(by_type.keys())
        counts = [by_type[t] for t in types]
        colors = [ATTACK_COLORS.get(t, "#999999") for t in types]
        
        # Clear previous plot
        self.attack_ax.clear()
        
        # Create new bar chart
        self.attack_bars = self.attack_ax.bar(types, counts, color=colors)
        
        # Add count labels on top of bars
        for bar in self.attack_bars:
            height = bar.get_height()
            self.attack_ax.text(
                bar.get_x() + bar.get_width()/2.,
                height + 0.1,
                f"{int(height)}",
                ha="center"
            )
        
        # Set y-axis limit to leave room for labels
        max_count = max(counts) if counts else 0
        self.attack_ax.set_ylim(0, max_count * 1.2)
        self.attack_ax.set_ylabel("Count")
            
        # Redraw canvas
        self.attack_fig.tight_layout()
        self.attack_canvas.draw()
    
    def update_new_patterns(self):
        """Update new attack patterns list."""
        # Get unknown attacks
        unknown_attacks = self.attack_logger.get_unknown_attacks()
        
        # Clear current items
        for item in self.new_patterns_tree.get_children():
            self.new_patterns_tree.delete(item)
            
        # Add new items
        for attack in unknown_attacks:
            status = "Analyzed" if attack.get("analyzed", False) else "New"
            self.new_patterns_tree.insert(
                "",
                "end",
                values=(
                    attack.get("timestamp", ""),
                    attack.get("attack_type", "unknown"),
                    f"{attack.get('confidence', 0):.4f}",
                    attack.get("signature", ""),
                    status
                )
            )

    def _apply_widget_colors(self):
        """Apply theme colors to widgets for consistent look."""
        bg_color = self.theme["bg"]
        fg_color = self.theme["fg"]
        accent = self.theme["accent"]
        highlight = self.theme["highlight"]
        
        # Apply styles based on dark/light mode
        if self.dark_mode:
            self._configure_dark_style()
        else:
            self._configure_light_style()
            
        # Apply custom configurations
        self.style.configure('TFrame', background=bg_color)
        self.style.configure('TLabel', background=bg_color, foreground=fg_color)
        self.style.configure('TButton', background=highlight, foreground=fg_color)
        self.style.configure('Accent.TButton', background=accent, foreground='white')
        
        # Configure Notebook (tabs) style
        self.style.configure('TNotebook', background=bg_color)
        self.style.configure('TNotebook.Tab', background=highlight, foreground=fg_color, padding=[10, 5])
        self.style.map('TNotebook.Tab',
            background=[('selected', accent)],
            foreground=[('selected', 'white')],
            padding=[('selected', [15, 8])]
        )
        
        # Apply animation to tab transitions
        if hasattr(self, 'notebook'):
            self.notebook.bind("<<NotebookTabChanged>>", self._animate_tab_transition)
        
        # Configure Treeview style for better contrast
        self.style.configure('Treeview', 
                           background=bg_color, 
                           foreground=fg_color, 
                           fieldbackground=bg_color)
        self.style.map('Treeview', 
                     background=[('selected', accent)],
                     foreground=[('selected', 'white')])
                     
        # Update scrolledtext widgets if they exist
        for widget in [getattr(self, attr) for attr in dir(self) if isinstance(getattr(self, attr, None), scrolledtext.ScrolledText)]:
            widget.config(background=bg_color, foreground=fg_color)
    
    def _animate_tab_transition(self, event):
        """Animate tab transition for a smoother experience."""
        if self.tab_transition_active:
            return
            
        self.tab_transition_active = True
        tab_id = self.notebook.select()
        tab_name = self.notebook.tab(tab_id, "text")
        
        # Store original state
        original_alpha = self.root.attributes('-alpha')
        
        # Briefly fade out and in
        steps = 5
        for i in range(steps):
            alpha = original_alpha * (steps - i) / steps
            self.root.attributes('-alpha', alpha)
            self.root.update()
            time.sleep(0.01)
            
        # Update UI based on selected tab
        self._on_tab_changed(event)
            
        # Fade back in
        for i in range(steps):
            alpha = original_alpha * (i + 1) / steps
            self.root.attributes('-alpha', alpha)
            self.root.update()
            time.sleep(0.01)
            
        self.tab_transition_active = False
    
    def _add_alert(self, attack_data):
        """Add an alert to the alerts panel with animation."""
        if not hasattr(self, 'alert_text'):
            return
            
        # Get alert info
        timestamp = attack_data.get('timestamp', datetime.now().strftime('%H:%M:%S'))
        attack_type = attack_data.get('attack_type', 'unknown')
        confidence = attack_data.get('confidence', 0.0)
        
        # Format the alert message
        if attack_type == 'normal':
            message = f"NORMAL TRAFFIC DETECTED (Confidence: {confidence:.2f})"
        else:
            message = f"{attack_type.upper()} ATTACK DETECTED! (Confidence: {confidence:.2f})"
        
        # Insert with the appropriate tag
        self.alert_text.config(state=tk.NORMAL)
        self.alert_text.insert(tk.END, f"[{timestamp}] ", "timestamp")
        self.alert_text.insert(tk.END, message + "\n", attack_type)
        self.alert_text.see(tk.END)
        self.alert_text.config(state=tk.DISABLED)
        
        # Update last alert display
        if attack_type != 'normal':
            self.last_alert_var.set(f"Last Alert: {attack_type.upper()} ({timestamp})")
            
            # Change color based on attack type
            fg_color = ATTACK_COLORS.get(attack_type, "#e74c3c")
            self.last_alert_label.config(foreground=fg_color, font=("Segoe UI", 10, "bold"))
            
            # Flash effect for alerts (but not for normal traffic)
            self._flash_alert(attack_type)
        else:
            # For normal traffic, update without flash or color change
            self.last_alert_var.set(f"Status: Normal Traffic ({timestamp})")
            self.last_alert_label.config(foreground="#2ecc71", font=("Segoe UI", 10))
    
    def _flash_alert(self, alert_type):
        """Flash the alert container to draw attention to a new alert."""
        # Check if we have already set up the animation parameters
        if not hasattr(self, '_flash_state'):
            self._flash_state = {}
        
        # If animation is already running for this alert type, don't start another
        if alert_type in self._flash_state and self._flash_state[alert_type]:
            return
            
        # Get alert container
        alert_container = self._get_alert_container()
        if not alert_container:
            return
            
        # Get alert color based on attack type
        color = ATTACK_COLORS.get(alert_type, ATTACK_COLORS['normal'])
        
        # Store original background
        if not hasattr(alert_container, 'original_bg'):
            alert_container.original_bg = alert_container.cget('background')
            
        # Mark animation as active
        self._flash_state[alert_type] = True
        
        # Convert color to RGB for animation
        r, g, b = self._hex_to_rgb(color)
        
        # Define the animation function
        def flash_step(count=0, step=0):
            if count >= 4:  # Reduce from 6 to 4 cycles to decrease flickering
                # Animation complete, restore original
                alert_container.configure(background=alert_container.original_bg)
                self._flash_state[alert_type] = False
                return
                
            if step == 0:
                # Flash to alert color (dimmed)
                flash_color = f'#{int(r*0.7):02x}{int(g*0.7):02x}{int(b*0.7):02x}'
                alert_container.configure(background=flash_color)
                self.root.after(100, lambda: flash_step(count, 1))  # Increased from 50ms to 100ms
            else:
                # Flash back to original
                alert_container.configure(background=alert_container.original_bg)
                self.root.after(150, lambda: flash_step(count + 1, 0))  # Increased from 100ms to 150ms
        
        # Start animation
        flash_step()
    
    def _hex_to_rgb(self, hex_color):
        """Convert hex color to RGB components."""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def _get_alert_container(self):
        """Get the container widget for the alerts panel."""
        for child in self.root.winfo_children():
            if isinstance(child, ttk.Frame) and hasattr(child, 'alert_container'):
                return child
        return None
    
    def _update_confidence_visualization(self):
        """Update the confidence visualization with latest data."""
        if not hasattr(self, 'confidence_ax') or not hasattr(self, 'confidence_canvas'):
            return
            
        # Clear the axis
        self.confidence_ax.clear()
        
        # Prepare data
        if self.confidence_queue:
            timestamps = [item[0] for item in self.confidence_queue]
            confidences = [item[1] for item in self.confidence_queue]
            
            # Format timestamps for x-axis
            x_labels = [t.strftime('%H:%M:%S') if isinstance(t, datetime) else t 
                       for t in timestamps]
                       
            # Plot confidence values with improved styling
            self.confidence_ax.plot(
                range(len(confidences)), 
                confidences,
                marker='o',
                markersize=5,
                linewidth=2,
                color=self.theme['accent']
            )
            
            # Add threshold line
            if hasattr(self.ids, 'threshold'):
                self.confidence_ax.axhline(
                    y=self.ids.threshold,
                    color=self.theme['danger'],
                    linestyle='--',
                    alpha=0.7,
                    label=f"Threshold ({self.ids.threshold:.2f})"
                )
            
            # Set x-axis labels
            if len(x_labels) > 10:
                # Show fewer labels if there are many points
                step = max(1, len(x_labels) // 10)
                self.confidence_ax.set_xticks(range(0, len(x_labels), step))
                self.confidence_ax.set_xticklabels([x_labels[i] for i in range(0, len(x_labels), step)], rotation=45)
            else:
                self.confidence_ax.set_xticks(range(len(x_labels)))
                self.confidence_ax.set_xticklabels(x_labels, rotation=45)
                
            # Set y-axis limits with a bit of padding
            self.confidence_ax.set_ylim(0, 1.05)
            
            # Add labels and title with improved styling
            self.confidence_ax.set_title("Detection Confidence", fontsize=12, pad=10, color=self.theme['fg'])
            self.confidence_ax.set_ylabel("Confidence", color=self.theme['fg'])
            
            # Style the plot
            self.confidence_ax.set_facecolor(self.theme['chart_bg'])
            self.confidence_ax.grid(True, alpha=0.3, color=self.theme['grid_color'])
            
            # Style the tick labels
            self.confidence_ax.tick_params(axis='both', colors=self.theme['fg'])
            
            # Add legend
            self.confidence_ax.legend(facecolor=self.theme['card_bg'], edgecolor=self.theme['border'])
            
        else:
            # No data yet
            self.confidence_ax.text(
                0.5, 0.5, 
                "No confidence data available yet",
                horizontalalignment='center',
                verticalalignment='center',
                transform=self.confidence_ax.transAxes,
                color=self.theme['fg'],
                alpha=0.7
            )
            
        # Update figure appearance
        self.confidence_fig.set_facecolor(self.theme['chart_bg'])
        
        # Adjust layout and redraw
        self.confidence_fig.tight_layout()
        self.confidence_canvas.draw()

    def _format_uptime(self, seconds):
        """Format uptime in a human-readable way."""
        hours, remainder = divmod(int(seconds), 3600)
        minutes, seconds = divmod(remainder, 60)
        
        if hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"
    
    def _animate_counter(self, label, start, end, duration=300):
        """Animate a counter from start to end over a duration in ms."""
        if hasattr(self, f"animate_{label}_active") and getattr(self, f"animate_{label}_active"):
            # Animation already in progress
            return
            
        # Mark animation as active
        setattr(self, f"animate_{label}_active", True)
        
        # Calculate steps based on difference
        diff = end - start
        steps = min(20, abs(diff))  # Max 20 steps for smooth animation
        if steps <= 1:
            # No need to animate small changes
            label.config(text=f"{end:,}")
            setattr(self, f"animate_{label}_active", False)
            return
            
        time_per_step = duration / steps
        
        def animate_step(step):
            if step >= steps:
                # Animation complete
                label.config(text=f"{end:,}")
                setattr(self, f"animate_{label}_active", False)
                return
                
            # Calculate current value with easing
            progress = step / steps
            # Ease in/out using sine function
            import math
            ease = (1 - math.cos(progress * math.pi)) / 2
            current = int(start + diff * ease)
            label.config(text=f"{current:,}")
            
            # Schedule next step
            self.root.after(int(time_per_step), lambda: animate_step(step + 1))
            
        # Start animation
        animate_step(0)
    
    def _process_alert(self, alert):
        """Process an alert and update the UI."""
        # Get alert info
        attack_type = alert.get('attack_type', 'unknown').lower()
        confidence = alert.get('confidence', 0.0)
        timestamp = alert.get('timestamp', datetime.now().strftime('%H:%M:%S'))
        
        # Add to alert display
        self._add_alert(alert)
        
        # Update attack counts
        self.attack_counts[attack_type] = self.attack_counts.get(attack_type, 0) + 1
        
        # Animate alerts counter
        if hasattr(self, 'alerts_label'):
            current_alerts = int(self.alerts_label.cget('text').replace(',', ''))
            self._animate_counter(self.alerts_label, current_alerts, current_alerts + 1)
            
        # Add to confidence queue for visualization
        self.confidence_queue.append((timestamp, confidence))
        if len(self.confidence_queue) > self.max_data_points:
            self.confidence_queue.pop(0)
            
        # Log to database
        self.attack_logger.log_attack(alert)
        
        # Send notification
        self._send_notification(alert)
        
        # Update visualizations
        self.update_attack_distribution()
        
        # For normal traffic, update the status differently
        if attack_type == 'normal':
            self.status_var.set(f"Normal traffic detected at {timestamp}")
        else:
            # Show a more prominent alert for actual attacks
            self.status_var.set(f"ALERT: {attack_type.upper()} attack detected!")

def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="DeepIDS Professional Dashboard")
    
    parser.add_argument("--model", type=str, default="models/best_fast_model.h5",
                      help="Path to trained IDS model")
    parser.add_argument("--norm-params", type=str, default="models/normalization_params.json",
                      help="Path to normalization parameters")
    parser.add_argument("--threshold", type=float, default=0.7,
                      help="Detection threshold (0.5-0.99)")
    parser.add_argument("--bridge-host", type=str, default="localhost",
                      help="IDS Bridge host")
    parser.add_argument("--bridge-port", type=int, default=5000,
                      help="IDS Bridge port")
    parser.add_argument("--light-mode", action="store_true",
                      help="Use light mode theme (default is dark mode)")
    parser.add_argument("--disable-attacks", action="store_true",
                      help="Completely disable all attack functionality")
    
    args = parser.parse_args()
    
    # Create FastIDS instance
    ids = FastIDS(
        model_path=args.model,
        norm_params_path=args.norm_params,
        threshold=args.threshold,
        bridge_host=args.bridge_host,
        bridge_port=args.bridge_port
    )
    
    # Store the disable_attacks flag in the ids instance
    ids.disable_attacks = args.disable_attacks
    
    # Create and run dashboard
    dashboard = ProDashboard(ids, dark_mode=not args.light_mode)
    dashboard.run()
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 