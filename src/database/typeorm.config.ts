import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { Media } from '../media/entities/media.entity';
import { Plan } from '../plan/entities/plan.entity';
import { Application } from '../applications/entities/application.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { Role } from '../rbac/entities/role.entity';
import { User } from '../users/entities/user.entity';

// Load environment variables
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'nest-auth',
  entities: [User, Role, Permission, RefreshToken, Plan, Media, Application],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false, // Never use synchronize with migrations
  logging: process.env.NODE_ENV === 'development',
});
