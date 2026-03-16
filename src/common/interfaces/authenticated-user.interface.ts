import { User } from '../../users/entities/user.entity';

export interface AuthenticatedUser extends User {
  permissions: string[];
}
