
import { User } from "../types";

const DB_KEY = "sonicforge_mongodb_users";
const SESSION_KEY = "sonicforge_session_user";

// Simulated MongoDB Collection
const getUsers = (): User[] => {
  const stored = localStorage.getItem(DB_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveUsers = (users: User[]) => {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
};

export const authService = {
  
  // Register a new user (simulates db.users.insertOne)
  register: async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const users = getUsers();
    
    // Check duplicate email
    if (users.some(u => u.email === userData.email)) {
      throw new Error("User with this email already exists.");
    }

    const newUser: User = {
      id: Math.random().toString(36).substring(2, 15),
      createdAt: Date.now(),
      ...userData
    };

    users.push(newUser);
    saveUsers(users);
    
    // Auto login
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    return newUser;
  },

  // Login user (simulates db.users.findOne)
  login: async (email: string, password: string): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // ADMIN BACKDOOR / HARDCODED CREDENTIALS
    if (email === 'harsh@gmail.com' && password === '1234') {
      const adminUser: User = {
        id: 'admin-root-001',
        username: 'System Administrator',
        email: 'harsh@gmail.com',
        phone: 'ADMIN-SECURE-LINE',
        createdAt: Date.now(),
        isAdmin: true
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
      return adminUser;
    }

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  // Logout
  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  // Check session on load
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  // Get all users (For Admin Panel)
  getAllUsers: (): User[] => {
    return getUsers();
  }
};
