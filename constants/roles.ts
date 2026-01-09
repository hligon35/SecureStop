export const ROLES = {
  parent: 'parent',
  driver: 'driver',
  admin: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABEL: Record<Role, string> = {
  parent: 'Parent',
  driver: 'Driver',
  admin: 'Admin',
};
