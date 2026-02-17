# 🚀 Quick Reference Card

## 🌐 URLs
- **Application**: http://localhost:8080
- **API**: http://localhost:5000/api/v1
- **Health Check**: http://localhost:5000/api/v1/health

## ⚡ Quick Start
```bash
# Start backend
npm run dev

# Start frontend (in new terminal)
cd frontend
python -m http.server 8080

# Or use the all-in-one script
start-all.bat
```

## 🔍 Check Status
```bash
# Backend running?
netstat -ano | findstr :5000

# Frontend running?
netstat -ano | findstr :8080

# Test API
curl http://localhost:5000/api/v1/health
```

## 📝 Workflow
1. Register → 2. Login → 3. Create Survey → 4. Add Building → 5. Add Wind → 6. Run Analysis → 7. View Reports

## 🛑 Stop Servers
- Press `Ctrl+C` in each terminal window
- Or close the terminal windows

## 📚 Documentation
- `START_HERE.md` - Getting started guide
- `DEBUGGING_GUIDE.md` - Troubleshooting help
- `SOLUTION_COMPLETE.md` - Full solution details
- `RUNNING_STATUS.md` - Current system status

## ✅ Current Status
- Backend: ✅ Running (Port 5000)
- Frontend: ✅ Running (Port 8080)
- Database: ✅ Connected
- Status: OPERATIONAL

---
*Last updated: 2026-02-17 21:38*
