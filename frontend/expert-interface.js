// ============================================
// Expert Interface Functions
// ============================================

// Account Type Selection
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

// Expert Tab Switching
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

// Registration Steps
function nextStep(step) {
  // Hide all steps
  document.querySelectorAll('.registration-step').forEach(s => s.classList.remove('active'));
  
  // Show target step
  document.getElementById(`step-${step}`).classList.add('active');
}

function prevStep(step) {
  nextStep(step);
}

// Expert Login
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
        showExpertDashboard();
        showToast(`Welcome back, ${state.user.name}!`, 'success');
        
        // Update sidebar navigation to expert mode
        if (typeof updateSidebarNavigation === 'function') {
          updateSidebarNavigation();
        }
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

// Expert Registration
async function registerExpert() {
  // Collect basic info
  const name = document.getElementById("expert-name").value;
  const email = document.getElementById("expert-email").value;
  const password = document.getElementById("expert-password").value;
  const phone = document.getElementById("expert-phone").value;

  // Collect professional details
  const expertType = document.getElementById("expert-type").value;
  const experience = document.getElementById("expert-experience").value;
  const location = document.getElementById("expert-location").value;
  const licenseNumber = document.getElementById("expert-license").value;

  // Collect specializations
  const specializationCheckboxes = document.querySelectorAll('input[name="specializations"]:checked');
  const specializations = Array.from(specializationCheckboxes).map(cb => cb.value);

  const summary = document.getElementById("expert-summary").value;

  // Validation
  if (!name || !email || !password || !phone) {
    showToast('Please fill all basic information fields', 'error');
    nextStep(1);
    return;
  }

  if (!expertType || !experience || !location || !licenseNumber) {
    showToast('Please fill all professional details', 'error');
    nextStep(2);
    return;
  }

  if (specializations.length === 0) {
    showToast('Please select at least one specialization', 'error');
    return;
  }

  const expertData = {
    name,
    email,
    password,
    phone,
    expertType,
    experience,
    location,
    licenseNumber,
    specializations,
    summary
  };

  try {
    showToast('Creating expert account...', 'info');

    const res = await fetch(`${API}/auth/register-expert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expertData)
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success') {
      showToast('Expert registration successful! Logging you in...', 'success');
      
      // Auto-login
      state.token = data.data.accessToken;
      state.refreshToken = data.data.refreshToken;
      state.user = data.data.user;

      localStorage.setItem('token', state.token);
      localStorage.setItem('refreshToken', state.refreshToken);
      localStorage.setItem('user', JSON.stringify(state.user));

      updateUIAfterLogin();
      showExpertDashboard();
      
      // Update sidebar navigation to expert mode
      if (typeof updateSidebarNavigation === 'function') {
        updateSidebarNavigation();
      }
    } else {
      showToast(data.message || 'Registration failed', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

// Show Expert Dashboard
function showExpertDashboard() {
  // Show expert dashboard nav item
  document.getElementById('expert-dashboard-nav').style.display = 'block';
  
  // Navigate to expert dashboard
  showSection('expert-dashboard');
  
  // Load expert dashboard data
  loadExpertDashboard();
}

// Load Expert Dashboard
async function loadExpertDashboard() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/experts/dashboard/stats`, {
      headers: { "Authorization": "Bearer " + state.token }
    });

    const data = await res.json();
    show(data);

    if (data.status === 'success' && data.data) {
      displayExpertDashboard(data.data);
      showToast('Dashboard loaded successfully', 'success');
    } else {
      showToast(data.message || 'Failed to load dashboard', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

// Display Expert Dashboard
function displayExpertDashboard(dashboard) {
  const stats = dashboard.stats;
  
  // Update stats
  const statsGrid = document.querySelector('#expert-dashboard-section .stats-grid');
  if (statsGrid) {
    statsGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${stats.totalPendingQueries}</div>
        <div class="stat-label">Pending Queries</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.totalSolvedQueries}</div>
        <div class="stat-label">Resolved Queries</div>
      </div>
      <div class="stat-card highlight">
        <div class="stat-value">${stats.averageRating.toFixed(1)}</div>
        <div class="stat-label">Average Rating</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats.profileViews}</div>
        <div class="stat-label">Profile Views</div>
      </div>
    `;
  }

  // Display recent queries
  displayExpertQueries(dashboard.recentQueries);
  
  // Load expert profile data
  if (dashboard.expertProfile) {
    loadExpertProfileData(dashboard.expertProfile);
  }
}

// Display Expert Queries
function displayExpertQueries(queries) {
  const container = document.getElementById('expert-queries-list');
  
  if (!queries || queries.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No queries found</p></div>';
    return;
  }

  container.innerHTML = queries.map(query => `
    <div class="list-item">
      <div class="list-item-header">
        <h4><i class="fas fa-question-circle"></i> ${query.title}</h4>
        <span class="badge badge-${query.priority.toLowerCase()}">${query.priority}</span>
      </div>
      <div class="list-item-body">
        <p><strong>From:</strong> ${query.user.name}</p>
        <p><strong>Category:</strong> ${query.category}</p>
        <p><strong>Status:</strong> <span class="badge badge-${query.status.toLowerCase()}">${query.status}</span></p>
        <p><strong>Posted:</strong> ${new Date(query.createdAt).toLocaleDateString()}</p>
        <p>${query.description.substring(0, 150)}${query.description.length > 150 ? '...' : ''}</p>
      </div>
      <div class="list-item-actions">
        ${query.status === 'OPEN' ? `
          <button onclick="assignQueryToSelf('${query.id}')" class="btn btn-sm btn-primary">
            <i class="fas fa-hand-paper"></i> Accept Query
          </button>
        ` : ''}
        ${query.status === 'ASSIGNED' || query.status === 'IN_PROGRESS' ? `
          <button onclick="showRespondModal('${query.id}')" class="btn btn-sm btn-success">
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

// Assign Query to Self
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
    show(data);

    if (data.status === 'success') {
      showToast('Query assigned successfully!', 'success');
      loadExpertDashboard();
    } else {
      showToast(data.message || 'Failed to assign query', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

// Show Respond Modal
function showRespondModal(queryId) {
  const response = prompt('Enter your response to this query:');
  
  if (response && response.trim()) {
    respondToQuery(queryId, response.trim());
  }
}

// Respond to Query
async function respondToQuery(queryId, response) {
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
    show(data);

    if (data.status === 'success') {
      showToast('Response submitted successfully!', 'success');
      loadExpertDashboard();
    } else {
      showToast(data.message || 'Failed to submit response', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

// View Query Details
function viewQueryDetails(queryId) {
  showToast('Query details view - Coming soon!', 'info');
}

// Load Expert Profile Data
function loadExpertProfileData(profile) {
  // Populate profile form fields if they exist
  const nameField = document.getElementById('profile-name');
  const phoneField = document.getElementById('profile-phone');
  const locationField = document.getElementById('profile-location');
  const licenseField = document.getElementById('profile-license');
  const summaryField = document.getElementById('profile-summary');

  if (nameField && state.user) nameField.value = state.user.name;
  if (phoneField && profile.phone) phoneField.value = profile.phone;
  if (locationField && profile.location) locationField.value = profile.location;
  if (licenseField && profile.licenseNumber) licenseField.value = profile.licenseNumber;
  if (summaryField && profile.summary) summaryField.value = profile.summary;
}

// Update Expert Profile
async function updateExpertProfile() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  const profileData = {
    phone: document.getElementById('profile-phone').value,
    location: document.getElementById('profile-location').value,
    summary: document.getElementById('profile-summary').value
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
    show(data);

    if (data.status === 'success') {
      showToast('Profile updated successfully!', 'success');
    } else {
      showToast(data.message || 'Failed to update profile', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

// Load Verified Experts
async function loadVerifiedExperts() {
  try {
    const res = await fetch(`${API}/experts`);
    const data = await res.json();

    if (data.status === 'success' && data.data) {
      displayVerifiedExperts(data.data);
    }
  } catch (err) {
    console.error('Failed to load experts', err);
  }
}

// Post a Query to Experts
async function postQuery() {
  if (!state.token) {
    showToast('Please login first', 'error');
    return;
  }

  if (!state.buildingId) {
    showToast('Please create a building input first', 'warning');
    return;
  }

  const title = document.getElementById('query-title').value;
  const description = document.getElementById('query-description').value;
  const category = document.getElementById('query-category').value;

  if (!title || !description) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  try {
    const res = await fetch(`${API}/queries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.token
      },
      body: JSON.stringify({
        buildingInputId: state.buildingId,
        queryType: category.toUpperCase(),
        title: title,
        description: description
      })
    });

    const data = await res.json();

    if (data.status === 'success') {
      showToast('Query posted successfully! Experts will respond soon.', 'success');
      document.getElementById('query-title').value = '';
      document.getElementById('query-description').value = '';
      loadMyQueries();
    } else {
      showToast(data.message || 'Failed to post query', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
  }
}

// Load My Queries
async function loadMyQueries() {
  if (!state.token) return;

  try {
    const res = await fetch(`${API}/queries/my-queries`, {
      headers: { 'Authorization': 'Bearer ' + state.token }
    });

    const data = await res.json();

    if (data.status === 'success' && data.data) {
      displayMyQueries(data.data);
    }
  } catch (err) {
    console.error('Failed to load queries', err);
  }
}

// Display My Queries
function displayMyQueries(queries) {
  const container = document.getElementById('my-queries-list');
  
  if (!container) return;

  if (!queries || queries.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No queries yet. Post your first query above!</p></div>';
    return;
  }

  container.innerHTML = queries.map(query => `
    <div class="list-item">
      <div class="list-item-header">
        <h4><i class="fas fa-question-circle"></i> ${query.title}</h4>
        <span class="badge badge-${query.status.toLowerCase()}">${query.status}</span>
      </div>
      <div class="list-item-body">
        <p>${query.description}</p>
        <p><strong>Category:</strong> ${query.queryType}</p>
        ${query.response ? `
          <div class="query-response">
            <h5><i class="fas fa-reply"></i> Expert Response:</h5>
            <p>${query.response}</p>
          </div>
        ` : '<p class="text-muted">Waiting for expert response...</p>'}
      </div>
      <div class="list-item-actions">
        <small><i class="fas fa-clock"></i> ${new Date(query.createdAt).toLocaleDateString()}</small>
      </div>
    </div>
  `).join('');
}

// Display Verified Experts
function displayVerifiedExperts(experts) {
  const container = document.getElementById('experts-grid');
  
  if (!container) return;

  if (!experts || experts.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No verified experts found</p></div>';
    return;
  }

  container.innerHTML = experts.map(expert => `
    <div class="expert-card">
      <div class="expert-avatar">
        <i class="fas fa-user-tie"></i>
      </div>
      <div class="expert-info">
        <h4>${expert.name}</h4>
        <p class="expert-type">${expert.expertType.replace(/_/g, ' ')}</p>
        <p class="expert-location"><i class="fas fa-map-marker-alt"></i> ${expert.location}</p>
        <p class="expert-experience"><i class="fas fa-calendar"></i> ${expert.experience} years</p>
        <div class="expert-specializations">
          ${expert.specializations.slice(0, 3).map(spec => 
            `<span class="spec-badge">${spec}</span>`
          ).join('')}
          ${expert.specializations.length > 3 ? `<span class="spec-badge">+${expert.specializations.length - 3}</span>` : ''}
        </div>
      </div>
      <div class="expert-actions">
        <button onclick="viewExpertProfile('${expert.id}')" class="btn btn-sm btn-secondary">
          <i class="fas fa-eye"></i> View Profile
        </button>
        <button onclick="contactExpert('${expert.id}')" class="btn btn-sm btn-primary">
          <i class="fas fa-envelope"></i> Contact
        </button>
      </div>
    </div>
  `).join('');
}

// View Expert Profile
async function viewExpertProfile(expertId) {
  try {
    const res = await fetch(`${API}/experts/${expertId}`);
    const data = await res.json();

    if (data.status === 'success' && data.data) {
      showExpertProfileModal(data.data);
    }
  } catch (err) {
    showToast('Failed to load expert profile', 'error');
  }
}

// Show Expert Profile Modal
function showExpertProfileModal(expert) {
  // Create a simple modal display
  const modalContent = `
    <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 600px; margin: 2rem auto;">
      <h2>${expert.name}</h2>
      <p><strong>Type:</strong> ${expert.expertType.replace(/_/g, ' ')}</p>
      <p><strong>Experience:</strong> ${expert.experience} years</p>
      <p><strong>Location:</strong> ${expert.location}</p>
      <p><strong>Specializations:</strong></p>
      <ul>
        ${expert.specializations.map(spec => `<li>${spec}</li>`).join('')}
      </ul>
      ${expert.summary ? `<p><strong>About:</strong> ${expert.summary}</p>` : ''}
      <button onclick="closeModal()" class="btn btn-secondary">Close</button>
    </div>
  `;
  
  showToast('Expert profile loaded', 'info');
  show(expert);
}

// Contact Expert
function contactExpert(expertId) {
  // This would open a query creation form pre-filled with the expert
  showToast('Opening contact form...', 'info');
  createExpertQuery(expertId);
}

// Create Expert Query
function createExpertQuery(expertId = null) {
  const title = prompt('Query Title:');
  if (!title) return;

  const description = prompt('Query Description:');
  if (!description) return;

  const category = prompt('Category (e.g., foundation, seismic, vastu):');
  if (!category) return;

  submitExpertQuery(title, description, category, expertId);
}

// Submit Expert Query
async function submitExpertQuery(title, description, category, expertId = null) {
  if (!state.token) {
    showToast('Please login to post a query', 'error');
    return;
  }

  const queryData = {
    title,
    description,
    category,
    priority: 'MEDIUM'
  };

  if (expertId) {
    queryData.expertId = expertId;
  }

  try {
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
      showToast('Query posted successfully!', 'success');
    } else {
      showToast(data.message || 'Failed to post query', 'error');
    }
  } catch (err) {
    showToast('Network error: ' + err.message, 'error');
    show({ error: err.message });
  }
}

// Initialize expert features on page load
document.addEventListener('DOMContentLoaded', () => {
  // Load verified experts if on the expert queries section
  loadVerifiedExperts();
  
  // Check if user is an expert and show dashboard nav
  if (state.user && state.user.role === 'EXPERT') {
    document.getElementById('expert-dashboard-nav').style.display = 'block';
  }
});
