import os
import subprocess
import time

print("Generating all images for the Windows IDS DQN paper...")

# Create directory for images if it doesn't exist
os.makedirs('ieee_format/generated_images', exist_ok=True)

scripts = [
    'generate_dqn_learning_curve.py',
    'generate_threat_detection_roc.py',
    'generate_response_heatmap.py',
    'generate_system_architecture.py',
    'generate_q_value_surface.py'
]

for script in scripts:
    print(f"\nRunning {script}...")
    script_path = os.path.join('ieee_format', script)
    start_time = time.time()
    
    try:
        result = subprocess.run(['python', script_path], check=True, capture_output=True, text=True)
        print(result.stdout)
        elapsed_time = time.time() - start_time
        print(f"Completed in {elapsed_time:.2f} seconds")
    except subprocess.CalledProcessError as e:
        print(f"Error running {script}:")
        print(e.stderr)
        print("Continuing with other scripts...")

print("\nAll image generation completed!")
print("Generated images are in the ieee_format/generated_images/ directory:")
for file in os.listdir('ieee_format/generated_images'):
    file_size = os.path.getsize(os.path.join('ieee_format/generated_images', file)) / 1024  # KB
    print(f"  - {file} ({file_size:.1f} KB)") 