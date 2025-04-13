#!/bin/bash

echo "======================================================"
echo "      USB Attack Simulator for Windows IDS"
echo "======================================================"
echo

# Check if Python is installed
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "Error: Python is not installed. Please install Python to run this simulator."
    exit 1
fi

# Determine Python command to use
PYTHON_CMD="python"
if ! command -v python &> /dev/null; then
    PYTHON_CMD="python3"
fi

echo "Running USB detector simulation..."
echo "This will simulate a USB device insertion with suspicious files"
echo

# Run the USB detector with appropriate arguments
$PYTHON_CMD usb_detector.py --simulate --test --server localhost:3000

echo
echo "Simulation completed."
echo "The IDS should now display an alert for the USB device detection."
echo
echo "Press Enter to continue..."
read 