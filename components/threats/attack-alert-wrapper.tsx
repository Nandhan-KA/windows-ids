"use client"

import dynamic from "next/dynamic";

// Dynamically import the AttackAlert component with client-side only rendering
const AttackAlert = dynamic(() => import("./attack-alert"), {
  ssr: false,
});

export default function AttackAlertWrapper() {
  return <AttackAlert />;
} 