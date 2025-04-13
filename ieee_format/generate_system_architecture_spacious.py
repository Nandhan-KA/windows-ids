import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, FancyArrowPatch, FancyBboxPatch
import matplotlib.patheffects as path_effects
import os

# Create directory for saving images if it doesn't exist
os.makedirs('ieee_format/generated_images', exist_ok=True)

# Function to create a box with title
def create_box(ax, x, y, width, height, title, components, color, alpha=0.85, edge_color='black'):
    # Draw the main box with simple rectangle and rounded corners
    rect = Rectangle((x, y), width, height, 
                    facecolor=color, alpha=alpha, 
                    edgecolor=edge_color, linewidth=1.8,  # Thicker border
                    zorder=1)
    ax.add_patch(rect)
    
    # Add the title at the top of the box
    title_y = y + height - 0.4
    text = ax.text(x + width/2, title_y, title, 
                  ha='center', va='center', fontsize=14, fontweight='bold',  # Larger title text
                  color='#000000',  # Darker text color
                  zorder=2)
    
    # Add a white background to the title for better readability
    text.set_path_effects([path_effects.withStroke(linewidth=5, foreground='white')])
    
    # Calculate component vertical spacing based on box height and number of components
    available_height = height - 1.0  # Subtract space for title
    component_spacing = min(0.8, available_height / (len(components) + 1))
    
    # Add components with perfectly aligned bullet points and text
    for i, component in enumerate(components):
        # Calculate vertical position with even spacing
        component_y = y + height - 1.0 - (i + 0.5) * component_spacing
        
        # Fixed positions for bullet points and text
        bullet_x = x + 0.5  # Consistent position for bullets
        text_x = x + 1.0    # Consistent position for text
        
        # Add bullet point - larger and darker
        ax.text(bullet_x, component_y, "•", ha='center', va='center', fontsize=12, 
                fontweight='bold', color='#222222', zorder=2)
        
        # Add component text with consistent alignment - larger, bolder and darker
        ax.text(text_x, component_y, component, ha='left', va='center', fontsize=12,  # Larger component text
                fontweight='bold', color='#222222', zorder=2)  # Bold and darker text
    
    return rect

# Create a new figure with higher resolution and even more width
plt.figure(figsize=(20, 13), dpi=300)  # Wider figure for much more space
ax = plt.gca()

# Set equal aspect ratio and axis limits
ax.set_xlim(0, 20)  # Wider canvas
ax.set_ylim(0, 13)
ax.set_aspect('equal')

# Remove axes
ax.axis('off')

# Define colors for different components - using a richer but still light palette
colors = {
    'data_sources': '#BBDEFB',      # Slightly richer blue
    'preprocessing': '#C8E6C9',      # Slightly richer green
    'dqn_core': '#FFF59D',          # Slightly richer yellow
    'training': '#F8BBD0',          # Slightly richer pink
    'response': '#FFE0B2',          # Slightly richer orange
    'alert': '#E1BEE7',             # Slightly richer purple
    'monitoring': '#EEEEEE'          # Slightly richer gray
}

# Add shadows to boxes for a more professional look
def add_shadow(ax, rect, offset=0.08):
    shadow = Rectangle(
        (rect.get_x() + offset, rect.get_y() - offset),
        rect.get_width(), rect.get_height(),
        facecolor='#888888', alpha=0.15, zorder=0
    )
    ax.add_patch(shadow)

# Create the boxes for each component with much more spacing between them
# Data Sources (top) - with more horizontal space
data_sources = create_box(ax, 3, 10, 14, 2, "DATA SOURCES", 
                         ["Windows Event Logs", "Network Traffic Sensors", 
                          "Process Monitoring", "File System Monitors"], colors['data_sources'])
add_shadow(ax, data_sources)  # Add shadow

# Data Ingestion & Preprocessing - adjusted height to accommodate all items
preprocessing = create_box(ax, 3, 7.5, 14, 2.0, "DATA INGESTION & PREPROCESSING",
                         ["Event Collection Service", "Real-time Stream Processing",
                          "Feature Extraction Pipeline"], colors['preprocessing'])
add_shadow(ax, preprocessing)  # Add shadow

# DQN Core (central) - with much more space around it
dqn_core = create_box(ax, 6, 4.5, 4.5, 2, "DQN CORE",
                     ["State Representation", "Neural Network (4 layers)",
                      "Action Selection Logic"], 
                      colors['dqn_core'], edge_color='#B7950B')
add_shadow(ax, dqn_core)  # Add shadow

# Training Components (side) - with much more space
training = create_box(ax, 13, 4.5, 4, 2, "TRAINING COMPONENTS",
                     ["Reward Calculation", "Experience Collection",
                      "Model Update Process"], 
                      colors['training'])
add_shadow(ax, training)  # Add shadow

# Response Execution (lower) - with much more space
response = create_box(ax, 6, 1.5, 4.5, 2, "RESPONSE EXECUTION",
                     ["Action Translation Layer", "Network Control Interface",
                      "Security Policy Controller"], 
                      colors['response'])
add_shadow(ax, response)  # Add shadow

# Alert System (bottom right) - with much more space
alert = create_box(ax, 13, 1.5, 4, 2, "ALERT SYSTEM",
                  ["Alert Classification Engine", "Windows Action Center",
                   "Security Dashboard"], 
                   colors['alert'])
add_shadow(ax, alert)  # Add shadow

# Monitoring & Feedback (bottom left) - with much more space
monitoring = create_box(ax, 1, 1.5, 3.5, 2, "MONITORING & FEEDBACK",
                       ["Performance Metrics", "Human Feedback Interface",
                        "System Health Monitoring"], 
                        colors['monitoring'])
add_shadow(ax, monitoring)  # Add shadow

# Add arrows for connections with clean styling and more spacing
# Solid arrows for data flow - straight vertical arrows with more space
arrow_kwargs = dict(arrowstyle='->',
                   connectionstyle='arc3,rad=0',  # Straight
                   color='#222222',  # Darker color
                   linewidth=2.0,  # Thicker lines
                   shrinkA=8, shrinkB=8,  # More space between arrow and boxes
                   zorder=1)

# Data flow: Data Sources -> Preprocessing (vertically centered)
data_to_preproc = FancyArrowPatch((10, 10), (10, 9.2), **arrow_kwargs)
ax.add_patch(data_to_preproc)

# Data flow: Preprocessing -> DQN Core (vertically centered)
preproc_to_dqn = FancyArrowPatch((8.25, 7.5), (8.25, 6.5), **arrow_kwargs)
ax.add_patch(preproc_to_dqn)

# Data flow: DQN Core -> Response Execution (vertically centered)
dqn_to_response = FancyArrowPatch((8.25, 4.5), (8.25, 3.5), **arrow_kwargs)
ax.add_patch(dqn_to_response)

# Dashed arrows for control flow - straight horizontal arrows with more spacing
arrow_kwargs_dashed = dict(arrowstyle='->',
                           connectionstyle='arc3,rad=0',  # Straight
                           color='#222222',  # Darker color
                           linewidth=2.0,  # Thicker lines
                           linestyle='dashed',
                           shrinkA=8, shrinkB=8,
                           zorder=1)

# Control flow: DQN Core <-> Training 
dqn_to_training = FancyArrowPatch((10.5, 5.5), (13, 5.5), **arrow_kwargs)
ax.add_patch(dqn_to_training)
training_to_dqn = FancyArrowPatch((13, 5), (10.5, 5), **arrow_kwargs_dashed)
ax.add_patch(training_to_dqn)

# Control flow: Response Execution -> Alert System
response_to_alert = FancyArrowPatch((10.5, 2.5), (13, 2.5), **arrow_kwargs)
ax.add_patch(response_to_alert)

# Control flow: Response Execution -> Monitoring
response_to_monitoring = FancyArrowPatch((6, 2.5), (4.5, 2.5), **arrow_kwargs)
ax.add_patch(response_to_monitoring)

# Double-headed arrows for feedback loops - straight diagonal arrows
arrow_kwargs_double = dict(arrowstyle='<->',
                          connectionstyle='arc3,rad=0.1',  # Slight curve
                          color='#222222',  # Darker color
                          linewidth=2.0,  # Thicker lines
                          shrinkA=8, shrinkB=8,
                          zorder=1)

# Feedback: Monitoring -> DQN Core
monitoring_to_dqn = FancyArrowPatch((3.3, 3.2), (6, 4.5), **arrow_kwargs_double)
ax.add_patch(monitoring_to_dqn)

# Add detection and response latency boxes with better styling
# Detection latency
latency_box = Rectangle((7.75, 6.25), 2, 0.4, 
                     facecolor='white', alpha=1.0, 
                     edgecolor='#BBBBBB', linewidth=1.5,  # Stronger border
                     zorder=3)  # Higher zorder to appear on top
ax.add_patch(latency_box)
ax.text(8.75, 6.45, "Detection: 1.73s", ha='center', va='center', 
       fontsize=11, fontweight='bold', color='#222222',  # Larger, darker text
       zorder=4)

# Response latency
response_box = Rectangle((7.75, 3.75), 2, 0.4, 
                      facecolor='white', alpha=1.0, 
                      edgecolor='#BBBBBB', linewidth=1.5,  # Stronger border
                      zorder=3)
ax.add_patch(response_box)
ax.text(8.75, 3.95, "Response: 0.28s", ha='center', va='center', 
       fontsize=11, fontweight='bold', color='#222222',  # Larger, darker text
       zorder=4)

# Add title with enhanced styling
plt.title("Windows IDS System Architecture with DQN Agent Integration", 
         fontsize=20, pad=20, fontweight='bold', color='#000000')  # Larger, darker title

# Add legend for arrow types with enhanced styling
legend_x, legend_y = 16, 6.5
# Add a legend background with enhanced styling
legend_box = Rectangle((legend_x - 0.5, legend_y - 1.5), 3.5, 1.8, 
                     facecolor='white', alpha=0.95, 
                     edgecolor='#CCCCCC', linewidth=1.5,  # Stronger border
                     zorder=5)
ax.add_patch(legend_box)
add_shadow(ax, legend_box, offset=0.05)  # Add shadow to legend box

# Add legend items with enhanced styling
ax.text(legend_x, legend_y, "Data Flow", ha='left', va='center', 
       fontsize=12, fontweight='bold', color='#222222',  # Larger, darker text
       zorder=6)
arrow1 = FancyArrowPatch((legend_x - 0.4, legend_y), (legend_x - 0.1, legend_y), 
                       arrowstyle='->', color='#222222', linewidth=2.0,
                       zorder=6)
ax.add_patch(arrow1)

ax.text(legend_x, legend_y - 0.6, "Control Flow", ha='left', va='center', 
        fontsize=12, fontweight='bold', color='#222222',
        zorder=6)
arrow2 = FancyArrowPatch((legend_x - 0.4, legend_y - 0.6), (legend_x - 0.1, legend_y - 0.6), 
                       arrowstyle='->', linestyle='dashed', color='#222222', linewidth=2.0,
                       zorder=6)
ax.add_patch(arrow2)

ax.text(legend_x, legend_y - 1.2, "Feedback Loop", ha='left', va='center', 
        fontsize=12, fontweight='bold', color='#222222',
        zorder=6)
arrow3 = FancyArrowPatch((legend_x - 0.4, legend_y - 1.2), (legend_x - 0.1, legend_y - 1.2), 
                       arrowstyle='<->', color='#222222', linewidth=2.0,
                       zorder=6)
ax.add_patch(arrow3)

# Save the figure with higher quality
plt.savefig('ieee_format/generated_images/DQN_IDS_Architecture_Spacious.png', dpi=400, bbox_inches='tight')
plt.close()

print("Spacious DQN IDS Architecture diagram generated successfully!") 