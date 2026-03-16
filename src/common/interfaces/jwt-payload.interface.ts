export interface JwtPayload {
  sub: number; // User ID
  email: string;
  permissions: string[];
}
