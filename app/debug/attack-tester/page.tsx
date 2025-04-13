import React from 'react'
import EnhancedAttackTester from '@/components/debug/enhanced-attack-tester'

export const metadata = {
  title: 'Enhanced Attack Tester | Windows IDS',
  description: 'Test attack simulation with enhanced controls for Windows IDS',
}

export default function AttackTesterPage() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enhanced Attack Tester</h1>
          <p className="text-muted-foreground">
            Simulate security attacks to test detection and response capabilities.
          </p>
        </div>
      </div>

      <EnhancedAttackTester />
    </div>
  )
} 