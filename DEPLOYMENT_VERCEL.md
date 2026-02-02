# 🚀 Vercel Deployment Guide

## 📋 Prerequisites

1. **Vercel Account**: Create account at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally (`npm i -g vercel`)
3. **GitHub Repository**: Push code to GitHub (recommended)
4. **Environment Variables**: Have DATABASE_URL and JWT_SECRET ready

## 🏗️ Deployment Steps

### Option 1: Automated Deployment (Recommended)

```bash
# 1. Build and deploy everything
npm run deploy

# 2. Follow the prompts to configure your project
```

### Option 2: Manual Deployment

#### Deploy Frontend (Next.js)
```bash
# Navigate to web app
cd apps/web

# Deploy to Vercel
vercel --prod

# Note the deployed URL for API configuration
```

#### Deploy API (Fastify)
```bash
# Navigate to API
cd apps/api

# Deploy to Vercel
vercel --prod

# Note the deployed URL
```

## 🔧 Environment Variables

### Required Variables
Set these in your Vercel project dashboard:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Application
NODE_ENV=production
```

### Frontend Variables
```bash
# API URL (after API deployment)
NEXT_PUBLIC_API_URL=https://your-api-url.vercel.app

# App URL (after frontend deployment)
NEXT_PUBLIC_APP_URL=https://your-app-url.vercel.app
```

## 📁 Project Structure for Vercel

```
quantum-finance-engine/
├── vercel.json              # Root configuration
├── apps/
│   ├── web/
│   │   ├── vercel.json     # Frontend config
│   │   └── package.json
│   └── api/
│       ├── vercel.json     # API config
│       └── src/index.ts
└── scripts/
    └── deploy-vercel.js     # Deployment script
```

## 🌐 Configuration Files

### Root vercel.json
```json
{
  "version": 2,
  "name": "quantum-finance-engine",
  "builds": [
    {
      "src": "apps/web/package.json",
      "use": "@vercel/next",
      "config": {
        "distDir": "apps/web/.next"
      }
    },
    {
      "src": "apps/api/src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "apps/api/src/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "apps/web/$1"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret",
    "NODE_ENV": "production"
  },
  "functions": {
    "apps/api/src/index.ts": {
      "maxDuration": 30
    }
  }
}
```

### API vercel.json (apps/api/vercel.json)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret",
    "NODE_ENV": "production"
  },
  "functions": {
    "src/index.ts": {
      "maxDuration": 30
    }
  }
}
```

### Web vercel.json (apps/web/vercel.json)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url",
    "NEXT_PUBLIC_APP_URL": "@app_url"
  }
}
```

## 🚀 Deployment Commands

### Quick Deploy
```bash
# Deploy both frontend and API
npm run deploy
```

### Individual Deployments
```bash
# Deploy only frontend
npm run deploy:web

# Deploy only API
npm run deploy:api
```

### Build Before Deploy
```bash
# Build everything first
npm run build

# Then deploy
npm run deploy
```

## 🔍 Post-Deployment Checklist

### 1. Verify Deployment
- [ ] Frontend loads at deployed URL
- [ ] API responds at deployed URL
- [ ] Health check works: `GET /health`
- [ ] Authentication endpoints work

### 2. Test Functionality
- [ ] User registration/login
- [ ] Database connectivity
- [ ] File uploads (if applicable)
- [ ] All major features

### 3. Configure Domain (Optional)
- [ ] Add custom domain in Vercel dashboard
- [ ] Update SSL certificates
- [ ] Update environment variables if needed

### 4. Monitor Performance
- [ ] Check Vercel Analytics
- [ ] Monitor error logs
- [ ] Set up alerts (if needed)

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
vercel logs

# Fix TypeScript errors
npm run build

# Redeploy
vercel --prod
```

#### Database Connection Issues
```bash
# Verify DATABASE_URL format
echo $DATABASE_URL

# Test connection locally
npm run setup:db

# Update environment variables in Vercel dashboard
```

#### API Route Issues
```bash
# Check API logs
vercel logs --scope=api

# Test API endpoints
curl https://your-api-url.vercel.app/health
```

#### Frontend Issues
```bash
# Check frontend logs
vercel logs --scope=web

# Clear build cache
vercel --prod --force
```

### Error Messages

#### "Function execution timed out"
```json
// Increase timeout in vercel.json
{
  "functions": {
    "src/index.ts": {
      "maxDuration": 60
    }
  }
}
```

#### "Environment variable not found"
```bash
# Set environment variables in Vercel dashboard
# Or use CLI:
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

#### "Build failed: TypeScript error"
```bash
# Check TypeScript errors locally
npm run build

# Fix errors and redeploy
npm run deploy
```

## 📊 Monitoring & Analytics

### Vercel Analytics
- Visit your Vercel dashboard
- Go to Analytics tab
- Monitor page views, API calls, errors

### Custom Monitoring
```javascript
// Add custom logging
console.log('API Request:', {
  method: req.method,
  url: req.url,
  timestamp: new Date().toISOString()
});
```

## 🔄 CI/CD Integration

### GitHub Actions (Optional)
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## 🎯 Best Practices

### Performance
- Enable Vercel Edge Functions for static content
- Use caching headers appropriately
- Optimize images and assets

### Security
- Use HTTPS (automatic on Vercel)
- Set proper CORS headers
- Validate all inputs

### Cost Management
- Monitor usage in Vercel dashboard
- Optimize function execution time
- Use appropriate Vercel plan

## 📞 Support

### Vercel Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Serverless Functions](https://vercel.com/docs/serverless-functions)

### Project Support
- Check README.md for project-specific issues
- Review troubleshooting section
- Contact project maintainers if needed

---

**🎉 Your Quantum Finance Engine is now ready for Vercel deployment!**

Deploy with confidence using: `npm run deploy`
