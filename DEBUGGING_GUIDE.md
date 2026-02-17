# 🐛 Debugging & Testing Guide

## Complete System Verification

This guide will help you debug and verify that everything works correctly.

## ✅ Pre-Flight Checklist

### 1. Environment Setup

```bash
# Check Node.js version (should be 18+)
node --version

# Check PostgreSQL (should be 14+)
psql --version

# Check if database exists
psql -l | grep smart_load_analyzer
```

### 2. Dependencies Installed

```bash
# Backend dependencies
npm list --depth=0

# Should show all packages without errors
```

### 3. Environment Variables

Check `.env` file exists and contains:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/smart_load_analyzer"
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Should complete without errors
```

## 🔍 Backend Debugging

### Step 1: Start Backend

```bash
npm run dev
```

**Expected Output:**
```
Server running on port 5000
Environment: development
Database connected successfully
Health check: http://localhost:5000/api/v1/health
```

**If you see errors:**

#### Error: "Port 5000 already in use"
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or change port in .env
PORT=5001
```

#### Error: "Database connection failed"
```bash
# Check PostgreSQL is running
sc query postgresql-x64-14

# Start if needed
net start postgresql-x64-14

# Verify connection string in .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/smart_load_analyzer"
```

#### Error: "Prisma Client not generated"
```bash
npm run prisma:generate
```

### Step 2: Test Backend Health

```bash
# Test health endpoint
curl http://localhost:5000/api/v1/health
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Smart Load Distribution Analyzer API is running",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### Step 3: Test Authentication

```bash
# Register a user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123456\",\"name\":\"Test User\"}"
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "user": { ... },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Common Issues:**

- **409 Conflict**: User already exists - use different email
- **400 Bad Request**: Check JSON format and required fields
- **500 Server Error**: Check backend logs in console

### Step 4: Verify All Routes

```bash
# Check routes are loaded
# Look for these in backend console:
# ✓ /api/v1/auth
# ✓ /api/v1/land-surveys
# ✓ /api/v1/building-inputs
# ✓ /api/v1/wind
# ✓ /api/v1/analysis
```

## 🎨 Frontend Debugging

### Step 1: Start Frontend

```bash
cd frontend
python -m http.server 8080
```

**Expected Output:**
```
Serving HTTP on :: port 8080 (http://[::]:8080/) ...
```

**Alternative methods:**
```bash
# Node.js
npx http-server -p 8080

# PHP
php -S localhost:8080
```

### Step 2: Open Browser

Navigate to: `http://localhost:8080`

**Open Browser Console (F12)**

Check for errors in Console tab.

**Expected:** No errors, clean console

**Common Issues:**

#### CORS Error
```
Access to fetch at 'http://localhost:5000/api/v1/...' from origin 'http://localhost:8080' 
has been blocked by CORS policy
```

**Fix:** Add to backend `.env`:
```env
CORS_ORIGIN=http://localhost:8080
```

Restart backend.

#### 404 Not Found on API calls
```
GET http://localhost:5000/api/v1/... 404 (Not Found)
```

**Fix:** Verify backend is running and API URL in `frontend/script.js`:
```javascript
const API = "http://localhost:5000/api/v1";
```

#### Script not loading
```
Failed to load resource: net::ERR_FILE_NOT_FOUND script.js
```

**Fix:** Verify file exists at `frontend/script.js`

### Step 3: Test UI Components

#### Test 1: Navigation
- Click each sidebar item
- Verify section changes
- Check active state highlights

#### Test 2: Forms
- Check all input fields are visible
- Verify dropdowns populate
- Test default values

#### Test 3: Buttons
- Hover over buttons (should change color)
- Click buttons (should trigger functions)
- Check console for function calls

## 🧪 Complete Workflow Test

### Test Scenario: Create Complete Analysis

#### Step 1: Register & Login ✅

1. Open `http://localhost:8080`
2. Click "Register" tab
3. Fill in:
   - Name: `Test Engineer`
   - Email: `engineer@test.com`
   - Password: `Test123456`
   - Role: `Engineer`
4. Click "Register"
5. **Verify:** Toast notification "Registration successful"
6. Switch to "Login" tab
7. Enter same email/password
8. Click "Login"
9. **Verify:** 
   - Toast "Welcome back, Test Engineer!"
   - User name appears in header
   - Redirects to Survey section

**Debug if fails:**
- Check browser console for errors
- Check backend console for request logs
- Verify token is stored: `localStorage.getItem('token')`

#### Step 2: Create Land Survey ✅

1. Navigate to "Land Survey" section
2. Use default values or customize
3. Click "Create Land Survey"
4. **Verify:**
   - Toast "Land survey created successfully!"
   - Console shows API response
   - Survey ID is stored
5. Click "Load Surveys"
6. **Verify:** Survey appears in list

**Debug if fails:**
- Check if token exists: `console.log(state.token)`
- Verify API endpoint: `/api/v1/land-surveys`
- Check backend logs for errors
- Verify database has record: `SELECT * FROM land_surveys;`

#### Step 3: Create Building Input ✅

1. Navigate to "Building Input" section
2. Select survey from dropdown
3. Fill in building details
4. Click "Create Building Input"
5. **Verify:**
   - Toast "Building input created successfully!"
   - Redirects to Wind Data section
   - Building ID is stored

**Debug if fails:**
- Verify survey is selected
- Check all required fields are filled
- Verify API endpoint: `/api/v1/building-inputs`
- Check backend validation errors

#### Step 4: Add Wind Data ✅

1. Should be on "Wind Data" section
2. Enter wind parameters
3. Click "Add Wind Data"
4. **Verify:**
   - Toast "Wind data added successfully!"
   - Redirects to Analysis section

**Debug if fails:**
- Verify building ID exists: `console.log(state.buildingId)`
- Check wind speed values are valid
- Verify API endpoint: `/api/v1/wind`

#### Step 5: Run Disaster Analysis ✅

1. Should be on "Analysis" section
2. Click "Run Analysis" on Disaster Analysis card
3. **Verify:**
   - Toast "Running disaster analysis..."
   - Wait for completion
   - Toast "Disaster analysis completed!"
   - Console shows detailed results

**Debug if fails:**
- Verify building ID exists
- Check backend logs for calculation errors
- Verify all required data is present
- Check API endpoint: `/api/v1/analysis/disaster/:buildingInputId`

#### Step 6: Run Vastu Analysis ✅

1. Click "Run Analysis" on Vastu Analysis card
2. **Verify:**
   - Toast "Running Vastu analysis..."
   - Toast "Vastu analysis completed!"
   - Console shows Vastu report

**Debug if fails:**
- Same checks as disaster analysis
- Verify API endpoint: `/api/v1/analysis/vastu/:buildingInputId`

#### Step 7: Generate Final Report ✅

1. Click "Generate Report" on Final Report card
2. **Verify:**
   - Toast "Generating final report..."
   - Toast "Final report generated!"
   - Automatically redirects to Reports section
   - Report displays with all sections

**Debug if fails:**
- Verify both analyses completed first
- Check API endpoint: `/api/v1/analysis/report/:buildingInputId`
- Verify report display function is called

#### Step 8: View Reports ✅

1. Should be on "Reports" section
2. **Verify report displays:**
   - Composite scores (4 metrics)
   - Survey summary
   - Risk analysis
   - Structural recommendations
   - Vastu compliance
   - Final recommendations

**Debug if fails:**
- Check `displayFinalReport()` function
- Verify report data structure
- Check CSS for report styles
- Inspect element for HTML structure

## 🔧 Common Issues & Fixes

### Issue 1: "Please login first" on every action

**Cause:** Token not stored or expired

**Fix:**
```javascript
// Check in browser console
console.log(localStorage.getItem('token'));

// If null, login again
// If exists but still fails, token might be invalid
localStorage.clear();
// Login again
```

### Issue 2: "Please create a building input first"

**Cause:** Building ID not stored

**Fix:**
```javascript
// Check building ID
console.log(state.buildingId);

// If empty, create building input again
// Verify it's stored after creation
```

### Issue 3: Reports not displaying

**Cause:** Report data not loaded or display function error

**Fix:**
```javascript
// Check if report data exists
console.log(state.currentReport);

// Check for JavaScript errors in console
// Verify display functions are defined
```

### Issue 4: Dropdown not populating

**Cause:** Surveys not loaded

**Fix:**
```javascript
// Manually load surveys
loadSurveysIntoDropdown();

// Check if surveys exist
console.log(state.surveys);
```

### Issue 5: Toast notifications not showing

**Cause:** Toast container missing or CSS issue

**Fix:**
- Verify `<div id="toast-container"></div>` exists in HTML
- Check CSS for `.toast` styles
- Test manually: `showToast('Test', 'success')`

## 📊 Verification Commands

### Backend Verification

```bash
# Check if server is running
curl http://localhost:5000/api/v1/health

# Check database connection
npm run prisma:studio
# Opens at http://localhost:5555

# View logs
type logs\combined.log
type logs\error.log
```

### Frontend Verification

```javascript
// In browser console

// Check state
console.log(state);

// Check token
console.log(localStorage.getItem('token'));

// Check API URL
console.log(API);

// Test API call manually
fetch(`${API}/health`).then(r => r.json()).then(console.log);
```

### Database Verification

```sql
-- Connect to database
psql -U postgres -d smart_load_analyzer

-- Check tables
\dt

-- Check users
SELECT id, email, name, role FROM users;

-- Check surveys
SELECT id, latitude, longitude, soil_type FROM land_surveys;

-- Check buildings
SELECT id, building_type, total_floors FROM building_inputs;

-- Exit
\q
```

## ✅ Success Indicators

### Backend Success
- ✅ Server starts without errors
- ✅ Health endpoint returns 200
- ✅ Database connection successful
- ✅ All routes loaded
- ✅ Logs show incoming requests

### Frontend Success
- ✅ Page loads without errors
- ✅ No console errors
- ✅ Navigation works
- ✅ Forms are visible
- ✅ Buttons are clickable
- ✅ API calls succeed

### Integration Success
- ✅ Can register user
- ✅ Can login
- ✅ Token is stored
- ✅ Can create survey
- ✅ Can create building
- ✅ Can add wind data
- ✅ Can run analyses
- ✅ Can generate report
- ✅ Reports display correctly

## 🎯 Performance Checks

### Backend Performance
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/v1/health

# Monitor memory
# Task Manager > Details > node.exe
```

### Frontend Performance
- Open DevTools > Network tab
- Reload page
- Check load times
- Verify all resources load

## 🔒 Security Checks

### Backend Security
- ✅ JWT tokens are used
- ✅ Passwords are hashed
- ✅ Rate limiting is active
- ✅ CORS is configured
- ✅ Helmet headers are set

### Frontend Security
- ✅ Tokens stored in localStorage
- ✅ No sensitive data in console
- ✅ HTTPS ready (for production)

## 📝 Testing Checklist

Print this and check off as you test:

- [ ] Backend starts successfully
- [ ] Frontend serves correctly
- [ ] Health endpoint works
- [ ] Can register user
- [ ] Can login user
- [ ] Token is stored
- [ ] Can create land survey
- [ ] Can list surveys
- [ ] Can create building input
- [ ] Can add wind data
- [ ] Can run disaster analysis
- [ ] Can run Vastu analysis
- [ ] Can generate final report
- [ ] Can view disaster report
- [ ] Can view Vastu report
- [ ] Can view final report
- [ ] Navigation works
- [ ] Forms validate
- [ ] Toasts appear
- [ ] Console shows responses
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Can logout
- [ ] Session persists on refresh

## 🆘 Getting Help

If you're still stuck:

1. **Check logs:**
   - Backend: `logs/error.log`
   - Browser: Console (F12)

2. **Verify setup:**
   - Database running?
   - Correct ports?
   - Environment variables set?

3. **Test incrementally:**
   - Test backend alone first
   - Then test frontend alone
   - Then test integration

4. **Common fixes:**
   - Restart backend
   - Clear browser cache
   - Clear localStorage
   - Regenerate Prisma client
   - Check firewall/antivirus

---

**Everything should work perfectly if you follow this guide! 🎉**
