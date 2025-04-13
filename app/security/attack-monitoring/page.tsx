import React from 'react'
import AttackDetectionFixed from '@/components/security/attack-detection-fixed'

export const metadata = {
  title: 'Attack Monitoring | Windows IDS',
  description: 'Monitor and detect attack patterns in real-time with advanced analytics',
}

export default function AttackMonitoringPage() {
  return (
    <div className="container py-6 space-y-6">
      <AttackDetectionFixed />
    </div>
  )
} 