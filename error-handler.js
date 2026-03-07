// ============================================
// Intelligent Error Handler & Auto-Recovery System
// Monitors, fixes, and debugs application errors
// ============================================

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const CONFIG = {
  BACKEND_PORT: 5000,
  FRONTEND_PORT: 8080,
  CHECK_INTERVAL: 60000, // Check every 1 minute
  BACKEND_HEALTH: 'http://localhost:5000/api/v1/health',
  FRONTEND_URL: 'http://localhost:8080',
  MAX_RESTART_ATTEMPTS: 3,
  AI_API_URL: 'http://localhost:5000/api/v1/chat/debug',
  LOG_FILE: 'logs/error-handler.log',
  RESTART_DELAY: 3000, // Wait 3 seconds before restart
  HEALTH_CHECK_TIMEOUT: 5000 // 5 second timeout for health checks
};

// State tracking
const state = {
  backendProcess: null,
  frontendProcess: null,
  backendRestarts: 0,
  frontendRestarts: 0,
  lastBackendCheck: null,
  lastFrontendCheck: null,
  errors: [],
  notifications: []
};

// ============================================
// LOGGING
// ============================================
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${message}`;
  console.log(logMessage);
  
  // Append to log file
  const logDir = path.dirname(CONFIG.LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  fs.appendFileSync(CONFIG.LOG_FILE, logMessage + '\n');
}

// ============================================
// NOTIFICATION SYSTEM
// ============================================
function createNotification(title, message, type = 'info', fixable = false, errorDetails = null, aiSuggestion = null) {
  const notification = {
    id: Date.now(),
    title,
    message,
    type, // 'info', 'warning', 'error', 'success'
    fixable,
    errorDetails,
    aiSuggestion,
    timestamp: new Date().toISOString(),
    dismissed: false
  };
  
  state.notifications.push(notification);
  log(`Notification: ${title} - ${message}`, type.toUpperCase());
  
  // Save to file for frontend to read
  saveNotifications();
  
  return notification;
}

function saveNotifications() {
  const notificationsFile = 'logs/notifications.json';
  const activeNotifications = state.notifications.filter(n => !n.dismissed);
  fs.writeFileSync(notificationsFile, JSON.stringify(activeNotifications, null, 2));
}

function dismissNotification(id) {
  const notification = state.notifications.find(n => n.id === id);
  if (notification) {
    notification.dismissed = true;
    saveNotifications();
  }
}

// ============================================
// SERVER HEALTH CHECKS
// ============================================
function checkServerHealth(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      timeout: CONFIG.HEALTH_CHECK_TIMEOUT
    };

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 304);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

function checkPortInUse(port) {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (error) {
        resolve(false);
        return;
      }
      
      const lines = stdout.trim().split('\n');
      // Check if there's an active LISTENING connection (not just TIME_WAIT)
      const activeConnections = lines.filter(line => 
        line.includes('LISTENING') || line.includes('ESTABLISHED')
      );
      
      resolve(activeConnections.length > 0);
    });
  });
}

// ============================================
// SERVER MANAGEMENT
// ============================================
function startBackend() {
  return new Promise((resolve, reject) => {
    log('Starting backend server...', 'INFO');
    
    // Kill existing process if any
    if (state.backendProcess) {
      try {
        state.backendProcess.kill();
        state.backendProcess = null;
      } catch (e) {
        log(`Error killing existing backend process: ${e.message}`, 'WARNING');
      }
    }
    
    const backendProcess = spawn('cmd.exe', ['/c', 'npm', 'run', 'dev'], {
      cwd: process.cwd(),
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let startupOutput = '';
    let hasStarted = false;
    
    backendProcess.stdout.on('data', (data) => {
      startupOutput += data.toString();
      if (!hasStarted && (startupOutput.includes('Server running on port') || startupOutput.includes('started'))) {
        hasStarted = true;
        log('Backend server started successfully', 'SUCCESS');
        state.backendProcess = backendProcess;
        state.backendRestarts++;
        
        // Only notify if this was a recovery (not initial start)
        if (state.backendRestarts > 1) {
          createNotification(
            '✅ Backend Recovered',
            'Backend server has been restarted successfully',
            'success'
          );
        }
        resolve(true);
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      log(`Backend error: ${error}`, 'ERROR');
      
      // Check for common errors
      if (error.includes('EADDRINUSE')) {
        handlePortInUseError(CONFIG.BACKEND_PORT, 'backend');
      } else if (error.includes('MODULE_NOT_FOUND')) {
        handleMissingDependencies();
      } else if (error.includes('database') || error.includes('prisma')) {
        handleDatabaseError(error);
      }
    });

    backendProcess.on('error', (error) => {
      log(`Failed to start backend: ${error.message}`, 'ERROR');
      reject(error);
    });
    
    backendProcess.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        log(`Backend process exited with code ${code}`, 'ERROR');
        state.backendProcess = null;
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!hasStarted) {
        log('Backend startup timeout', 'ERROR');
        reject(new Error('Backend startup timeout'));
      }
    }, 30000);
  });
}

function startFrontend() {
  return new Promise((resolve, reject) => {
    log('Starting frontend server...', 'INFO');
    
    // Kill existing process if any
    if (state.frontendProcess) {
      try {
        state.frontendProcess.kill();
        state.frontendProcess = null;
      } catch (e) {
        log(`Error killing existing frontend process: ${e.message}`, 'WARNING');
      }
    }
    
    const frontendProcess = spawn('cmd.exe', ['/c', 'python', '-m', 'http.server', '8080'], {
      cwd: path.join(process.cwd(), 'frontend'),
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let hasStarted = false;

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      log(`Frontend output: ${output.trim()}`, 'INFO');
      if (!hasStarted && (output.includes('Serving HTTP') || output.includes('server') || output.includes('8080'))) {
        hasStarted = true;
        log('Frontend server started successfully', 'SUCCESS');
        state.frontendProcess = frontendProcess;
        state.frontendRestarts++;
        
        // Only notify if this was a recovery (not initial start)
        if (state.frontendRestarts > 1) {
          createNotification(
            '✅ Frontend Recovered',
            'Frontend server has been restarted successfully',
            'success'
          );
        }
        resolve(true);
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      log(`Frontend error: ${error}`, 'ERROR');
      
      if (error.includes('Address already in use')) {
        handlePortInUseError(CONFIG.FRONTEND_PORT, 'frontend');
      }
    });

    frontendProcess.on('error', (error) => {
      log(`Failed to start frontend: ${error.message}`, 'ERROR');
      
      if (error.message.includes('python')) {
        handlePythonNotFound();
      }
      reject(error);
    });
    
    frontendProcess.on('exit', (code, signal) => {
      if (code !== 0 && code !== null) {
        log(`Frontend process exited with code ${code}`, 'ERROR');
        state.frontendProcess = null;
      }
    });

    // Assume success after 2 seconds if no errors, then verify
    setTimeout(async () => {
      if (!hasStarted && !state.frontendProcess) {
        state.frontendProcess = frontendProcess;
        hasStarted = true;
        
        // Verify the server is actually responding
        setTimeout(async () => {
          const isHealthy = await checkServerHealth(CONFIG.FRONTEND_URL);
          if (isHealthy) {
            log('Frontend server verified and responding', 'SUCCESS');
          } else {
            log('Frontend server started but not responding', 'WARNING');
            createNotification(
              '⚠️ Frontend Issue',
              'Frontend server started but may not be responding properly',
              'warning'
            );
          }
        }, 3000);
        
        resolve(true);
      }
    }, 2000);
  });
}

// ============================================
// ENHANCED ERROR HANDLERS
// ============================================
function handlePortInUseError(port, serverType) {
  log(`Port ${port} is already in use for ${serverType}`, 'WARNING');
  
  createNotification(
    `⚠️ Port ${port} In Use`,
    `${serverType} port is already occupied. Attempting to free it...`,
    'warning',
    true
  );

  // Try to kill the process using the port
  exec(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a`, (error) => {
    if (error) {
      createNotification(
        '❌ Port Conflict',
        `Could not free port ${port}. Please manually close the application using this port.`,
        'error',
        false
      );
    } else {
      log(`Freed port ${port}`, 'SUCCESS');
      createNotification(
        '✅ Port Freed',
        `Port ${port} has been freed. Restarting ${serverType}...`,
        'success',
        true
      );
      
      setTimeout(() => {
        if (serverType === 'backend') {
          startBackend().catch(err => log(`Retry failed: ${err.message}`, 'ERROR'));
        } else {
          startFrontend().catch(err => log(`Retry failed: ${err.message}`, 'ERROR'));
        }
      }, CONFIG.RESTART_DELAY);
    }
  });
}

function handleFrontendJavaScriptError(errorMessage) {
  log('Frontend JavaScript error detected', 'ERROR');
  
  // Check for common frontend issues
  if (errorMessage.includes('Cannot read properties of null') || 
      errorMessage.includes('style') ||
      errorMessage.includes('undefined')) {
    
    createNotification(
      '🔧 Frontend Script Error',
      'Detected JavaScript error. Checking for missing files and fixing...',
      'warning',
      true
    );
    
    // Check if required files exist
    const requiredFiles = [
      'frontend/refined-theme.css',
      'frontend/script.js',
      'frontend/expert-interface.js',
      'frontend/error-notifications.js',
      'frontend/error-notifications.css'
    ];
    
    let missingFiles = [];
    requiredFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        missingFiles.push(file);
      }
    });
    
    if (missingFiles.length > 0) {
      createNotification(
        '📁 Missing Frontend Files',
        `Found missing files: ${missingFiles.join(', ')}. Recreating...`,
        'warning',
        true
      );
      
      // Recreate missing files
      recreateMissingFrontendFiles(missingFiles);
    } else {
      // Files exist but there's still an error - might be a DOM timing issue
      createNotification(
        '⚡ Frontend Timing Issue',
        'JavaScript error detected. This usually resolves on page refresh.',
        'info',
        false,
        { 
          error: errorMessage,
          solution: 'Try refreshing the page (F5) or clearing browser cache (Ctrl+F5)',
          technicalNote: 'This error often occurs when JavaScript runs before DOM is fully loaded'
        }
      );
    }
  }
}

function recreateMissingFrontendFiles(missingFiles) {
  missingFiles.forEach(file => {
    try {
      if (file.includes('style.css')) {
        // Create a basic style.css if it was deleted
        const basicCSS = `/* Basic styles for Smart Load Analyzer */
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 0;
  background: #0f0f14;
  color: #e0e0e0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* This file was auto-recreated by the error handler */
/* Main styles are in refined-theme.css */`;
        
        fs.writeFileSync(file, basicCSS);
        log(`Recreated ${file}`, 'SUCCESS');
      }
      
      // Add more file recreation logic as needed
      
    } catch (error) {
      log(`Failed to recreate ${file}: ${error.message}`, 'ERROR');
    }
  });
  
  createNotification(
    '✅ Files Recreated',
    'Missing frontend files have been recreated. Refreshing frontend...',
    'success',
    true
  );
  
  // Restart frontend to pick up new files
  setTimeout(() => {
    if (state.frontendProcess) {
      state.frontendProcess.kill();
      state.frontendProcess = null;
    }
    startFrontend().catch(err => log(`Frontend restart failed: ${err.message}`, 'ERROR'));
  }, 2000);
}

function handleMissingDependencies() {
  log('Missing dependencies detected', 'ERROR');
  
  createNotification(
    '📦 Missing Dependencies',
    'Installing missing npm packages...',
    'warning',
    true
  );

  exec('npm install', (error, stdout, stderr) => {
    if (error) {
      createNotification(
        '❌ Installation Failed',
        `Could not install dependencies: ${error.message}`,
        'error',
        false,
        { error: error.message, stderr }
      );
    } else {
      log('Dependencies installed successfully', 'SUCCESS');
      createNotification(
        '✅ Dependencies Installed',
        'Restarting backend server...',
        'success',
        true
      );
      setTimeout(() => {
        startBackend().catch(err => log(`Retry failed: ${err.message}`, 'ERROR'));
      }, 2000);
    }
  });
}

function handleDatabaseError(errorMessage) {
  log('Database error detected', 'ERROR');
  
  if (errorMessage.includes('migration') || errorMessage.includes('schema')) {
    createNotification(
      '🗄️ Database Migration Needed',
      'Running database migrations...',
      'warning',
      true
    );

    exec('npx prisma migrate deploy', (error, stdout, stderr) => {
      if (error) {
        createNotification(
          '❌ Migration Failed',
          'Database migration failed. Check your database connection.',
          'error',
          false,
          { error: error.message, stderr }
        );
      } else {
        log('Database migrations completed', 'SUCCESS');
        createNotification(
          '✅ Database Updated',
          'Restarting backend server...',
          'success',
          true
        );
        setTimeout(() => {
          startBackend().catch(err => log(`Retry failed: ${err.message}`, 'ERROR'));
        }, 2000);
      }
    });
  } else {
    createNotification(
      '❌ Database Connection Error',
      'Cannot connect to database. Check your .env file and ensure PostgreSQL is running.',
      'error',
      false,
      { error: errorMessage }
    );
  }
}

function handlePythonNotFound() {
  log('Python not found', 'ERROR');
  
  createNotification(
    '❌ Python Not Found',
    'Python is required for the frontend server. Please install Python 3.x from python.org',
    'error',
    false,
    { 
      solution: 'Install Python from https://www.python.org/downloads/',
      alternative: 'Or use: npm install -g http-server && http-server frontend -p 8080'
    }
  );
}

async function handleUnknownError(errorDetails) {
  log('Unknown error detected, consulting AI...', 'WARNING');

  try {
    // Use the existing AI endpoint to analyze the error
    const aiResponse = await fetch(CONFIG.AI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `You are a system administrator. Analyze this error and provide: 1) Can you fix it automatically? (yes/no) 2) If yes, provide the exact command to run. If no, provide step-by-step instructions for manual fix.\n\nError:\n${JSON.stringify(errorDetails, null, 2)}`,
        context: 'error_debugging'
      })
    });

    if (aiResponse.ok) {
      const result = await aiResponse.json();
      const aiSuggestion = result.data?.response || 'No suggestion available';
      
      // Check if AI suggests an automatic fix
      const canAutoFix = aiSuggestion.toLowerCase().includes('yes') && 
                        aiSuggestion.toLowerCase().includes('command:');
      
      if (canAutoFix) {
        // Try to extract and execute the command
        const commandMatch = aiSuggestion.match(/command:\s*`([^`]+)`/i);
        if (commandMatch) {
          const command = commandMatch[1];
          log(`AI suggested command: ${command}`, 'INFO');
          
          createNotification(
            '🤖 AI Auto-Fix Attempt',
            `Trying AI-suggested fix: ${command}`,
            'info',
            true,
            errorDetails,
            aiSuggestion
          );
          
          const { exec } = require('child_process');
          exec(command, (error, stdout, stderr) => {
            if (error) {
              createNotification(
                '❌ AI Fix Failed',
                'AI-suggested fix did not work. Manual intervention required.',
                'error',
                false,
                { originalError: errorDetails, aiSuggestion, fixAttempt: command, fixError: error.message },
                aiSuggestion
              );
            } else {
              createNotification(
                '✅ AI Fix Successful',
                'AI successfully resolved the error!',
                'success',
                false,
                null,
                aiSuggestion
              );
            }
          });
        }
      } else {
        // Error is too complex, show AI suggestion for manual fix
        createNotification(
          '⚠️ Manual Fix Required',
          'This error requires manual intervention. See AI suggestions below.',
          'error',
          false,
          errorDetails,
          aiSuggestion
        );
      }
    } else {
      throw new Error('AI service unavailable');
    }
  } catch (error) {
    log(`AI debugging failed: ${error.message}`, 'ERROR');
    createNotification(
      '❌ Complex Error',
      'An error occurred that requires manual intervention. Check logs/error-handler.log for details.',
      'error',
      false,
      errorDetails,
      'AI service is unavailable. Please check the error details and logs manually.'
    );
  }
}

// ============================================
// MONITORING LOOP
// ============================================
async function monitorServers() {
  // Check backend
  const backendHealthy = await checkServerHealth(CONFIG.BACKEND_HEALTH);
  const backendPortInUse = await checkPortInUse(CONFIG.BACKEND_PORT);

  if (!backendHealthy) {
    if (backendPortInUse) {
      // Port is in use but server not responding - force restart
      log('Backend port in use but not responding, forcing restart...', 'WARNING');
      createNotification(
        '⚠️ Backend Not Responding',
        'Backend port is occupied but server not responding. Forcing restart...',
        'warning',
        true
      );
      handlePortInUseError(CONFIG.BACKEND_PORT, 'backend');
    } else if (state.backendRestarts < CONFIG.MAX_RESTART_ATTEMPTS) {
      log('Backend is down, attempting restart...', 'WARNING');
      try {
        await startBackend();
      } catch (error) {
        log(`Backend restart failed: ${error.message}`, 'ERROR');
        handleUnknownError({
          service: 'backend',
          error: error.message,
          restartAttempts: state.backendRestarts
        });
      }
    } else {
      createNotification(
        '❌ Backend Failed',
        `Backend failed to start after ${CONFIG.MAX_RESTART_ATTEMPTS} attempts. Manual intervention required.`,
        'error',
        false
      );
    }
  } else {
    state.backendRestarts = 0; // Reset counter on success
  }

  // Check frontend
  const frontendHealthy = await checkServerHealth(CONFIG.FRONTEND_URL);
  const frontendPortInUse = await checkPortInUse(CONFIG.FRONTEND_PORT);

  if (!frontendHealthy) {
    if (frontendPortInUse) {
      // Port is in use but server not responding - force restart
      log('Frontend port in use but not responding, forcing restart...', 'WARNING');
      createNotification(
        '⚠️ Frontend Not Responding',
        'Frontend port is occupied but server not responding. Forcing restart...',
        'warning',
        true
      );
      handlePortInUseError(CONFIG.FRONTEND_PORT, 'frontend');
    } else if (state.frontendRestarts < CONFIG.MAX_RESTART_ATTEMPTS) {
      log('Frontend is down, attempting restart...', 'WARNING');
      try {
        await startFrontend();
      } catch (error) {
        log(`Frontend restart failed: ${error.message}`, 'ERROR');
      }
    } else {
      createNotification(
        '❌ Frontend Failed',
        `Frontend failed to start after ${CONFIG.MAX_RESTART_ATTEMPTS} attempts. Manual intervention required.`,
        'error',
        false
      );
    }
  } else {
    state.frontendRestarts = 0; // Reset counter on success
  }

  state.lastBackendCheck = new Date().toISOString();
  state.lastFrontendCheck = new Date().toISOString();
}

// ============================================
// API SERVER FOR NOTIFICATIONS
// ============================================
function startNotificationAPI() {
  const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.url === '/notifications' && req.method === 'GET') {
      // Get active notifications
      const activeNotifications = state.notifications.filter(n => !n.dismissed);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ notifications: activeNotifications }));
    } else if (req.url.startsWith('/notifications/') && req.method === 'DELETE') {
      // Dismiss notification
      const id = parseInt(req.url.split('/')[2]);
      dismissNotification(id);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } else if (req.url === '/status' && req.method === 'GET') {
      // Get system status
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        backend: state.backendProcess ? 'running' : 'stopped',
        frontend: state.frontendProcess ? 'running' : 'stopped',
        lastCheck: {
          backend: state.lastBackendCheck,
          frontend: state.lastFrontendCheck
        }
      }));
    } else if (req.url === '/frontend-error' && req.method === 'POST') {
      // Report frontend JavaScript errors
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const errorData = JSON.parse(body);
          log(`Frontend error reported: ${errorData.message}`, 'ERROR');
          handleFrontendJavaScriptError(errorData.message);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(9999, () => {
    log('Notification API running on http://localhost:9999', 'INFO');
  });
}

// ============================================
// MAIN
// ============================================
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Intelligent Error Handler & Auto-Recovery System      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  log('Starting error handler system...', 'INFO');

  // Start notification API
  startNotificationAPI();

  // Initial server check and start
  const backendRunning = await checkPortInUse(CONFIG.BACKEND_PORT);
  const frontendRunning = await checkPortInUse(CONFIG.FRONTEND_PORT);

  if (!backendRunning) {
    log('Backend not running, starting...', 'INFO');
    try {
      await startBackend();
    } catch (error) {
      log(`Initial backend start failed: ${error.message}`, 'ERROR');
    }
  } else {
    log('Backend already running', 'INFO');
  }

  if (!frontendRunning) {
    log('Frontend not running, starting...', 'INFO');
    try {
      await startFrontend();
    } catch (error) {
      log(`Initial frontend start failed: ${error.message}`, 'ERROR');
    }
  } else {
    log('Frontend already running', 'INFO');
  }

  // Start monitoring loop
  setInterval(monitorServers, CONFIG.CHECK_INTERVAL);

  log('Monitoring active. Press Ctrl+C to stop.', 'INFO');
  console.log('\n📊 System Status:');
  console.log(`   Backend:  http://localhost:${CONFIG.BACKEND_PORT}`);
  console.log(`   Frontend: http://localhost:${CONFIG.FRONTEND_PORT}`);
  console.log(`   Notifications: http://localhost:9999/notifications`);
  console.log(`   Logs: ${CONFIG.LOG_FILE}\n`);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('Shutting down error handler...', 'INFO');
  
  if (state.backendProcess) {
    state.backendProcess.kill();
  }
  if (state.frontendProcess) {
    state.frontendProcess.kill();
  }
  
  process.exit(0);
});

// Start the system
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'ERROR');
  process.exit(1);
});
