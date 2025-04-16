import os
import re
import sys

def remove_comments_from_file(file_path):
    print(f"Processing {file_path}...")
    
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Remove multi-line docstrings (triple quotes)
    content = re.sub(r'"""[\s\S]*?"""', '', content)
    content = re.sub(r"'''[\s\S]*?'''", '', content)
    
    # Process line by line to remove single-line comments
    lines = content.split('\n')
    cleaned_lines = []
    
    for line in lines:
        # Remove comments that start with #
        if '#' in line:
            # Keep the part before the comment
            line = line.split('#')[0]
        
        # Skip empty lines or lines with only whitespace
        if line.strip():
            cleaned_lines.append(line)
    
    # Join lines back together
    cleaned_content = '\n'.join(cleaned_lines)
    
    # Write the cleaned content back to the file
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(cleaned_content)
    
    print(f"Removed comments from {file_path}")

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                file_path = os.path.join(root, file)
                remove_comments_from_file(file_path)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target = sys.argv[1]
        if os.path.isfile(target) and target.endswith('.py'):
            remove_comments_from_file(target)
        elif os.path.isdir(target):
            process_directory(target)
        else:
            print("Target must be a Python file or directory")
    else:
        process_directory('backend-python')  # Process the default directory 