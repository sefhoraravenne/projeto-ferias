import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type RoleType = 'RH' | 'Gestor' | 'Funcionario';

export const Roles = (...roles: RoleType[]) => SetMetadata(ROLES_KEY, roles);