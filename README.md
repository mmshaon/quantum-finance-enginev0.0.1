# Quantum Finance Engine

## 🌟 Multi-Platform Financial Management & Operations Engine

**Creator**: Mohammad Maynul Hasan  
**Company**: Alpha Ultimate Ltd  
**Version**: 1.0.0

---

## ⚡ Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL database (Free tier: [NeonDB](https://neon.tech))
- Git (optional)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment
cp .env.example .env
# Edit .env and set your DATABASE_URL and JWT_SECRET

# 3. Setup database
npm run db:push

# 4. Start the system
npm run dev
```

### Database Setup

#### Option 1: NeonDB (Recommended - Free)
1. Create account at [https://neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Update `.env` file:
   ```
   DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
   ```

#### Option 2: Local PostgreSQL
```bash
# Install PostgreSQL locally
# Create database
createdb quantum_finance

# Update .env with local connection
DATABASE_URL="postgresql://localhost:5432/quantum_finance"
```

### Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database UI**: Run `npm run db:studio`

### Default Login

```
Email: creator@alphaultimate.com
Password: Creator@2026
```

> ⚠️ **Change this password immediately after first login!**

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: Fastify (Node.js), TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **File Storage**: Local filesystem
- **UI Components**: Custom component library

### Project Structure
```
quantum-finance-engine/
├── apps/
│   ├── api/           # Backend API server
│   └── web/           # Next.js frontend
├── packages/
│   ├── ui/            # Shared UI components
│   ├── types/         # TypeScript definitions
│   └── utils/         # Shared utilities
├── database/
│   ├── schema.prisma  # Database schema
│   └── migrations/    # Database migrations
└── docs/
    ├── QUICK_START.md # Quick start guide
    └── ARCHITECTURE.md # Architecture docs
```

---

## 🚀 Features

### Core Modules
- **🏢 Company Management**: Multi-tenant company setup
- **👥 User Management**: Role-based access control (RBAC)
- **💰 Accounting**: Double-entry bookkeeping, chart of accounts
- **📊 Financial Statements**: Balance sheet, P&L, cash flow
- **💳 Billing & Invoicing**: Project invoicing, payment tracking
- **🛒 Procurement**: Purchase orders, vendor management
- **💼 Payroll**: Salary calculation, payslip generation
- **📈 Project Management**: Project tracking, HR management
- **💱 Forex Management**: Multi-currency support, FX rates
- **📁 File Management**: Document uploads, file storage

### Advanced Features
- **🔐 Advanced Security**: JWT authentication, role permissions
- **📱 Responsive Design**: Mobile-friendly interface
- **🔄 Real-time Updates**: Live data synchronization
- **📊 Analytics Dashboard**: Financial insights and reports
- **🔍 Audit Logging**: Complete activity tracking
- **🌐 Multi-language Support**: Internationalization ready

---

## 📋 Available Scripts

### Development
```bash
npm run dev          # Start all services in development
npm run dev:api      # Start API server only
npm run dev:web      # Start web app only
```

### Database
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with sample data
```

### Build & Deploy
```bash
npm run build        # Build all packages
npm run build:api    # Build API only
npm run build:web    # Build web app only
npm run start        # Start production servers
```

### Testing
```bash
npm run test         # Run all tests
npm run test:api     # Test API endpoints
npm run test:web     # Test web components
```

---

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# API Configuration
API_PORT=3001
API_HOST=0.0.0.0

# Web App Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# App Configuration
NODE_ENV=development
LOG_LEVEL=info

# Company Information
COMPANY_NAME="Alpha Ultimate Ltd"
COMPANY_EMAIL=info@alphaultimate.com
COMPANY_PHONE=+966-XXX-XXXX
COMPANY_ADDRESS="Riyadh, Saudi Arabia"
COMPANY_WEBSITE=https://alphaultimate.com
```

---

## 🔐 Security Features

### Authentication
- JWT-based authentication with refresh tokens
- Secure password hashing with bcrypt
- Session management with automatic token refresh

### Authorization
- Role-Based Access Control (RBAC)
- Granular permissions system
- Company-scoped data access

### Data Protection
- Input validation and sanitization
- SQL injection prevention with Prisma ORM
- File upload security with type validation
- CORS configuration for API security

---

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication Headers
```bash
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user

#### Company Management
- `GET /companies` - List companies
- `POST /companies` - Create company
- `PATCH /companies/:id` - Update company

#### Accounting
- `GET /accounts` - Chart of accounts
- `GET /journal-entries` - Journal entries
- `GET /statements/balance-sheet` - Balance sheet
- `GET /statements/profit-loss` - P&L statement

#### Billing
- `GET /invoices` - List invoices
- `POST /invoices` - Create invoice
- `GET /payments` - List payments

---

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Error
```bash
Error: Can't reach database server
```
**Solution**: Check your DATABASE_URL in .env file
```bash
# Test database connection
npx prisma db pull
```

#### Port Already in Use
```bash
Error: Port 3000/3001 already in use
```
**Solution**: Kill existing processes
```bash
# Kill Node processes
Stop-Process -Name "node" -Force

# Or use different ports
API_PORT=3002 npm run dev
```

#### Prisma Client Issues
```bash
Error: Prisma Client initialization failed
```
**Solution**: Regenerate Prisma client
```bash
npm run db:generate
```

#### Build Errors
```bash
Error: TypeScript compilation failed
```
**Solution**: Check for type errors
```bash
npm run build
# Fix any TypeScript errors shown
```

### Getting Help

1. **Check logs**: Look at console output for detailed error messages
2. **Verify environment**: Ensure all required environment variables are set
3. **Database status**: Confirm database is running and accessible
4. **Dependencies**: Run `npm install` to ensure all packages are installed

---

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request

### Code Standards
- Use TypeScript for all new code
- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation

---

## 📄 License

This project is proprietary software owned by Alpha Ultimate Ltd.

---

## 📞 Support

**Creator**: Mohammad Maynul Hasan  
**Email**: creator@alphaultimate.com  
**Company**: Alpha Ultimate Ltd  
**Website**: https://alphaultimate.com

---

## 🎯 Version History

### v1.0.0 (Current)
- ✅ Complete financial management system
- ✅ Multi-tenant architecture
- ✅ Advanced security features
- ✅ Real-time dashboard
- ✅ Mobile-responsive design
- ✅ Comprehensive API documentation

---

## 🚀 Deployment

### Production Deployment

#### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd apps/web
vercel --prod

# Deploy API (separate)
cd apps/api
vercel --prod
```

#### Option 2: Docker
```bash
# Build Docker images
docker-compose build

# Run production containers
docker-compose up -d
```

#### Option 3: Traditional Server
```bash
# Build applications
npm run build

# Start production servers
npm run start
```

### Environment Setup
- Set production environment variables
- Configure SSL certificates
- Set up reverse proxy (nginx/Apache)
- Configure monitoring and logging

---

**🎉 Thank you for choosing Quantum Finance Engine!**

Built with ❤️ by [Alpha Ultimate Ltd](https://alphaultimate.com)

---

## 📋 What's Included

### ✅ Complete Backend API
- **Fastify** server with TypeScript
- **Prisma ORM** with PostgreSQL
- **JWT authentication** and authorization
- **Role-based access control** (RBAC)
- **Audit logging** for all actions
- **File upload** support
- **Rate limiting** and security headers

### ✅ Modern Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **TailwindCSS** with custom theme
- **Responsive design** (mobile & desktop)
- **Glass-morphism** UI components
- **Animated gradients** and effects

### ✅ Core Modules
1. **Dashboard** - Financial overview & analytics
2. **Expenses** - Expense tracking with approval workflow
3. **Income & Billing** - Invoice generation with PDF export
4. **Projects** - Project management & budgeting
5. **HR & Admin** - Staff, attendance & payroll
6. **Assets & Liabilities** - Financial asset tracking
7. **Settings** - User & company configuration

### ✅ Database Schema
- 40+ models covering all business operations
- Proper relationships and constraints
- Soft delete support
- Audit trail for compliance
- Multi-company support ready

---

## 🏗️ Project Structure

```
quantum-finance-engine/
├── apps/
│   ├── web/              # Next.js frontend (port 3000)
│   │   ├── app/          # App Router pages
│   │   │   ├── auth/     # Login & registration
│   │   │   ├── dashboard/
│   │   │   ├── expenses/
│   │   │   ├── income/
│   │   │   ├── projects/
│   │   │   ├── hr/
│   │   │   └── assets/
│   │   └── components/   # Shared components
│   │
│   └── api/              # Fastify backend (port 3001)
│       ├── src/
│       │   ├── routes/   # API endpoints
│       │   ├── plugins/  # Fastify plugins
│       │   └── services/ # Business logic
│
├── packages/
│   ├── ui/               # Shared React components
│   ├── types/            # TypeScript interfaces
│   ├── utils/            # Helper functions
│   └── config/           # Configuration & constants
│
├── database/
│   ├── schema.prisma     # Database schema
│   └── seed/             # Initial data
│
├── scripts/              # Deployment & automation
└── docs/                 # Documentation
```

---

## 📚 Available Commands

### Development
```bash
npm run dev              # Start frontend + backend
npm run build            # Build all apps
npm run start            # Run production build
```

### Database
```bash
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Create migration
npm run db:seed          # Seed initial data
npm run db:studio        # Open database GUI
```

### Maintenance
```bash
npm run lint             # Run linters
npm run clean            # Remove build artifacts
```

---

## 🔐 Environment Variables

Required variables in `.env`:

```env
# Database (Required)
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# JWT (Required)
JWT_SECRET="your-super-secret-key-min-32-characters"
JWT_EXPIRES_IN="7d"

# Application URLs
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: OAuth Providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""
```

---

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Dashboard
- `GET /api/dashboard/stats` - Get statistics

### Expenses
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
- `GET /api/expenses/:id` - Get expense
- `PATCH /api/expenses/:id/status` - Update status

### Income
- `GET /api/income` - List bills
- `POST /api/income` - Create bill
- `GET /api/income/:id` - Get bill
- `POST /api/income/:id/payments` - Add payment

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `POST /api/projects/:id/progress` - Add progress

### HR
- `GET /api/hr/staff` - List staff
- `POST /api/hr/staff` - Create staff member
- `POST /api/hr/attendance` - Mark attendance
- `POST /api/hr/salary-sheet` - Generate salary

### Settings
- `GET /api/settings/company` - Get company settings
- `PATCH /api/settings/company` - Update settings
- `GET /api/settings/profile` - Get user profile
- `PATCH /api/settings/profile` - Update profile

All endpoints require `Authorization: Bearer <token>` header (except register/login).

---

## 🎨 Features

### Design
- **Deep cyan gradient** backgrounds
- **Glass-morphism** cards with blur effects
- **Electric spark** animated borders
- **Responsive** mobile-first design
- **Touch-optimized** controls

### Security
- ✅ Bcrypt password hashing
- ✅ JWT token authentication
- ✅ Role-based permissions
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Security headers (Helmet)

### Performance
- ✅ Turborepo monorepo
- ✅ Shared package caching
- ✅ Optimized builds
- ✅ Code splitting
- ✅ Lazy loading

---

## 📱 Responsive Design

The system is fully responsive and works on:
- 📱 Mobile phones (320px+)
- 📱 Tablets (768px+)
- 💻 Laptops (1024px+)
- 🖥️ Desktops (1920px+)

---

## 🔧 Troubleshooting

### Database Connection Failed
```bash
# Check your DATABASE_URL format
# Ensure it ends with ?sslmode=require for NeonDB
# Test with: npm run db:studio
```

### Build Errors
```bash
# Clean and rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run db:generate
npm run build
```

### Port Already in Use
```bash
# Change ports in .env:
PORT=3002
# Update NEXT_PUBLIC_API_URL accordingly
```

### Module Not Found
```bash
# Rebuild shared packages
npm run clean
npm install
cd packages/types && npm run build
cd packages/utils && npm run build
cd packages/config && npm run build
cd packages/ui && npm run build
```

---

## 📖 Documentation

- `COMPLETE_INSTALLATION_GUIDE.md` - Detailed setup guide
- `database/schema.prisma` - Database schema documentation
- API routes - See inline comments in `apps/api/src/routes/`

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd apps/web
vercel --prod
```

### Backend (Railway/Render)
1. Connect GitHub repo
2. Set environment variables
3. Deploy from dashboard

### Full Stack (VPS)
See deployment guide for:
- Nginx configuration
- PM2 process management
- SSL/Let's Encrypt setup

---

## 📞 Support

**Creator**: Mohammad Maynul Hasan  
**Company**: Alpha Ultimate Ltd  
**Location**: Riyadh, Saudi Arabia

For support:
- Check troubleshooting section above
- Review documentation files
- Contact system administrator

---

## 📜 License

**PROPRIETARY** - Alpha Ultimate Ltd  
© 2026 All Rights Reserved

Unauthorized copying, distribution, or modification is prohibited.

---

## 🎯 Key Features Summary

✅ **100% Complete** - No placeholders or TODOs  
✅ **Production Ready** - Deployed & tested  
✅ **Fully Responsive** - Mobile & desktop  
✅ **Secure** - Industry-standard security  
✅ **Scalable** - Multi-company support  
✅ **Well Documented** - Comprehensive docs  
✅ **Modern Stack** - Latest technologies  
✅ **Type Safe** - Full TypeScript coverage  

---

**Built with ❤️ by Mohammad Maynul Hasan**
