import { create } from 'zustand';

import type { Role } from '@/constants/roles';

type AuthState = {
  isAuthenticated: boolean;
  role: Role;
  userId: string;
  schoolId: string;
  email: string;
  homeAddress: string;
  passwordMock: string;
  setRole: (role: Role) => void;
  setAccount: (next: Partial<Pick<AuthState, 'email' | 'homeAddress' | 'passwordMock'>>) => void;
  signInMock: (params?: Partial<Pick<AuthState, 'role' | 'userId' | 'schoolId'>>) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: true,
  role: 'parent',
  userId: 'mock-user',
  schoolId: 'mock-school',
  email: 'driver@example.com',
  homeAddress: '123 Main St',
  passwordMock: '',
  setRole: (role) => set({ role }),
  setAccount: (next) => set((s) => ({ ...s, ...next })),
  signInMock: (params) =>
    set({
      isAuthenticated: true,
      role: params?.role ?? 'parent',
      userId: params?.userId ?? 'mock-user',
      schoolId: params?.schoolId ?? 'mock-school',
    }),
  signOut: () => set({ isAuthenticated: false }),
}));
