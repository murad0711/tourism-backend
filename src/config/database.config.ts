import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppSetting } from '../app-settings/entities/app-setting.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { Media } from '../media/entities/media.entity';
import { Plan } from '../plan/entities/plan.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { Role } from '../rbac/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { Application } from '../applications/entities/application.entity';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'nest-auth',
    entities: [
      User,
      RefreshToken,
      Role,
      Permission,
      Plan,
      Media,
      AppSetting,
      Application,
    ],
    synchronize: process.env.NODE_ENV === 'development',
    migrationsRun: process.env.NODE_ENV === 'production',
    migrations: ['dist/database/migrations/*.js'],
    logging: process.env.NODE_ENV === 'development',
  }),
);
