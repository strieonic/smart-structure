# 🚀 START HERE - Quick Guide

## ⚡ Quick Start (3 Commands)

```bash
# 1. Verify everything is ready
verify-setup.bat

# 2. Start both backend and frontend
start-all.bat

# 3. Open browser
http://localhost:8080
```

That's it! Your application is now running.

## 📋 What to Do Next

### First Time Setup

If this is your first time:

1. **Check if database exists:**
   ```bash
   psql -l | findstr smart_load_analyzer
   ```

2. **If not, create it:**
   ```bash
   createdb smart_load_analyzer
   ```

3. **Run migrations:**
   ```bash
   npm run prisma:migrate
   ```

4. **Then start:**
   ```bash
   start-all.bat
   ```

### Using the Application

1. **Register** - Create your account
2. **Login** - Get authenticated
3. **Create Survey** - Enter land data
4. **Create Building** - Enter building specs
5. **Add Wind** - Enter wind parameters
6. **Run Analyses** - Get results
7. **View Reports** - See recommendations

## 🔍 Troubleshooting

### Backend won't start?
```bash
# Check if port is in use
netstat -ano | findstr :5000

# Kill process if needed
taskkill /PID <PID> /F

# Or change port in .env
PORT=5001
```

### Frontend won't start?
```bash
# Try different port
cd frontend
python -m http.server 8081
```

### Database issues?
```bash
# Regenerate Prisma client
npm run prisma:generate

# Reset database (WARNING: deletes data)
npm run prisma:migrate reset
```

### Login not working?
```javascript
// Clear browser storage
localStorage.clear()

// Then try again
```

## 📚 Documentation

- **DEBUGGING_GUIDE.md** - Complete debugging help
- **SYSTEM_STATUS.md** - System verification report
- **FINAL_SUMMARY.md** - Complete summary
- **FULLSTACK_GUIDE.md** - Detailed setup guide
- **QUICK_REFERENCE.md** - Quick reference card

## 🧪 Testing

### Manual Test
```bash
# Start backend
npm run dev

# Open browser
http://localhost:8080

# Follow workflow
```

### Automated Test
```bash
# Start backend first
npm run dev

# Then run tests
node test-system.js
```

## 🎯 Key URLs

- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:5000
- **Health**: http://localhost:5000/api/v1/health
- **Database UI**: http://localhost:5555 (run: npm run prisma:studio)

## ✅ Success Indicators

You'll know it's working when:
- ✅ Backend console shows "Server running on port 5000"
- ✅ Frontend opens in browser
- ✅ No errors in browser console
- ✅ Can register and login
- ✅ Can create surveys and buildings
- ✅ Can run analyses
- ✅ Reports display correctly

## 🆘 Need Help?

1. **Check DEBUGGING_GUIDE.md** - Comprehensive debugging
2. **Check SYSTEM_STATUS.md** - System verification
3. **Check browser console** - Look for errors
4. **Check backend logs** - Look for errors
5. **Run verify-setup.bat** - Check requirements

## 🎉 You're Ready!

Everything is debugged, verified, and ready to use.

**Just run: `start-all.bat`**

---

**Happy Building! 🏗️**
