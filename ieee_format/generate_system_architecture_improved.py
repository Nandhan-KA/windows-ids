import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyArrowPatch, FancyBboxPatch
import matplotlib.patheffects as path_effects
import os

# Create directory for saving images if it doesn't exist
os.makedirs('ieee_format/generated_images', exist_ok=True)

# Function to create a box with title
def create_box(ax, x, y, width, height, title, components, color, alpha=1.0):
    # Draw the main box
    rect = FancyBboxPatch((x, y), width, height, boxstyle="round,pad=0.5", 
                         facecolor=color, alpha=alpha, edgecolor='black')
    ax.add_patch(rect)
    
    # Add the title
    title_y = y + height - 0.3
    text = ax.text(x + width/2, title_y, title, 
                  ha='center', va='center', fontsize=12, fontweight='bold')
    text.set_path_effects([path_effects.withStroke(linewidth=2, foreground='white')])
    
    # Add components as bulleted list
    for i, component in enumerate(components):
        component_y = title_y - 0.5 - i * 0.3
        ax.text(x + 0.3, component_y, "•", ha='center', va='center')
        ax.text(x + 0.5, component_y, component, ha='left', va='center', fontsize=10)
    
    return rect

# Create a new figure with higher resolution
plt.figure(figsize=(16, 12), dpi=300)
ax = plt.gca()

# Set equal aspect ratio and axis limits
ax.set_xlim(0, 16)
ax.set_ylim(0, 12)
ax.set_aspect('equal')

# Remove axes
ax.axis('off')

# Define colors for different components - using a more professional palette
colors = {
    'data_sources': '#B3D7EA',      # Lighter blue
    'preprocessing': '#B6E2BB',      # Lighter green
    'dqn_core': '#F9E79F',          # Softer gold
    'training': '#F5CBA7',          # Softer orange
    'response': '#F5B7B1',          # Softer red
    'alert': '#D7BDE2',             # Softer purple
    'monitoring': '#E5E7E9'          # Softer gray
}

# Create the boxes for each component with more precise spacing
# Data Sources (top)
data_sources = create_box(ax, 3, 9.5, 10, 2, "DATA SOURCES", 
                         ["Windows Event Logs", "Network Traffic Sensors", 
                          "Process Monitoring", "File System Monitors",
                          "Registry Watchers", "User Activity Trackers",
                          "Windows Defender Events"], colors['data_sources'])

# Data Ingestion & Preprocessing
preprocessing = create_box(ax, 3, 7.5, 10, 1.5, "DATA INGESTION & PREPROCESSING",
                         ["Event Collection Service", "Real-time Stream Processing",
                          "Feature Extraction Pipeline", "Normalization and Transformation",
                          "State Vector Generation (248 features)"], colors['preprocessing'])

# DQN Core (central) - adjusted position for better alignment
dqn_core = create_box(ax, 6, 5, 4, 2, "DQN CORE",
                     ["State Representation Module", "Neural Network (4 layers)",
                      "Action Selection Logic", "Q-Value Calculation",
                      "Experience Replay Buffer", "Target Network"], colors['dqn_core'])

# Training Components (side) - adjusted position for better alignment
training = create_box(ax, 11, 5, 3, 2, "TRAINING COMPONENTS",
                     ["Reward Calculation", "Experience Collection",
                      "Model Update Process", "Epsilon Scheduler",
                      "Model Checkpoint Storage"], colors['training'])

# Response Execution (lower) - adjusted position for better alignment
response = create_box(ax, 6, 2.5, 4, 2, "RESPONSE EXECUTION",
                     ["Action Translation Layer", "Network Control Interface",
                      "Process Management Interface", "Security Policy Controller",
                      "Windows API Integration"], colors['response'])

# Alert System (bottom right) - adjusted position for better alignment
alert = create_box(ax, 11, 2.5, 3, 2, "ALERT SYSTEM",
                  ["Alert Classification Engine", "Windows Action Center Integration",
                   "Email Notification Service", "Security Dashboard",
                   "Administrative Controls"], colors['alert'])

# Monitoring & Feedback (bottom left) - adjusted position for better alignment
monitoring = create_box(ax, 2, 2.5, 3, 2, "MONITORING & FEEDBACK",
                       ["Performance Metrics Collection", "Human Feedback Interface",
                        "Model Performance Analytics", "System Health Monitoring"], 
                        colors['monitoring'])

# Add arrows for connections with improved positioning
# Solid arrows for data flow - straighter paths
arrow_kwargs = dict(arrowstyle='->', 
                    connectionstyle='arc3,rad=0.05',  # Less curved
                    color='black',
                    linewidth=1.8)  # Slightly thicker

# Data flow: Data Sources -> Preprocessing (vertically centered)
data_to_preproc = FancyArrowPatch((8, 9.5), (8, 9), **arrow_kwargs)
ax.add_patch(data_to_preproc)

# Data flow: Preprocessing -> DQN Core (vertically centered)
preproc_to_dqn = FancyArrowPatch((8, 7.5), (8, 7), **arrow_kwargs)
ax.add_patch(preproc_to_dqn)

# Data flow: DQN Core -> Response Execution (vertically centered)
dqn_to_response = FancyArrowPatch((8, 5), (8, 4.5), **arrow_kwargs)
ax.add_patch(dqn_to_response)

# Dashed arrows for control flow - more precision in placement
arrow_kwargs_dashed = dict(arrowstyle='->',
                           connectionstyle='arc3,rad=0.05',  # Less curved
                           color='black',
                           linewidth=1.8,
                           linestyle='dashed')

# Control flow: DQN Core <-> Training - better aligned
dqn_to_training = FancyArrowPatch((10, 6), (11, 6), **arrow_kwargs)
ax.add_patch(dqn_to_training)
training_to_dqn = FancyArrowPatch((11, 5.5), (10, 5.5), **arrow_kwargs_dashed)
ax.add_patch(training_to_dqn)

# Control flow: Response Execution -> Alert System - better aligned
response_to_alert = FancyArrowPatch((10, 3.5), (11, 3.5), **arrow_kwargs)
ax.add_patch(response_to_alert)

# Control flow: Response Execution -> Monitoring - better aligned
response_to_monitoring = FancyArrowPatch((6, 3.5), (5, 3.5), **arrow_kwargs)
ax.add_patch(response_to_monitoring)

# Double-headed arrows for feedback loops - smoother curve
arrow_kwargs_double = dict(arrowstyle='<->',
                          connectionstyle='arc3,rad=0.2',  # More defined curve
                          color='black',
                          linewidth=1.8)

# Feedback: Monitoring -> DQN Core - better positioned
monitoring_to_dqn = FancyArrowPatch((3.5, 4.5), (6.5, 5.5), **arrow_kwargs_double)
ax.add_patch(monitoring_to_dqn)

# Add small metrics boxes at key junctions with better positioning and styling
# Detection latency
latency_box = FancyBboxPatch((7.7, 6.6), 1.7, 0.4, boxstyle="round,pad=0.1", 
                            facecolor='white', alpha=0.95, edgecolor='black')
ax.add_patch(latency_box)
ax.text(8.5, 6.8, "Detection: 1.73s", ha='center', va='center', fontsize=9, fontweight='bold')

# Response latency
response_box = FancyBboxPatch((7.7, 4.8), 1.7, 0.4, boxstyle="round,pad=0.1", 
                             facecolor='white', alpha=0.95, edgecolor='black')
ax.add_patch(response_box)
ax.text(8.5, 5.0, "Response: 0.28s", ha='center', va='center', fontsize=9, fontweight='bold')

# Add title - corrected spelling and increased size
plt.title("Windows IDS System Architecture with DQN Agent Integration", fontsize=20, pad=20, fontweight='bold')

# Add legend for arrow types - better positioned and styled
legend_x, legend_y = 1, 1.2
ax.text(legend_x, legend_y, "Data Flow", ha='left', va='center', fontsize=10)
arrow1 = FancyArrowPatch((legend_x - 0.4, legend_y), (legend_x - 0.1, legend_y), arrowstyle='->', color='black', linewidth=1.8)
ax.add_patch(arrow1)

ax.text(legend_x, legend_y - 0.4, "Control Flow", ha='left', va='center', fontsize=10)
arrow2 = FancyArrowPatch((legend_x - 0.4, legend_y - 0.4), (legend_x - 0.1, legend_y - 0.4), 
                       arrowstyle='->', linestyle='dashed', color='black', linewidth=1.8)
ax.add_patch(arrow2)

ax.text(legend_x, legend_y - 0.8, "Feedback Loop", ha='left', va='center', fontsize=10)
arrow3 = FancyArrowPatch((legend_x - 0.4, legend_y - 0.8), (legend_x - 0.1, legend_y - 0.8), 
                       arrowstyle='<->', color='black', linewidth=1.8)
ax.add_patch(arrow3)

# Add a subtle grid in the background - lighter for more professional look
for i in range(17):
    ax.axvline(x=i, color='gray', linestyle='-', alpha=0.05)
for i in range(13):
    ax.axhline(y=i, color='gray', linestyle='-', alpha=0.05)

# Save the figure with higher quality
plt.savefig('ieee_format/generated_images/DQN_IDS_Architecture_Improved.png', dpi=400, bbox_inches='tight')
plt.close()

print("Improved DQN IDS Architecture diagram generated successfully!") 