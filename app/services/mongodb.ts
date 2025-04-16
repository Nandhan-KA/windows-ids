
const MONGODB_API_URL = process.env.NEXT_PUBLIC_MONGODB_API_URL || 'http://localhost:5000';

/**
 * Dispatches a MongoDB operation event
 */
export function dispatchMongoDBEvent(operation: string, success: boolean, message: string, refresh: boolean = false) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('mongodb-operation', {
      detail: { operation, success, message, refresh }
    });
    window.dispatchEvent(event);
  }
}

// Add retry functionality for fetch operations
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, delay = 1000): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      // Add cache control to prevent caching
      cache: 'no-store',
    });
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Fetch failed, retrying (${retries} attempts left)...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Keeps the MongoDB connection alive by making a simple ping request
 * every 5 minutes to prevent timeouts
 */
export function keepMongoDBAlive() {
  if (typeof window !== 'undefined') {
    console.log(`Starting MongoDB keepalive to ${MONGODB_API_URL}/api/ping`);
    // Start the keepalive interval
    const interval = setInterval(async () => {
      try {
        const response = await fetchWithRetry(`${MONGODB_API_URL}/api/ping`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }, 2);
        
        if (response.ok) {
          console.log('MongoDB keepalive ping successful');
        } else {
          console.warn(`MongoDB keepalive ping failed with status: ${response.status}`);
        }
      } catch (error) {
        console.error('MongoDB keepalive error:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Initial ping to check connection immediately
    fetchWithRetry(`${MONGODB_API_URL}/api/ping`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(response => {
      if (response.ok) {
        console.log('Initial MongoDB connection successful');
      } else {
        console.warn(`Initial MongoDB connection failed with status: ${response.status}`);
      }
    })
    .catch(error => {
      console.error('Initial MongoDB connection error:', error);
    });
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(interval);
    });
    
    return interval;
  }
  return null;
}

// Send attack data to MongoDB
export async function sendToMongoDB(data: any): Promise<boolean> {
  try {
    if (!data.title && data.type) {
      // Add a title if missing
      data.title = `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Attack`;
    }
    
    console.log(`Sending data to MongoDB at ${MONGODB_API_URL}/api/debug/simulate-attack`);
    console.log('Data being sent:', JSON.stringify(data));
    
    const response = await fetchWithRetry(`${MONGODB_API_URL}/api/debug/simulate-attack`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }, 2);

    if (!response.ok) {
      console.error(`MongoDB responded with status: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      
      // Try to save locally if MongoDB fails
      try {
        console.log('Attempting to save data locally...');
        const key = `fallback_attack_${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(data));
        console.log('Data saved locally with key:', key);
        
        // Add more information about the error
        dispatchMongoDBEvent(
          'save_attack', 
          false, 
          `Failed to save attack data to MongoDB: ${response.status} ${response.statusText}. Data saved locally.`,
          false
        );
      } catch (localError) {
        console.error('Local storage fallback also failed:', localError);
      }
      
      return false;
    }
    
    const result = await response.json();
    
    // Dispatch event for logging
    dispatchMongoDBEvent(
      'save_attack', 
      result.success, 
      result.success 
        ? `Attack data saved to MongoDB successfully (${data.id})` 
        : `Failed to save attack data to MongoDB (${data.id}): ${result.message || 'Unknown error'}`,
      false
    );
    
    return result.success;
  } catch (error) {
    // Handle network errors and other exceptions
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Try to save locally if MongoDB fails
    try {
      console.log('Connection error, saving data locally...');
      const key = `fallback_attack_${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(data));
      console.log('Data saved locally with key:', key);
      
      dispatchMongoDBEvent('save_attack', false, `Error sending data to MongoDB: ${errorMessage}. Data saved locally.`, false);
    } catch (localError) {
      dispatchMongoDBEvent('save_attack', false, `Error sending data to MongoDB: ${errorMessage}. Local fallback also failed.`, false);
    }
    
    console.error('Error sending data to MongoDB:', error);
    
    // Try to determine if it's a connection issue
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      console.error('Connection to MongoDB backend failed. Please ensure the MongoDB backend is running at:', MONGODB_API_URL);
    }
    
    return false;
  }
}

// Get all attacks from MongoDB
export async function getAttacksFromMongoDB(): Promise<any[]> {
  try {
    const response = await fetch(`${MONGODB_API_URL}/api/attacks`);
    const data = await response.json();
    
    // Dispatch event for logging
    dispatchMongoDBEvent(
      'get_attacks', 
      true, 
      `Retrieved ${data.length} attacks from MongoDB`,
      false
    );
    
    return data;
  } catch (error) {
    dispatchMongoDBEvent('get_attacks', false, `Error fetching attacks from MongoDB: ${error}`, false);
    console.error('Error fetching attacks from MongoDB:', error);
    return [];
  }
}

// Get all USB devices from MongoDB
export async function getUSBDevicesFromMongoDB(): Promise<any[]> {
  try {
    const response = await fetch(`${MONGODB_API_URL}/api/usb-devices`);
    const data = await response.json();
    
    // Dispatch event for logging
    dispatchMongoDBEvent(
      'get_usb_devices', 
      true, 
      `Retrieved ${data.length} USB devices from MongoDB`,
      false
    );
    
    return data;
  } catch (error) {
    dispatchMongoDBEvent('get_usb_devices', false, `Error fetching USB devices from MongoDB: ${error}`, false);
    console.error('Error fetching USB devices from MongoDB:', error);
    return [];
  }
}

// Get all IDS events from MongoDB
export async function getIDSEventsFromMongoDB(): Promise<any[]> {
  try {
    const response = await fetch(`${MONGODB_API_URL}/api/ids-events`);
    const data = await response.json();
    
    // Dispatch event for logging
    dispatchMongoDBEvent(
      'get_ids_events', 
      true, 
      `Retrieved ${data.length} IDS events from MongoDB`,
      false
    );
    
    return data;
  } catch (error) {
    dispatchMongoDBEvent('get_ids_events', false, `Error fetching IDS events from MongoDB: ${error}`, false);
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
    
    // Dispatch event for logging
    dispatchMongoDBEvent(
      'update_attack_status', 
      result.success, 
      result.success 
        ? `Attack status updated to "${status}" for ${id}` 
        : `Failed to update attack status for ${id}`,
      true
    );
    
    return result.success;
  } catch (error) {
    dispatchMongoDBEvent('update_attack_status', false, `Error updating attack status in MongoDB: ${error}`, false);
    console.error('Error updating attack status in MongoDB:', error);
    return false;
  }
}

// Get USB device statistics
export async function getUSBStatistics(): Promise<any> {
  try {
    const response = await fetch(`${MONGODB_API_URL}/api/usb-devices/statistics`);
    const data = await response.json();
    
    // Dispatch event for logging
    dispatchMongoDBEvent(
      'get_usb_statistics', 
      true, 
      `Retrieved USB device statistics from MongoDB`,
      false
    );
    
    return data;
  } catch (error) {
    dispatchMongoDBEvent('get_usb_statistics', false, `Error fetching USB statistics from MongoDB: ${error}`, false);
    console.error('Error fetching USB statistics from MongoDB:', error);
    return null;
  }
}

// Get IDS event statistics
export async function getIDSStatistics(): Promise<any> {
  try {
    const response = await fetchWithRetry(`${MONGODB_API_URL}/api/ids-events/statistics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    }, 2);
    
    const data = await response.json();
    
    // Dispatch event for logging
    dispatchMongoDBEvent(
      'get_ids_statistics', 
      true, 
      `Retrieved IDS event statistics from MongoDB`,
      false
    );
    
    return data;
  } catch (error) {
    dispatchMongoDBEvent('get_ids_statistics', false, `Error fetching IDS statistics from MongoDB: ${error}`, false);
    console.error('Error fetching IDS statistics from MongoDB:', error);
    return null;
  }
}