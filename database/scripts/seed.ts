import { PrismaClient, ModuleKey, LanguageCode, CurrencyCode } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default theme
  const theme = await prisma.theme.upsert({
    where: { id: 'default-theme' },
    update: {},
    create: {
      id: 'default-theme',
      name: 'Quantum Cyan',
      primaryColor: '#00bcd4',
      secondaryColor: '#00e5ff',
      backgroundGradient: 'linear-gradient(135deg, #002b36, #003f5c, #004d6b)',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }
  });
  console.log('✓ Default theme created');

  // Create default company
  const company = await prisma.company.upsert({
    where: { id: 'alpha-ultimate-ltd' },
    update: {},
    create: {
      id: 'alpha-ultimate-ltd',
      name: 'Alpha Ultimate Ltd',
      address: 'Riyadh, Saudi Arabia',
      email: 'info@alphaultimate.com',
      phone: '+966-XXX-XXXX',
      website: 'https://alphaultimate.com'
    }
  });
  console.log('✓ Default company created');

  // Create company settings
  await prisma.companySettings.upsert({
    where: { companyId: company.id },
    update: {},
    create: {
      companyId: company.id,
      themeId: theme.id,
      language: LanguageCode.en,
      currency: CurrencyCode.SAR,
      darkModeDefault: true
    }
  });
  console.log('✓ Company settings created');

  // Create creator user
  const passwordHash = await bcrypt.hash(process.env.CREATOR_DEFAULT_PASSWORD || 'Creator@2026', 10);
  const creator = await prisma.user.upsert({
    where: { email: 'creator@alphaultimate.com' },
    update: {},
    create: {
      email: 'creator@alphaultimate.com',
      passwordHash,
      fullName: 'Mohammad Maynul Hasan',
      isApproved: true,
      isCreator: true,
      companyId: company.id
    }
  });
  console.log('✓ Creator account created');

  // Create roles
  const creatorRole = await prisma.role.upsert({
    where: { id: 'role-creator' },
    update: {},
    create: {
      id: 'role-creator',
      name: 'Creator',
      description: 'Full system access',
      isSystem: true
    }
  });

  const adminRole = await prisma.role.upsert({
    where: { id: 'role-admin' },
    update: {},
    create: {
      id: 'role-admin',
      name: 'Company Admin',
      description: 'Full company access',
      isSystem: true
    }
  });

  const managerRole = await prisma.role.upsert({
    where: { id: 'role-manager' },
    update: {},
    create: {
      id: 'role-manager',
      name: 'Manager',
      description: 'Manager level access',
      isSystem: true
    }
  });

  const staffRole = await prisma.role.upsert({
    where: { id: 'role-staff' },
    update: {},
    create: {
      id: 'role-staff',
      name: 'Staff',
      description: 'Staff level access',
      isSystem: true
    }
  });
  console.log('✓ Default roles created');

  // Assign creator role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: creator.id,
        roleId: creatorRole.id
      }
    },
    update: {},
    create: {
      userId: creator.id,
      roleId: creatorRole.id
    }
  });
  console.log('✓ Creator role assigned');

  // Create module definitions
  const modules: { key: ModuleKey; name: string; description: string }[] = [
    { key: ModuleKey.DASHBOARD, name: 'Dashboard', description: 'Main dashboard with analytics' },
    { key: ModuleKey.EXPENSES, name: 'Expenses', description: 'Expense management and tracking' },
    { key: ModuleKey.INCOME, name: 'Income & Billing', description: 'Revenue and billing management' },
    { key: ModuleKey.INVESTMENTS, name: 'Investments', description: 'Investment tracking' },
    { key: ModuleKey.ASSETS, name: 'Assets', description: 'Asset management' },
    { key: ModuleKey.LIABILITIES, name: 'Liabilities', description: 'Liability tracking' },
    { key: ModuleKey.PROJECTS, name: 'Projects', description: 'Project management' },
    { key: ModuleKey.HR_ADMIN, name: 'HR & Admin', description: 'Human resources and administration' },
    { key: ModuleKey.CONTROL_PANEL, name: 'Control Panel', description: 'System configuration (Creator only)' },
    { key: ModuleKey.SETTINGS, name: 'Settings', description: 'Application settings' },
    { key: ModuleKey.CONTACT, name: 'Contact & Help', description: 'Contact and support' }
  ];

  for (const mod of modules) {
    const moduleDefinition = await prisma.moduleDefinition.upsert({
      where: { key: mod.key },
      update: {},
      create: mod
    });

    // Enable module for default company
    await prisma.companyModule.upsert({
      where: {
        companyId_moduleId: {
          companyId: company.id,
          moduleId: moduleDefinition.id
        }
      },
      update: {},
      create: {
        companyId: company.id,
        moduleId: moduleDefinition.id,
        isEnabled: true,
        isLocked: mod.key === ModuleKey.CONTROL_PANEL // Lock control panel by default
      }
    });
  }
  console.log('✓ Module definitions created');

  // Create permissions
  const actions = ['VIEW', 'CREATE', 'EDIT', 'APPROVE', 'REJECT', 'DELETE', 'EXPORT'];
  for (const mod of modules) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: {
          id: `perm-${mod.key}-${action}`
        },
        update: {},
        create: {
          id: `perm-${mod.key}-${action}`,
          module: mod.key,
          action,
          description: `${action} permission for ${mod.name}`
        }
      });
    }
  }
  console.log('✓ Permissions created');

  // Assign all permissions to creator role
  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: creatorRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: creatorRole.id,
        permissionId: permission.id
      }
    });
  }
  console.log('✓ Creator permissions assigned');

  // Create expense categories
  const expenseCategories = [
    'Office Supplies',
    'Transportation',
    'Utilities',
    'Equipment',
    'Marketing',
    'Staff Welfare',
    'Rent',
    'Maintenance',
    'Miscellaneous'
  ];

  for (const categoryName of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: {
        id: `cat-${categoryName.toLowerCase().replace(/\s+/g, '-')}`
      },
      update: {},
      create: {
        id: `cat-${categoryName.toLowerCase().replace(/\s+/g, '-')}`,
        companyId: company.id,
        name: categoryName,
        description: `${categoryName} expenses`
      }
    });
  }
  console.log('✓ Expense categories created');

  // Create asset categories
  const assetCategories = [
    'Office Equipment',
    'Vehicles',
    'Furniture',
    'Electronics',
    'Real Estate'
  ];

  for (const categoryName of assetCategories) {
    await prisma.assetCategory.upsert({
      where: {
        id: `asset-cat-${categoryName.toLowerCase().replace(/\s+/g, '-')}`
      },
      update: {},
      create: {
        id: `asset-cat-${categoryName.toLowerCase().replace(/\s+/g, '-')}`,
        companyId: company.id,
        name: categoryName,
        description: `${categoryName} category`
      }
    });
  }
  console.log('✓ Asset categories created');

  // Create liability types
  const liabilityTypes = [
    'Bank Loan',
    'Vendor Payable',
    'Salary Payable',
    'Rent Payable',
    'Utilities Payable'
  ];

  for (const typeName of liabilityTypes) {
    await prisma.liabilityType.upsert({
      where: {
        id: `liability-type-${typeName.toLowerCase().replace(/\s+/g, '-')}`
      },
      update: {},
      create: {
        id: `liability-type-${typeName.toLowerCase().replace(/\s+/g, '-')}`,
        companyId: company.id,
        name: typeName,
        description: `${typeName} liability`
      }
    });
  }
  console.log('✓ Liability types created');

  // Create system guide sections
  const guideSections = [
    {
      title: 'Getting Started',
      content: 'Welcome to Quantum Finance Engine. This guide will help you get started with the system.',
      order: 1
    },
    {
      title: 'Dashboard Overview',
      content: 'The dashboard provides a comprehensive view of your financial data and key metrics.',
      order: 2
    },
    {
      title: 'Managing Expenses',
      content: 'Learn how to submit, track, and approve expenses efficiently.',
      order: 3
    },
    {
      title: 'Creating Bills',
      content: 'Generate professional invoices and track payments with ease.',
      order: 4
    },
    {
      title: 'Project Management',
      content: 'Manage projects, budgets, and track progress in real-time.',
      order: 5
    }
  ];

  for (const section of guideSections) {
    await prisma.systemGuideSection.upsert({
      where: {
        id: `guide-${section.order}`
      },
      update: {},
      create: {
        id: `guide-${section.order}`,
        ...section
      }
    });
  }
  console.log('✓ System guide sections created');

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📧 Creator Login:');
  console.log('   Email: creator@alphaultimate.com');
  console.log('   Password: Creator@2026');
  console.log('\n🏢 Company: Alpha Ultimate Ltd');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
