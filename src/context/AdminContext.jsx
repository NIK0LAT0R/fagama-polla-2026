
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ADMIN_PASSWORD, ADMIN_SESSION_KEY } from '../config/admin.js';
import AdminPasswordModal from '../components/Admin/AdminPasswordModal.jsx';

const AdminContext = createContext(null);

function loadAdminSession() {
  try {
    return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveAdminSession(isAdmin) {
  try {
    if (isAdmin) {
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
    } else {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(loadAdminSession);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const pendingActionRef = useRef(null);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalError('');
    pendingActionRef.current = null;
  }, []);

  const loginAdmin = useCallback(async (password) => {
    if (password !== ADMIN_PASSWORD) {
      setModalError('Incorrect password. Try again.');
      return false;
    }

    setIsAdmin(true);
    saveAdminSession(true);
    setModalError('');
    setModalOpen(false);

    const pendingAction = pendingActionRef.current;
    pendingActionRef.current = null;

    if (pendingAction) {
      try {
        await pendingAction();
      } catch (error) {
        console.error('Admin pending action failed:', error);
      }
    }

    return true;
  }, []);

  const logoutAdmin = useCallback(() => {
    setIsAdmin(false);
    saveAdminSession(false);
    closeModal();
  }, [closeModal]);

  const requireAdmin = useCallback(
    async (action) => {
      if (isAdmin) {
        try {
          return await action();
        } catch (error) {
          console.error('requireAdmin action failed:', error);
          throw error;
        }
      }

      pendingActionRef.current = action;
      setModalError('');
      setModalOpen(true);
      return false;
    },
    [isAdmin]
  );

  const value = useMemo(
    () => ({
      isAdmin,
      loginAdmin,
      logoutAdmin,
      requireAdmin,
    }),
    [isAdmin, loginAdmin, logoutAdmin, requireAdmin]
  );

  return (
    <AdminContext.Provider value={value}>
      {children}

      <AdminPasswordModal
        open={modalOpen}
        error={modalError}
        onSubmit={loginAdmin}
        onClose={closeModal}
      />
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);

  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }

  return context;
}
