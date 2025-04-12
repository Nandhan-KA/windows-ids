#!/usr/bin/env python
"""
Run an attack simulation against DeepIDS with visualization.
This script demonstrates how to use the attack simulator environment
and a trained attack agent to test the IDS system.
"""

import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import time
import json
import random
import logging
import argparse
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import matplotlib.gridspec as gridspec
from datetime import datetime
import pandas as pd

# Import the environment and agent
from ids_project.attack_simulator.ids_gym import make_ids_gym_env, ATTACK_TYPES
from ids_project.attack_simulator.train_attack_agent import create_attack_agent_env

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("deepids.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("DeepIDS-Simulation")

# Check if stable-baselines3 is installed
try:
    from stable_baselines3 import PPO, A2C
except ImportError:
    logger.warning("stable-baselines3 is not installed. Random agent will be used.")
    HAS_SB3 = False
else:
    HAS_SB3 = True

class AttackSimulationVisualizer:
    """Visualizer for attack simulation against DeepIDS."""
    
    def __init__(self, env, agent=None, fig_size=(15, 10)):
        """
        Initialize the attack simulation visualizer.
        
        Args:
            env: The environment to visualize
            agent: The trained agent (optional)
            fig_size: Figure size
        """
        self.env = env
        self.agent = agent
        
        # Initialize data tracking
        self.reset_data()
        
        # Create figure and axes
        self.fig = plt.figure(figsize=fig_size, constrained_layout=True)
        gs = gridspec.GridSpec(3, 3, figure=self.fig)
        
        # Main visualization axes
        self.ax_main = self.fig.add_subplot(gs[0:2, :])
        self.ax_main.set_title("DeepIDS Attack Simulation", fontsize=16)
        self.ax_main.set_xlabel("Step")
        self.ax_main.set_ylabel("Attack Confidence")
        self.ax_main.set_ylim(0, 1)
        self.ax_main.axhline(y=0.7, color='r', linestyle='--', label="Detection Threshold")
        self.line_confidence, = self.ax_main.plot([], [], 'b-', label="IDS Confidence")
        self.scatter_attacks = self.ax_main.scatter([], [], s=100, c=[], cmap='viridis', 
                                                   marker='o', edgecolors='black',
                                                   label="Attacks")
        self.ax_main.legend(loc="upper left")
        
        # Attack type distribution
        self.ax_attack_types = self.fig.add_subplot(gs[2, 0])
        self.ax_attack_types.set_title("Attack Type Distribution")
        self.bar_attack_types = self.ax_attack_types.bar(
            list(ATTACK_TYPES.keys()), 
            [0] * len(ATTACK_TYPES)
        )
        self.ax_attack_types.set_ylim(0, 1)
        self.ax_attack_types.tick_params(axis='x', rotation=45)
        
        # Success rate
        self.ax_success = self.fig.add_subplot(gs[2, 1])
        self.ax_success.set_title("Attack Success Rate")
        self.bar_success = self.ax_success.bar(["Success", "Detected"], [0, 0], color=['g', 'r'])
        self.ax_success.set_ylim(0, 1)
        
        # Recent attacks table
        self.ax_table = self.fig.add_subplot(gs[2, 2])
        self.ax_table.set_title("Recent Attacks")
        self.ax_table.axis('tight')
        self.ax_table.axis('off')
        self.table = self.ax_table.table(
            cellText=[["", "", "", ""]],
            colLabels=["Step", "Type", "Intensity", "Status"],
            loc='center',
            cellLoc='center'
        )
        self.table.auto_set_font_size(False)
        self.table.set_fontsize(9)
        self.table.scale(1, 1.5)
        
        # Status text
        self.status_text = self.ax_main.text(
            0.02, 0.02, "Initializing...", 
            transform=self.ax_main.transAxes,
            bbox=dict(facecolor='white', alpha=0.8, edgecolor='gray')
        )
        
        # Animation
        self.ani = None
        
    def reset_data(self):
        """Reset data tracking."""
        self.steps = []
        self.confidences = []
        self.attack_points = []
        self.attack_confidences = []
        self.attack_colors = []
        self.attack_texts = []
        
        self.attack_counts = {k: 0 for k in ATTACK_TYPES.keys()}
        self.success_counts = {"success": 0, "detected": 0}
        self.recent_attacks = []
        
    def run_simulation(self, n_steps=200, interval=100):
        """
        Run the simulation with visualization.
        
        Args:
            n_steps: Number of steps to run
            interval: Animation interval in milliseconds
        """
        self.max_steps = n_steps
        
        # Reset environment and data
        self.obs, _ = self.env.reset()
        self.reset_data()
        
        # Initialize animation
        self.ani = FuncAnimation(
            self.fig, self.update_viz, frames=n_steps,
            interval=interval, blit=False, repeat=False
        )
        
        plt.show()
        
    def update_viz(self, frame):
        """Update visualization for current frame."""
        # Get action - either from agent or random
        if self.agent is not None:
            action, _ = self.agent.predict(self.obs, deterministic=True)
        else:
            # Random action
            action = np.array([
                random.random(),  # attack_type
                random.random(),  # intensity
                random.random()   # stealth
            ])
        
        # Step environment
        self.obs, reward, terminated, truncated, info = self.env.step(action)
        
        # Extract information
        step = len(self.steps) + 1
        confidence = info.get('prediction', 0.5) if 'prediction' in info else random.random()
        attack_type = info['attack_type']
        intensity = info['intensity']
        detected = info.get('detected', None)
        is_attack = info['is_attack']
        
        # Store data
        self.steps.append(step)
        self.confidences.append(confidence)
        
        if is_attack and attack_type != 'normal':
            # Store attack point
            self.attack_points.append(step)
            self.attack_confidences.append(confidence)
            
            # Color based on attack type
            type_idx = list(ATTACK_TYPES.keys()).index(attack_type)
            self.attack_colors.append(type_idx)
            
            # Add attack info
            self.attack_texts.append(f"{attack_type}\n{intensity:.1f}")
            
            # Update attack counts
            self.attack_counts[attack_type] += 1
            
            # Update success counts
            if detected is False:
                self.success_counts["success"] += 1
            else:
                self.success_counts["detected"] += 1
                
            # Add to recent attacks list (keep last 5)
            status = "UNDETECTED" if detected is False else "DETECTED"
            self.recent_attacks.append([str(step), attack_type.upper(), f"{intensity:.2f}", status])
            if len(self.recent_attacks) > 5:
                self.recent_attacks = self.recent_attacks[-5:]
        
        # Update main visualization
        self.line_confidence.set_data(self.steps, self.confidences)
        self.ax_main.set_xlim(0, max(self.max_steps, step + 1))
        
        if self.attack_points:
            self.scatter_attacks.set_offsets(list(zip(self.attack_points, self.attack_confidences)))
            self.scatter_attacks.set_array(np.array(self.attack_colors))
            
        # Update attack type distribution
        total_attacks = sum(self.attack_counts.values())
        if total_attacks > 0:
            attack_freqs = [self.attack_counts[k] / total_attacks for k in ATTACK_TYPES.keys()]
        else:
            attack_freqs = [0] * len(ATTACK_TYPES)
            
        for i, bar in enumerate(self.bar_attack_types):
            bar.set_height(attack_freqs[i])
            
        # Update success rate
        total_classified = sum(self.success_counts.values())
        if total_classified > 0:
            success_rate = self.success_counts["success"] / total_classified
            detected_rate = self.success_counts["detected"] / total_classified
        else:
            success_rate = 0
            detected_rate = 0
            
        self.bar_success[0].set_height(success_rate)
        self.bar_success[1].set_height(detected_rate)
        
        # Update table
        if self.recent_attacks:
            self.table.remove()
            self.table = self.ax_table.table(
                cellText=self.recent_attacks,
                colLabels=["Step", "Type", "Intensity", "Status"],
                loc='center',
                cellLoc='center'
            )
            self.table.auto_set_font_size(False)
            self.table.set_fontsize(9)
            self.table.scale(1, 1.5)
            
        # Update status text
        metrics = self.env.get_metrics_summary()
        status_str = (
            f"Step: {step}/{self.max_steps}\n"
            f"Attacks: {metrics['attack_count']}, Success: {metrics['successful_attacks']}\n"
            f"Detection Rate: {metrics['detection_rate']:.1f}%, FP Rate: {metrics['false_positive_rate']:.1f}%"
        )
        self.status_text.set_text(status_str)
        
        return (self.line_confidence, self.scatter_attacks, *self.bar_attack_types, 
                *self.bar_success, self.status_text)

def main():
    """Main entry point for attack simulation visualization."""
    parser = argparse.ArgumentParser(description="Run DeepIDS attack simulation with visualization")
    
    parser.add_argument("--model", type=str, default="models/best_fast_model.h5",
                      help="Path to trained IDS model (default: models/best_fast_model.h5)")
    parser.add_argument("--norm-params", type=str, default="models/normalization_params.json",
                      help="Path to normalization parameters (default: models/normalization_params.json)")
    parser.add_argument("--real-data", type=str, default="data/validation_data.json",
                      help="Path to real data for simulation (default: data/validation_data.json)")
    parser.add_argument("--attack-agent", type=str, default=None,
                      help="Path to trained attack agent (optional)")
    parser.add_argument("--algorithm", type=str, default="PPO", choices=["PPO", "A2C"],
                      help="Algorithm type of the attack agent (default: PPO)")
    parser.add_argument("--steps", type=int, default=200,
                      help="Number of simulation steps (default: 200)")
    parser.add_argument("--interval", type=int, default=100,
                      help="Animation interval in milliseconds (default: 100)")
    parser.add_argument("--save-video", type=str, default=None,
                      help="Save animation as mp4 video file (requires ffmpeg)")
    
    args = parser.parse_args()
    
    # Validate paths
    if not os.path.exists(args.model):
        logger.error(f"IDS model file not found: {args.model}")
        return 1
        
    if not os.path.exists(args.norm_params):
        logger.error(f"Normalization parameters file not found: {args.norm_params}")
        return 1
    
    # Create environment
    env = make_ids_gym_env(
        ids_model_path=args.model,
        norm_params_path=args.norm_params,
        real_data_path=args.real_data
    )
    
    # Load attack agent if specified
    agent = None
    if args.attack_agent and HAS_SB3:
        if not os.path.exists(args.attack_agent):
            logger.warning(f"Attack agent model not found: {args.attack_agent}")
        else:
            logger.info(f"Loading attack agent from {args.attack_agent}")
            try:
                if args.algorithm == "PPO":
                    agent = PPO.load(args.attack_agent)
                elif args.algorithm == "A2C":
                    agent = A2C.load(args.attack_agent)
                logger.info("Attack agent loaded successfully")
            except Exception as e:
                logger.error(f"Failed to load attack agent: {e}")
                agent = None
    else:
        if args.attack_agent:
            logger.warning("stable-baselines3 not installed, using random agent instead")
        else:
            logger.info("No attack agent specified, using random actions")
    
    # Create visualizer
    visualizer = AttackSimulationVisualizer(env=env, agent=agent)
    
    # Run simulation
    logger.info(f"Starting simulation for {args.steps} steps")
    
    # If saving video
    if args.save_video:
        try:
            import matplotlib.animation as animation
            
            def run_and_save():
                ani = visualizer.run_simulation(n_steps=args.steps, interval=args.interval)
                Writer = animation.writers['ffmpeg']
                writer = Writer(fps=15, metadata=dict(artist='DeepIDS'), bitrate=1800)
                ani.save(args.save_video, writer=writer)
                logger.info(f"Video saved to {args.save_video}")
                
            run_and_save()
        except ImportError:
            logger.error("ffmpeg writer not available. Install ffmpeg to save videos.")
            visualizer.run_simulation(n_steps=args.steps, interval=args.interval)
    else:
        visualizer.run_simulation(n_steps=args.steps, interval=args.interval)
    
    logger.info("Simulation complete")
    return 0

if __name__ == "__main__":
    sys.exit(main()) 