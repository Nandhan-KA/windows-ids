/**
 * Attack Simulation and Detection Test Script
 * 
 * This script provides utility functions to test the attack simulation,
 * detection, and alert system. It can be used from the browser console
 * to verify the system is working correctly.
 */

/**
 * Simulates an attack by creating and dispatching a custom event
 */
export function simulateAttack(
  type: 'Brute Force' | 'Port Scan' | 'DDoS' | 'Man in the Middle' | 'Malware' | 'Trojan',
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): void {
  // Create attack event
  const attackEvent = {
    id: `sim-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    timestamp: new Date().toISOString(),
    type: 'threat',
    severity: severity,
    source_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    target: 'System',
    title: `${type} Attack Detected`,
    description: getDescriptionForType(type),
    threat_type: type,
    status: 'active'
  };
  
  // Save to localStorage
  saveAttackToStorage(attackEvent);
  
  // Dispatch custom event
  const simulatedAttackEvent = new CustomEvent('simulated-attack', { detail: attackEvent });
  window.dispatchEvent(simulatedAttackEvent);
  
  console.log('🔥 Attack simulated:', type, severity);
}

/**
 * Run a sequence of attacks to thoroughly test the system
 */
export function runTestSequence(): void {
  console.log('🧪 Starting attack simulation test sequence...');
  
  // Clear any previous attacks for a clean test
  clearAttackHistory();
  
  // Define a test sequence with various attacks and severities
  const testSequence = [
    { type: 'Brute Force' as const, severity: 'medium' as const, delay: 1000 },
    { type: 'Port Scan' as const, severity: 'low' as const, delay: 2000 },
    { type: 'DDoS' as const, severity: 'high' as const, delay: 3000 },
    { type: 'Malware' as const, severity: 'critical' as const, delay: 4000 },
    { type: 'Man in the Middle' as const, severity: 'high' as const, delay: 5000 }
  ];
  
  // Execute the sequence
  testSequence.forEach((attack, index) => {
    setTimeout(() => {
      simulateAttack(attack.type, attack.severity);
      
      // If this is the last attack, check the results
      if (index === testSequence.length - 1) {
        setTimeout(() => checkTestResults(), 1000);
      }
    }, attack.delay);
  });
}

/**
 * Clear attack history from localStorage
 */
export function clearAttackHistory(): void {
  localStorage.removeItem('simulatedAttacks');
  console.log('🧹 Attack history cleared');
}

/**
 * Check test results to verify everything is working
 */
function checkTestResults(): void {
  console.log('🔍 Checking test results...');
  
  // Check localStorage
  const storedAttacks = localStorage.getItem('simulatedAttacks');
  if (!storedAttacks) {
    console.error('❌ No attacks found in localStorage');
    return;
  }
  
  const attacksData = JSON.parse(storedAttacks);
  console.log(`✅ Found ${attacksData.length} attacks in localStorage`);
  
  // Verify the DOM has been updated
  const threatElements = document.querySelectorAll('[class*="TableRow"]'); // This is an approximation
  console.log(`ℹ️ Found ${threatElements.length} threat rows in the table`);
  
  console.log('🏁 Test complete! Check that:');
  console.log('1. Alerts appeared on screen');
  console.log('2. Threat list shows the simulated attacks');
  console.log('3. The alert dialog appeared for high/critical threats');
}

/**
 * Save attack to localStorage
 */
function saveAttackToStorage(attack: any): void {
  try {
    // Get existing attacks
    const existingAttacksJson = localStorage.getItem('simulatedAttacks');
    const existingAttacks = existingAttacksJson ? JSON.parse(existingAttacksJson) : [];
    
    // Add new attack
    existingAttacks.unshift(attack);
    
    // Save back to localStorage
    localStorage.setItem('simulatedAttacks', JSON.stringify(existingAttacks));
  } catch (error) {
    console.error('Error saving attack to localStorage:', error);
  }
}

/**
 * Get description for attack type
 */
function getDescriptionForType(type: string): string {
  switch (type) {
    case 'Brute Force':
      return 'Multiple failed login attempts detected from single source';
    case 'Port Scan':
      return 'Systematic scan of multiple ports detected';
    case 'DDoS':
      return 'Unusual traffic pattern consistent with distributed denial of service';
    case 'Man in the Middle':
      return 'Abnormal network routing detected, possible man-in-the-middle attack';
    case 'Malware':
      return 'Suspicious process behavior consistent with malware activity detected';
    case 'Trojan':
      return 'Suspicious outbound connection from trusted application detected';
    default:
      return 'Suspicious activity detected';
  }
}

// Export a test function that can be called from the console
(window as any).testAttackSystem = {
  simulateAttack,
  runTestSequence,
  clearAttackHistory
}; 