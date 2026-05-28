import { User } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u-admin',
    full_name: 'Ana García',
    email: 'admin@jcrealestate.mx',
    phone: '+52 55 0000 0001',
    role: 'admin',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2025-01-10T10:00:00Z',
  },
  {
    id: 'u-broker-1',
    full_name: 'Carlos Mendoza',
    email: 'cmendoza@jcrealestate.mx',
    phone: '+52 55 1234 5678',
    role: 'broker',
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2025-02-01T10:00:00Z',
  },
  {
    id: 'u-broker-2',
    full_name: 'Sofía Vargas',
    email: 'svargas@jcrealestate.mx',
    phone: '+52 998 765 4321',
    role: 'broker',
    created_at: '2024-03-01T10:00:00Z',
    updated_at: '2025-02-15T10:00:00Z',
  },
  {
    id: 'u-lawyer',
    full_name: 'Dr. Miguel Torres',
    email: 'mtorres@jcrealestate.mx',
    phone: '+52 55 2222 3333',
    role: 'abogado',
    created_at: '2024-04-01T10:00:00Z',
    updated_at: '2025-01-20T10:00:00Z',
  },
  {
    id: 'u-buyer',
    full_name: 'Carlos Ruiz',
    email: 'carlos.ruiz@email.com',
    phone: '+52 55 4444 5555',
    role: 'comprador',
    created_at: '2025-01-05T10:00:00Z',
    updated_at: '2025-05-01T10:00:00Z',
  },
  {
    id: 'u-guest',
    full_name: 'Invitado',
    email: '',
    phone: '',
    role: 'invitado',
    created_at: '2025-05-28T10:00:00Z',
    updated_at: '2025-05-28T10:00:00Z',
  },
];

export function getUserByRole(role: User['role']): User | undefined {
  if (role === 'invitado') return MOCK_USERS.find((u) => u.role === 'invitado');
  return MOCK_USERS.find((u) => u.role === role);
}

export function getUserById(id: string): User | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}
