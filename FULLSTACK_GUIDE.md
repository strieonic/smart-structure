# Full Stack Setup Guide

## Complete Smart Load Distribution Analyzer Setup

This guide will help you run both the backend and frontend together.

## 🚀 Quick Start (5 Minutes)

### Step 1: Start Backend

```bash
# Terminal 1 - Backend
cd smart-load-distribution-analyzer

# Install dependencies (first time only)
npm install

# Setup database (first time only)
createdb smart_load_analyzer
cp .env.example .env
# Edit .env with your database credentials
npm run prisma:generate
npm run prisma:migrate

# Start backend server
npm run dev
```

Backend will run on: `http://localhost:5000`

### Step 2: Start Frontend

```bash
# Terminal 2 - Frontend
cd smart-load-distribution-analyzer/frontend

# Option 1: Python HTTP Server
python -m http.server 8080

# Option 2: Node.js HTTP Server
npx http-server -p 8080

# Option 3: PHP Server
php -S localhost:8080
```

Frontend will run on: `http://localhost:8080`

### Step 3: Open Browser

Navigate to: `http://localhost:8080`

## 📋 Complete Workflow Test

### 1. Register & Login

```
1. Open http://localhost:8080
2. Click "Register" tab
3. Fill in:
   - Name: Test Engineer
   - Email: test@example.com
   - Password: Test123456
   - Role: Engineer
4. Click "Register"
5. Switch to "Login" tab
6. Login with same credentials
```

### 2. Create Land Survey

```
1. Navigate to "Land Survey" section
2. Use default values or customize:
   - Latitude: 19.0760 (Mumbai)
   - Longitude: 72.8777
   - Plot Area: 1000 sq.m
   - Soil Type: Black Cotton
   - Seismic Zone: Zone III
   - Flood Risk: High
3. Click "Create Land Survey"
4. Check console for response
```

### 3. Create Building Input

```
1. Navigate to "Building Input" section
2. Select the survey you just created
3. Use default values or customize:
   - Building Type: Residential
   - Total Floors: 15
   - Floor Height: 3.0m
   - Total Height: 45.0m
   - Built-up Area: 12000 sq.m
   - Orientation: North-East
   - Structural System: RCC
4. Click "Create Building Input"
```

### 4. Add Wind Data

```
1. Navigate to "Wind Data" section
2. Enter wind parameters:
   - Wind Direction: 270° (West)
   - Average Wind Speed: 35 m/s
   - Peak Gust Speed: 55 m/s
   - Terrain Roughness: Category 2
3. Click "Add Wind Data"
```

### 5. Run Analyses

```
1. Navigate to "Analysis" section
2. Click "Run Analysis" on Disaster Analysis
   - Wait for completion
   - Check console for results
3. Click "Run Analysis" on Vastu Analysis
   - Wait for completion
4. Click "Generate Report" on Final Report
   - This combines all analyses
```

### 6. View Reports

```
1. Navigate to "Reports" section
2. Or click "View Report" buttons in Analysis section
3. Explore:
   - Load calculations
   - Earthquake safety scores
   - Flood recommendations
   - Wind analysis
   - Vastu compliance
   - Final recommendations
```

## 🔍 Verification Checklist

### Backend Health Check

```bash
curl http://localhost:5000/api/v1/health
```

Expected response:
```json
{
  "status": "success",
  "message": "Smart Load Distribution Analyzer API is running",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### Frontend Check

Open browser console (F12) and check:
- No CORS errors
- API calls successful
- Token stored in localStorage

### Database Check

```bash
# Check if database exists
psql -l | grep smart_load_analyzer

# Check tables
psql smart_load_analyzer -c "\dt"
```

## 🐛 Troubleshooting

### Backend Issues

**Port 5000 already in use:**
```bash
# Change PORT in .env
PORT=5001

# Update frontend/script.js
const API = "http://localhost:5001/api/v1";
```

**Database connection failed:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start if needed
sudo systemctl start postgresql

# Verify DATABASE_URL in .env
```

**Prisma errors:**
```bash
# Regenerate Prisma client
npm run prisma:generate

# Reset database (WARNING: deletes data)
npm run prisma:migrate reset
```

### Frontend Issues

**CORS errors:**
```bash
# Check backend .env has:
CORS_ORIGIN=http://localhost:8080

# Or allow all origins (development only):
CORS_ORIGIN=*
```

**API not responding:**
```bash
# Verify backend is running
curl http://localhost:5000/api/v1/health

# Check API URL in frontend/script.js
const API = "http://localhost:5000/api/v1";
```

**Login not working:**
```bash
# Clear browser localStorage
localStorage.clear()

# Check browser console for errors
# Verify credentials in database
```

## 📊 Sample Data

### Sample Land Survey (Mumbai, High-Rise)

```json
{
  "latitude": 19.0760,
  "longitude": 72.8777,
  "plotArea": 1000,
  "soilType": "BLACK_COTTON",
  "slope": 3.5,
  "elevation": 14,
  "waterTableDepth": 6.5,
  "seismicZone": "ZONE_III",
  "floodRisk": "HIGH",
  "nearbyWaterBodies": true,
  "waterBodyDistance": 200,
  "averageRainfall": 2400
}
```

### Sample Building Input (15-Story Residential)

```json
{
  "buildingType": "RESIDENTIAL",
  "totalFloors": 15,
  "floorHeight": 3.0,
  "totalHeight": 45.0,
  "builtUpArea": 12000,
  "orientation": "NORTH_EAST",
  "structuralSystem": "RCC",
  "basementFloors": 2,
  "parkingFloors": 2,
  "expectedOccupancy": 150
}
```

### Sample Wind Data (Coastal Area)

```json
{
  "windDirection": 270,
  "averageWindSpeed": 35,
  "peakGustSpeed": 55,
  "terrainRoughness": "CATEGORY_2"
}
```

## 🎯 Testing Different Scenarios

### Scenario 1: Low-Rise in Low Seismic Zone

```
Land Survey:
- Seismic Zone: ZONE_II
- Flood Risk: LOW
- Soil Type: ROCKY

Building:
- Total Floors: 5
- Total Height: 15m
- Structural System: LOAD_BEARING
```

### Scenario 2: High-Rise in High Seismic Zone

```
Land Survey:
- Seismic Zone: ZONE_V
- Flood Risk: MEDIUM
- Soil Type: ALLUVIAL

Building:
- Total Floors: 25
- Total Height: 75m
- Structural System: RCC
```

### Scenario 3: Coastal Building with High Wind

```
Land Survey:
- Nearby Water Bodies: Yes
- Water Body Distance: 100m
- Flood Risk: VERY_HIGH

Wind Data:
- Average Wind Speed: 45 m/s
- Peak Gust Speed: 70 m/s
```

## 📈 Performance Tips

### Backend Optimization

```bash
# Use production build
npm run build
NODE_ENV=production npm start

# Enable database connection pooling (already configured)
# Monitor with PM2
pm2 start dist/server.js --name smart-load-analyzer
pm2 monit
```

### Frontend Optimization

```bash
# Minify JavaScript (optional)
npx terser script.js -o script.min.js

# Minify CSS (optional)
npx csso style.css -o style.min.css

# Use CDN for Font Awesome (already configured)
```

## 🔒 Security Checklist

- [ ] Change JWT_SECRET in .env
- [ ] Change JWT_REFRESH_SECRET in .env
- [ ] Use strong database password
- [ ] Enable HTTPS in production
- [ ] Configure proper CORS_ORIGIN
- [ ] Set up rate limiting (already configured)
- [ ] Regular security updates

## 📦 Production Deployment

### Backend Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

Quick steps:
1. Set NODE_ENV=production
2. Use strong secrets
3. Configure PostgreSQL
4. Set up Nginx reverse proxy
5. Enable SSL with Let's Encrypt
6. Use PM2 for process management

### Frontend Deployment

Options:
1. **Static Hosting**: Netlify, Vercel, GitHub Pages
2. **CDN**: CloudFlare, AWS CloudFront
3. **Same Server**: Serve from backend with express.static

Example (serve from backend):
```javascript
// In src/app.ts
app.use(express.static('frontend'));
```

## 🎓 Learning Resources

### Backend (Node.js + TypeScript)
- [Express.js Documentation](https://expressjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

### Frontend (Vanilla JS)
- [MDN Web Docs](https://developer.mozilla.org)
- [JavaScript.info](https://javascript.info)
- [CSS Tricks](https://css-tricks.com)

### Civil Engineering Standards
- IS 875 (Design Loads)
- IS 1893 (Earthquake Resistant Design)
- IS 13920 (Ductile Detailing)
- National Building Code of India

## 💡 Tips & Tricks

### Development Workflow

1. **Use two terminals**: One for backend, one for frontend
2. **Keep console open**: Monitor API calls and errors
3. **Use Prisma Studio**: Visual database management
4. **Test incrementally**: Test each step before moving forward
5. **Save test data**: Keep sample surveys for quick testing

### Debugging

```javascript
// Frontend debugging
console.log('State:', state);
console.log('Token:', state.token);

// Backend debugging
// Check logs/combined.log
// Check logs/error.log
```

### Database Management

```bash
# View data in Prisma Studio
npm run prisma:studio

# Create database backup
pg_dump smart_load_analyzer > backup.sql

# Restore database
psql smart_load_analyzer < backup.sql
```

## 🎉 Success Indicators

You'll know everything is working when:

✅ Backend health check returns success
✅ Frontend loads without errors
✅ Login works and stores token
✅ Can create land survey
✅ Can create building input
✅ Can add wind data
✅ Disaster analysis completes
✅ Vastu analysis completes
✅ Final report generates
✅ Reports display correctly
✅ No CORS errors in console

## 📞 Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review [README.md](README.md) for backend details
3. Review [frontend/README.md](frontend/README.md) for frontend details
4. Check [API_EXAMPLES.md](API_EXAMPLES.md) for API usage
5. Open an issue on GitHub

---

**Happy Building! 🏗️**
