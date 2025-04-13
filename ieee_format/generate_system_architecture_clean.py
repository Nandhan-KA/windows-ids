import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyArrowPatch, FancyBboxPatch
import matplotlib.patheffects as path_effects
import os

# Create directory for saving images if it doesn't exist
os.makedirs('ieee_format/generated_images', exist_ok=True)

# Function to create a box with title
def create_box(ax, x, y, width, height, title, components, color, alpha=0.9, edge_color='black'):
    # Draw the main box with simple rectangle
    rect = Rectangle((x, y), width, height, 
                    facecolor=color, alpha=alpha, 
                    edgecolor=edge_color, linewidth=1.5,
                    zorder=1)
    ax.add_patch(rect)
    
    # Add the title at the top of the box
    title_y = y + height - 0.4
    text = ax.text(x + width/2, title_y, title, 
                  ha='center', va='center', fontsize=12, fontweight='bold',
                  zorder=2)
    
    # Add a white background to the title for better readability
    text.set_path_effects([path_effects.withStroke(linewidth=5, foreground='white')])
    
    # Add components as bulleted list with more spacing
    for i, component in enumerate(components):
        component_y = title_y - 0.7 - i * 0.4  # Increased spacing between items
        ax.text(x + 0.3, component_y, "•", ha='center', va='center', fontsize=10, zorder=2)
        ax.text(x + 0.6, component_y, component, ha='left', va='center', fontsize=10, zorder=2)
    
    return rect

# Create a new figure with higher resolution
plt.figure(figsize=(18, 12), dpi=300)  # Wider figure for more space
ax = plt.gca()

# Set equal aspect ratio and axis limits
ax.set_xlim(0, 18)  # Wider canvas
ax.set_ylim(0, 12)
ax.set_aspect('equal')

# Remove axes
ax.axis('off')

# Define colors for different components - using a cleaner palette
colors = {
    'data_sources': '#D6EAF8',      # Very light blue
    'preprocessing': '#D5F5E3',      # Very light green
    'dqn_core': '#FCF3CF',          # Very light yellow
    'training': '#FADBD8',          # Very light pink
    'response': '#F5CBA7',          # Very light orange
    'alert': '#E8DAEF',             # Very light purple
    'monitoring': '#F2F3F4'          # Very light gray
}

# Create the boxes for each component with more spacing between them
# Data Sources (top)
data_sources = create_box(ax, 3, 9.5, 12, 2, "DATA SOURCES", 
                         ["Windows Event Logs", "Network Traffic Sensors", 
                          "Process Monitoring", "File System Monitors",
                          "Registry Watchers", "User Activity Trackers",
                          "Windows Defender Events"], colors['data_sources'])

# Data Ingestion & Preprocessing
preprocessing = create_box(ax, 3, 7.3, 12, 1.7, "DATA INGESTION & PREPROCESSING",
                         ["Event Collection Service", "Real-time Stream Processing",
                          "Feature Extraction Pipeline", "Normalization",
                          "State Vector Generation (248 features)"], colors['preprocessing'])

# DQN Core (central) - with more space around it
dqn_core = create_box(ax, 5.5, 4.8, 4, 2, "DQN CORE",
                     ["State Representation", "Neural Network (4 layers)",
                      "Action Selection Logic", "Q-Value Calculation",
                      "Experience Replay Buffer", "Target Network"], 
                      colors['dqn_core'], edge_color='#B7950B')

# Training Components (side) - with more space
training = create_box(ax, 11.5, 4.8, 3.5, 2, "TRAINING COMPONENTS",
                     ["Reward Calculation", "Experience Collection",
                      "Model Update Process", "Epsilon Scheduler",
                      "Model Checkpoint Storage"], 
                      colors['training'])

# Response Execution (lower) - with more space
response = create_box(ax, 5.5, 2.3, 4, 2, "RESPONSE EXECUTION",
                     ["Action Translation Layer", "Network Control Interface",
                      "Process Management Interface", "Security Policy Controller",
                      "Windows API Integration"], 
                      colors['response'])

# Alert System (bottom right) - with more space
alert = create_box(ax, 11.5, 2.3, 3.5, 2, "ALERT SYSTEM",
                  ["Alert Classification Engine", "Windows Action Center",
                   "Email Notification Service", "Security Dashboard",
                   "Administrative Controls"], 
                   colors['alert'])

# Monitoring & Feedback (bottom left) - with more space
monitoring = create_box(ax, 1, 2.3, 3.5, 2, "MONITORING & FEEDBACK",
                       ["Performance Metrics", "Human Feedback Interface",
                        "Model Performance Analytics", "System Health Monitoring"], 
                        colors['monitoring'])

# Add arrows for connections with clean styling
# Solid arrows for data flow - straight vertical arrows
arrow_kwargs = dict(arrowstyle='->', 
                    connectionstyle='arc3,rad=0',  # Straight
                    color='black',
                    linewidth=1.5,
                    shrinkA=5, shrinkB=5,  # Space between arrow and boxes
                    zorder=1)

# Data flow: Data Sources -> Preprocessing (vertically centered)
data_to_preproc = FancyArrowPatch((9, 9.5), (9, 9), **arrow_kwargs)
ax.add_patch(data_to_preproc)

# Data flow: Preprocessing -> DQN Core (vertically centered)
preproc_to_dqn = FancyArrowPatch((7.5, 7.3), (7.5, 6.8), **arrow_kwargs)
ax.add_patch(preproc_to_dqn)

# Data flow: DQN Core -> Response Execution (vertically centered)
dqn_to_response = FancyArrowPatch((7.5, 4.8), (7.5, 4.3), **arrow_kwargs)
ax.add_patch(dqn_to_response)

# Dashed arrows for control flow - straight horizontal arrows
arrow_kwargs_dashed = dict(arrowstyle='->',
                           connectionstyle='arc3,rad=0',  # Straight
                           color='black',
                           linewidth=1.5,
                           linestyle='dashed',
                           shrinkA=5, shrinkB=5,
                           zorder=1)

# Control flow: DQN Core <-> Training 
dqn_to_training = FancyArrowPatch((9.5, 5.8), (11.5, 5.8), **arrow_kwargs)
ax.add_patch(dqn_to_training)
training_to_dqn = FancyArrowPatch((11.5, 5.3), (9.5, 5.3), **arrow_kwargs_dashed)
ax.add_patch(training_to_dqn)

# Control flow: Response Execution -> Alert System
response_to_alert = FancyArrowPatch((9.5, 3.3), (11.5, 3.3), **arrow_kwargs)
ax.add_patch(response_to_alert)

# Control flow: Response Execution -> Monitoring
response_to_monitoring = FancyArrowPatch((5.5, 3.3), (4.5, 3.3), **arrow_kwargs)
ax.add_patch(response_to_monitoring)

# Double-headed arrows for feedback loops - straight diagonal arrows
arrow_kwargs_double = dict(arrowstyle='<->',
                          connectionstyle='arc3,rad=0.1',  # Slight curve
                          color='black',
                          linewidth=1.5,
                          shrinkA=5, shrinkB=5,
                          zorder=1)

# Feedback: Monitoring -> DQN Core
monitoring_to_dqn = FancyArrowPatch((3.3, 4.0), (5.5, 5.5), **arrow_kwargs_double)
ax.add_patch(monitoring_to_dqn)

# Add small metrics boxes with clean styling
# Detection latency
latency_box = Rectangle((7.0, 6.4), 2, 0.4, 
                       facecolor='white', alpha=1.0, 
                       edgecolor='#888888', linewidth=1,
                       zorder=3)  # Higher zorder to appear on top
ax.add_patch(latency_box)
ax.text(8.0, 6.6, "Detection: 1.73s", ha='center', va='center', 
        fontsize=9, fontweight='bold', color='#444444',
        zorder=4)

# Response latency
response_box = Rectangle((7.0, 4.0), 2, 0.4, 
                        facecolor='white', alpha=1.0, 
                        edgecolor='#888888', linewidth=1,
                        zorder=3)
ax.add_patch(response_box)
ax.text(8.0, 4.2, "Response: 0.28s", ha='center', va='center', 
        fontsize=9, fontweight='bold', color='#444444',
        zorder=4)

# Add title with clean styling
plt.title("Windows IDS System Architecture with DQN Agent Integration", 
          fontsize=18, pad=20, fontweight='bold', color='black')

# Add legend for arrow types with clean styling
legend_x, legend_y = 14, 6.5
# Add a legend background
legend_box = Rectangle((legend_x - 0.5, legend_y - 1.5), 3, 1.8, 
                       facecolor='white', alpha=0.9, 
                       edgecolor='#888888', linewidth=1,
                       zorder=5)
ax.add_patch(legend_box)

# Add legend items
ax.text(legend_x, legend_y, "Data Flow", ha='left', va='center', 
        fontsize=10, fontweight='bold', color='black',
        zorder=6)
arrow1 = FancyArrowPatch((legend_x - 0.4, legend_y), (legend_x - 0.1, legend_y), 
                       arrowstyle='->', color='black', linewidth=1.5,
                       zorder=6)
ax.add_patch(arrow1)

ax.text(legend_x, legend_y - 0.6, "Control Flow", ha='left', va='center', 
        fontsize=10, fontweight='bold', color='black',
        zorder=6)
arrow2 = FancyArrowPatch((legend_x - 0.4, legend_y - 0.6), (legend_x - 0.1, legend_y - 0.6), 
                       arrowstyle='->', linestyle='dashed', color='black', linewidth=1.5,
                       zorder=6)
ax.add_patch(arrow2)

ax.text(legend_x, legend_y - 1.2, "Feedback Loop", ha='left', va='center', 
        fontsize=10, fontweight='bold', color='black',
        zorder=6)
arrow3 = FancyArrowPatch((legend_x - 0.4, legend_y - 1.2), (legend_x - 0.1, legend_y - 1.2), 
                       arrowstyle='<->', color='black', linewidth=1.5,
                       zorder=6)
ax.add_patch(arrow3)

# Add a very subtle grid in the background
for i in range(19):
    ax.axvline(x=i, color='gray', linestyle='-', alpha=0.03)
for i in range(13):
    ax.axhline(y=i, color='gray', linestyle='-', alpha=0.03)

# Save the figure with higher quality
plt.savefig('ieee_format/generated_images/DQN_IDS_Architecture_Clean.png', dpi=400, bbox_inches='tight')
plt.close()

print("Clean DQN IDS Architecture diagram generated successfully!") 