import { createContext, useContext, useState, useCallback } from 'react';
import { users, getAccessibleTree, getNavigableItems } from '../data/orgStructure';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('dq_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((email, password) => {
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      setUser(found);
      sessionStorage.setItem('dq_user', JSON.stringify(found));
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('dq_user');
  }, []);

  const getTree = useCallback(() => {
    if (!user) return null;
    return getAccessibleTree(user);
  }, [user]);

  const getNavItems = useCallback(() => {
    if (!user) return [];
    const tree = getAccessibleTree(user);
    if (!tree) return [];
    return getNavigableItems(tree, user.scopePath);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, getTree, getNavItems }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
