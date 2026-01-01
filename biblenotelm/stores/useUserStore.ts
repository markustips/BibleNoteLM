import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole, SubscriptionTier, hasPermission } from '../types';

interface UserState {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  churchId: string | null;
  churchCode: string | null;
  churchName: string | null;
  isAuthenticated: boolean;
  updateUser: (updates: Partial<UserState>) => void;
  joinChurch: (code: string, churchName: string, churchId: string) => void;
  leaveChurch: () => void;
  setRole: (role: UserRole) => void;
  setSubscription: (tier: SubscriptionTier) => void;
  can: (permission: string) => boolean;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      id: "user-1",
      name: "Alex Johnson",
      email: "alex.johnson@example.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      role: 'member',
      subscriptionTier: 'free',
      churchId: 'church-1',
      churchCode: 'GRACE2024',
      churchName: 'Grace Community Church',
      isAuthenticated: true,
      
      updateUser: (updates) => set((state) => ({ ...state, ...updates })),
      
      joinChurch: (code, churchName, churchId) => set({ 
        churchCode: code, 
        churchName, 
        churchId,
        role: 'member' 
      }),
      
      leaveChurch: () => set({ 
        churchCode: null, 
        churchName: null, 
        churchId: null,
        role: 'guest' 
      }),
      
      setRole: (role) => set({ role }),
      
      setSubscription: (tier) => set({ subscriptionTier: tier }),
      
      can: (permission) => hasPermission(get().role, permission),
      
      logout: () => set({
        isAuthenticated: false,
        role: 'guest',
        churchId: null,
        churchCode: null,
        churchName: null,
      }),
    }),
    {
      name: 'user-storage',
    }
  )
);