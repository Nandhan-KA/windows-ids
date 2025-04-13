/**
 * MongoDB Service - Frontend Interface
 * 
 * This service handles communication with the MongoDB backend
 * and ensures all attack/threat data is stored in MongoDB.
 */

const MONGODB_API_URL = process.env.NEXT_PUBLIC_MONGODB_API_URL || 'http://localhost:5000';

// Send attack data to MongoDB
export async function sendToMongoDB(data: any): Promise<boolean> {
  try {
    const response = await fetch(`${MONGODB_API_URL}/api/debug/simulate-attack`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error sending data to MongoDB:', error);
    return false;
  }
}

// Get all attacks from MongoDB
export async function getAttacksFromMongoDB(): Promise<any[]> {
  try {
    const response = await fetch(`${MONGODB_API_URL}/api/attacks`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching attacks from MongoDB:', error);
    return [];
  }
}

// Get all USB devices from MongoDB
export async function getUSBDevicesFromMongoDB(): Promise<any[]> {
  try {
    const response = await fetch(`${MONGODB_API_URL}/api/usb-devices`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching USB devices from MongoDB:', error);
    return [];
  }
}

// Get all IDS events from MongoDB
export async function getIDSEventsFromMongoDB(): Promise<any[]> {
  try {
    const response = await fetch(`${MONGODB_API_URL}/api/ids-events`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching IDS events from MongoDB:', error);
    return [];
  }
}

// Update attack status
export async function updateAttackStatus(id: string, status: string): Promise<boolean> {
  try {
    const response = await fetch(`${MONGODB_API_URL}/api/attacks/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error updating attack status in MongoDB:', error);
    return false;
  }
}

// Get USB device statistics
export async function getUSBStatistics(): Promise<any> {
  try {
    const response = await fetch(`${MONGODB_API_URL}/api/usb-devices/statistics`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching USB statistics from MongoDB:', error);
    return null;
  }
}

// Get IDS event statistics
export async function getIDSStatistics(): Promise<any> {
  try {
    const response = await fetch(`${MONGODB_API_URL}/api/ids-events/statistics`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching IDS statistics from MongoDB:', error);
    return null;
  }
} 