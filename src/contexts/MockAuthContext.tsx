import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'staff' | 'user';

export interface MockUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: MockUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, username: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users database
const MOCK_USERS: MockUser[] = [
  {
    id: 'admin-1',
    email: 'admin@parkwise.com',
    username: 'admin',
    fullName: 'Admin User',
    role: 'admin',
  },
  {
    id: 'staff-1',
    email: 'staff@parkwise.com',
    username: 'staff',
    fullName: 'Staff Member',
    role: 'staff',
  },
  {
    id: 'user-1',
    email: 'john@example.com',
    username: 'john_doe',
    fullName: 'John Doe',
    role: 'user',
  },
];

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const foundUser = MOCK_USERS.find(u => u.username === username);
    
    if (!foundUser) {
      throw new Error('Username not found');
    }

    // In mock mode, any password works (except empty)
    if (!password) {
      throw new Error('Password is required');
    }

    setUser(foundUser);
    localStorage.setItem('mockUser', JSON.stringify(foundUser));
  };

  const signup = async (email: string, password: string, fullName: string, username: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Check if username exists
    if (MOCK_USERS.some(u => u.username === username)) {
      throw new Error('Username already taken');
    }

    // Check if email exists
    if (MOCK_USERS.some(u => u.email === email)) {
      throw new Error('Email already registered');
    }

    const newUser: MockUser = {
      id: `user-${Date.now()}`,
      email,
      username,
      fullName,
      role: 'user',
    };

    // Add to mock users
    MOCK_USERS.push(newUser);
    
    setUser(newUser);
    localStorage.setItem('mockUser', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mockUser');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a MockAuthProvider');
  }
  return context;
}
