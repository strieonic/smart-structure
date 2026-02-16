# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites Check

```bash
# Check Node.js (need v18+)
node --version

# Check PostgreSQL (need v14+)
psql --version

# Check npm
npm --version
```

### Step 1: Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd smart-load-distribution-analyzer

# Install dependencies
npm install
```

### Step 2: Database Setup

```bash
# Create PostgreSQL database
createdb smart_load_analyzer

# Or using psql
psql -U postgres
CREATE DATABASE smart_load_analyzer;
\q
```

### Step 3: Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

Minimal `.env` configuration:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://postgres:mahskas@localhost:5432/smart_load_analyzer"
JWT_SECRET=your-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this
```

### Step 4: Initialize Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

### Step 5: Start Development Server

```bash
npm run dev
```

You should see:
```
Server running on port 5000
Environment: development
Health check: http://localhost:5000/api/v1/health
```

### Step 6: Test the API

```bash
# Health check
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

## 📝 First API Call

### Register a User

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "name": "Test User"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

Save the `accessToken` from the response!

### Create Land Survey

```bash
curl -X POST http://localhost:5000/api/v1/land-surveys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.6139,
    "longitude": 77.2090,
    "plotArea": 500,
    "soilType": "CLAY",
    "slope": 2.5,
    "elevation": 250,
    "waterTableDepth": 8.5,
    "seismicZone": "ZONE_IV",
    "floodRisk": "MEDIUM",
    "nearbyWaterBodies": false
  }'
```

## 🛠️ Development Tools

### Prisma Studio (Database GUI)

```bash
npm run prisma:studio
```

Opens at: http://localhost:5555

### View Logs

Development logs appear in console. Production logs:
```bash
tail -f logs/combined.log
tail -f logs/error.log
```

### TypeScript Compilation

```bash
# Build for production
npm run build

# Output in dist/ folder
```

## 📚 Next Steps

1. **Read Full Documentation**
   - [README.md](README.md) - Complete overview
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System design
   - [API_EXAMPLES.md](API_EXAMPLES.md) - API usage

2. **Explore API Endpoints**
   - Authentication: `/api/v1/auth/*`
   - Land Surveys: `/api/v1/land-surveys/*`
   - Building Inputs: `/api/v1/building-inputs/*`
   - Wind Analysis: `/api/v1/wind/*`
   - Analysis: `/api/v1/analysis/*`

3. **Test Complete Workflow**
   - Create land survey
   - Add building input
   - Add wind data
   - Run disaster analysis
   - Run Vastu analysis
   - Generate final report

## 🔧 Common Issues

### Port Already in Use

```bash
# Change PORT in .env
PORT=5001
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start if needed
sudo systemctl start postgresql

# Verify DATABASE_URL in .env
```

### Prisma Client Not Generated

```bash
# Regenerate Prisma client
npm run prisma:generate
```

### Migration Failed

```bash
# Reset database (WARNING: deletes all data)
npm run prisma:migrate reset

# Or manually
dropdb smart_load_analyzer
createdb smart_load_analyzer
npm run prisma:migrate
```

## 🎯 Production Deployment

For production deployment, see [DEPLOYMENT.md](DEPLOYMENT.md)

Quick production checklist:
- [ ] Set NODE_ENV=production
- [ ] Use strong JWT secrets
- [ ] Configure CORS_ORIGIN
- [ ] Set up SSL/HTTPS
- [ ] Configure rate limits
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Use process manager (PM2)

## 📞 Support

- Documentation: See README.md
- Issues: Open GitHub issue
- Email: support@smartloadanalyzer.com

## 🎓 Learning Resources

### Indian Standards Referenced
- IS 875 (Part 1, 2, 3) - Design Loads
- IS 1893 - Earthquake Resistant Design
- IS 13920 - Ductile Detailing
- National Building Code of India

### Technologies Used
- Node.js: https://nodejs.org/docs
- Express.js: https://expressjs.com
- TypeScript: https://www.typescriptlang.org/docs
- Prisma: https://www.prisma.io/docs
- PostgreSQL: https://www.postgresql.org/docs
- Zod: https://zod.dev

## ✅ Verification Checklist

After setup, verify:

- [ ] Server starts without errors
- [ ] Health endpoint responds
- [ ] Can register user
- [ ] Can login
- [ ] Can create land survey
- [ ] Can create building input
- [ ] Can run analysis
- [ ] Database persists data
- [ ] Logs are generated

## 🚦 Status Indicators

**Server Running:**
```
✓ Server running on port 5000
✓ Database connected successfully
```

**Server Issues:**
```
✗ Failed to start server
✗ Database connection failed
```

Check logs for details!

---

**You're all set!** Start building disaster-resilient, Vastu-compliant structures with AI-powered analysis.
