import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Create directory for saving images if it doesn't exist
os.makedirs('ieee_format/generated_images', exist_ok=True)

# Set the style to be more professional/academic
plt.style.use('seaborn-v0_8-whitegrid')

# Generate synthetic data for the response selection heatmap
np.random.seed(42)  # For reproducibility

# Define attack types and response actions
attack_types = [
    'Brute Force', 
    'Privilege Escalation', 
    'Data Exfiltration', 
    'Lateral Movement', 
    'Command & Control', 
    'Zero-day Simulations'
]

response_actions = [
    'Block IP',
    'Rate Limiting',
    'DNS Sinkhole',
    'Process Termination',
    'Process Sandbox',
    'Reduce Privileges',
    'Apply Security Patch',
    'Modify Configuration',
    'Force Re-authentication',
    'Restrict User Access',
    'Critical Alert',
    'High Alert',
    'Medium Alert',
    'Low Alert',
    'Quarantine File',
    'Firewall Rule Update',
    'Resource Isolation',
    'No Action (monitoring)'
]

# Initialize the heatmap data matrix
heatmap_data = np.zeros((len(response_actions), len(attack_types)))

# Define key patterns from the specification
key_patterns = {
    'Brute Force': {
        'Block IP': 0.80,
        'Rate Limiting': 0.65,
        'Force Re-authentication': 0.45,
        'High Alert': 0.30,
        'Medium Alert': 0.25
    },
    'Privilege Escalation': {
        'Process Termination': 0.72,
        'Reduce Privileges': 0.68,
        'Critical Alert': 0.55,
        'Quarantine File': 0.40,
        'Restrict User Access': 0.38
    },
    'Data Exfiltration': {
        'Firewall Rule Update': 0.75,
        'Resource Isolation': 0.62,
        'Critical Alert': 0.58,
        'Block IP': 0.45,
        'High Alert': 0.40
    },
    'Lateral Movement': {
        'Resource Isolation': 0.81,
        'Critical Alert': 0.73,
        'Process Termination': 0.50,
        'Restrict User Access': 0.45,
        'Firewall Rule Update': 0.42
    },
    'Command & Control': {
        'DNS Sinkhole': 0.83,
        'Block IP': 0.76,
        'Firewall Rule Update': 0.60,
        'Critical Alert': 0.55,
        'High Alert': 0.40
    },
    'Zero-day Simulations': {
        'Critical Alert': 0.48,
        'High Alert': 0.45,
        'Resource Isolation': 0.42,
        'Process Sandbox': 0.38,
        'Block IP': 0.35,
        'DNS Sinkhole': 0.33,
        'Medium Alert': 0.30,
        'Process Termination': 0.28,
        'Firewall Rule Update': 0.25
    }
}

# Fill the heatmap matrix with specified values
for j, attack in enumerate(attack_types):
    for response, value in key_patterns[attack].items():
        i = response_actions.index(response)
        heatmap_data[i, j] = value
    
    # Fill remaining cells with small random values
    for i in range(len(response_actions)):
        if heatmap_data[i, j] == 0:
            heatmap_data[i, j] = np.random.uniform(0.02, 0.15)

# Create the plot
plt.figure(figsize=(12, 14))

# Create a custom colormap from white to dark blue
cmap = sns.color_palette("Blues", as_cmap=True)

# Plot the heatmap
ax = sns.heatmap(heatmap_data, annot=True, cmap=cmap, fmt='.2f', linewidths=0.5,
            xticklabels=attack_types, yticklabels=response_actions,
            cbar_kws={'label': 'Selection Frequency'})

# Highlight cells with values > 50% with black borders
for i in range(len(response_actions)):
    for j in range(len(attack_types)):
        if heatmap_data[i, j] > 0.5:
            ax.add_patch(plt.Rectangle((j, i), 1, 1, fill=False, edgecolor='black', lw=2))

# Find top 3 responses for each attack type and add thicker borders
for j, attack in enumerate(attack_types):
    # Get the indices of top 3 responses for this attack
    top_indices = np.argsort(heatmap_data[:, j])[-3:]
    
    for i in top_indices:
        ax.add_patch(plt.Rectangle((j, i), 1, 1, fill=False, edgecolor='black', lw=3))

# Set title and adjust layout
plt.title('DQN Response Selection Distribution Across Attack Types', fontsize=16, pad=20)
plt.tight_layout()

# Save the figure
plt.savefig('ieee_format/generated_images/Response_Selection_Heatmap.png', dpi=300, bbox_inches='tight')
plt.close()

print("Response Selection Heatmap image generated successfully!") 