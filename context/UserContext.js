import { createContext, useContext, useState } from 'react';
import { DEMO_USERS } from '../constants/mockData';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [partnerStatus, setPartnerStatus] = useState(null);

  const login = (userData) => setUser(userData);
  const logout = () => {
    setUser(null);
    setPartnerStatus(null);
  };

  const demoLogin = (role) => {
    const found = DEMO_USERS.find((u) => u.role === role);
    if (found) {
      setUser({
        name: found.name,
        nickname: found.nickname,
        babyNickname: found.babyNickname,
        email: found.email,
        role: found.role,
        pregnancyWeek: found.pregnancyWeek,
        inviteCode: found.inviteCode,
      });
    }
  };

  const updatePartnerStatus = (status) => setPartnerStatus(status);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        demoLogin,
        partnerStatus,
        updatePartnerStatus,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}