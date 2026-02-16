# Quick Reference Card

## 🚀 Start Everything

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend && python -m http.server 8080

# Browser
http://localhost:8080
```

## 🔗 URLs

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:8080 | Web UI |
| Backend API | http://localhost:5000/api/v1 | REST API |
| Health Check | http://localhost:5000/api/v1/health | Status |
| Prisma Studio | http://localhost:5555 | Database UI |

## 📋 Quick Test Workflow

```
1. Register → test@example.com / Test123456
2. Login → Get token
3. Create Survey → Use defaults
4. Create Building → Select survey
5. Add Wind → Enter parameters
6. Run Disaster → Wait for completion
7. Run Vastu → Wait for completion
8. Generate Report → View results
```

## 🎯 Default Test Values

### Land Survey (Mumbai)
```
Lat: 19.0760, Lng: 72.8777
Plot: 1000 sq.m, Soil: Black Cotton
Zone: III, Flood: High
```

### Building (15-Story Residential)
```
Type: Residential, Floors: 15
Height: 45m, Area: 12000 sq.m
Orientation: North-East, System: RCC
```

### Wind Data (Coastal)
```
Direction: 270°, Avg Speed: 35 m/s
Peak: 55 m/s, Terrain: Category 2
```

## 🔑 API Endpoints

### Auth
```
POST /auth/register
POST /auth/login
POST /auth/refresh
```

### Land Surveys
```
POST   /land-surveys
GET    /land-surveys
GET    /land-surveys/:id
PUT    /land-surveys/:id
DELETE /land-surveys/:id
```

### Building & Wind
```
POST /building-inputs
GET  /building-inputs/:id
POST /wind
GET  /wind/building/:buildingInputId
```

### Analysis
```
POST /analysis/disaster/:buildingInputId
POST /analysis/vastu/:buildingInputId
POST /analysis/report/:buildingInputId
GET  /analysis/disaster/:buildingInputId
GET  /analysis/vastu/:buildingInputId
GET  /analysis/report/:buildingInputId
```

## 🐛 Quick Fixes

### Backend Won't Start
```bash
# Check database
sudo systemctl status postgresql

# Regenerate Prisma
npm run prisma:generate

# Check port
lsof -i :5000
```

### Frontend Issues
```bash
# Clear browser data
localStorage.clear()

# Check CORS in backend .env
CORS_ORIGIN=http://localhost:8080

# Verify API URL in script.js
const API = "http://localhost:5000/api/v1";
```

### Database Issues
```bash
# Reset database
npm run prisma:migrate reset

# View data
npm run prisma:studio
```

## 📊 Score Interpretation

| Score | Rating | Color |
|-------|--------|-------|
| 80-100 | Excellent | Green |
| 60-79 | Good | Blue |
| 40-59 | Moderate | Orange |
| 0-39 | Poor | Red |

## 🎨 Color Codes

```css
Primary:  #2563eb (Blue)
Success:  #10b981 (Green)
Danger:   #ef4444 (Red)
Warning:  #f59e0b (Orange)
Info:     #3b82f6 (Light Blue)
```

## 📁 Key Files

```
Backend:
├── src/server.ts          # Entry point
├── src/app.ts             # Express app
├── src/routes/            # API routes
├── src/services/          # Business logic
├── src/controllers/       # Request handlers
└── prisma/schema.prisma   # Database schema

Frontend:
├── index.html             # Main HTML
├── script.js              # JavaScript
├── style.css              # Styling
└── README.md              # Documentation
```

## 🔒 Environment Variables

```env
# Backend .env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/smart_load_analyzer
JWT_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:8080
```

## 🧪 Test Commands

```bash
# Backend
npm run dev              # Development
npm run build            # Production build
npm start                # Production run
npm run prisma:studio    # Database UI

# Frontend
python -m http.server 8080
npx http-server -p 8080
php -S localhost:8080
```

## 📞 Support Checklist

Before asking for help:
- [ ] Backend running?
- [ ] Frontend running?
- [ ] Database connected?
- [ ] Logged in?
- [ ] Check browser console
- [ ] Check backend logs
- [ ] Try clearing localStorage
- [ ] Try different browser

## 🎓 Documentation

| Document | Purpose |
|----------|---------|
| README.md | Backend overview |
| QUICK_START.md | 5-minute setup |
| ARCHITECTURE.md | System design |
| DEPLOYMENT.md | Production guide |
| API_EXAMPLES.md | API usage |
| FULLSTACK_GUIDE.md | Complete setup |
| frontend/README.md | Frontend guide |
| FRONTEND_SUMMARY.md | Frontend details |

## ⚡ Performance Tips

```bash
# Backend
NODE_ENV=production npm start
pm2 start dist/server.js

# Database
# Add indexes (already configured)
# Use connection pooling (already configured)

# Frontend
# Minify files (optional)
# Use CDN for icons (already configured)
```

## 🔐 Security Checklist

- [ ] Change JWT secrets
- [ ] Strong database password
- [ ] HTTPS in production
- [ ] Proper CORS configuration
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] Audit logging working

## 📈 Monitoring

```bash
# Backend logs
tail -f logs/combined.log
tail -f logs/error.log

# PM2 monitoring
pm2 monit
pm2 logs

# Database
psql smart_load_analyzer
SELECT count(*) FROM users;
```

## 🎯 Success Indicators

✅ Health check returns 200
✅ Login works
✅ Can create survey
✅ Can create building
✅ Analysis completes
✅ Reports display
✅ No console errors
✅ No CORS errors

## 💡 Pro Tips

1. Keep two terminals open (backend + frontend)
2. Use Prisma Studio for database inspection
3. Check browser console for errors
4. Use default values for quick testing
5. Clear localStorage if login issues
6. Check logs for backend errors
7. Use health endpoint to verify backend
8. Test incrementally, step by step

---

**Keep this card handy for quick reference! 📌**
