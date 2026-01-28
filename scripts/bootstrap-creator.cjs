// scripts/bootstrap-creator.cjs
const { PrismaClient, ModuleKey } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const creatorEmail = process.env.CREATOR_EMAIL;
  const creatorPassword = process.env.CREATOR_INITIAL_PASSWORD;
  const creatorId = process.env.CREATOR_ID || "creator-root";
  const defaultCompanyName =
    process.env.COMPANY_NAME_DEFAULT || "Alpha Ultimate Ltd.";

  if (!creatorEmail || !creatorPassword) {
    throw new Error(
      "CREATOR_EMAIL and CREATOR_INITIAL_PASSWORD must be set in .env"
    );
  }

  console.log("Bootstrapping Creator and default company...");

  // 1) Ensure company exists
  let company = await prisma.company.findFirst({
    where: { name: defaultCompanyName }
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: defaultCompanyName,
        email: creatorEmail
      }
    });
    console.log("Created company:", company.name);
  } else {
    console.log("Company already exists:", company.name);
  }

  // 2) Ensure creator user exists
  let creator = await prisma.user.findUnique({
    where: { email: creatorEmail }
  });

  const passwordHash = await bcrypt.hash(creatorPassword, 12);

  if (!creator) {
    creator = await prisma.user.create({
      data: {
        id: creatorId,
        email: creatorEmail,
        passwordHash,
        fullName: "System Creator",
        isApproved: true,
        isCreator: true,
        companyId: company.id
      }
    });
    console.log("Created creator user:", creator.email);
  } else {
    console.log("Creator user already exists:", creator.email);
  }

  // 3) Create base roles
  const [adminRole, managerRole, staffRole] = await Promise.all([
    upsertRole("ADMIN", "Full admin for a company"),
    upsertRole("MANAGER", "Manager with module-level control"),
    upsertRole("STAFF", "Standard staff user")
  ]);

  // 4) Create permissions for all modules
  const moduleKeys = Object.values(ModuleKey);
  const actions = ["VIEW", "CREATE", "EDIT", "APPROVE", "REJECT", "DELETE", "EXPORT"];

  const permissions = [];
  for (const moduleKey of moduleKeys) {
    for (const action of actions) {
      const perm = await prisma.permission.upsert({
        where: {
          module_action: {
            module: moduleKey,
            action
          }
        },
        update: {},
        create: {
          module: moduleKey,
          action,
          description: `${action} on ${moduleKey}`
        }
      });
      permissions.push(perm);
    }
  }

  // 5) Attach all permissions to ADMIN role
  await attachPermissions(adminRole.id, permissions);

  // 6) Attach filtered permissions to MANAGER and STAFF (example)
  const managerAllowedActions = new Set(["VIEW", "CREATE", "EDIT", "APPROVE"]);
  const staffAllowedActions = new Set(["VIEW", "CREATE"]);

  await attachPermissions(
    managerRole.id,
    permissions.filter((p) => managerAllowedActions.has(p.action))
  );
  await attachPermissions(
    staffRole.id,
    permissions.filter((p) => staffAllowedActions.has(p.action))
  );

  // 7) Assign ADMIN role to creator
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: creator.id,
        roleId: adminRole.id
      }
    },
    update: {},
    create: {
      userId: creator.id,
      roleId: adminRole.id
    }
  });

  console.log("Creator bootstrap completed.");
}

async function upsertRole(name, description) {
  const role = await prisma.role.upsert({
    where: { name },
    update: {},
    create: {
      name,
      description,
      isSystem: true
    }
  });
  console.log("Role ensured:", name);
  return role;
}

async function attachPermissions(roleId, permissions) {
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: perm.id
        }
      },
      update: {},
      create: {
        roleId,
        permissionId: perm.id
      }
    });
  }
  console.log("Attached permissions to role:", roleId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
