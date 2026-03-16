import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { AppSetting } from '../../app-settings/entities/app-setting.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { Plan } from '../../plan/entities/plan.entity';
import { Permission } from '../../rbac/entities/permission.entity';
import { Role } from '../../rbac/entities/role.entity';
import { User } from '../../users/entities/user.entity';
import { Application } from '../../applications/entities/application.entity';

// Load environment variables
config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'nest-auth',
  entities: [User, Role, Permission, RefreshToken, Plan, AppSetting, Application],
  synchronize: false,
  logging: true,
});

// ─── Permission Definitions ────────────────────────────────────────────

const PERMISSIONS = [
  { slug: 'users.read', description: 'View users list and details' },
  { slug: 'users.create', description: 'Create new users' },
  { slug: 'users.update', description: 'Update existing users' },
  { slug: 'users.delete', description: 'Delete users' },
  { slug: 'plans.read', description: 'View plans list and details' },
  { slug: 'plans.create', description: 'Create new plans' },
  { slug: 'plans.update', description: 'Update existing plans' },
  { slug: 'plans.delete', description: 'Delete plans' },
  { slug: 'ads_timers.read', description: 'View ads timers list and details' },
  { slug: 'ads_timers.create', description: 'Create new ads timers' },
  { slug: 'ads_timers.update', description: 'Update existing ads timers' },
  { slug: 'ads_timers.delete', description: 'Delete ads timers' },
  { slug: 'app_settings.read', description: 'View app settings' },
  { slug: 'app_settings.create', description: 'Create or update app settings' },
  { slug: 'applications.read', description: 'View permit applications' },
  { slug: 'applications.create', description: 'Create new permit applications' },
  { slug: 'applications.update', description: 'Update/Review permit applications' },
  { slug: 'applications.delete', description: 'Delete permit applications' },
];

// ─── Role Definitions ──────────────────────────────────────────────────

const ROLES = [
  {
    name: 'admin',
    description: 'Full access to all features',
    isStatic: true,
    permissions: [
      'users.read',
      'users.create',
      'users.update',
      'users.delete',
      'plans.read',
      'plans.create',
      'plans.update',
      'plans.delete',
      'ads_timers.read',
      'ads_timers.create',
      'ads_timers.update',
      'ads_timers.delete',
      'app_settings.read',
      'app_settings.create',
      'applications.read',
      'applications.create',
      'applications.update',
      'applications.delete',
    ],
  },
  {
    name: 'parjatan-admin',
    description: 'Review and verify applications',
    isStatic: true,
    permissions: [
      'users.read',
      'applications.read',
      'applications.update',
    ],
  },
  {
    name: 'tourist',
    description: 'Tourist access for registration and application',
    isStatic: true,
    permissions: [
      'applications.read',
      'applications.create',
    ],
  },
  {
    name: 'view-only',
    description: 'Read-only access',
    isStatic: true,
    permissions: ['users.read', 'plans.read', 'applications.read'],
  },
];

// ─── System User ───────────────────────────────────────────────────────

const SYSTEM_USER = {
  firstName: 'System',
  lastName: 'Admin',
  email: 'admin@tourism.com',
  password: 'Admin@123',
  department: 'Engineering',
  isActive: true,
  isEmailVerified: true,
  roleName: 'admin',
};

// ─── Seed Runner ───────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting database seed...\n');

  await AppDataSource.initialize();
  console.log('✅ Database connected\n');

  const permissionRepo = AppDataSource.getRepository(Permission);
  const roleRepo = AppDataSource.getRepository(Role);
  const userRepo = AppDataSource.getRepository(User);

  // 1. Seed Permissions
  console.log('📋 Seeding permissions...');
  const savedPermissions: Permission[] = [];

  for (const perm of PERMISSIONS) {
    let existing = await permissionRepo.findOne({
      where: { slug: perm.slug },
    });

    if (!existing) {
      existing = await permissionRepo.save(
        permissionRepo.create({
          slug: perm.slug,
          description: perm.description,
        }),
      );
      console.log(`  ✅ Created permission: ${perm.slug}`);
    } else {
      existing.description = perm.description;
      await permissionRepo.save(existing);
      console.log(`  ⏩ Permission already exists: ${perm.slug}`);
    }

    savedPermissions.push(existing);
  }

  console.log(`\n📋 Total permissions: ${savedPermissions.length}\n`);

  // 2. Seed Roles with Permissions
  console.log('👥 Seeding roles...');

  for (const roleDef of ROLES) {
    let role = await roleRepo.findOne({
      where: { name: roleDef.name },
      relations: ['permissions'],
    });

    const rolePermissions = savedPermissions.filter((p) =>
      roleDef.permissions.includes(p.slug),
    );

    if (!role) {
      role = roleRepo.create({
        name: roleDef.name,
        description: roleDef.description,
        isStatic: roleDef.isStatic,
        isActive: true,
        permissions: rolePermissions,
      });
      await roleRepo.save(role);
      console.log(
        `  ✅ Created role: ${roleDef.name} (${rolePermissions.length} permissions)`,
      );
    } else {
      role.description = roleDef.description;
      role.isStatic = roleDef.isStatic;
      role.permissions = rolePermissions;
      await roleRepo.save(role);
      console.log(
        `  ⏩ Role already exists, updated: ${roleDef.name} (${rolePermissions.length} permissions)`,
      );
    }
  }

  // 3. Seed System User
  console.log('\n👤 Seeding system admin user...');

  let systemUser = await userRepo.findOne({
    where: { email: SYSTEM_USER.email },
  });

  const adminRole = await roleRepo.findOne({
    where: { name: SYSTEM_USER.roleName },
  });

  if (!adminRole) {
    throw new Error(
      'Admin role not found — permissions seeding may have failed',
    );
  }

  if (!systemUser) {
    const hashedPassword = await bcrypt.hash(SYSTEM_USER.password, 10);

    systemUser = userRepo.create({
      firstName: SYSTEM_USER.firstName,
      lastName: SYSTEM_USER.lastName,
      email: SYSTEM_USER.email,
      password: hashedPassword,
      department: SYSTEM_USER.department,
      isActive: SYSTEM_USER.isActive,
      isEmailVerified: SYSTEM_USER.isEmailVerified,
      roles: [adminRole],
      invitationSentAt: new Date(),
    });

    await userRepo.save(systemUser);
    console.log(`  ✅ Created system admin: ${SYSTEM_USER.email}`);
  } else {
    console.log(`  ⏩ System admin already exists: ${SYSTEM_USER.email}`);
  }

  // Summary
  console.log('\n────────────────────────────────────────');
  console.log('🎉 Seed completed successfully!');
  console.log('────────────────────────────────────────');
  console.log(`  Permissions: ${PERMISSIONS.length}`);
  console.log(`  Roles:       ${ROLES.length}`);
  console.log(
    `  System user: ${SYSTEM_USER.email} (password: ${SYSTEM_USER.password})`,
  );
  console.log('────────────────────────────────────────\n');

  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
