# System Architecture

## Overview

The Quantum Finance Engine is built as a **modular monolith** with clear domain boundaries, designed to be:
- Scalable and maintainable
- Multi-tenant capable
- Cloud-native ready
- Easy to extend

## Architecture Layers

### 1. Client Layer

#### Web Application (Next.js)
- **Framework**: Next.js 14 with App Router
- **Styling**: TailwindCSS with custom theme
- **State Management**: Zustand (lightweight)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Animations**: Framer Motion

#### Mobile Web
- Same Next.js application
- Responsive design with mobile-first approach
- Touch-optimized UI components
- Progressive Web App (PWA) capable

#### Android Application
- **Framework**: React Native / Expo
- **API Integration**: Same REST APIs
- **Features**:
  - Expense entry with camera
  - Attendance tracking
  - Approval workflows
  - Push notifications
  - Biometric authentication

### 2. API Layer

#### Backend Service (Fastify)
- **Framework**: Fastify (high-performance Node.js)
- **Architecture**: Modular domain-based structure
- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-Based Access Control (RBAC)
- **File Upload**: Multipart with size limits
- **Rate Limiting**: Built-in protection
- **Logging**: Structured JSON logs

### 3. Data Layer

#### Database (NeonDB PostgreSQL)
- **ORM**: Prisma
- **Multi-tenancy**: Row-level isolation by `company_id`
- **Audit Logging**: All actions tracked
- **Soft Deletes**: Data retention strategy
- **Migrations**: Version-controlled schema changes

#### File Storage
- **Development**: Local filesystem
- **Production**: S3-compatible (AWS S3, Cloudinary, etc.)
- **Max File Size**: 5MB per file
- **Allowed Types**: Images (JPG, PNG, WebP), PDFs

#### Caching (Optional)
- **Redis**: Session storage, rate limiting, dashboard data
- **In-Memory**: Temporary data caching

## Core Domains

### 1. Authentication & Identity
- User registration with approval workflow
- Email/password login
- OAuth (Google, Microsoft)
- PIN and biometric support
- Session management
- Password reset

### 2. Company & Tenant Management
- Company profiles and settings
- Branding customization
- Multi-tenant data isolation
- Company-specific configurations

### 3. Creator Control Panel
- System configuration
- Module and form builder
- Role and permission management
- Global system updates
- Backup and restore
- Company lifecycle management

### 4. Finance Engine

#### Expenses
- Expense submission with items
- Receipt upload (camera/file)
- Approval workflow (Pending → Review → Approved/Rejected)
- Category mapping
- Submitter history
- Anomaly detection

#### Income & Billing
- Bill creation with line items
- VAT calculation (optional 15%)
- Discount handling
- PDF generation (A4 format)
- Payment tracking
- Due management

#### Investments
- Primary, Permanent, Project, Personal, Investor funds
- Project linkage
- Investment analytics

#### Assets & Liabilities
- Asset categories and tracking
- Operating cash management
- Liability types (loans, dues, pending salaries)
- Forecasting

### 5. Project Management
- Project overview (number, name, value, status)
- Budget allocation
- Expense linkage
- Worker assignments
- Progress tracking (percentage, logs)
- Profit/loss calculation
- Timeline management

### 6. HR & Admin

#### Staff Management
- Staff profiles with documents
- Auto-generated staff IDs
- Personal account ledger
- Petty cash issuance
- Salary advance tracking

#### Attendance
- Daily attendance (Present, Absent, Late, Leave)
- Check-in/check-out times
- Notes and exceptions

#### Salary & Payroll
- Monthly salary sheets
- Base salary + allowances - deductions
- Printable reports
- Payment status tracking

#### Equipment & Assets
- Car/equipment issuance
- Return tracking
- Serial number management

#### Tasks & Planning
- Task creation and assignment
- Status tracking (Open, In Progress, Completed, Cancelled)
- Due dates and priorities
- Notifications

### 7. Settings & Localization
- Theme customization (colors, fonts, gradients)
- Language switching (EN/BN/AR)
- Currency selection (SAR/USD/EUR/BDT)
- Module enable/disable/lock
- Profile settings

### 8. Contact & Help
- Company information
- Creator details
- System usage guides
- Inquiry forms
- Direct email integration

## Security Architecture

### Authentication Flow
1. User submits credentials
2. Server validates and checks approval status
3. JWT token generated with user context
4. Token stored client-side (httpOnly cookie or localStorage)
5. Subsequent requests include token in Authorization header
6. Server validates token and extracts user context

### Authorization (RBAC)
- **Roles**: Creator, Company Admin, Manager, Staff, Viewer
- **Permissions**: VIEW, CREATE, EDIT, DELETE, APPROVE, REJECT, EXPORT
- **Module-level**: Each module has its own permission set
- **Action-level**: Fine-grained control per action

### Audit Logging
- **What**: Action type, module, entity
- **Who**: User ID, company ID
- **When**: Timestamp
- **Where**: IP address, user agent (in metadata)
- **Retention**: 2 years

## Data Flow

### Expense Submission Flow
1. User fills expense form with items and receipts
2. Client validates and uploads files
3. API creates expense record (status: PENDING)
4. Admin receives notification
5. Admin approves/rejects/reviews
6. If approved: added to expense tables
7. If rejected: converted to salary advance (if applicable)
8. Audit log created for each step

### Bill Generation Flow
1. User creates bill with line items
2. System calculates subtotal, VAT, discount, total
3. Amount converted to words
4. Bill saved (status: DRAFT)
5. Admin approves bill
6. PDF generated with company branding
7. Bill status updated (SENT)
8. Payment tracking begins

## Deployment Architecture

### Development
- **Web**: Next.js dev server (localhost:3000)
- **API**: Fastify dev server (localhost:3001)
- **Database**: NeonDB or local PostgreSQL
- **Storage**: Local filesystem

### Production (Vercel)
- **Web**: Vercel Edge Network
- **API**: Vercel Serverless Functions
- **Database**: NeonDB (serverless PostgreSQL)
- **Storage**: S3-compatible service
- **CDN**: Vercel CDN for static assets

### Production (IONOS VPS)
- **Web**: Next.js standalone mode + Nginx
- **API**: PM2 process manager
- **Database**: NeonDB or self-hosted PostgreSQL
- **Storage**: Local or S3
- **Reverse Proxy**: Nginx with SSL (Let's Encrypt)

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- JWT-based authentication (no server-side sessions)
- Database connection pooling
- Separate read/write replicas (future)

### Vertical Scaling
- Optimized queries with Prisma
- Indexed database columns
- Lazy loading and pagination
- Image optimization and CDN

### Caching Strategy
- Redis for session storage
- In-memory cache for frequently accessed data
- CDN for static assets
- Browser caching with proper headers

## Monitoring & Observability

### Application Monitoring
- Structured JSON logging
- Error tracking (Sentry integration ready)
- Performance metrics
- Health check endpoints

### Database Monitoring
- Query performance tracking
- Connection pool monitoring
- Migration status

### User Activity
- Audit logs for all actions
- Login/logout tracking
- Failed login attempts
- Session duration

## Backup & Recovery

### Automated Backups
- **Database**: Daily snapshots
- **Files**: Incremental backups
- **Code**: Git version control
- **Retention**: 30 days

### Disaster Recovery
1. Restore database from latest snapshot
2. Restore files from backup storage
3. Deploy latest code from Git
4. Verify data integrity
5. Update DNS if needed

### Recovery Time Objective (RTO)
- Target: < 4 hours

### Recovery Point Objective (RPO)
- Target: < 24 hours

---

## Technology Stack Summary

**Frontend**:
- Next.js 14, React 18, TypeScript, TailwindCSS, Framer Motion

**Backend**:
- Fastify, TypeScript, Prisma ORM, Zod validation

**Database**:
- PostgreSQL (NeonDB), Redis (optional)

**Infrastructure**:
- Vercel / IONOS VPS, Nginx, PM2, Let's Encrypt

**Development**:
- Turborepo, ESLint, Prettier, Git

**Testing** (future):
- Jest, React Testing Library, Playwright

---

This architecture ensures:
- ✅ High performance and scalability
- ✅ Security and compliance
- ✅ Easy maintenance and updates
- ✅ Multi-tenant support
- ✅ Disaster recovery capability
