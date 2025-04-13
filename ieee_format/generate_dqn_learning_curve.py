import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.collections import LineCollection
import os

# Create directory for saving images if it doesn't exist
os.makedirs('ieee_format/generated_images', exist_ok=True)

# Set the style to be more professional/academic
plt.style.use('seaborn-v0_8-whitegrid')

# Generate synthetic data for the DQN learning curve
np.random.seed(42)  # For reproducibility

# Number of episodes
episodes = 15000
episode_indices = np.arange(episodes)

# Create synthetic rewards data with appropriate pattern
# Start negative, then gradually increase with diminishing returns
rewards_raw = []
for i in range(episodes):
    if i < 1000:  # Initial phase
        base = -4 + (4 * i / 1000)
        noise = np.random.normal(0, 1.5)
    elif i < 5000:  # Intermediate phase
        base = 0 + (4 * (i - 1000) / 4000)
        noise = np.random.normal(0, 1.0)
    elif i < 10000:  # Advanced phase
        base = 4 + (4 * (i - 5000) / 5000)
        noise = np.random.normal(0, 0.7)
    else:  # Final phase
        base = 8 + (0.5 * (i - 10000) / 5000)
        noise = np.random.normal(0, 0.5)
    
    rewards_raw.append(base + noise)

# Calculate moving average (window=100)
window_size = 100
rewards_smoothed = np.zeros_like(rewards_raw)
for i in range(episodes):
    start = max(0, i - window_size + 1)
    rewards_smoothed[i] = np.mean(rewards_raw[start:i+1])

# Calculate standard deviation for shaded area
rewards_std = np.zeros_like(rewards_raw)
for i in range(episodes):
    start = max(0, i - window_size + 1)
    if i - start > 1:  # Need at least 2 points for std
        rewards_std[i] = np.std(rewards_raw[start:i+1])

# Create gradient color for the main curve
cmap = LinearSegmentedColormap.from_list('custom_blue', 
                                         [(0, '#1E3F66'), 
                                          (0.5, '#2E5984'), 
                                          (1, '#4682B4')])

# Create the plot
plt.figure(figsize=(10, 6))

# Plot raw data points (light gray and transparent)
plt.scatter(episode_indices[::50], rewards_raw[::50], 
            color='lightgray', alpha=0.3, s=10, zorder=1)

# Plot the moving average with gradient color
points = np.array([episode_indices, rewards_smoothed]).T.reshape(-1, 1, 2)
segments = np.concatenate([points[:-1], points[1:]], axis=1)
norm = plt.Normalize(0, episodes)
lc = LineCollection(segments, cmap=cmap, norm=norm, lw=2.5, zorder=3)
lc.set_array(episode_indices)
plt.gca().add_collection(lc)

# Add shaded area for standard deviation
plt.fill_between(episode_indices, 
                 rewards_smoothed - rewards_std, 
                 rewards_smoothed + rewards_std, 
                 color='lightblue', alpha=0.3, zorder=2)

# Add phase transition lines
plt.axvline(x=1000, color='gray', linestyle='--', alpha=0.7)
plt.axvline(x=5000, color='gray', linestyle='--', alpha=0.7)
plt.axvline(x=10000, color='gray', linestyle='--', alpha=0.7)

# Add annotations
plt.annotate('Initial exploration dominates', xy=(500, -3.5), xytext=(500, -4.5),
             arrowprops=dict(facecolor='black', shrink=0.05, width=1.5, headwidth=8),
             ha='center', fontsize=10)

plt.annotate('Policy refinement', xy=(3000, 2.5), xytext=(3000, 0.5),
             arrowprops=dict(facecolor='black', shrink=0.05, width=1.5, headwidth=8),
             ha='center', fontsize=10)

plt.annotate('Fine-tuning', xy=(8000, 7), xytext=(8000, 5),
             arrowprops=dict(facecolor='black', shrink=0.05, width=1.5, headwidth=8),
             ha='center', fontsize=10)

plt.annotate('Convergence', xy=(12000, 8.5), xytext=(12000, 6.5),
             arrowprops=dict(facecolor='black', shrink=0.05, width=1.5, headwidth=8),
             ha='center', fontsize=10)

# Set labels and title
plt.xlabel('Training Episodes', fontsize=12)
plt.ylabel('Average Reward per Episode', fontsize=12)
plt.title('DQN Learning Curve: Reward vs. Training Episodes', fontsize=14, pad=20)

# Set axis limits
plt.xlim(0, episodes)
plt.ylim(-5, 10)

# Add grid
plt.grid(True, alpha=0.3)

# Add phase labels at the top
plt.text(500, 9.5, 'Initial', ha='center', fontsize=10)
plt.text(3000, 9.5, 'Intermediate', ha='center', fontsize=10)
plt.text(7500, 9.5, 'Advanced', ha='center', fontsize=10)
plt.text(12500, 9.5, 'Final', ha='center', fontsize=10)

# Tight layout
plt.tight_layout()

# Save the figure
plt.savefig('ieee_format/generated_images/DQN_Learning_Curve.png', dpi=300, bbox_inches='tight')
plt.close()

print("DQN Learning Curve image generated successfully!") 