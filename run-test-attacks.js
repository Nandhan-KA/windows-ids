// Script to manually simulate attacks through localStorage
// This simulates what the attack-tester.tsx component does but can be run directly

// Define functions to simulate attacks
function simulateAttack(attackType = 'Brute Force', severity = 'medium') {
  try {
    // Create attack event
    const attackEvent = {
      id: `sim-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
      type: 'threat',
      severity: severity,
      source_ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      target: 'System',
      title: `${attackType} Attack Detected`,
      description: getDescriptionForType(attackType),
      threat_type: attackType,
      status: 'active'
    }
    
    // Save to localStorage
    saveAttackToStorage(attackEvent)
    
    console.log(`Attack simulated: ${attackType} (${severity})`)
    return true
  } catch (error) {
    console.error("Error simulating attack:", error)
    return false
  }
}

// Save attack to localStorage
function saveAttackToStorage(attack) {
  try {
    // Get existing attacks
    const existingAttacksJson = localStorage.getItem('simulatedAttacks')
    const existingAttacks = existingAttacksJson ? JSON.parse(existingAttacksJson) : []
    
    // Add new attack
    existingAttacks.unshift(attack)
    
    // Save back to localStorage
    localStorage.setItem('simulatedAttacks', JSON.stringify(existingAttacks))
  } catch (error) {
    console.error('Error saving attack to localStorage:', error)
    throw error
  }
}

// Get description for attack type
function getDescriptionForType(type) {
  switch (type) {
    case 'Brute Force':
      return 'Multiple failed login attempts detected from single source'
    case 'Port Scan':
      return 'Systematic scan of multiple ports detected'
    case 'DDoS':
      return 'Unusual traffic pattern consistent with distributed denial of service'
    case 'Man in the Middle':
      return 'Abnormal network routing detected, possible man-in-the-middle attack'
    case 'Malware':
      return 'Suspicious process behavior consistent with malware activity detected'
    case 'Trojan':
      return 'Suspicious outbound connection from trusted application detected'
    default:
      return 'Suspicious activity detected'
  }
}

// Function to run a test sequence
function runTestSequence() {
  // Define a test sequence with various attacks and severities
  const testSequence = [
    { type: 'Brute Force', severity: 'medium' },
    { type: 'Port Scan', severity: 'low' },
    { type: 'DDoS', severity: 'high' },
    { type: 'Malware', severity: 'critical' },
    { type: 'Man in the Middle', severity: 'high' }
  ]
  
  console.log("Starting test sequence...")
  
  // Execute the sequence
  testSequence.forEach((attack, index) => {
    setTimeout(() => {
      simulateAttack(attack.type, attack.severity)
      
      // If this is the last attack, mark test as complete
      if (index === testSequence.length - 1) {
        console.log("Test sequence completed!")
      }
    }, index * 1000) // 1 second delay between attacks
  })
}

// Function to clear attack history
function clearAttackHistory() {
  try {
    localStorage.removeItem('simulatedAttacks')
    console.log("Attack history cleared!")
    return true
  } catch (error) {
    console.error("Error clearing attack history:", error)
    return false
  }
}

// Export functions so they can be used in browser console
if (typeof window !== 'undefined') {
  window.simulateAttack = simulateAttack
  window.runTestSequence = runTestSequence
  window.clearAttackHistory = clearAttackHistory
  
  console.log("Attack simulation functions loaded!")
  console.log("Available functions:")
  console.log("- simulateAttack(attackType, severity)")
  console.log("- runTestSequence()")
  console.log("- clearAttackHistory()")
} 