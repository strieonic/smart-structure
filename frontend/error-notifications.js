// ============================================
// Error Notification System - Backend Only
// No visible notifications in main UI - only for site status window
// ============================================

const NOTIFICATION_API = 'http://localhost:9999';
let notificationCheckInterval = null;

// ============================================
// SYSTEM STATUS - For Site Status Window Only
// ============================================
async function updateSystemStatus() {
  try {
    const response = await fetch(`${NOTIFICATION_API}/status`);
    if (!response.ok) return;
    
    const status = await response.json();
    
    // Update site status window if it exists
    updateSiteStatusWindow(status);
  } catch (error) {
    // Service not available - update with unknown status
    updateSiteStatusWindow({ backend: 'unknown', frontend: 'unknown' });
  }
}

function updateSiteStatusWindow(status) {
  // This will be called by the site status window
  // Store status in window object for access by other components
  window.systemStatus = status;
  
  // Dispatch custom event for site status window to listen
  const event = new CustomEvent('systemStatusUpdate', { detail: status });
  window.dispatchEvent(event);
}

// ============================================
// NOTIFICATION MANAGEMENT - For Site Status Window Only
// ============================================
async function fetchNotifications() {
  // This function is now only used by the site status window
  // Main UI does not display notifications
  try {
    const response = await fetch(`${NOTIFICATION_API}/notifications`);
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.notifications || [];
  } catch (error) {
    console.log('Notification service not available');
    return [];
  }
}

async function dismissNotification(id) {
  try {
    await fetch(`${NOTIFICATION_API}/notifications/${id}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Failed to dismiss notification:', error);
  }
}

// Expose functions globally for site status window
window.fetchSystemNotifications = fetchNotifications;
window.dismissSystemNotification = dismissNotification;

// ============================================
// INITIALIZATION
// ============================================
function initErrorNotificationSystem() {
  // DO NOT create notification container - notifications are hidden from main UI
  // Notifications will only be visible in the site status window
  
  // Start polling for status updates only (for site status window)
  updateSystemStatus();
  
  notificationCheckInterval = setInterval(() => {
    updateSystemStatus();
  }, 60000); // Check every 1 minute
  
  console.log('✅ Error notification system initialized (notifications hidden from main UI)');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initErrorNotificationSystem);
} else {
  initErrorNotificationSystem();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval);
  }
});