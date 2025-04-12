import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as api from "./api"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Admin privilege functions
export async function checkAdminPrivileges(): Promise<boolean> {
  return api.checkAdminPrivileges();
}

export async function requestAdminPrivileges(): Promise<boolean> {
  return api.requestAdminPrivileges();
}

// Network monitoring functions
export async function getNetworkConnections(): Promise<any[]> {
  return api.getNetworkConnections();
}

// Security event monitoring
export async function getSecurityEvents(): Promise<any[]> {
  return api.getSecurityEvents();
}

// Email reporting using ZohoMail via API route
export async function sendEmailReport(to: string, subject: string, content: string): Promise<boolean> {
  return api.sendEmailReport(to, subject, content);
}

// Windows notification
export function sendWindowsNotification(title: string, message: string): void {
  try {
    // In a real application, this would use Windows notification API
    // For demo purposes, we're simulating this
    console.log(`Windows Notification: ${title} - ${message}`);
  } catch (error) {
    console.error("Error sending Windows notification:", error);
  }
}
