import { create } from 'zustand';
import { mockMatters, mockTasks, mockDocuments, mockReferrals, mockUsers, mockNotifications } from './mockData';

export type Role = 'CLIENT' | 'BROKER' | 'CONVEYANCER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

interface StoreState {
  currentUser: User | null;
  users: User[];
  matters: any[];
  tasks: any[];
  documents: any[];
  referrals: any[];
  notifications: any[];
  
  // Actions
  login: (email: string) => void;
  logout: () => void;
  setCurrentUser: (user: User) => void;
  
  // Matter Actions
  addMatter: (matter: any) => void;
  updateMatterStatus: (id: string, status: string, percent: number) => void;
  
  // Task Actions
  completeTask: (id: string) => void;
  
  // Doc Actions
  uploadDocument: (doc: any) => void;
  deleteDocument: (id: string) => void;

  // Admin Actions
  toggleQuietHours: (enabled: boolean) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  currentUser: null, // Start logged out
  users: mockUsers as User[],
  matters: mockMatters,
  tasks: mockTasks,
  documents: mockDocuments,
  referrals: mockReferrals,
  notifications: mockNotifications,

  login: (email) => {
    const user = get().users.find((u: User) => u.email === email);
    if (user) {
      set({ currentUser: user });
    } else {
      // For demo, just log in as the first user of that role if not found, or create a guest
      if (email.includes('broker')) set({ currentUser: mockUsers.find((u: any) => u.role === 'BROKER') as User });
      else if (email.includes('admin')) set({ currentUser: mockUsers.find((u: any) => u.role === 'ADMIN') as User });
      else if (email.includes('conv')) set({ currentUser: mockUsers.find((u: any) => u.role === 'CONVEYANCER') as User });
      else set({ currentUser: mockUsers.find((u: any) => u.role === 'CLIENT') as User });
    }
  },

  logout: () => set({ currentUser: null }),
  setCurrentUser: (user) => set({ currentUser: user }),

  addMatter: (matter) => set(state => ({ matters: [...state.matters, matter] })),
  
  updateMatterStatus: (id, status, percent) => set(state => ({
    matters: state.matters.map(m => m.id === id ? { ...m, status, milestonePercent: percent } : m)
  })),

  completeTask: (id) => set(state => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'COMPLETE' } : t)
  })),

  uploadDocument: (doc) => set(state => ({ documents: [...state.documents, doc] })),
  
  deleteDocument: (id) => set(state => ({
    documents: state.documents.filter(d => d.id !== id)
  })),

  toggleQuietHours: (enabled) => {
    console.log('Quiet hours toggled:', enabled);
  }
}));
