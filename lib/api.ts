// Base URL for backend API
const API_BASE_URL = 'http://localhost:5000';

// Admin APIs
export async function checkAdminPrivileges(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/check`);
    const data = await response.json();
    return data.hasAdminPrivileges;
  } catch (error) {
    console.error("Error checking admin privileges:", error);
    return false;
  }
}

export async function requestAdminPrivileges(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/request`, {
      method: 'POST',
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error requesting admin privileges:", error);
    return false;
  }
}

// Network APIs
export async function getNetworkConnections(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/network/connections`);
    return await response.json();
  } catch (error) {
    console.error("Error getting network connections:", error);
    return [];
  }
}

// Security APIs
export async function getSecurityEvents(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/security/events`);
    return await response.json();
  } catch (error) {
    console.error("Error getting security events:", error);
    return [];
  }
}

// Email APIs
export async function sendEmailReport(to: string, subject: string, content: string): Promise<boolean> {
  try {
    // Try the Python backend first
    try {
      const pythonResponse = await fetch(`${API_BASE_URL}/api/send-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, subject, content }),
      });

      const pythonData = await pythonResponse.json();
      
      if (pythonResponse.ok) {
        console.log("Email sent via Python backend");
        return true;
      }
      
      // If Python backend fails, we'll fall back to Next.js API route
      console.warn("Python backend email sending failed, falling back to Next.js API");
    } catch (pythonError) {
      console.warn("Error accessing Python backend:", pythonError);
    }
    
    // Fallback to Next.js API route
    const response = await fetch('/api/send-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, content }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }

    console.log("Email sent via Next.js API");
    return true;
  } catch (error) {
    console.error("Error sending email report:", error);
    return false;
  }
} 