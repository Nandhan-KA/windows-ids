import os
import shutil
import sys
def setup_analyzer():
    source_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'network_monitor.py')
    target_dir = r"C:\Users\nandhanka\Desktop\ids"
    target_path = os.path.join(target_dir, 'network_monitor.py')
    if not os.path.exists(source_path):
        print(f"Error: Source file {source_path} does not exist")
        return False
    if not os.path.exists(target_dir):
        try:
            os.makedirs(target_dir)
            print(f"Created directory: {target_dir}")
        except Exception as e:
            print(f"Error creating directory {target_dir}: {e}")
            return False
    try:
        shutil.copy2(source_path, target_path)
        print(f"Successfully copied network_monitor.py to {target_path}")
        return True
    except Exception as e:
        print(f"Error copying file: {e}")
        return False
if __name__ == "__main__":
    success = setup_analyzer()
    if success:
        print("Network analyzer setup completed successfully")
    else:
        print("Network analyzer setup failed")
        sys.exit(1) 