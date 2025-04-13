# Windows IDS Attack Simulation Tester

This set of tools allows you to test the threat detection capabilities of the Windows IDS without needing to run the full application.

## Files Included

1. `run-test-attacks.js` - JavaScript library that simulates various attacks
2. `test-attacks.html` - HTML interface for running attack simulations

## How It Works

These tools simulate attacks by writing to the browser's localStorage, which the Windows IDS system uses to store and retrieve threat data. This allows you to:

1. Generate simulated attacks of different types and severities
2. View the stored attack history
3. Clear the attack history

This approach does not require running the full IDS backend, making it ideal for testing just the threat detection and display functionality.

## Using the Test Tools

### Method 1: Using the HTML Interface

1. Open `test-attacks.html` in a web browser
2. The interface allows you to:
   - Run a single attack with a specific type and severity
   - Run a test sequence of different attacks
   - Clear the attack history
   - View all stored attacks

This is the easiest way to test the system.

### Method 2: Using the Browser Console

1. Open any page from the Windows IDS application in your browser
2. Open the browser developer console (F12 or right-click > Inspect > Console)
3. Load the test script by running:
   ```javascript
   var script = document.createElement('script');
   script.src = 'path/to/run-test-attacks.js';
   document.head.appendChild(script);
   ```
4. Once loaded, you can use these functions in the console:
   - `simulateAttack('Brute Force', 'medium')` - Simulate a specific attack
   - `runTestSequence()` - Run a sequence of different attacks
   - `clearAttackHistory()` - Clear all stored attacks

## Attack Types Available

The simulation supports these attack types:
- Brute Force
- Port Scan
- DDoS
- Man in the Middle
- Malware
- Trojan

## Severity Levels

Available severity levels:
- low
- medium
- high
- critical

## Testing the Threats List Component

After running simulations:

1. Navigate to the Threats page in the Windows IDS application
2. The simulated attacks should appear in the threats list
3. You can interact with the threats, view details, and block them
4. The component will update the status in localStorage when you block a threat

## Integration with the Windows IDS

The Windows IDS's threats-list.tsx component is designed to:

1. Load threats from localStorage on initial load
2. Listen for 'simulated-attack' custom events for real-time updates
3. Display threats with details like severity, source, status, and more
4. Allow blocking threats and updating their status
5. Calculate risk scores based on threat characteristics

## Example Test Sequence

The `runTestSequence()` function will generate these attacks in sequence:
1. Brute Force (medium)
2. Port Scan (low)
3. DDoS (high)
4. Malware (critical)
5. Man in the Middle (high)

This covers a range of attack types and severities to thoroughly test the system. 