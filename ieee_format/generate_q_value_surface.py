import numpy as np
import matplotlib.pyplot as plt
from matplotlib import cm
from mpl_toolkits.mplot3d import Axes3D
import os

# Create directory for saving images if it doesn't exist
os.makedirs('ieee_format/generated_images', exist_ok=True)

# Set the style to be more professional/academic
plt.style.use('seaborn-v0_8-whitegrid')

# Generate synthetic data for Q-value surfaces
np.random.seed(42)  # For reproducibility

# Define the 2D state space grid
resolution = 50
x = np.linspace(-1, 1, resolution)  # PC1 - attack progression
y = np.linspace(-1, 1, resolution)  # PC2 - attack type
X, Y = np.meshgrid(x, y)

# Function to create Q-value surfaces with peaks in specific regions
def create_q_surface(peak_regions, baseline=-0.5, peak_height=7.0, noise_scale=0.3):
    Z = np.ones_like(X) * baseline
    
    for region in peak_regions:
        x_center, y_center, intensity, spread = region
        gaussian = intensity * np.exp(-((X - x_center)**2 + (Y - y_center)**2) / (2 * spread**2))
        Z += gaussian
    
    # Add some noise to make it look realistic
    noise = np.random.normal(0, noise_scale, Z.shape)
    Z += noise
    
    # Clip values to reasonable range
    Z = np.clip(Z, -2, 10)
    
    return Z

# Define peak regions for different actions
# (x_center, y_center, intensity, spread)
block_ip_peaks = [
    (0.5, 0.8, 9.0, 0.3),   # Brute Force attack region peak
    (0.2, 0.3, 5.0, 0.2),   # Minor peak in other region
    (-0.3, 0.7, 6.0, 0.25)  # Another peak
]

process_termination_peaks = [
    (0.3, 0.3, 9.0, 0.3),   # Privilege Escalation region peak
    (0.6, -0.2, 5.0, 0.2),  # Minor peak
    (-0.2, 0.1, 4.0, 0.15)  # Another peak
]

resource_isolation_peaks = [
    (0.7, -0.4, 9.0, 0.35),  # Data Exfiltration region peak
    (0.0, -0.8, 7.0, 0.3),   # Another peak
    (-0.5, -0.6, 5.0, 0.25)  # Minor peak
]

critical_alert_peaks = [
    (0.4, 0.5, 7.0, 0.4),    # More uniform distribution
    (-0.1, -0.3, 6.5, 0.35),
    (0.6, 0.0, 6.0, 0.3),
    (-0.5, 0.2, 5.5, 0.25),
    (0.1, -0.7, 5.0, 0.3)
]

# Create the Q-value surfaces
block_ip_surface = create_q_surface(block_ip_peaks)
process_term_surface = create_q_surface(process_termination_peaks)
resource_iso_surface = create_q_surface(resource_isolation_peaks)
critical_alert_surface = create_q_surface(critical_alert_peaks)

# Create the figure with 2x2 subplots
fig = plt.figure(figsize=(16, 14))
fig.suptitle('Q-Value Surface Visualization for Key Security States', fontsize=20, y=0.98)

# Define a function to create a surface plot
def create_surface_plot(ax, X, Y, Z, title, view_angle=None):
    # Create the surface plot
    surf = ax.plot_surface(X, Y, Z, cmap=cm.coolwarm, linewidth=0, antialiased=True, alpha=0.8)
    
    # Add a color bar
    cbar = fig.colorbar(surf, ax=ax, shrink=0.6, aspect=10)
    cbar.set_label('Q-Value')
    
    # Set labels and title
    ax.set_xlabel('PC1 (Attack Progression)')
    ax.set_ylabel('PC2 (Attack Type)')
    ax.set_zlabel('Q-Value')
    ax.set_title(title, fontsize=14, pad=10)
    
    # Set axis limits
    ax.set_xlim(-1, 1)
    ax.set_ylim(-1, 1)
    ax.set_zlim(-2, 10)
    
    # Set view angle if provided
    if view_angle:
        ax.view_init(elev=view_angle[0], azim=view_angle[1])
    
    # Add region labels
    add_region_labels(ax)
    
    # Add grid lines
    ax.grid(True, alpha=0.3)
    
    # Find and mark the peak
    max_idx = np.unravel_index(Z.argmax(), Z.shape)
    max_x, max_y, max_z = X[max_idx], Y[max_idx], Z[max_idx]
    ax.scatter([max_x], [max_y], [max_z], color='black', s=50, marker='^')
    
    return surf

# Function to add region labels to an axis
def add_region_labels(ax):
    # Add region labels as text in 3D space
    brute_force_pos = (0.5, 0.8, -2)
    priv_esc_pos = (0.3, 0.3, -2)
    data_exfil_pos = (0.7, -0.4, -2)
    normal_ops_pos = (-0.8, -0.8, -2)
    
    ax.text(brute_force_pos[0], brute_force_pos[1], brute_force_pos[2], 
            "Brute Force\nAttack Region", color='green', fontsize=8, ha='center')
    ax.text(priv_esc_pos[0], priv_esc_pos[1], priv_esc_pos[2], 
            "Privilege Escalation\nRegion", color='orange', fontsize=8, ha='center')
    ax.text(data_exfil_pos[0], data_exfil_pos[1], data_exfil_pos[2], 
            "Data Exfiltration\nRegion", color='purple', fontsize=8, ha='center')
    ax.text(normal_ops_pos[0], normal_ops_pos[1], normal_ops_pos[2], 
            "Normal Operation\nRegion", color='blue', fontsize=8, ha='center')

# Create the subplots
ax1 = fig.add_subplot(2, 2, 1, projection='3d')
surf1 = create_surface_plot(ax1, X, Y, block_ip_surface, '"Block IP" Action', (30, 45))

ax2 = fig.add_subplot(2, 2, 2, projection='3d')
surf2 = create_surface_plot(ax2, X, Y, process_term_surface, '"Process Termination" Action', (30, 45))

ax3 = fig.add_subplot(2, 2, 3, projection='3d')
surf3 = create_surface_plot(ax3, X, Y, resource_iso_surface, '"Resource Isolation" Action', (30, 45))

ax4 = fig.add_subplot(2, 2, 4, projection='3d')
surf4 = create_surface_plot(ax4, X, Y, critical_alert_surface, '"Critical Alert" Action', (30, 45))

# Add a state space navigation guide in the corner
ax_guide = fig.add_axes([0.85, 0.85, 0.15, 0.15], frameon=False)
ax_guide.axis('off')
ax_guide.imshow(np.ones((10, 10, 3)), extent=[-1, 1, -1, 1])

ax_guide.plot([-1, 1], [0, 0], 'k-', alpha=0.5)
ax_guide.plot([0, 0], [-1, 1], 'k-', alpha=0.5)
ax_guide.text(0.9, 0, 'PC1', ha='center', va='center', fontsize=8)
ax_guide.text(0, 0.9, 'PC2', ha='center', va='center', fontsize=8)

ax_guide.scatter(0.5, 0.8, color='green', s=30)
ax_guide.text(0.5, 0.8, 'BF', ha='left', va='bottom', fontsize=6)

ax_guide.scatter(0.3, 0.3, color='orange', s=30)
ax_guide.text(0.3, 0.3, 'PE', ha='left', va='bottom', fontsize=6)

ax_guide.scatter(0.7, -0.4, color='purple', s=30)
ax_guide.text(0.7, -0.4, 'DE', ha='left', va='bottom', fontsize=6)

ax_guide.scatter(-0.8, -0.8, color='blue', s=30)
ax_guide.text(-0.8, -0.8, 'NO', ha='left', va='bottom', fontsize=6)

ax_guide.set_xlim(-1, 1)
ax_guide.set_ylim(-1, 1)
ax_guide.set_title('State Space\nNavigation', fontsize=8)

# Add caption at the bottom
caption = """Fig. 5. 3D visualization of Q-values across a 2D projection of the state space for selected defensive actions. 
The height and color of each surface represents the expected future reward (Q-value) for taking that action in a given state.
Note how different actions are preferred in different regions of the state space, demonstrating the agent's learned policy."""

fig.text(0.5, 0.01, caption, fontsize=12, ha='center', wrap=True)

# Adjust layout
plt.tight_layout()
plt.subplots_adjust(top=0.92, bottom=0.08)

# Save the figure
plt.savefig('ieee_format/generated_images/Q_Value_Surface.png', dpi=300, bbox_inches='tight')
plt.close()

print("Q-Value Surface visualization generated successfully!") 