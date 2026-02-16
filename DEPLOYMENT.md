# Deployment Guide

## Prerequisites

- Node.js v18+
- PostgreSQL v14+
- Git
- Domain name (for production)
- SSL certificate (for production)

## Local Development Setup

1. **Clone and Install**
```bash
git clone <repository-url>
cd smart-load-distribution-analyzer
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
```

Edit `.env`:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/smart_load_analyzer"
JWT_SECRET=dev-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=debug
```

3. **Database Setup**
```bash
# Create database
createdb smart_load_analyzer

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

4. **Start Development Server**
```bash
npm run dev
```

## Production Deployment

### Option 1: Traditional VPS (Ubuntu/Debian)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### 2. PostgreSQL Configuration

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE smart_load_analyzer;
CREATE USER analyzer_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE smart_load_analyzer TO analyzer_user;
\q
```

#### 3. Application Deployment

```bash
# Clone repository
cd /var/www
sudo git clone <repository-url> smart-load-analyzer
cd smart-load-analyzer

# Install dependencies
sudo npm ci --only=production

# Create .env file
sudo nano .env
```

Production `.env`:
```env
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://analyzer_user:strong_password@localhost:5432/smart_load_analyzer"
JWT_SECRET=<generate-strong-secret>
JWT_REFRESH_SECRET=<generate-strong-refresh-secret>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com
```

```bash
# Generate Prisma client
sudo npm run prisma:generate

# Run migrations
sudo npm run prisma:migrate

# Build application
sudo npm run build

# Start with PM2
sudo pm2 start dist/server.js --name smart-load-analyzer
sudo pm2 save
sudo pm2 startup
```

#### 4. Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/smart-load-analyzer
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/smart-load-analyzer /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 5. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is configured automatically
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run prisma:generate
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5000

CMD ["npm", "start"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: smart_load_analyzer
      POSTGRES_USER: analyzer_user
      POSTGRES_PASSWORD: strong_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U analyzer_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://analyzer_user:strong_password@postgres:5432/smart_load_analyzer
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 3. Deploy with Docker

```bash
# Build and start
docker-compose up -d

# Run migrations
docker-compose exec app npm run prisma:migrate

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

### Option 3: Cloud Platforms

#### AWS Elastic Beanstalk

1. Install EB CLI
```bash
pip install awsebcli
```

2. Initialize
```bash
eb init -p node.js-18 smart-load-analyzer
```

3. Create environment
```bash
eb create production-env
```

4. Deploy
```bash
eb deploy
```

#### Heroku

1. Install Heroku CLI
```bash
# Install from https://devcenter.heroku.com/articles/heroku-cli
```

2. Create app
```bash
heroku create smart-load-analyzer
```

3. Add PostgreSQL
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

4. Set environment variables
```bash
heroku config:set JWT_SECRET=your-secret
heroku config:set JWT_REFRESH_SECRET=your-refresh-secret
```

5. Deploy
```bash
git push heroku main
```

6. Run migrations
```bash
heroku run npm run prisma:migrate
```

## Post-Deployment

### 1. Health Check

```bash
curl https://api.yourdomain.com/api/v1/health
```

Expected response:
```json
{
  "status": "success",
  "message": "Smart Load Distribution Analyzer API is running",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### 2. Monitoring

#### PM2 Monitoring
```bash
pm2 monit
pm2 logs smart-load-analyzer
```

#### Database Monitoring
```bash
# Check connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('smart_load_analyzer'));"
```

### 3. Backup Strategy

#### Database Backup Script
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="smart_load_analyzer_$DATE.sql"

mkdir -p $BACKUP_DIR

pg_dump -U analyzer_user smart_load_analyzer > $BACKUP_DIR/$FILENAME

# Compress
gzip $BACKUP_DIR/$FILENAME

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $FILENAME.gz"
```

#### Automate with Cron
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### 4. Security Hardening

#### Firewall Configuration
```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

#### Fail2Ban
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 5. Performance Optimization

#### PostgreSQL Tuning
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

```conf
# Adjust based on server resources
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

#### Node.js Optimization
```bash
# Increase PM2 instances
pm2 scale smart-load-analyzer 4

# Enable cluster mode
pm2 start dist/server.js -i max --name smart-load-analyzer
```

## Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs smart-load-analyzer --lines 100

# Check environment variables
pm2 env 0

# Restart
pm2 restart smart-load-analyzer
```

### Database connection issues
```bash
# Test connection
psql -U analyzer_user -d smart_load_analyzer -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql
```

### High memory usage
```bash
# Check PM2 processes
pm2 list

# Monitor resources
pm2 monit

# Restart if needed
pm2 restart smart-load-analyzer
```

## Rollback Procedure

```bash
# Stop application
pm2 stop smart-load-analyzer

# Restore database backup
gunzip /var/backups/postgres/smart_load_analyzer_YYYYMMDD_HHMMSS.sql.gz
psql -U analyzer_user smart_load_analyzer < /var/backups/postgres/smart_load_analyzer_YYYYMMDD_HHMMSS.sql

# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild
npm run build

# Start application
pm2 start dist/server.js --name smart-load-analyzer
```

## Maintenance

### Update Application
```bash
cd /var/www/smart-load-analyzer
sudo git pull
sudo npm ci --only=production
sudo npm run build
sudo pm2 restart smart-load-analyzer
```

### Database Migrations
```bash
# Run new migrations
npm run prisma:migrate

# Rollback if needed
npm run prisma:migrate reset
```

## Support

For deployment issues, contact: devops@smartloadanalyzer.com
