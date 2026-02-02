# Quick Start Guide

This guide will help you get the Quantum Finance Engine up and running in minutes.

## Prerequisites Check

Before starting, ensure you have:

- ✅ **Node.js** 20.0.0 or higher
- ✅ **npm** 10.0.0 or higher
- ✅ **Git** installed
- ✅ **NeonDB** account (or PostgreSQL database)
- ✅ **Code editor** (VS Code recommended)

Check versions:
\`\`\`bash
node --version  # Should be v20.0.0 or higher
npm --version   # Should be 10.0.0 or higher
git --version   # Any recent version
\`\`\`

## Step-by-Step Setup

### 1. Clone or Navigate to Project

If you haven't cloned yet:
\`\`\`bash
git clone <repository-url>
cd quantum-finance-engine
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

This will install all dependencies for:
- Root workspace
- Web application
- API server
- Database package
- All shared packages

⏱️ **This may take 2-5 minutes**

### 3. Set Up Environment Variables

\`\`\`bash
cp .env.example .env
\`\`\`

Open `.env` and configure:

**Required Variables**:
\`\`\`env
# Database (Get from neon.tech)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# JWT Secret (Generate a random string)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"

# API URLs
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
\`\`\`

**Optional Variables** (for OAuth):
\`\`\`env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"
\`\`\`

### 4. Set Up Database

#### A. Generate Prisma Client

\`\`\`bash
npm run db:generate
\`\`\`

#### B. Push Schema to Database

For development (quick setup):
\`\`\`bash
npm run db:push
\`\`\`

OR for production (with migrations):
\`\`\`bash
npm run db:migrate
\`\`\`

✅ **Your database is now ready!**

### 5. Start Development Servers

Open **two terminals**:

**Terminal 1 - Web App**:
\`\`\`bash
cd apps/web
npm run dev
\`\`\`

**Terminal 2 - API Server**:
\`\`\`bash
cd apps/api
npm run dev
\`\`\`

OR use Turborepo to start all at once:
\`\`\`bash
npm run dev
\`\`\`

### 6. Open Application

- **Web App**: http://localhost:3000
- **API Server**: http://localhost:3001
- **API Health**: http://localhost:3001/health

## Verification

### Check Web App
1. Open http://localhost:3000
2. You should see the Quantum Finance Engine homepage
3. Click "Login" or "Register"

### Check API
1. Open http://localhost:3001
2. You should see API status JSON

### Check Database
\`\`\`bash
npm run db:studio
\`\`\`
Opens Prisma Studio at http://localhost:5555

## Creating First User

### Option 1: Via Registration Page
1. Go to http://localhost:3000/auth/register
2. Fill in the form
3. Submit (account will be pending approval)

### Option 2: Via Prisma Studio
1. Run `npm run db:studio`
2. Open "User" model
3. Click "Add record"
4. Fill in details:
   - Email: `admin@example.com`
   - Password: (hash with bcrypt)
   - Full Name: `Admin User`
   - Is Approved: `true`
   - Is Creator: `true` (for creator account)

### Option 3: Via Database Seed (Recommended)

Create `database/seed.ts`:

\`\`\`typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create Creator account
  const creatorPassword = await bcrypt.hash('Creator@12345', 10);
  
  const creator = await prisma.user.upsert({
    where: { email: 'mohammad.maynul.hasan@example.com' },
    update: {},
    create: {
      email: 'mohammad.maynul.hasan@example.com',
      passwordHash: creatorPassword,
      fullName: 'Mohammad Maynul Hasan',
      isApproved: true,
      isCreator: true,
    },
  });

  console.log('✅ Creator account created:', creator.email);

  // Create default company
  const company = await prisma.company.create({
    data: {
      name: 'Alpha Ultimate Ltd',
      email: 'info@alpha-ultimate.com',
      settings: {
        create: {
          language: 'en',
          currency: 'SAR',
          darkModeDefault: true,
        },
      },
    },
  });

  console.log('✅ Default company created:', company.name);

  // Create default roles
  const creatorRole = await prisma.role.create({
    data: {
      name: 'Creator',
      description: 'System creator with full access',
      isSystem: true,
    },
  });

  console.log('✅ Default roles created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
\`\`\`

Run seed:
\`\`\`bash
npm run db:seed
\`\`\`

**Default Login**:
- Email: `mohammad.maynul.hasan@example.com`
- Password: `Creator@12345`

⚠️ **Change this password immediately in production!**

## Common Issues & Solutions

### Issue: "Cannot find module '@prisma/client'"

**Solution**:
\`\`\`bash
npm run db:generate
\`\`\`

### Issue: "Port 3000/3001 already in use"

**Solution**:
1. Kill the process using that port
2. Or change port in `.env`:
   \`\`\`env
   PORT=3002  # For API
   \`\`\`

### Issue: Database connection error

**Solution**:
1. Check `DATABASE_URL` in `.env`
2. Ensure NeonDB is accessible
3. Verify SSL mode: `?sslmode=require`

### Issue: Build errors with TypeScript

**Solution**:
\`\`\`bash
# Clean everything
npm run clean

# Reinstall
npm install

# Regenerate Prisma
npm run db:generate

# Try again
npm run dev
\`\`\`

## Next Steps

### 1. Explore the Application
- ✅ Login with created account
- ✅ Navigate through modules
- ✅ Create test data

### 2. Review Documentation
- 📖 [Architecture](./ARCHITECTURE.md)
- 📖 [Modules](./MODULES.md)
- 📖 [API Reference](./API.md)
- 📖 [Deployment](./DEPLOYMENT.md)

### 3. Customize
- 🎨 Modify theme in `packages/config/src/index.ts`
- 🌐 Add translations
- 📝 Create custom modules (via Creator Control Panel)

### 4. Prepare for Production
- 🔒 Change all default passwords
- 🔑 Generate strong JWT secrets
- 🌍 Set up custom domain
- 📧 Configure email service
- 💾 Set up backups

## Development Tips

### Hot Reload
Both web and API support hot reload - changes will reflect automatically.

### Database Changes
After modifying `schema.prisma`:
\`\`\`bash
npm run db:push  # Quick sync
# OR
npm run db:migrate  # Create migration
\`\`\`

### Code Quality
\`\`\`bash
npm run lint    # Check code
npm run format  # Format code
\`\`\`

### Debugging
- **Web**: Use React DevTools
- **API**: Check terminal logs
- **Database**: Use Prisma Studio

## Getting Help

- 📧 **Email**: Contact creator
- 📖 **Docs**: Check `/docs` folder
- 🐛 **Issues**: Report via contact module
- 💬 **Support**: In-app contact form

---

## Success Checklist

Before considering setup complete:

- [ ] Web app loads at http://localhost:3000
- [ ] API responds at http://localhost:3001
- [ ] Database connection works
- [ ] Can login with created account
- [ ] All modules are accessible
- [ ] No console errors
- [ ] Environment variables are set

---

**🎉 Congratulations! You're all set up!**

Start building with the Quantum Finance Engine.
