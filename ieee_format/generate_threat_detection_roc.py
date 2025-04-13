import numpy as np
import matplotlib.pyplot as plt
import os

# Create directory for saving images if it doesn't exist
os.makedirs('ieee_format/generated_images', exist_ok=True)

# Set the style to be more professional/academic
plt.style.use('seaborn-v0_8-whitegrid')

# Generate synthetic data for ROC curves
np.random.seed(42)  # For reproducibility

# Helper function to generate ROC curve data points with specific AUC
def generate_roc_curve_data(auc_target, n_points=100):
    # Start with a perfect ROC curve
    fpr_perfect = np.linspace(0, 1, n_points)
    tpr_perfect = np.ones_like(fpr_perfect)
    
    # Start with a random ROC curve (diagonal line)
    fpr_random = np.linspace(0, 1, n_points)
    tpr_random = np.linspace(0, 1, n_points)
    
    # Interpolate between perfect and random to get desired AUC
    # AUC of perfect curve is 1.0, AUC of random is 0.5
    weight = (auc_target - 0.5) / 0.5  # Scale to [0, 1]

    # Use fpr_random as the base for our FPR values
    fpr = fpr_random
    
    tpr = weight * tpr_perfect + (1 - weight) * tpr_random
    
    # Add some noise to make it look realistic
    noise = np.random.normal(0, 0.02, n_points)
    tpr = np.clip(tpr + noise, 0, 1)
    
    # Sort points to ensure non-decreasing TPR
    idx = np.argsort(fpr)
    fpr = fpr[idx]
    tpr = tpr[idx]
    
    # Ensure tpr is non-decreasing
    tpr.sort()
    
    # Ensure starts at (0,0) and ends at (1,1)
    fpr[0], tpr[0] = 0, 0
    fpr[-1], tpr[-1] = 1, 1
    
    # Calculate actual AUC (will be close to target)
    actual_auc = np.trapz(tpr, fpr)
    
    return fpr, tpr, actual_auc

# Define AUC values from the specification
auc_values = {
    'DQN Overall': 0.967,
    'Brute Force': 0.988,
    'Privilege Escalation': 0.923,
    'Data Exfiltration': 0.945,
    'Lateral Movement': 0.907,
    'Command & Control': 0.961,
    'Zero-day Simulations': 0.843,
    'Signature-based': 0.897,
    'Anomaly Detection': 0.931,
    'Random Forest': 0.941,
    'LSTM Network': 0.952
}

# Generate ROC curve data for each method
roc_curves = {}
for name, target_auc in auc_values.items():
    fpr, tpr, actual_auc = generate_roc_curve_data(target_auc)
    roc_curves[name] = (fpr, tpr, actual_auc)

# Create the plot
plt.figure(figsize=(10, 8))

# Plot the random classifier reference line
plt.plot([0, 1], [0, 1], linestyle='--', color='gray', alpha=0.7, 
         label='Random Classifier', linewidth=1.5)

# Define colors for the attack types and comparison methods
attack_colors = {
    'DQN Overall': 'blue',
    'Brute Force': 'green',
    'Privilege Escalation': 'orange',
    'Data Exfiltration': 'purple',
    'Lateral Movement': 'gold',
    'Command & Control': 'red',
    'Zero-day Simulations': 'black',
    'Signature-based': 'gray',
    'Anomaly Detection': 'skyblue',
    'Random Forest': 'brown',
    'LSTM Network': 'pink'
}

# Plot the ROC curves in the right order and style
# First the comparison methods (thinner lines)
for name in ['Signature-based', 'Anomaly Detection', 'Random Forest', 'LSTM Network']:
    fpr, tpr, auc_val = roc_curves[name]
    plt.plot(fpr, tpr, color=attack_colors[name], 
             label=f'{name} (AUC = {auc_val:.3f})',
             linewidth=1.5, alpha=0.7)

# Then the attack-specific curves
for name in ['Brute Force', 'Privilege Escalation', 'Data Exfiltration', 
             'Lateral Movement', 'Command & Control', 'Zero-day Simulations']:
    fpr, tpr, auc_val = roc_curves[name]
    linestyle = '--' if name == 'Zero-day Simulations' else '-'
    plt.plot(fpr, tpr, color=attack_colors[name], 
             label=f'{name} (AUC = {auc_val:.3f})',
             linewidth=2, linestyle=linestyle)

# Finally, plot the DQN overall performance (bold)
fpr, tpr, auc_val = roc_curves['DQN Overall']
plt.plot(fpr, tpr, color=attack_colors['DQN Overall'], 
         label=f'DQN Overall (AUC = {auc_val:.3f})',
         linewidth=3)

# Add operating point of DQN system (circle marker)
operating_fpr, operating_tpr = 0.028, 0.935
plt.scatter([operating_fpr], [operating_tpr], marker='o', color='blue', s=100, 
            label=f'Operating Point (FPR={operating_fpr:.3f}, TPR={operating_tpr:.3f})')

# Add optimal threshold point (star marker)
optimal_fpr, optimal_tpr = 0.031, 0.942
plt.scatter([optimal_fpr], [optimal_tpr], marker='*', color='blue', s=150,
            label=f'Optimal Threshold (FPR={optimal_fpr:.3f}, TPR={optimal_tpr:.3f})')

# Add vertical dashed lines at important thresholds
for fpr_thresh in [0.01, 0.05, 0.1]:
    plt.axvline(x=fpr_thresh, color='gray', linestyle='--', alpha=0.5)
    plt.text(fpr_thresh+0.01, 0.1, f'FPR={fpr_thresh}', rotation=90, alpha=0.7)

# Set labels and title
plt.xlabel('False Positive Rate', fontsize=12)
plt.ylabel('True Positive Rate', fontsize=12)
plt.title('Receiver Operating Characteristic (ROC) Curves for Windows IDS', fontsize=14, pad=20)

# Set axis limits
plt.xlim([-0.01, 1.01])
plt.ylim([-0.01, 1.01])

# Add grid
plt.grid(True, alpha=0.3)

# Add legend in bottom-right corner
plt.legend(loc='lower right', fontsize=9)

# Tight layout
plt.tight_layout()

# Save the figure
plt.savefig('ieee_format/generated_images/Threat_Detection_ROC.png', dpi=300, bbox_inches='tight')
plt.close()

print("Threat Detection ROC image generated successfully!") 