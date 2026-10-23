import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, BehaviorReport, RubricAspect, Startup, Batch, ActivityLog } from './types';
import { authApi, usersApi, reportsApi, rubricsApi, startupsApi, batchesApi, activitiesApi, setToken, clearToken, hasToken } from './api';
import { computeInternScore } from './utils';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  reports: BehaviorReport[];
  startups: Startup[];
  batches: Batch[];
  rubricAspects: RubricAspect[];
  activities: any[];
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  register: (user: { name: string; email: string; password: string; role: string; nim?: string; startup?: string; lecturerCode?: string; advisedStartups?: string[] }) => Promise<void>;
  addUser: (user: { name: string; email: string; password: string; role: string; nim?: string; startup?: string; lecturerCode?: string; advisedStartups?: string[] }) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  suspendUser: (id: string, suspended: boolean) => Promise<void>;
  addReport: (report: Omit<BehaviorReport, 'id'>) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  updateScore: (internId: string, newScore: number, rubricScores?: Record<string, number>) => Promise<void>;
  updateRubricAspects: (aspects: RubricAspect[], reassign?: Record<string, string>) => Promise<void>;
  addStartup: (startup: Omit<Startup, 'id'>) => Promise<void>;
  updateStartup: (id: string, updates: Partial<Startup>) => Promise<void>;
  deleteStartup: (id: string) => Promise<void>;
  addBatch: (batch: Omit<Batch, 'id'>) => Promise<void>;
  updateBatch: (id: string, updates: Partial<Batch>) => Promise<void>;
  deleteBatch: (id: string) => Promise<void>;
  addActivity: (activity: any) => Promise<void>;
  updateActivityStatus: (id: string, status: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mapFrontendUser = (u: any): User => {
  if (!u) return u;
  return {
    ...u,
    lecturerCode: u.lecturerCode || u.lecturer_code,
    advisedStartups: u.advisedStartups || u.advised_startups || [],
    photoUrl: u.photoUrl || u.photo_url,
    rubricScores: u.rubricScores || u.rubric_scores,
  };
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<BehaviorReport[]>([]);
  const [rubricAspects, setRubricAspects] = useState<RubricAspect[]>([]);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data from API
  const refreshData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        usersApi.list(),
        reportsApi.list(),
        rubricsApi.list(),
        startupsApi.list(),
        batchesApi.list(),
        activitiesApi.list(),
      ]);
      
      let loadedUsers = [];
      let loadedReports = [];
      let loadedRubrics = [];

      if (results[1].status === 'fulfilled') {
        loadedReports = results[1].value;
        setReports(loadedReports);
      }
      if (results[2].status === 'fulfilled') {
        loadedRubrics = results[2].value;
        setRubricAspects(loadedRubrics);
      }
      if (results[3].status === 'fulfilled') setStartups(results[3].value);
      if (results[4].status === 'fulfilled') setBatches(results[4].value);
      if (results[5].status === 'fulfilled') setActivities(results[5].value);

      if (results[0].status === 'fulfilled') {
        loadedUsers = (results[0].value as any[]).map(mapFrontendUser);
        
        // Fix for bug: dynamically compute total score for interns
        loadedUsers = loadedUsers.map(user =>
          user.role === 'intern'
            ? { ...user, score: computeInternScore(user, loadedRubrics, loadedReports) }
            : user
        );

        setUsers(loadedUsers);
      }

      const errors = results.filter(r => r.status === 'rejected').map((r: any) => r.reason?.message || 'Gagal memuat sebagian data');
      if (errors.length > 0) {
        setError(errors.join(', '));
      } else {
        setError(null);
      }
    } catch (err: any) {
      console.error('Failed to refresh data:', err);
      setError(err.message);
    }
  }, []);

  // Auto-login if token exists
  useEffect(() => {
    const initAuth = async () => {
      if (hasToken()) {
        try {
          const user = await authApi.me();
          setCurrentUser(mapFrontendUser(user));
          await refreshData();
        } catch {
          clearToken();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [refreshData]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      setError(null);
      const { token, user } = await authApi.login(email, pass);
      setToken(token);
      setCurrentUser(mapFrontendUser(user));
      await refreshData();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const logout = () => {
    clearToken();
    window.location.hash = '';
    setCurrentUser(null);
    setUsers([]);
    setReports([]);
    setRubricAspects([]);
    setStartups([]);
    setBatches([]);
    setActivities([]);
  };

  const register = async (userData: { name: string; email: string; password: string; role: string; nim?: string; startup?: string; lecturerCode?: string; advisedStartups?: string[] }) => {
    try {
      const { token, user } = await authApi.register(userData);
      setToken(token);
      setCurrentUser(mapFrontendUser(user));
      await refreshData();
      return { success: true, message: '' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Pendaftaran gagal.' };
    }
  };

  const addUser = async (userData: { name: string; email: string; password: string; role: string; nim?: string; startup?: string; lecturerCode?: string; advisedStartups?: string[] }) => {
    await usersApi.create(userData);
    await refreshData();
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    const updatedUser = await usersApi.update(id, updates);
    const mapped = mapFrontendUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === id ? mapped : u));
    if (currentUser?.id === id) {
      setCurrentUser(mapped);
    }
  };

  const deleteUser = async (id: string) => {
    await usersApi.delete(id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const suspendUser = async (id: string, suspended: boolean) => {
    const updatedUser = await usersApi.suspend(id, suspended);
    setUsers(prev => prev.map(u => u.id === id ? mapFrontendUser(updatedUser) : u));
  };

  const addReport = async (report: Omit<BehaviorReport, 'id'>) => {
    await reportsApi.create(report);
    await refreshData();
  };

  const deleteReport = async (id: string) => {
    await reportsApi.delete(id);
    await refreshData();
  };

  const updateScore = async (internId: string, newScore: number, rubricScores?: Record<string, number>) => {
    await usersApi.updateScore(internId, newScore, rubricScores);
    await refreshData();
  };

  const updateRubricAspects = async (aspects: RubricAspect[], reassign?: Record<string, string>) => {
    await rubricsApi.update(aspects, reassign);
    await refreshData();
  };

  const addStartup = async (startup: Omit<Startup, 'id'>) => {
    const newStartup = await startupsApi.create(startup);
    setStartups(prev => [...prev, newStartup]);
  };

  const updateStartup = async (id: string, updates: Partial<Startup>) => {
    const updatedStartup = await startupsApi.update(id, updates);
    setStartups(prev => prev.map(s => s.id === id ? updatedStartup : s));
  };

  const deleteStartup = async (id: string) => {
    await startupsApi.delete(id);
    setStartups(prev => prev.filter(s => s.id !== id));
  };

  const addBatch = async (batch: Omit<Batch, 'id'>) => {
    const newBatch = await batchesApi.create(batch as any);
    setBatches(prev => [newBatch, ...prev]);
  };

  const updateBatch = async (id: string, updates: Partial<Batch>) => {
    const updatedBatch = await batchesApi.update(id, updates as any);
    setBatches(prev => prev.map(b => b.id === id ? updatedBatch : b));
  };

  const deleteBatch = async (id: string) => {
    await batchesApi.delete(id);
    setBatches(prev => prev.filter(b => b.id !== id));
  };

  const addActivity = async (activity: any) => {
    const newAct = await activitiesApi.create(activity);
    setActivities(prev => [newAct, ...prev]);
  };

  const updateActivityStatus = async (id: string, status: string) => {
    const updated = await activitiesApi.updateStatus(id, status);
    setActivities(prev => prev.map(a => a.id === id ? updated : a));
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, reports, startups, batches, rubricAspects, activities,
      loading, error,
      login, logout, register, addUser, updateUser, deleteUser, suspendUser,
      addReport, deleteReport, updateScore, updateRubricAspects,
      addStartup, updateStartup, deleteStartup,
      addBatch, updateBatch, deleteBatch,
      addActivity, updateActivityStatus,
      refreshData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
