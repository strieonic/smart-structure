// ============================================
// Smart Load Distribution Analyzer - Frontend
// ============================================

const API = "http://localhost:5000/api/v1";
const ERROR_HANDLER_API = "http://localhost:9999";

// Global error handler for frontend JavaScript errors
window.addEventListener('error', function(event) {
  const errorMessage = `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
  console.error('JavaScript Error:', errorMessage);
  
  // Report to error handler
  fetch(`${ERROR_HANDLER_API}/frontend-error`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message: errorMessage,
      stack: event.error?.stack,
      timestamp: new Date().toISOString()
    })
  }).catch(err => console.log('Could not report error to handler:', err));
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
  const errorMessage = `Unhandled Promise Rejection: ${event.reason}`;
  console.error('Promise Rejection:', errorMessage);
  
  // Report to error handler
  fetch(`${ERROR_HANDLER_API}/frontend-error`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message: errorMessage,
      timestamp: new Date().toISOString()
    })
  }).catch(err => console.log('Could not report error to handler:', err));
});

// State Management
let state = {
  token: localStorage.getItem('token') || '',
  refreshToken: localStorage.getItem('refreshToken') || '',
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  surveyId: localStorage.getItem('surveyId') || '',
  buildingId: localStorage.getItem('buildingId') || '',
  surveys: [],
  currentReport: null
};

// Google Maps State
let map;
let marker;
let searchBox;
let googleMapsLoaded = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  if (state.token && state.user) {
    updateUIAfterLogin();
  }
  loadSurveysIntoDropdown();
  
  // Update sidebar navigation after state is loaded
  setTimeout(() => {
    if (typeof updateSidebarNavigation === 'function') {
      updateSidebarNavigation();
    }
  }, 200);
  
  // Check if Google Maps is already loaded
  if (typeof google !== 'undefined' && google.maps) {
    initMap();
  }
});

// ============================================
// Google Maps Integration
// ============================================

function initMap() {
  // Prevent multiple initializations
  if (googleMapsLoaded) {
    console.log('Google Maps already initialized');
    return;
  }
  
  // Check if Google Maps API is loaded
  if (typeof google === 'undefined' || !google.maps) {
    console.log('Google Maps API not yet loaded');
    return;
  }
  
  console.log('Initializing Google Maps...');
  googleMapsLoaded = true;
  
  // Default location (India - Delhi)
  const defaultLocation = { lat: 28.6139, lng: 77.2090 };
  
  // Create map
  map = new google.maps.Map(document.getElementById('map'), {
    center: defaultLocation,
    zoom: 12,
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
      mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
    },
    streetViewControl: true,
    fullscreenControl: true,
    zoomControl: true
  });

  // Create marker
  marker = new google.maps.Marker({
    map: map,
    position: defaultLocation,
    draggable: true,
    animation: google.maps.Animation.DROP,
    title: 'Selected Location'
  });

  // Update coordinates when marker is dragged
  marker.addListener('dragend', function(event) {
    updateCoordinates(event.latLng.lat(), event.latLng.lng());
  });

  // Click on map to place marker
  map.addListener('click', function(event) {
    placeMarker(event.latLng);
  });

  // Setup search box
  const input = document.getElementById('map-search');
  searchBox = new google.maps.places.SearchBox(input);
  
  // Bias search results to map viewport
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });

  // Listen for search box selection
  searchBox.addListener('places_changed', function() {
    const places = searchBox.getPlaces();
    
    if (places.length === 0) {
      return;
    }

    const place = places[0];
    
    if (!place.geometry || !place.geometry.location) {
      showToast('No location found for that search', 'warning');
      return;
    }

    // Move map and marker to searched location
    map.setCenter(place.geometry.location);
    map.setZoom(15);
    placeMarker(place.geometry.location);
    
    showToast('Location selected: ' + place.formatted_address, 'success');
  });

  // Set initial coordinates
  updateCoordinates(defaultLocation.lat, defaultLocation.lng);
}

function placeMarker(location) {
  marker.setPosition(location);
  marker.setAnimation(google.maps.Animation.BOUNCE);
  setTimeout(() => marker.setAnimation(null), 750);
  
  updateCoordinates(location.lat(), location.lng());
  
  // Optional: Show info window with coordinates
  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div class="map-marker-info">
        <h4><i class="fas fa-map-marker-alt"></i> Selected Location</h4>
        <p><strong>Latitude:</strong> ${location.lat().toFixed(6)}</p>
        <p><strong>Longitude:</strong> ${location.lng().toFixed(6)}</p>
      </div>
    `
  });
  
  infoWindow.open(map, marker);
  setTimeout(() => infoWindow.close(), 3000);
}

function updateCoordinates(lat, lng) {
  document.getElementById('survey-lat').value = lat.toFixed(6);
  document.getElementById('survey-lng').value = lng.toFixed(6);
}

function getCurrentLocation() {
  if (navigator.geolocation) {
    showToast('Getting your location...', 'info');
    
    navigator.geolocation.getCurrentPosition(
      function(position) {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        map.setCenter(pos);
        map.setZoom(15);
        placeMarker(new google.maps.LatLng(pos.lat, pos.lng));
        
        showToast('Current location detected!', 'success');
      },
      function(error) {
        let errorMsg = 'Unable to get your location';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission denied. Trying IP-based location...';
            showToast(errorMsg, 'warning');
            // Fallback to IP-based location
            autoDetectLocationFromIP();
            return;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out.';
            break;
        }
        showToast(errorMsg, 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    showToast('Geolocation is not supported by your browser', 'error');
  }
}

// ============================================
// Auto-detect location from IP using GeoJS
// ============================================
async function autoDetectLocationFromIP() {
  try {
    showToast('Detecting location from IP...', 'info');
    
    const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
    const data = await response.json();
    
    if (data.latitude && data.longitude) {
      const lat = parseFloat(data.latitude);
      const lon = parseFloat(data.longitude);
      
      // Update form fields
      document.getElementById('survey-lat').value = lat.toFixed(6);
      document.getElementById('survey-lng').value = lon.toFixed(6);
      
      // Update map if initialized
      if (map && marker) {
        const pos = new google.maps.LatLng(lat, lon);
        map.setCenter(pos);
        map.setZoom(12);
        placeMarker(pos);
      }
      
      showToast(`Location detected: ${data.city}, ${data.country}`, 'success');
      return { lat, lon, city: data.city, country: data.country };
    }
  } catch (error) {
    console.error('Auto-location failed:', error);
    showToast('Failed to detect location automatically', 'error');
  }
  return null;
}

// Make initMap available globally for Google Maps callback
window.initMap = initMap;

// ============================================
// Enhanced Address Search with Nominatim
// ============================================

// Search address using Nominatim (OpenStreetMap)
async function searchAddressNominatim(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SmartLoadAnalyzer/1.0'
      }
    });
    
    const results = await response.json();
    return results;
  } catch (error) {
    console.error('Address search failed:', error);
  }
  return [];
}

// Enhanced map search combining Google and Nominatim
async function enhancedMapSearch() {
  const searchInput = document.getElementById('map-search');
  const query = searchInput?.value;
  
  if (!query) {
    showToast('Please enter a location to search', 'warning');
    return;
  }
  
  showToast('Searching for location...', 'info');
  
  // Try Nominatim first (free, no API key)
  const results = await searchAddressNominatim(query);
  
  if (results.length > 0) {
    const result = results[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    // Update map
    if (map && marker) {
      const pos = new google.maps.LatLng(lat, lon);
      map.setCenter(pos);
      map.setZoom(15);
      placeMarker(pos);
    }
    
    // Update form
    document.getElementById('survey-lat').value = lat.toFixed(6);
    document.getElementById('survey-lng').value = lon.toFixed(6);
    
    // Auto-fill elevation
    autoFillElevation();
    
    const locationName = result.display_name.split(',').slice(0, 3).join(',');
    showToast(`Found: ${locationName}`, 'success');
  } else {
    showToast('No results found. Try a different search term.', 'warning');
  }
}

// ============================================
// DOM SAFETY HELPERS
// ============================================

// Safe DOM element getter with error handling
function safeGetElement(id) {
  try {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element with ID '${id}' not found`);
      return null;
    }
    return element;
  } catch (error) {
    console.error(`Error getting element '${id}':`, error);
    return null;
  }
}

// Safe style setter
function safeSetStyle(elementId, property, value) {
  const element = safeGetElement(elementId);
  if (element && element.style) {
    try {
      element.style[property] = value;
      return true;
    } catch (error) {
      console.error(`Error setting style on '${elementId}':`, error);
      return false;
    }
  }
  return false;
}

// Safe innerHTML setter
function safeSetHTML(elementId, html) {
  const element = safeGetElement(elementId);
  if (element) {
    try {
      element.innerHTML = html;
      return true;
    } catch (error) {
      console.error(`Error setting HTML on '${elementId}':`, error);
      return false;
    }
  }
  return false;
}

// ============================================
// UI Helper Functions
// ============================================

function showSection(sectionName) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  document.getElementById(`${sectionName}-section`).classList.add('active');
  document.querySelector(`[onclick="showSection('${sectionName}')"]`).classList.add('active');
}

function switchTab(tab, event) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  if (tab === 'login') {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
  } else {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
  }
}

// ============================================
// Account Type Selection Functions
// ============================================

function selectAccountType(type, event) {
  // Update active state
  document.querySelectorAll('.account-type-card').forEach(card => {
    card.classList.remove('active');
  });
  event.currentTarget.classList.add('active');

  // Show/hide appropriate auth cards
  if (type === 'user') {
    document.getElementById('user-auth-card').style.display = 'block';
    document.getElementById('expert-auth-card').style.display = 'none';
  } else {
    document.getElementById('user-auth-card').style.display = 'none';
    document.getElementById('expert-auth-card').style.display = 'block';
  }
}

// User Account Tab Switching
function switchUserTab(tab, event) {
  // Remove active from all tabs
  const userTabs = document.querySelectorAll('#user-auth-card .tab');
  userTabs.forEach(t => t.classList.remove('active'));

  // Add active to the correct tab
  let activated = false;
  if (event && event.target && event.target.classList.contains('tab')) {
    event.target.classList.add('active');
    activated = true;
  }
  if (!activated) {
    userTabs.forEach(t => {
      if ((tab === 'login' && t.textContent.trim().toLowerCase() === 'login') ||
          (tab === 'register' && t.textContent.trim().toLowerCase() === 'register')) {
        t.classList.add('active');
      }
    });
  }

  // Show/hide fields
  document.getElementById('user-login-fields').style.display = (tab === 'login') ? 'block' : 'none';
  document.getElementById('user-register-fields').style.display = (tab === 'register') ? 'block' : 'none';
}

// Expert Account Tab Switching
function switchExpertTab(tab, event) {
  // Remove active from all tabs
  const expertTabs = document.querySelectorAll('#expert-auth-card .tab');
  expertTabs.forEach(t => t.classList.remove('active'));

  // Add active to the correct tab
  let activated = false;
  if (event && event.target && event.target.classList.contains('tab')) {
    event.target.classList.add('active');
    activated = true;
  }
  if (!activated) {
    expertTabs.forEach(t => {
      if ((tab === 'login' && t.textContent.trim().toLowerCase() === 'login') ||
          (tab === 'register' && t.textContent.trim().toLowerCase() === 'register')) {
        t.classList.add('active');
      }
    });
  }

  // Show/hide fields
  document.getElementById('expert-login-fields').style.display = (tab === 'login') ? 'block' : 'none';
  document.getElementById('expert-register-fields').style.display = (tab === 'register') ? 'block' : 'none';
}

// Password toggle for user
document.addEventListener('DOMContentLoaded', () => {
  const userPwdToggle = document.getElementById('toggle-user-password');
  if (userPwdToggle) {
    userPwdToggle.addEventListener('click', () => {
      const pwdInput = document.getElementById('login-password');
      if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        userPwdToggle.textContent = '🙈';
      } else {
        pwdInput.type = 'password';
        userPwdToggle.textContent = '👁️';
      }
    });
  }

  const expertPwdToggle = document.getElementById('toggle-expert-password');
  if (expertPwdToggle) {
    expertPwdToggle.addEventListener('click', () => {
      const pwdInput = document.getElementById('expert-login-password');
      if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        expertPwdToggle.textContent = '🙈';
      } else {
        pwdInput.type = 'password';
        expertPwdToggle.textContent = '👁️';
      }
    });
  }
});


function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? 'check-circle' : 
               type === 'error' ? 'exclamation-circle' : 
               type === 'warning' ? 'exclamation-triangle' : 'info-circle';
  
  toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function show(data) {
  // Console output disabled - working silently in background
  // Uncomment below lines to re-enable API response console
  // const outputElement = safeGetElement("output");
  // const consoleElement = safeGetElement("console");
  // if (outputElement) outputElement.textContent = JSON.stringify(data, null, 2);
  // if (consoleElement) safeSetStyle("console", "display", "block");
  
  // Log to browser console for debugging (optional)
  console.log('API Response:', data);
}

function clearConsole() {
  // Clear console output (only used in debug mode)
  const outputElement = safeGetElement("output");
  const consoleElement = safeGetElement("console");
  if (outputElement) outputElement.textContent = '';
  if (consoleElement) safeSetStyle("console", "display", "none");
}

function updateUIAfterLogin() {
  const userInfo = safeGetElement('userInfo');
  const userName = safeGetElement('userName');
  
  if (userInfo) safeSetStyle('userInfo', 'display', 'flex');
  if (userName) userName.textContent = state.user.name;
  
  showToast(`Welcome back, ${state.user.name}!`, 'success');
  
  // Update sidebar navigation based on user role
  if (typeof updateSidebarNavigation === 'function') {
    updateSidebarNavigation();
  }
  
  // Load data for AI features
  loadBuildingsIntoAIDropdown();
  loadProjectsIntoDropdowns();
}

async function loadBuildingsIntoAIDropdown() {
  if (!state.token) return;

  try {
    const res = await fetch(`${API}/building-inputs`, {
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();

    if (data.status === 'success' && data.data) {
      const select = document.getElementById('ai-project-building');
      if (select) {
        select.innerHTML = '<option value="">-- Select Building --</option>' +
          data.data.map(b => `
            <option value="${b.id}" ${b.id === state.buildingId ? 'selected' : ''}>
              ${b.buildingType} - ${b.totalFloors} floors (${b.builtUpArea} sq.m)
            </option>
          `).join('');
      }
    }
  } catch (err) {
    console.error('Failed to load buildings into AI dropdown', err);
  }
}

// ============================================
// User Authentication Functions
// ============================================

async function userRegister() {
  const name = document.getElementById("user-register-name").value.trim();
  const email = document.getElementById("user-register-email").value.trim();
  const password = document.getElementById("user-register-password").value.trim();

  if (!name) {
    showToast('Please enter your full name', 'error');
    return;
  }
  if (!email) {
    showToast('Please enter your email', 'error');
    return;
  }
  if (!password) {
    showToast('Please enter a password', 'error');
    return;
  }
  if (password.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, role: 'USER' })
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success') {
      showToast('Registration successful! Please login.', 'success');
      document.getElementById('user-register-name').value = '';
      document.getElementById('user-register-email').value = '';
      document.getElementById('user-register-password').value = '';
      document.querySelectorAll('#user-auth-card .tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('#user-auth-card .tab')[0].classList.add('active');
      document.getElementById('user-login-fields').style.display = 'block';
      document.getElementById('user-register-fields').style.display = 'none';
      document.getElementById('login-email').value = email;
    } else {
      showToast(data.message || 'Registration failed', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    console.error('Registration error:', err);
  }
}

async function userLogin() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showToast('Please enter email and password', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data.accessToken) {
      state.token = data.data.accessToken;
      state.refreshToken = data.data.refreshToken;
      state.user = data.data.user;

      localStorage.setItem('token', state.token);
      localStorage.setItem('refreshToken', state.refreshToken);
      localStorage.setItem('user', JSON.stringify(state.user));

      updateUIAfterLogin();
      showToast(`Welcome back, ${state.user.name}!`, 'success');
      
      // Update sidebar navigation
      if (typeof updateSidebarNavigation === 'function') {
        updateSidebarNavigation();
      }
      
      // Navigate to survey section
      navigateTo('survey-section');
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

// ============================================
// Expert Authentication Functions
// ============================================

async function expertRegister() {
  const name = document.getElementById("expert-register-name").value.trim();
  const email = document.getElementById("expert-register-email").value.trim();
  const password = document.getElementById("expert-register-password").value.trim();
  const license = document.getElementById("expert-register-license").value.trim();

  if (!name) {
    showToast('Please enter your full name', 'error');
    return;
  }
  if (!email) {
    showToast('Please enter your email', 'error');
    return;
  }
  if (!password) {
    showToast('Please enter a password', 'error');
    return;
  }
  if (!license) {
    showToast('Please enter your professional license number', 'error');
    return;
  }
  if (password.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, role: 'EXPERT', license })
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success') {
      showToast('Expert registration successful! Please login.', 'success');
      document.getElementById('expert-register-name').value = '';
      document.getElementById('expert-register-email').value = '';
      document.getElementById('expert-register-password').value = '';
      document.getElementById('expert-register-license').value = '';
      document.querySelectorAll('#expert-auth-card .tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('#expert-auth-card .tab')[0].classList.add('active');
      document.getElementById('expert-login-fields').style.display = 'block';
      document.getElementById('expert-register-fields').style.display = 'none';
      document.getElementById('expert-login-email').value = email;
    } else {
      showToast(data.message || 'Registration failed', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    console.error('Expert registration error:', err);
  }
}

async function expertLogin() {
  const email = document.getElementById("expert-login-email").value;
  const password = document.getElementById("expert-login-password").value;

  if (!email || !password) {
    showToast('Please enter email and password', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data.accessToken) {
      state.token = data.data.accessToken;
      state.refreshToken = data.data.refreshToken;
      state.user = data.data.user;

      localStorage.setItem('token', state.token);
      localStorage.setItem('refreshToken', state.refreshToken);
      localStorage.setItem('user', JSON.stringify(state.user));

      // Check if user is an expert
      if (state.user.role === 'EXPERT') {
        updateUIAfterLogin();
        showToast(`Welcome back, ${state.user.name}!`, 'success');
        
        // Update sidebar navigation
        if (typeof updateSidebarNavigation === 'function') {
          updateSidebarNavigation();
        }
        
        // Navigate to expert dashboard
        navigateTo('expert-queries-section');
      } else {
        showToast('This account is not registered as an expert', 'error');
        logout();
      }
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

// Backward compatibility - keep old functions
async function register() {
  return userRegister();
}

async function login() {
  return userLogin();
}

// Demo login function
async function demoLogin(type = 'user') {
  let demoEmail, demoPass, demoName, demoRole;
  
  if (type === 'expert') {
    demoEmail = 'expert@demo.smartload.io';
    demoPass = 'Demo1234!';
    demoName = 'Dr. Rajesh Kumar';
    demoRole = 'EXPERT';
  } else {
    demoEmail = 'user@demo.smartload.io';
    demoPass = 'Demo1234!';
    demoName = 'Alex Rivera';
    demoRole = 'USER';
  }

  try {
    // Try to register demo account (will fail silently if exists)
    await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: demoEmail, password: demoPass, name: demoName, role: demoRole })
    });

    // Now login
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: demoEmail, password: demoPass })
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data.accessToken) {
      state.token = data.data.accessToken;
      state.refreshToken = data.data.refreshToken;
      state.user = data.data.user;

      localStorage.setItem('token', state.token);
      localStorage.setItem('refreshToken', state.refreshToken);
      localStorage.setItem('user', JSON.stringify(state.user));

      showToast(`Demo mode activated! 🚀 Welcome ${demoName}!`, 'success');
      
      updateUIAfterLogin();

      // Update sidebar navigation
      if (typeof updateSidebarNavigation === 'function') {
        updateSidebarNavigation();
      }

      setTimeout(() => {
        if (type === 'expert') {
          navigateTo('expert-queries-section');
        } else {
          navigateTo('survey-section');
        }
      }, 1500);
    } else {
      showToast(data.message || 'Demo login failed', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

async function logout() {
  console.log('Logout function called');
  
  // Clear state
  state = {
    token: '',
    refreshToken: '',
    user: null,
    surveyId: '',
    buildingId: '',
    surveys: [],
    currentReport: null
  };
  
  // Clear localStorage
  localStorage.clear();
  console.log('LocalStorage cleared');
  
  // Hide user info section
  const userInfoSection = document.getElementById('user-info-section');
  if (userInfoSection) {
    userInfoSection.style.display = 'none';
    console.log('User info section hidden');
  }
  
  // Update sidebar navigation to guest mode
  if (typeof updateSidebarNavigation === 'function') {
    updateSidebarNavigation();
    console.log('Sidebar navigation updated');
  }
  
  // Show toast notification
  showToast('Logged out successfully', 'info');
  
  // Navigate to home
  if (typeof navigateTo === 'function') {
    navigateTo('home-section');
    console.log('Navigated to home');
  } else {
    // Fallback: reload page
    console.log('Reloading page as fallback');
    window.location.reload();
  }
}

// ============================================
// Land Survey Functions
// ============================================

// Get elevation data from Open-Elevation API
async function getElevationData(lat, lon) {
  try {
    const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].elevation;
    }
  } catch (error) {
    console.error('Elevation fetch failed:', error);
  }
  return null;
}

// Auto-fill elevation from API
async function autoFillElevation() {
  const lat = document.getElementById('survey-lat').value;
  const lon = document.getElementById('survey-lng').value;
  
  if (!lat || !lon) {
    showToast('Please select a location on the map first', 'warning');
    return;
  }
  
  showToast('Fetching elevation data...', 'info');
  
  const elevation = await getElevationData(lat, lon);
  
  if (elevation !== null) {
    document.getElementById('survey-elevation').value = Math.round(elevation);
    showToast(`Elevation: ${Math.round(elevation)}m above sea level`, 'success');
  } else {
    showToast('Failed to fetch elevation data', 'error');
  }
}

async function createSurvey() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  const surveyData = {
    latitude: parseFloat(document.getElementById("survey-lat").value),
    longitude: parseFloat(document.getElementById("survey-lng").value),
    plotArea: parseFloat(document.getElementById("survey-area").value),
    soilType: document.getElementById("survey-soil").value,
    slope: parseFloat(document.getElementById("survey-slope").value),
    elevation: parseFloat(document.getElementById("survey-elevation").value),
    waterTableDepth: parseFloat(document.getElementById("survey-water").value),
    seismicZone: document.getElementById("survey-seismic").value,
    floodRisk: document.getElementById("survey-flood").value,
    nearbyWaterBodies: document.getElementById("survey-waterbody").value === 'true',
    waterBodyDistance: parseFloat(document.getElementById("survey-waterdist").value) || null,
    averageRainfall: parseFloat(document.getElementById("survey-rainfall").value) || null
  };

  try {
    const res = await fetch(`${API}/land-surveys`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + state.token
      },
      body: JSON.stringify(surveyData)
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data) {
      state.surveyId = data.data.id;
      localStorage.setItem('surveyId', state.surveyId);
      showToast('Land survey created successfully!', 'success');
      loadSurveys();
      loadSurveysIntoDropdown();
    } else {
      showToast(data.message || 'Failed to create survey', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

async function loadSurveys() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/land-surveys`, {
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data) {
      state.surveys = data.data;
      displaySurveys(data.data);
      showToast('Surveys loaded successfully', 'success');
    }
  } catch (err) {
    showToast('Failed to load surveys', 'error');
    show({ error: err.message });
  }
}

function displaySurveys(surveys) {
  const container = document.getElementById('surveys-list');
  
  if (!surveys || surveys.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No surveys found</p></div>';
    return;
  }

  container.innerHTML = surveys.map(survey => `
    <div class="list-item">
      <div class="list-item-header">
        <h4><i class="fas fa-map-marker-alt"></i> Survey ${survey.id.substring(0, 8)}</h4>
        <span class="badge badge-${survey.seismicZone}">${survey.seismicZone}</span>
      </div>
      <div class="list-item-body">
        <p><strong>Location:</strong> ${survey.latitude}, ${survey.longitude}</p>
        <p><strong>Plot Area:</strong> ${survey.plotArea} sq.m</p>
        <p><strong>Soil:</strong> ${survey.soilType}</p>
        <p><strong>Flood Risk:</strong> ${survey.floodRisk}</p>
      </div>
      <div class="list-item-actions">
        <button onclick="selectSurvey('${survey.id}')" class="btn btn-sm btn-primary">
          <i class="fas fa-check"></i> Select
        </button>
      </div>
    </div>
  `).join('');
}

function selectSurvey(surveyId) {
  state.surveyId = surveyId;
  localStorage.setItem('surveyId', surveyId);
  showToast('Survey selected', 'success');
  loadSurveysIntoDropdown();
}

async function loadSurveysIntoDropdown() {
  if (!state.token) return;

  try {
    const res = await fetch(`${API}/land-surveys`, {
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();

    if (data.status === 'success' && data.data) {
      const select = document.getElementById('building-survey');
      select.innerHTML = '<option value="">-- Select Survey --</option>' +
        data.data.map(s => `
          <option value="${s.id}" ${s.id === state.surveyId ? 'selected' : ''}>
            ${s.latitude}, ${s.longitude} - ${s.soilType}
          </option>
        `).join('');
    }
  } catch (err) {
    console.error('Failed to load surveys into dropdown', err);
  }
}

// ============================================
// Building Input Functions
// ============================================

async function createBuilding() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  const selectedSurveyId = document.getElementById('building-survey').value || state.surveyId;
  
  if (!selectedSurveyId) {
    showToast('Please select a land survey first', 'error');
    return;
  }

  const buildingData = {
    landSurveyId: selectedSurveyId,
    buildingType: document.getElementById("building-type").value,
    totalFloors: parseInt(document.getElementById("building-floors").value),
    floorHeight: parseFloat(document.getElementById("building-floorheight").value),
    totalHeight: parseFloat(document.getElementById("building-height").value),
    builtUpArea: parseFloat(document.getElementById("building-area").value),
    orientation: document.getElementById("building-orientation").value,
    structuralSystem: document.getElementById("building-structure").value,
    basementFloors: parseInt(document.getElementById("building-basement").value) || 0,
    parkingFloors: parseInt(document.getElementById("building-parking").value) || 0,
    expectedOccupancy: parseInt(document.getElementById("building-occupancy").value) || null
  };

  try {
    const res = await fetch(`${API}/building-inputs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + state.token
      },
      body: JSON.stringify(buildingData)
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data) {
      state.buildingId = data.data.id;
      localStorage.setItem('buildingId', state.buildingId);
      showToast('Building input created successfully!', 'success');
      showSection('wind');
    } else {
      showToast(data.message || 'Failed to create building input', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

// ============================================
// Wind Data Functions
// ============================================

// Get weather data from Open-Meteo API
async function getWeatherData(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=windspeed_10m,winddirection_10m,temperature_2m&daily=precipitation_sum`;
    
    showToast('Fetching real-time weather data...', 'info');
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.current_weather) {
      return {
        windSpeed: data.current_weather.windspeed,
        windDirection: data.current_weather.winddirection,
        temperature: data.current_weather.temperature,
        precipitation: data.daily?.precipitation_sum?.[0] || 0,
        time: data.current_weather.time
      };
    }
  } catch (error) {
    console.error('Weather data fetch failed:', error);
    showToast('Failed to fetch weather data', 'error');
  }
  return null;
}

// Auto-fill wind data from weather API
async function autoFillWindData() {
  const lat = document.getElementById('survey-lat')?.value || state.surveyId;
  const lon = document.getElementById('survey-lng')?.value;
  
  if (!lat || !lon) {
    showToast('Please select a location in Land Survey first', 'warning');
    return;
  }
  
  const weather = await getWeatherData(lat, lon);
  
  if (weather) {
    // Fill wind data form with real weather data
    document.getElementById('wind-direction').value = Math.round(weather.windDirection);
    document.getElementById('wind-avgspeed').value = weather.windSpeed.toFixed(1);
    // Peak gust is typically 1.5x average wind speed
    document.getElementById('wind-peakspeed').value = (weather.windSpeed * 1.5).toFixed(1);
    
    showToast(`Weather data loaded! Wind: ${weather.windSpeed.toFixed(1)} m/s from ${Math.round(weather.windDirection)}°`, 'success');
  }
}

async function addWind() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  if (!state.buildingId) {
    showToast('Please create a building input first', 'error');
    return;
  }

  const windData = {
    buildingInputId: state.buildingId,
    windDirection: parseFloat(document.getElementById("wind-direction").value),
    averageWindSpeed: parseFloat(document.getElementById("wind-avgspeed").value),
    peakGustSpeed: parseFloat(document.getElementById("wind-peakspeed").value),
    terrainRoughness: document.getElementById("wind-terrain").value
  };

  try {
    const res = await fetch(`${API}/wind`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + state.token
      },
      body: JSON.stringify(windData)
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success') {
      showToast('Wind data added successfully!', 'success');
      showSection('analysis');
    } else {
      showToast(data.message || 'Failed to add wind data', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

// ============================================
// Analysis Functions
// ============================================

async function runDisaster() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  if (!state.buildingId) {
    showToast('Please create a building input first', 'error');
    return;
  }

  showToast('Running disaster analysis... This may take 10 seconds', 'info');

  try {
    const res = await fetch(`${API}/analysis/disaster/${state.buildingId}`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();
    console.log('Disaster Analysis Response:', data);
    show(data);

    if (data.status === 'success' && data.data) {
      showToast('Disaster analysis completed successfully!', 'success');
      state.currentReport = data.data;
      
      // Auto-navigate to reports section and display
      setTimeout(() => {
        navigateTo('reports-section');
        displayDisasterReport(data.data);
        
        setTimeout(() => {
          showToast('Disaster report is now displayed', 'info');
        }, 500);
      }, 500);
    } else {
      console.error('Disaster analysis failed:', data);
      showToast(data.message || 'Analysis failed. Please try again.', 'error');
    }
  } catch (err) {
    console.error('Network error in disaster analysis:', err);
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

async function runVastu() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  if (!state.buildingId) {
    showToast('Please create a building input first', 'error');
    return;
  }

  showToast('Running Vastu analysis... This may take 10 seconds', 'info');

  try {
    const res = await fetch(`${API}/analysis/vastu/${state.buildingId}`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();
    console.log('Vastu Analysis Response:', data);
    show(data);

    if (data.status === 'success' && data.data) {
      showToast('Vastu analysis completed successfully!', 'success');
      state.currentReport = data.data;
      
      // Auto-navigate to reports section and display
      setTimeout(() => {
        navigateTo('reports-section');
        displayVastuReport(data.data);
        
        setTimeout(() => {
          showToast('Vastu report is now displayed', 'info');
        }, 500);
      }, 500);
    } else {
      console.error('Vastu analysis failed:', data);
      showToast(data.message || 'Analysis failed. Please try again.', 'error');
    }
  } catch (err) {
    console.error('Network error in Vastu analysis:', err);
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

async function generateReport() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  if (!state.buildingId) {
    showToast('Please create a building input first', 'error');
    return;
  }

  showToast('Generating final report... This may take 10-15 seconds', 'info');

  try {
    const res = await fetch(`${API}/analysis/report/${state.buildingId}`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();
    console.log('Generate Report Response:', data);
    show(data);

    if (data.status === 'success' && data.data) {
      showToast('Final report generated successfully!', 'success');
      state.currentReport = data.data;
      
      // Auto-navigate to reports section
      setTimeout(() => {
        navigateTo('reports-section');
        displayFinalReport(data.data);
        
        // Show another toast to confirm
        setTimeout(() => {
          showToast('Report is now displayed below', 'info');
        }, 500);
      }, 500);
    } else {
      console.error('Report generation failed:', data);
      
      // Improved error messages
      let errorMsg = data.message || 'Report generation failed. Please try again.';
      
      if (errorMsg.includes('Disaster analysis not completed')) {
        errorMsg = '⚠️ Please run Disaster Analysis first, then Vastu Analysis, then try again.';
      } else if (errorMsg.includes('Vastu analysis not completed')) {
        errorMsg = '⚠️ Please run Vastu Analysis first, then try again.';
      }
      
      showToast(errorMsg, 'error');
      
      // Show more details if available
      if (data.errors) {
        console.error('Errors:', data.errors);
      }
    }
  } catch (err) {
    console.error('Network error generating report:', err);
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

// Run all analyses in sequence
async function runAllAnalyses() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  if (!state.buildingId) {
    showToast('Please create a building input first', 'error');
    return;
  }

  showToast('🚀 Starting complete analysis workflow...', 'info');

  try {
    // Step 1: Run Disaster Analysis
    showToast('Step 1/3: Running Disaster Analysis...', 'info');
    const disasterRes = await fetch(`${API}/analysis/disaster/${state.buildingId}`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + state.token }
    });
    const disasterData = await disasterRes.json();
    
    if (disasterData.status !== 'success') {
      showToast('❌ Disaster analysis failed: ' + (disasterData.message || 'Unknown error'), 'error');
      return;
    }
    showToast('✅ Disaster analysis completed', 'success');
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 2: Run Vastu Analysis
    showToast('Step 2/3: Running Vastu Analysis...', 'info');
    const vastuRes = await fetch(`${API}/analysis/vastu/${state.buildingId}`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + state.token }
    });
    const vastuData = await vastuRes.json();
    
    if (vastuData.status !== 'success') {
      showToast('❌ Vastu analysis failed: ' + (vastuData.message || 'Unknown error'), 'error');
      return;
    }
    showToast('✅ Vastu analysis completed', 'success');
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Generate Final Report
    showToast('Step 3/3: Generating Final Report...', 'info');
    const reportRes = await fetch(`${API}/analysis/report/${state.buildingId}`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + state.token }
    });
    const reportData = await reportRes.json();
    
    if (reportData.status === 'success' && reportData.data) {
      showToast('🎉 All analyses completed! Final report generated successfully!', 'success');
      state.currentReport = reportData.data;
      
      // Auto-navigate to reports section
      setTimeout(() => {
        navigateTo('reports-section');
        displayFinalReport(reportData.data);
        
        // Show another toast to confirm
        setTimeout(() => {
          showToast('✅ Complete analysis workflow finished! Report is displayed below.', 'success');
        }, 500);
      }, 1000);
    } else {
      showToast('❌ Final report generation failed: ' + (reportData.message || 'Unknown error'), 'error');
    }
    
  } catch (err) {
    console.error('Error in runAllAnalyses:', err);
    showToast('Network error: ' + err.message, 'error');
  }
}

// ============================================
// Report Viewing Functions
// ============================================

async function viewDisasterReport() {
  if (!state.buildingId) {
    showToast('No building selected. Please create a building input first.', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/analysis/disaster/${state.buildingId}`, {
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data) {
      navigateTo('reports-section');
      displayDisasterReport(data.data);
      showToast('Disaster report loaded successfully', 'success');
    } else {
      showToast('Report not found. Please run disaster analysis first from the Analysis section.', 'warning');
      // Optionally navigate to analysis section
      if (confirm('Would you like to go to the Analysis section to run the analysis?')) {
        navigateTo('analysis-section');
      }
    }
  } catch (err) {
    console.error('Failed to load disaster report:', err);
    showToast('Failed to load report. Please ensure you have run the disaster analysis first.', 'error');
  }
}

async function viewVastuReport() {
  if (!state.buildingId) {
    showToast('No building selected. Please create a building input first.', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/analysis/vastu/${state.buildingId}`, {
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data) {
      navigateTo('reports-section');
      displayVastuReport(data.data);
      showToast('Vastu report loaded successfully', 'success');
    } else {
      showToast('Report not found. Please run Vastu analysis first from the Analysis section.', 'warning');
      // Optionally navigate to analysis section
      if (confirm('Would you like to go to the Analysis section to run the analysis?')) {
        navigateTo('analysis-section');
      }
    }
  } catch (err) {
    console.error('Failed to load Vastu report:', err);
    showToast('Failed to load report. Please ensure you have run the Vastu analysis first.', 'error');
  }
}

async function viewFinalReport() {
  if (!state.buildingId) {
    showToast('No building selected. Please create a building input first.', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/analysis/report/${state.buildingId}`, {
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data) {
      navigateTo('reports-section');
      displayFinalReport(data.data);
      showToast('Final report loaded successfully', 'success');
    } else {
      showToast('Report not found. Please generate the final report first from the Analysis section.', 'warning');
      // Optionally navigate to analysis section
      if (confirm('Would you like to go to the Analysis section to generate the report?')) {
        navigateTo('analysis-section');
      }
    }
  } catch (err) {
    console.error('Failed to load final report:', err);
    showToast('Failed to load report. Please ensure you have generated the final report first.', 'error');
  }
}

function displayDisasterReport(report) {
  const viewer = document.getElementById('report-viewer');
  viewer.innerHTML = `
    <div class="report-header">
      <h2><i class="fas fa-exclamation-triangle"></i> Disaster Analysis Report</h2>
      <div class="report-meta">
        <span><i class="fas fa-calendar"></i> ${new Date(report.createdAt).toLocaleDateString()}</span>
      </div>
    </div>

    <div class="report-section">
      <h3>Load Analysis</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${report.deadLoad.toFixed(2)} kN</div>
          <div class="stat-label">Dead Load</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${report.liveLoad.toFixed(2)} kN</div>
          <div class="stat-label">Live Load</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${report.windLoad.toFixed(2)} kN</div>
          <div class="stat-label">Wind Load</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${report.seismicLoad.toFixed(2)} kN</div>
          <div class="stat-label">Seismic Load</div>
        </div>
        <div class="stat-card highlight">
          <div class="stat-value">${report.totalLoad.toFixed(2)} kN</div>
          <div class="stat-label">Total Load</div>
        </div>
      </div>
    </div>

    <div class="report-section">
      <h3>Structural Recommendations</h3>
      <div class="info-grid">
        <div class="info-item">
          <strong>Height Category:</strong> ${report.heightCategory}
        </div>
        <div class="info-item">
          <strong>Foundation Type:</strong> ${report.recommendedFoundation}
        </div>
        <div class="info-item">
          <strong>Foundation Depth:</strong> ${report.foundationDepth}m
        </div>
        <div class="info-item">
          <strong>Column Spacing:</strong> ${report.columnSpacing}m
        </div>
        <div class="info-item">
          <strong>Shear Walls Required:</strong> ${report.shearWallRequired ? 'Yes' : 'No'}
        </div>
      </div>
      <div class="info-box">
        <strong>Beam Sizing:</strong>
        <p>${report.beamSizing}</p>
      </div>
    </div>

    <div class="report-section">
      <h3>Earthquake Analysis</h3>
      <div class="score-card ${getScoreClass(report.earthquakeSafetyScore)}">
        <div class="score-value">${report.earthquakeSafetyScore.toFixed(1)}</div>
        <div class="score-label">Safety Score</div>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <strong>Base Shear:</strong> ${report.baseShear.toFixed(2)} kN
        </div>
        <div class="info-item">
          <strong>Soft Story Detected:</strong> 
          <span class="${report.softStoryDetected ? 'text-danger' : 'text-success'}">
            ${report.softStoryDetected ? 'Yes - Critical!' : 'No'}
          </span>
        </div>
      </div>
    </div>

    <div class="report-section">
      <h3>Flood Analysis</h3>
      <div class="info-grid">
        <div class="info-item">
          <strong>Minimum Plinth Height:</strong> ${report.minimumPlinthHeight}m
        </div>
        <div class="info-item">
          <strong>Drainage Slope:</strong> ${report.drainageSlope}%
        </div>
        <div class="info-item">
          <strong>Basement Feasible:</strong> ${report.basementFeasible ? 'Yes' : 'No'}
        </div>
      </div>
    </div>

    <div class="report-section">
      <h3>Wind/Cyclone Analysis</h3>
      <div class="info-grid">
        <div class="info-item">
          <strong>Vortex Shedding Risk:</strong> 
          <span class="badge badge-${report.vortexSheddingRisk.toLowerCase()}">${report.vortexSheddingRisk}</span>
        </div>
        <div class="info-item">
          <strong>Height to Width Ratio:</strong> ${report.heightToWidthRatio.toFixed(2)}
        </div>
      </div>
      <div class="info-box">
        <strong>Shape Optimization:</strong>
        <p>${report.shapeOptimization}</p>
      </div>
    </div>
  `;
}

function displayVastuReport(report) {
  const viewer = document.getElementById('report-viewer');
  viewer.innerHTML = `
    <div class="report-header">
      <h2><i class="fas fa-om"></i> Vastu Shastra Analysis Report</h2>
      <div class="report-meta">
        <span><i class="fas fa-calendar"></i> ${new Date(report.createdAt).toLocaleDateString()}</span>
      </div>
    </div>

    <div class="report-section">
      <h3>Vastu Compliance</h3>
      <div class="score-card ${getScoreClass(report.vastuComplianceScore)}">
        <div class="score-value">${report.vastuComplianceScore.toFixed(1)}</div>
        <div class="score-label">Compliance Score</div>
      </div>
      <div class="info-item">
        <strong>Overall Compliance:</strong> 
        <span class="badge badge-${report.overallCompliance.toLowerCase()}">${report.overallCompliance}</span>
      </div>
    </div>

    <div class="report-section">
      <h3>Directional Analysis</h3>
      <div class="info-grid">
        <div class="info-item">
          <strong>Entrance Direction:</strong> ${report.entranceDirection}
        </div>
        <div class="info-item">
          <strong>Entrance Suitability:</strong>
          <p class="text-small">${report.entranceSuitability}</p>
        </div>
        <div class="info-item">
          <strong>Kitchen Zone:</strong> ${report.kitchenZoneCompliance ? '✓ Compliant' : '✗ Non-compliant'}
        </div>
        <div class="info-item">
          <strong>Bedroom Zone:</strong> ${report.bedroomZoneCompliance ? '✓ Compliant' : '✗ Non-compliant'}
        </div>
        <div class="info-item">
          <strong>Staircase:</strong> ${report.staircaseCompliance ? '✓ Compliant' : '✗ Non-compliant'}
        </div>
      </div>
    </div>

    <div class="report-section">
      <h3>Water Element Placement</h3>
      <div class="info-box">
        <strong>Water Tank Direction:</strong>
        <p>${report.waterTankDirection}</p>
      </div>
      <div class="info-box">
        <strong>Borewell Direction:</strong>
        <p>${report.borewellDirection}</p>
      </div>
    </div>

    <div class="report-section">
      <h3>Wind-Vastu Compatibility</h3>
      <div class="info-box">
        <p>${report.windVastuCompatibility}</p>
      </div>
    </div>

    ${report.violations && report.violations.length > 0 ? `
      <div class="report-section">
        <h3>Violations Detected</h3>
        ${report.violations.map(v => `
          <div class="alert alert-${v.severity.toLowerCase()}">
            <strong>${v.category}:</strong> ${v.description}
            <br><small>Impact: ${v.impact}</small>
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${report.corrections && report.corrections.length > 0 ? `
      <div class="report-section">
        <h3>Recommended Corrections</h3>
        ${report.corrections.map(c => `
          <div class="correction-item">
            <div class="correction-header">
              <span class="badge badge-${c.priority.toLowerCase()}">${c.priority}</span>
              <strong>${c.violation}</strong>
            </div>
            <p>${c.solution}</p>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

function displayFinalReport(report) {
  const viewer = document.getElementById('report-viewer');
  viewer.innerHTML = `
    <div class="report-header">
      <h2><i class="fas fa-file-alt"></i> Comprehensive Analysis Report</h2>
      <div class="report-meta">
        <span><i class="fas fa-calendar"></i> ${new Date(report.generatedAt).toLocaleDateString()}</span>
        <span class="badge badge-success">${report.reportStatus}</span>
      </div>
    </div>

    <div class="report-section">
      <h3>Composite Scores</h3>
      <div class="stats-grid">
        <div class="stat-card ${getScoreClass(report.overallSafetyScore)}">
          <div class="stat-value">${report.overallSafetyScore.toFixed(1)}</div>
          <div class="stat-label">Safety Score</div>
        </div>
        <div class="stat-card ${getScoreClass(report.costEfficiencyScore)}">
          <div class="stat-value">${report.costEfficiencyScore.toFixed(1)}</div>
          <div class="stat-label">Cost Efficiency</div>
        </div>
        <div class="stat-card ${getScoreClass(report.sustainabilityScore)}">
          <div class="stat-value">${report.sustainabilityScore.toFixed(1)}</div>
          <div class="stat-label">Sustainability</div>
        </div>
        <div class="stat-card ${getScoreClass(report.vastuScore)}">
          <div class="stat-value">${report.vastuScore.toFixed(1)}</div>
          <div class="stat-label">Vastu Score</div>
        </div>
      </div>
    </div>

    <div class="report-section">
      <h3>Survey Summary</h3>
      <div class="info-grid">
        <div class="info-item">
          <strong>Location:</strong> ${report.surveySummary.location.lat}, ${report.surveySummary.location.lng}
        </div>
        <div class="info-item">
          <strong>Plot Area:</strong> ${report.surveySummary.plotArea} sq.m
        </div>
        <div class="info-item">
          <strong>Soil Type:</strong> ${report.surveySummary.soilType}
        </div>
        <div class="info-item">
          <strong>Seismic Zone:</strong> ${report.surveySummary.seismicZone}
        </div>
        <div class="info-item">
          <strong>Flood Risk:</strong> ${report.surveySummary.floodRisk}
        </div>
      </div>
    </div>

    <div class="report-section">
      <h3>Risk Analysis</h3>
      <div class="risk-cards">
        <div class="risk-card">
          <h4><i class="fas fa-house-damage"></i> Earthquake Risk</h4>
          <p><strong>Zone:</strong> ${report.riskAnalysis.earthquakeRisk.zone}</p>
          <p><strong>Safety Score:</strong> ${report.riskAnalysis.earthquakeRisk.safetyScore}</p>
          <p><strong>Base Shear:</strong> ${report.riskAnalysis.earthquakeRisk.baseShear} kN</p>
        </div>
        <div class="risk-card">
          <h4><i class="fas fa-water"></i> Flood Risk</h4>
          <p><strong>Level:</strong> ${report.riskAnalysis.floodRisk.level}</p>
          <p><strong>Plinth Height:</strong> ${report.riskAnalysis.floodRisk.plinthHeight}m</p>
          <p><strong>Basement:</strong> ${report.riskAnalysis.floodRisk.basementFeasible ? 'Feasible' : 'Not Feasible'}</p>
        </div>
        <div class="risk-card">
          <h4><i class="fas fa-wind"></i> Wind Risk</h4>
          <p><strong>Vortex Shedding:</strong> ${report.riskAnalysis.windRisk.vortexShedding}</p>
          <p><strong>H/W Ratio:</strong> ${report.riskAnalysis.windRisk.heightToWidthRatio}</p>
        </div>
      </div>
    </div>

    <div class="report-section">
      <h3>Final Recommendations</h3>
      
      <div class="recommendations">
        <h4><i class="fas fa-hard-hat"></i> Structural</h4>
        <ul>
          ${report.finalRecommendations.structural.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>

      <div class="recommendations">
        <h4><i class="fas fa-exclamation-triangle"></i> Disaster Mitigation</h4>
        <ul>
          ${report.finalRecommendations.disaster.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>

      <div class="recommendations">
        <h4><i class="fas fa-om"></i> Vastu</h4>
        <ul>
          ${report.finalRecommendations.vastu.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>

      <div class="recommendations">
        <h4><i class="fas fa-info-circle"></i> General</h4>
        <ul>
          ${report.finalRecommendations.general.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </div>
    </div>
  `;
}

function getScoreClass(score) {
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-good';
  if (score >= 40) return 'score-moderate';
  return 'score-poor';
}

// ============================================
// AI Projects Functions
// ============================================

let currentProjectId = '';
let aiProjects = [];

async function createAIProject() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  const buildingId = document.getElementById('ai-project-building').value || state.buildingId;
  const projectName = document.getElementById('ai-project-name').value;
  const projectType = document.getElementById('ai-project-type').value;

  if (!buildingId) {
    showToast('Please select a building input', 'error');
    return;
  }

  if (!projectName) {
    showToast('Please enter a project name', 'error');
    return;
  }

  // Get building data to extract location
  try {
    const buildingRes = await fetch(`${API}/building-inputs/${buildingId}`, {
      headers: { "Authorization": "Bearer " + state.token }
    });
    const buildingData = await buildingRes.json();

    if (buildingData.status !== 'success') {
      showToast('Failed to fetch building data', 'error');
      return;
    }

    const building = buildingData.data;
    const survey = building.landSurvey;

    const projectData = {
      projectName: projectName,
      latitude: survey.latitude,
      longitude: survey.longitude,
      buildingInputId: buildingId,
      projectType: projectType
    };

    showToast('Creating AI project...', 'info');

    const res = await fetch(`${API}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + state.token
      },
      body: JSON.stringify(projectData)
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data) {
      currentProjectId = data.data.id;
      showToast('AI Project created successfully!', 'success');
      loadAIProjects();
      
      // Clear form
      document.getElementById('ai-project-name').value = '';
    } else {
      showToast(data.message || 'Failed to create project', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

async function loadAIProjects() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/projects`, {
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data) {
      aiProjects = data.data;
      displayAIProjects(data.data);
      loadProjectsIntoDropdowns(data.data);
      showToast('Projects loaded successfully', 'success');
    }
  } catch (err) {
    showToast('Failed to load projects', 'error');
    show({ error: err.message });
  }
}

function displayAIProjects(projects) {
  const container = document.getElementById('ai-projects-list');
  
  if (!projects || projects.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No AI projects found. Create one to get started!</p></div>';
    return;
  }

  container.innerHTML = projects.map(project => {
    // Safely access location data
    const location = project.location || {};
    const locationText = location.city && location.state 
      ? `${location.city}, ${location.state}` 
      : 'Location data loading...';
    const zoneText = location.zoneType || 'Unknown';
    
    return `
      <div class="list-item">
        <div class="list-item-header">
          <h4><i class="fas fa-robot"></i> ${project.projectName}</h4>
          <span class="badge badge-${project.projectType.toLowerCase()}">${project.projectType}</span>
        </div>
        <div class="list-item-body">
          <p><strong>Location:</strong> ${locationText}</p>
          <p><strong>Zone:</strong> ${zoneText}</p>
          <p><strong>Status:</strong> <span class="badge badge-${project.status.toLowerCase()}">${project.status}</span></p>
          <p><strong>Created:</strong> ${new Date(project.createdAt).toLocaleDateString()}</p>
        </div>
        <div class="list-item-actions">
          <button onclick="runAIAnalysis('${project.id}')" class="btn btn-sm btn-primary">
            <i class="fas fa-brain"></i> Run AI Analysis
          </button>
          <button onclick="viewAIAnalysis('${project.id}')" class="btn btn-sm btn-secondary">
            <i class="fas fa-eye"></i> View Analysis
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function runAIAnalysis(projectId) {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  showToast('Running AI analysis... This may take 10-20 seconds', 'info');

  try {
    const res = await fetch(`${API}/projects/${projectId}/analyze`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data) {
      showToast('AI Analysis completed successfully!', 'success');
      currentProjectId = projectId;
      displayAIAnalysisResults(data.data);
      document.getElementById('ai-analysis-card').style.display = 'block';
      document.getElementById('ai-analysis-card').scrollIntoView({ behavior: 'smooth' });
    } else {
      showToast(data.message || 'AI Analysis failed', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

async function viewAIAnalysis(projectId) {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/projects/${projectId}/analysis-status`, {
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data && data.data.analysisCompleted) {
      currentProjectId = projectId;
      displayAIAnalysisResults(data.data);
      document.getElementById('ai-analysis-card').style.display = 'block';
      document.getElementById('ai-analysis-card').scrollIntoView({ behavior: 'smooth' });
    } else {
      showToast('No analysis found. Run AI analysis first.', 'warning');
    }
  } catch (err) {
    showToast('Failed to load analysis', 'error');
    show({ error: err.message });
  }
}

function displayAIAnalysisResults(analysis) {
  const viewer = document.getElementById('ai-analysis-viewer');
  
  // Extract data safely
  const combinedScore = analysis.combinedScore || 0;
  const overallStatus = analysis.overallStatus || 'UNKNOWN';
  const aiAnalysis = analysis.aiAnalysis || {};
  const complianceReport = aiAnalysis.complianceReport || {};
  const riskAnalysis = aiAnalysis.riskAnalysis || {};
  const recommendations = aiAnalysis.recommendations || {};
  const modifications = aiAnalysis.modifications || [];
  
  viewer.innerHTML = `
    <div class="report-header">
      <h2><i class="fas fa-brain"></i> AI Compliance Analysis</h2>
      <div class="report-meta">
        <span><i class="fas fa-calendar"></i> ${new Date().toLocaleDateString()}</span>
        <span class="badge badge-${overallStatus.toLowerCase()}">${overallStatus}</span>
      </div>
    </div>

    <div class="report-section">
      <h3>Overall Compliance Score</h3>
      <div class="stats-grid">
        <div class="stat-card ${getScoreClass(combinedScore)}">
          <div class="stat-value">${combinedScore.toFixed(1)}</div>
          <div class="stat-label">Combined Score</div>
        </div>
        <div class="stat-card ${getScoreClass(complianceReport.score || 0)}">
          <div class="stat-value">${(complianceReport.score || 0).toFixed(1)}</div>
          <div class="stat-label">AI Compliance</div>
        </div>
      </div>
    </div>

    ${(complianceReport.violations && complianceReport.violations.length > 0) || (analysis.criticalIssues && analysis.criticalIssues.length > 0) ? `
      <div class="report-section">
        <h3><i class="fas fa-exclamation-triangle"></i> Issues Detected</h3>
        ${complianceReport.violations ? complianceReport.violations.map(v => `
          <div class="alert alert-${(v.severity || 'medium').toLowerCase()}">
            <div class="violation-header">
              <strong>${v.ruleCode || 'Rule'}:</strong>
              <span class="badge badge-${(v.severity || 'medium').toLowerCase()}">${v.severity || 'MEDIUM'}</span>
            </div>
            <p>${v.description || v.message || 'Violation detected'}</p>
          </div>
        `).join('') : ''}
        ${analysis.criticalIssues ? analysis.criticalIssues.map(issue => `
          <div class="alert alert-warning">
            <p>${issue}</p>
          </div>
        `).join('') : ''}
      </div>
    ` : '<div class="alert alert-success"><i class="fas fa-check-circle"></i> No critical violations detected!</div>'}

    ${recommendations.immediate || recommendations.shortTerm || analysis.actionItems ? `
      <div class="report-section">
        <h3><i class="fas fa-lightbulb"></i> AI Recommendations</h3>
        ${recommendations.immediate && recommendations.immediate.length > 0 ? `
          <div class="recommendation-category">
            <h4><i class="fas fa-exclamation-circle"></i> Immediate Actions</h4>
            <ul>
              ${recommendations.immediate.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        ${recommendations.shortTerm && recommendations.shortTerm.length > 0 ? `
          <div class="recommendation-category">
            <h4><i class="fas fa-clock"></i> Short-term Actions</h4>
            <ul>
              ${recommendations.shortTerm.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        ${analysis.actionItems && analysis.actionItems.length > 0 ? `
          <div class="recommendation-category">
            <h4><i class="fas fa-tasks"></i> Action Items</h4>
            <ul>
              ${analysis.actionItems.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    ` : ''}

    ${modifications && modifications.length > 0 ? `
      <div class="report-section">
        <h3><i class="fas fa-tools"></i> Suggested Modifications</h3>
        ${modifications.map(mod => `
          <div class="modification-item">
            <div class="modification-header">
              <strong>${mod.parameter || mod.aspect}</strong>
              <span class="badge badge-info">${mod.impact || 'Improvement'}</span>
            </div>
            <p>${mod.suggestion || mod.description}</p>
            ${mod.reason ? `<p class="text-small"><em>${mod.reason}</em></p>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div class="report-section">
      <h3><i class="fas fa-info-circle"></i> Analysis Summary</h3>
      <div class="info-box">
        <p>${complianceReport.summary || riskAnalysis.summary || 'AI analysis completed successfully. Review the compliance scores and recommendations above.'}</p>
      </div>
    </div>
  `;
}

async function loadProjectsIntoDropdowns() {
  if (!state.token) return;

  try {
    const res = await fetch(`${API}/projects`, {
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();

    if (data.status === 'success' && data.data) {
      const projects = data.data;
      
      // Load into chat project selector
      const chatSelect = document.getElementById('chat-project-select');
      if (chatSelect) {
        chatSelect.innerHTML = '<option value="">-- General Chat --</option>' +
          projects.map(p => `
            <option value="${p.id}">${p.projectName}</option>
          `).join('');
      }
    }
  } catch (err) {
    console.error('Failed to load projects into dropdowns', err);
  }
}

// ============================================
// AI Chat Functions
// ============================================

let currentChatSessionId = '';
let chatSessions = [];

async function createChatSession() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  const projectId = document.getElementById('chat-project-select').value;

  if (!projectId) {
    showToast('Please select a project first', 'error');
    return;
  }

  const sessionData = { projectId };

  try {
    showToast('Creating chat session...', 'info');

    const res = await fetch(`${API}/chat/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + state.token
      },
      body: JSON.stringify(sessionData)
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data) {
      currentChatSessionId = data.data.session.id;
      showToast('Chat session created!', 'success');
      openChatInterface(data.data.session);
    } else {
      showToast(data.message || 'Failed to create chat session', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

async function loadChatSessions() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/chat/sessions`, {
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data) {
      chatSessions = data.data;
      displayChatSessions(data.data);
      showToast('Chat sessions loaded', 'success');
    }
  } catch (err) {
    showToast('Failed to load chat sessions', 'error');
    show({ error: err.message });
  }
}

function displayChatSessions(sessions) {
  const container = document.getElementById('chat-sessions-list');
  
  if (!sessions || sessions.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No chat sessions found. Start a new conversation!</p></div>';
    return;
  }

  container.innerHTML = sessions.map(session => `
    <div class="list-item">
      <div class="list-item-header">
        <h4><i class="fas fa-comments"></i> Chat Session</h4>
        <span class="badge badge-${session.status.toLowerCase()}">${session.status}</span>
      </div>
      <div class="list-item-body">
        <p><strong>Project:</strong> ${session.project ? session.project.projectName : 'General Chat'}</p>
        <p><strong>Messages:</strong> ${session.messages ? session.messages.length : 0}</p>
        <p><strong>Started:</strong> ${new Date(session.createdAt).toLocaleDateString()}</p>
      </div>
      <div class="list-item-actions">
        <button onclick="openChatSession('${session.id}')" class="btn btn-sm btn-primary">
          <i class="fas fa-comment-dots"></i> Open Chat
        </button>
      </div>
    </div>
  `).join('');
}

async function openChatSession(sessionId) {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/chat/sessions/${sessionId}`, {
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data) {
      currentChatSessionId = sessionId;
      openChatInterface(data.data);
    } else {
      showToast('Failed to load chat session', 'error');
    }
  } catch (err) {
    showToast('Failed to load chat session', 'error');
    show({ error: err.message });
  }
}

function openChatInterface(session) {
  currentChatSessionId = session.id;
  document.getElementById('chat-interface-card').style.display = 'block';
  
  const messagesContainer = document.getElementById('chat-messages');
  messagesContainer.innerHTML = '';

  if (session.messages && session.messages.length > 0) {
    session.messages.forEach(msg => {
      appendChatMessage(msg.role, msg.content);
    });
  } else {
    appendChatMessage('assistant', 'Hello! I\'m your AI assistant for building codes and compliance. How can I help you today?');
  }

  document.getElementById('chat-interface-card').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('chat-input').focus();
}

function closeChatInterface() {
  document.getElementById('chat-interface-card').style.display = 'none';
  currentChatSessionId = '';
}

async function sendChatMessage() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  if (!currentChatSessionId) {
    showToast('No active chat session', 'error');
    return;
  }

  const input = document.getElementById('chat-input');
  const message = input.value.trim();

  if (!message) {
    showToast('Please enter a message', 'warning');
    return;
  }

  // Display user message immediately
  appendChatMessage('user', message);
  input.value = '';

  // Show typing indicator
  const typingId = appendChatMessage('assistant', '<i class="fas fa-spinner fa-spin"></i> Thinking...');

  try {
    const res = await fetch(`${API}/chat/sessions/${currentChatSessionId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + state.token
      },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    show(data);

    // Remove typing indicator
    const typingElement = document.getElementById(typingId);
    if (typingElement) typingElement.remove();

    if (data.status === 'success' && data.data) {
      const aiMessage = data.data.message || data.data;
      const content = aiMessage.content || data.data.response || 'Response received';
      appendChatMessage('assistant', content);
    } else {
      appendChatMessage('assistant', 'Sorry, I encountered an error. Please try again.');
      showToast(data.message || 'Failed to send message', 'error');
    }
  } catch (err) {
    const typingElement = document.getElementById(typingId);
    if (typingElement) typingElement.remove();
    appendChatMessage('assistant', 'Network error. Please check your connection and try again.');
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

function appendChatMessage(role, content) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  const messageDiv = document.createElement('div');
  messageDiv.id = messageId;
  messageDiv.className = `chat-message chat-message-${role}`;
  
  const icon = role === 'user' ? 'fa-user' : 'fa-robot';
  const label = role === 'user' ? 'You' : 'AI Assistant';
  
  messageDiv.innerHTML = `
    <div class="chat-message-header">
      <i class="fas ${icon}"></i> ${label}
    </div>
    <div class="chat-message-content">${content}</div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  return messageId;
}

// Load AI projects and chat sessions on page load
document.addEventListener('DOMContentLoaded', () => {
  if (state.token && state.user) {
    loadAIProjects();
    loadChatSessions();
  }
});

// Test function to manually show chat interface
function testChatInterface() {
  console.log('Testing chat interface...');
  
  // Create a fake session object
  const testSession = {
    id: 'test-session-' + Date.now(),
    messages: []
  };
  
  // Try to open the interface
  openChatInterface(testSession);
  
  showToast('Chat interface test - check if input box appears below', 'info');
}

// ============================================
// Expert Authentication Functions
// ============================================

let currentStep = 1;

function selectAccountType(type, event) {
  // Update card active states
  document.querySelectorAll('.account-type-card').forEach(card => {
    card.classList.remove('active');
  });
  event.target.closest('.account-type-card').classList.add('active');
  
  // Show/hide appropriate auth cards
  if (type === 'user') {
    document.getElementById('user-auth-card').style.display = 'block';
    document.getElementById('expert-auth-card').style.display = 'none';
  } else {
    document.getElementById('user-auth-card').style.display = 'none';
    document.getElementById('expert-auth-card').style.display = 'block';
  }
}

function switchExpertTab(tab, event) {
  document.querySelectorAll('#expert-auth-card .tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  if (tab === 'expert-login') {
    document.getElementById('expert-login-form').style.display = 'block';
    document.getElementById('expert-register-form').style.display = 'none';
  } else {
    document.getElementById('expert-login-form').style.display = 'none';
    document.getElementById('expert-register-form').style.display = 'block';
  }
}

function nextStep(step) {
  // Validate current step
  if (!validateCurrentStep()) {
    return;
  }
  
  // Hide current step
  document.getElementById(`step-${currentStep}`).classList.remove('active');
  
  // Show next step
  currentStep = step;
  document.getElementById(`step-${step}`).classList.add('active');
}

function prevStep(step) {
  // Hide current step
  document.getElementById(`step-${currentStep}`).classList.remove('active');
  
  // Show previous step
  currentStep = step;
  document.getElementById(`step-${step}`).classList.add('active');
}

function validateCurrentStep() {
  if (currentStep === 1) {
    const name = document.getElementById('expert-name').value;
    const email = document.getElementById('expert-email').value;
    const password = document.getElementById('expert-password').value;
    const phone = document.getElementById('expert-phone').value;
    
    if (!name || !email || !password || !phone) {
      showToast('Please fill all required fields', 'error');
      return false;
    }
    
    if (password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return false;
    }
    
    return true;
  }
  
  if (currentStep === 2) {
    const type = document.getElementById('expert-type').value;
    const experience = document.getElementById('expert-experience').value;
    const location = document.getElementById('expert-location').value;
    const license = document.getElementById('expert-license').value;
    
    if (!type || !experience || !location || !license) {
      showToast('Please fill all professional details', 'error');
      return false;
    }
    
    return true;
  }
  
  return true;
}

async function registerExpert() {
  if (!validateCurrentStep()) {
    return;
  }
  
  // Validate specializations
  const specializations = Array.from(document.querySelectorAll('input[name="specializations"]:checked'))
    .map(cb => cb.value);
  
  if (specializations.length === 0) {
    showToast('Please select at least one specialization', 'error');
    return;
  }
  
  const expertData = {
    // Basic Info
    name: document.getElementById('expert-name').value,
    email: document.getElementById('expert-email').value,
    password: document.getElementById('expert-password').value,
    phone: document.getElementById('expert-phone').value,
    
    // Professional Details
    expertType: document.getElementById('expert-type').value,
    experience: document.getElementById('expert-experience').value,
    location: document.getElementById('expert-location').value,
    licenseNumber: document.getElementById('expert-license').value,
    
    // Specializations
    specializations: specializations,
    summary: document.getElementById('expert-summary').value || null
  };

  try {
    showToast('Registering expert account...', 'info');
    
    const res = await fetch(`${API}/auth/register-expert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expertData)
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data.accessToken) {
      state.token = data.data.accessToken;
      state.refreshToken = data.data.refreshToken;
      state.user = data.data.user;

      localStorage.setItem('token', state.token);
      localStorage.setItem('refreshToken', state.refreshToken);
      localStorage.setItem('user', JSON.stringify(state.user));

      showToast('Expert registration successful! Welcome to the platform.', 'success');
      
      // Update UI and show expert interface
      updateUIAfterLogin();
      showExpertInterface();
    } else {
      showToast(data.message || 'Expert registration failed', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

async function expertLogin() {
  const email = document.getElementById("expert-login-email").value;
  const password = document.getElementById("expert-login-password").value;

  if (!email || !password) {
    showToast('Please enter email and password', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data.accessToken) {
      state.token = data.data.accessToken;
      state.refreshToken = data.data.refreshToken;
      state.user = data.data.user;

      localStorage.setItem('token', state.token);
      localStorage.setItem('refreshToken', state.refreshToken);
      localStorage.setItem('user', JSON.stringify(state.user));

      updateUIAfterLogin();
      
      // Check if user is an expert
      if (state.user.role === 'EXPERT') {
        showExpertInterface();
      } else {
        showSection('survey');
      }
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

function showExpertInterface() {
  // Show expert dashboard navigation
  document.getElementById('expert-dashboard-nav').style.display = 'block';
  
  // Hide regular sections and show expert interface
  showSection('expert-dashboard');
  loadExpertData();
}

// ============================================
// Expert Interface Functions
// ============================================

async function loadExpertData() {
  if (!state.token || state.user.role !== 'EXPERT') {
    return;
  }
  
  try {
    // Load expert queries
    await loadExpertQueries();
    
    // Load expert profile
    await loadExpertProfile();
    
    // Update experts directory with real data
    await loadVerifiedExperts();
    
  } catch (err) {
    console.error('Failed to load expert data:', err);
  }
}

async function loadExpertQueries() {
  try {
    const res = await fetch(`${API}/experts/queries`, {
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();

    if (data.status === 'success') {
      displayExpertQueries(data.data);
    }
  } catch (err) {
    console.error('Failed to load expert queries:', err);
  }
}

function displayExpertQueries(queries) {
  // This will be implemented when we add the expert dashboard section
  console.log('Expert queries:', queries);
}

async function loadExpertProfile() {
  try {
    const res = await fetch(`${API}/experts/profile`, {
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();

    if (data.status === 'success') {
      // Update profile display
      console.log('Expert profile:', data.data);
    }
  } catch (err) {
    console.error('Failed to load expert profile:', err);
  }
}

async function loadVerifiedExperts() {
  try {
    const res = await fetch(`${API}/experts/experts`);
    const data = await res.json();

    if (data.status === 'success') {
      // Update the experts grid with real data
      updateExpertsGrid(data.data);
    }
  } catch (err) {
    console.error('Failed to load verified experts:', err);
  }
}

function updateExpertsGrid(experts) {
  filteredExperts = experts.map(expert => ({
    id: expert.id,
    name: expert.name,
    specialization: expert.specializations,
    experience: expert.experience,
    location: expert.location,
    phone: expert.phone,
    email: expert.email,
    type: expert.expertType.toLowerCase().includes('architect') ? 'architects' : 'structural',
    verified: expert.status === 'VERIFIED',
    avatar: expert.name.split(' ').map(n => n[0]).join('').toUpperCase()
  }));
  
  renderExpertsGrid();
}

async function createExpertQuery() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  // This will be implemented when we add the query posting modal
  showToast('Query posting feature coming soon!', 'info');
}

// Sample expert data
const expertsData = [
  {
    id: 1,
    name: "Er. Vikram Singh",
    specialization: ["Seismic Loading", "Foundation Design", "High-Rise Structures"],
    experience: "15+ Years",
    location: "Mumbai",
    phone: "+91 98765 43210",
    email: "vikram.singh@example.com",
    type: "structural",
    verified: true,
    avatar: "VS"
  },
  {
    id: 2,
    name: "Ar. Priya Sharma",
    specialization: ["Sustainable Design", "BIM Expert", "Green Buildings"],
    experience: "12+ Years",
    location: "Delhi",
    phone: "+91 98765 43211",
    email: "priya.sharma@example.com",
    type: "architects",
    verified: true,
    avatar: "PS"
  },
  {
    id: 3,
    name: "Er. Rajesh Kumar",
    specialization: ["Soil Analysis", "Geotechnical", "Foundation Systems"],
    experience: "18+ Years",
    location: "Bangalore",
    phone: "+91 98765 43212",
    email: "rajesh.kumar@example.com",
    type: "structural",
    verified: true,
    avatar: "RK"
  },
  {
    id: 4,
    name: "Ar. Neha Patel",
    specialization: ["Interior Design", "Space Planning", "Vastu Compliance"],
    experience: "10+ Years",
    location: "Pune",
    phone: "+91 98765 43213",
    email: "neha.patel@example.com",
    type: "architects",
    verified: true,
    avatar: "NP"
  },
  {
    id: 5,
    name: "Er. Amit Gupta",
    specialization: ["Steel Structures", "Industrial Buildings", "Load Analysis"],
    experience: "20+ Years",
    location: "Chennai",
    phone: "+91 98765 43214",
    email: "amit.gupta@example.com",
    type: "structural",
    verified: true,
    avatar: "AG"
  },
  {
    id: 6,
    name: "Ar. Kavya Reddy",
    specialization: ["Residential Design", "Heritage Conservation", "Urban Planning"],
    experience: "8+ Years",
    location: "Hyderabad",
    phone: "+91 98765 43215",
    email: "kavya.reddy@example.com",
    type: "architects",
    verified: true,
    avatar: "KR"
  }
];

let currentExpertFilter = 'all';
let filteredExperts = [...expertsData];

// Initialize Professional Network
function initializeProfessionalNetwork() {
  renderExpertsGrid();
  setupExpertFilters();
}

// Switch expert category tabs
function switchExpertTab(category, event) {
  // Update tab active state
  document.querySelectorAll('.expert-tabs .tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');
  
  currentExpertFilter = category;
  filterAndRenderExperts();
}

// Filter and render experts
function filterAndRenderExperts() {
  const searchTerm = document.getElementById('expert-search')?.value.toLowerCase() || '';
  const locationFilter = document.getElementById('location-filter')?.value || '';
  const experienceFilter = document.getElementById('experience-filter')?.value || '';
  
  filteredExperts = expertsData.filter(expert => {
    // Category filter
    if (currentExpertFilter !== 'all' && expert.type !== currentExpertFilter) {
      return false;
    }
    
    // Search filter
    if (searchTerm && !expert.name.toLowerCase().includes(searchTerm) && 
        !expert.specialization.some(spec => spec.toLowerCase().includes(searchTerm))) {
      return false;
    }
    
    // Location filter
    if (locationFilter && expert.location.toLowerCase() !== locationFilter) {
      return false;
    }
    
    // Experience filter
    if (experienceFilter) {
      const expertYears = parseInt(expert.experience);
      const [min, max] = experienceFilter.split('-').map(x => parseInt(x) || 999);
      if (expertYears < min || (max !== 999 && expertYears > max)) {
        return false;
      }
    }
    
    return true;
  });
  
  renderExpertsGrid();
}

// Setup expert filters
function setupExpertFilters() {
  const searchInput = document.getElementById('expert-search');
  const locationFilter = document.getElementById('location-filter');
  const experienceFilter = document.getElementById('experience-filter');
  
  if (searchInput) {
    searchInput.addEventListener('input', filterAndRenderExperts);
  }
  
  if (locationFilter) {
    locationFilter.addEventListener('change', filterAndRenderExperts);
  }
  
  if (experienceFilter) {
    experienceFilter.addEventListener('change', filterAndRenderExperts);
  }
}

// Render experts grid
function renderExpertsGrid() {
  const grid = document.getElementById('experts-grid');
  if (!grid) return;
  
  if (filteredExperts.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
        <i class="fas fa-user-slash" style="font-size: 3rem; color: var(--text-light); margin-bottom: 1rem;"></i>
        <p>No experts found matching your criteria</p>
        <p class="text-muted">Try adjusting your filters</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = filteredExperts.map(expert => `
    <div class="expert-card">
      <div class="expert-profile-header">
        <div class="expert-avatar">${expert.avatar}</div>
        <div class="expert-info">
          <h4>${expert.name}</h4>
          ${expert.verified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>' : ''}
        </div>
      </div>
      
      <div class="expert-specialization">
        <h5>Specialization</h5>
        <div class="specialization-tags">
          ${expert.specialization.map(spec => `<span class="specialization-tag">${spec}</span>`).join('')}
        </div>
      </div>
      
      <div class="expert-experience">
        <strong>Experience:</strong> ${expert.experience}
      </div>
      
      <div class="expert-contact">
        <div><i class="fas fa-map-marker-alt"></i> ${expert.location}</div>
        <div><i class="fas fa-phone"></i> ${expert.phone}</div>
        <div><i class="fas fa-envelope"></i> ${expert.email}</div>
      </div>
      
      <div class="expert-actions">
        <button class="whatsapp-btn" onclick="contactExpert('whatsapp', ${expert.id})">
          <i class="fab fa-whatsapp"></i> WhatsApp Chat
        </button>
        <button class="portfolio-btn" onclick="viewPortfolio(${expert.id})">
          View Portfolio
        </button>
      </div>
    </div>
  `).join('');
}

// Contact expert via WhatsApp
function contactExpert(method, expertId) {
  const expert = expertsData.find(e => e.id === expertId);
  if (!expert) return;
  
  if (method === 'whatsapp') {
    const message = encodeURIComponent(`Hello ${expert.name}, I found your profile on Smart Load Analyzer. I would like to consult with you regarding my structural analysis project.`);
    const phone = expert.phone.replace(/[^\d]/g, '');
    window.open(`https://wa.me/91${phone.slice(-10)}?text=${message}`, '_blank');
    
    showToast(`Opening WhatsApp chat with ${expert.name}`, 'success');
  }
}

// View expert portfolio
function viewPortfolio(expertId) {
  const expert = expertsData.find(e => e.id === expertId);
  if (!expert) return;
  
  showToast(`Portfolio feature coming soon for ${expert.name}`, 'info');
  // TODO: Implement portfolio modal or redirect
}

// Toggle workspace
function toggleWorkspace() {
  const content = document.getElementById('workspace-content');
  const toggle = document.querySelector('.workspace-toggle');
  
  if (content.style.display === 'none') {
    content.style.display = 'block';
    toggle.classList.add('expanded');
    toggle.innerHTML = '<i class="fas fa-chevron-up"></i> Collapse';
  } else {
    content.style.display = 'none';
    toggle.classList.remove('expanded');
    toggle.innerHTML = '<i class="fas fa-chevron-down"></i> Expand';
  }
}

// Switch workspace tabs
function switchWorkspaceTab(tabName, event) {
  // Update tab active state
  document.querySelectorAll('.workspace-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Hide all panels
  document.querySelectorAll('.workspace-panel').forEach(panel => {
    panel.style.display = 'none';
  });
  
  // Show selected panel
  const panel = document.getElementById(`${tabName}-panel`);
  if (panel) {
    panel.style.display = 'block';
  }
}

// Generate professional report
function generateProfessionalReport(type) {
  showToast(`Generating ${type} report...`, 'info');
  
  // Simulate report generation
  setTimeout(() => {
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated successfully!`, 'success');
    
    // TODO: Implement actual PDF generation
    const reportData = {
      type: type,
      projectName: state.currentProject?.name || 'Current Project',
      generatedAt: new Date().toISOString(),
      expertReviews: [
        {
          expert: 'Er. Vikram Singh',
          review: 'Foundation design needs revision for better stability',
          priority: 'High'
        }
      ]
    };
    
    console.log('Report data:', reportData);
  }, 2000);
}

// File upload handler
function handleFileUpload(files) {
  const documentsList = document.getElementById('documents-list');
  if (!documentsList) return;
  
  Array.from(files).forEach(file => {
    const fileItem = document.createElement('div');
    fileItem.className = 'document-item';
    fileItem.innerHTML = `
      <div class="document-info">
        <i class="fas fa-file-pdf"></i>
        <span>${file.name}</span>
        <span class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
      </div>
      <div class="document-actions">
        <button class="btn btn-sm btn-secondary">View</button>
        <button class="btn btn-sm btn-danger">Delete</button>
      </div>
    `;
    documentsList.appendChild(fileItem);
  });
  
  showToast(`${files.length} file(s) uploaded successfully`, 'success');
}

// Setup file upload
document.addEventListener('DOMContentLoaded', () => {
  const fileUpload = document.getElementById('file-upload');
  if (fileUpload) {
    fileUpload.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileUpload(e.target.files);
      }
    });
  }
  
  // Initialize professional network when page loads
  if (state.token && state.user) {
    initializeProfessionalNetwork();
  }
});

// Update the existing updateUIAfterLogin function to include professional network initialization
const originalUpdateUIAfterLogin = updateUIAfterLogin;
updateUIAfterLogin = function() {
  originalUpdateUIAfterLogin();
  initializeProfessionalNetwork();
};

// ============================================
// Expert Dashboard Functions
// ============================================

async function updateExpertProfile() {
  if (!state.token || state.user.role !== 'EXPERT') {
    showToast('Access denied', 'error');
    return;
  }

  const profileData = {
    phone: document.getElementById('profile-phone').value,
    location: document.getElementById('profile-location').value,
    licenseNumber: document.getElementById('profile-license').value,
    summary: document.getElementById('profile-summary').value,
  };

  try {
    const res = await fetch(`${API}/experts/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + state.token
      },
      body: JSON.stringify(profileData)
    });

    const data = await res.json();

    if (data.status === 'success') {
      showToast('Profile updated successfully!', 'success');
    } else {
      showToast(data.message || 'Failed to update profile', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
  }
}

function displayExpertQueries(queries) {
  const container = document.getElementById('expert-queries-list');
  
  if (!queries || queries.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No pending queries found</p></div>';
    return;
  }

  container.innerHTML = queries.map(query => `
    <div class="list-item">
      <div class="list-item-header">
        <h4><i class="fas fa-question-circle"></i> ${query.title}</h4>
        <span class="badge badge-${query.priority.toLowerCase()}">${query.priority}</span>
      </div>
      <div class="list-item-body">
        <p><strong>Category:</strong> ${query.category}</p>
        <p><strong>From:</strong> ${query.user.name}</p>
        <p><strong>Description:</strong> ${query.description}</p>
        <p><strong>Status:</strong> <span class="badge badge-${query.status.toLowerCase()}">${query.status}</span></p>
        <p><strong>Created:</strong> ${new Date(query.createdAt).toLocaleDateString()}</p>
      </div>
      <div class="list-item-actions">
        ${query.status === 'OPEN' ? `
          <button onclick="assignQueryToSelf('${query.id}')" class="btn btn-sm btn-primary">
            <i class="fas fa-hand-paper"></i> Take Query
          </button>
        ` : ''}
        ${query.status === 'ASSIGNED' ? `
          <button onclick="respondToQuery('${query.id}')" class="btn btn-sm btn-success">
            <i class="fas fa-reply"></i> Respond
          </button>
        ` : ''}
        <button onclick="viewQueryDetails('${query.id}')" class="btn btn-sm btn-secondary">
          <i class="fas fa-eye"></i> View Details
        </button>
      </div>
    </div>
  `).join('');
}

async function assignQueryToSelf(queryId) {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/experts/queries/${queryId}/assign`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();

    if (data.status === 'success') {
      showToast('Query assigned to you successfully!', 'success');
      loadExpertQueries(); // Refresh the list
    } else {
      showToast(data.message || 'Failed to assign query', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
  }
}

function respondToQuery(queryId) {
  const response = prompt('Enter your response to this query:');
  
  if (!response) {
    return;
  }

  submitQueryResponse(queryId, response);
}

async function submitQueryResponse(queryId, response) {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/experts/queries/${queryId}/respond`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + state.token
      },
      body: JSON.stringify({ response })
    });

    const data = await res.json();

    if (data.status === 'success') {
      showToast('Response submitted successfully!', 'success');
      loadExpertQueries(); // Refresh the list
    } else {
      showToast(data.message || 'Failed to submit response', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
  }
}

function viewQueryDetails(queryId) {
  showToast('Query details view coming soon!', 'info');
}

// Update the login function to handle expert interface
const originalLogin = login;
login = async function() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  if (!email || !password) {
    showToast('Please enter email and password', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data.accessToken) {
      state.token = data.data.accessToken;
      state.refreshToken = data.data.refreshToken;
      state.user = data.data.user;

      localStorage.setItem('token', state.token);
      localStorage.setItem('refreshToken', state.refreshToken);
      localStorage.setItem('user', JSON.stringify(state.user));

      updateUIAfterLogin();
      
      // Check user role and show appropriate interface
      if (state.user.role === 'EXPERT') {
        showExpertInterface();
      } else {
        showSection('survey');
      }
    } else {
      showToast(data.message || 'Login failed', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
};

// Initialize expert interface on page load if user is expert
document.addEventListener('DOMContentLoaded', () => {
  if (state.token && state.user && state.user.role === 'EXPERT') {
    showExpertInterface();
  }
});


// ============================================
// Expert Query Posting (User Side)
// ============================================

async function postQuery() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  const title = document.getElementById('query-title').value;
  const description = document.getElementById('query-description').value;
  const category = document.getElementById('query-category').value;

  if (!title || !description) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  const queryData = {
    title,
    description,
    category,
    priority: 'MEDIUM'
  };

  try {
    showToast('Posting query...', 'info');

    const res = await fetch(`${API}/experts/queries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + state.token
      },
      body: JSON.stringify(queryData)
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success') {
      showToast('Query posted successfully! Experts will respond soon.', 'success');
      
      // Clear form
      document.getElementById('query-title').value = '';
      document.getElementById('query-description').value = '';
      document.getElementById('query-category').value = 'foundation';
    } else {
      showToast(data.message || 'Failed to post query', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

// ============================================
// Helper Functions
// ============================================

function getScoreClass(score) {
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-good';
  if (score >= 40) return 'score-moderate';
  return 'score-poor';
}
