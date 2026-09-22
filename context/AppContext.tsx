import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ExposureRecord, NotificationItem, ThresholdConfig, RiskLevel, ExposureAnalysisResult } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface AppContextType {
  users: User[];
  exposureRecords: ExposureRecord[];
  thresholds: ThresholdConfig;
  notifications: NotificationItem[];
  lastScanResult: ExposureAnalysisResult | null;
  setLastScanResult: (result: ExposureAnalysisResult | null) => void;
  calculateRiskLevel: (h2sPpm: number) => RiskLevel;
  addExposureRecord: (record: Omit<ExposureRecord, 'id' | 'riskLevel'>) => Promise<ExposureRecord>;
  markAsConsulted: (recordId: string) => Promise<void>;
  updateThresholds: (normal: number, high: number) => Promise<void>;
  generateReport: (recordId: string) => void;
  addWorker: (name: string, employeeId: string, department: string) => Promise<void>;
  addSafetyOfficer: (name: string, employeeId: string, department: string) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  markNotificationRead: (notifId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({
  users: [],
  exposureRecords: [],
  thresholds: { normalThreshold: 15, highThreshold: 35 },
  notifications: [],
  lastScanResult: null,
  setLastScanResult: () => {},
  calculateRiskLevel: () => 'normal',
  addExposureRecord: async () => ({} as ExposureRecord),
  markAsConsulted: async () => {},
  updateThresholds: async () => {},
  generateReport: () => {},
  addWorker: async () => {},
  addSafetyOfficer: async () => {},
  deactivateUser: async () => {},
  deleteUser: async () => {},
  markNotificationRead: async () => {},
  refreshData: async () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, role } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [exposureRecords, setExposureRecords] = useState<ExposureRecord[]>([]);
  const [thresholds, setThresholds] = useState<ThresholdConfig>({ normalThreshold: 15, highThreshold: 35 });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [lastScanResult, setLastScanResult] = useState<ExposureAnalysisResult | null>(null);

  const calculateRiskLevel = (h2sPpm: number): RiskLevel => {
    if (h2sPpm <= thresholds.normalThreshold) return 'normal';
    if (h2sPpm <= thresholds.highThreshold) return 'average';
    return 'high';
  };

  const refreshData = async () => {
    if (!currentUser) return;
    try {
      // 1. Fetch Thresholds
      const fetchedThresholds = await api.getThreshold();
      setThresholds(fetchedThresholds);

      // 2. Fetch Notifications
      const fetchedNotifs = await api.getMyNotifications(role || 'worker');
      setNotifications(fetchedNotifs);

      // 3. Fetch Exposure Records based on Role
      if (role === 'worker') {
        const myExposures = await api.getMyExposures();
        if (myExposures.length === 0) {
          // Fallback to all exposures if my is empty so seeded records or team scans remain visible
          const all = await api.getAllExposures();
          setExposureRecords(all.length > 0 ? all : myExposures);
        } else {
          setExposureRecords(myExposures);
        }
      } else {
        const allExposures = await api.getAllExposures();
        setExposureRecords(allExposures);
      }

      // 4. Fetch Users list for Staff
      if (role === 'safetyOfficer' || role === 'admin') {
        const allUsers = await api.getAllUsers();
        setUsers(allUsers);
      }
    } catch (e) {
      console.error('Error fetching live data from API Gateway:', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshData();
    } else {
      setUsers([]);
      setExposureRecords([]);
      setNotifications([]);
    }
  }, [currentUser]);

  const addExposureRecord = async (recordData: Omit<ExposureRecord, 'id' | 'riskLevel'>): Promise<ExposureRecord> => {
    const workerIdToUse = recordData.workerId || currentUser?.employeeId || currentUser?.id || 'SID001';
    
    try {
      const created = await api.recordExposure({
        workerId: workerIdToUse,
        predictedPpm: recordData.h2sLevelPpm,
        exposureDuration: recordData.exposureDurationMinutes,
      });

      setExposureRecords((prev) => {
        const existing = prev.filter((r) => r.id !== created.id);
        return [created, ...existing];
      });

      await refreshData();
      return created;
    } catch (err) {
      console.error('Error calling recordExposure API:', err);
      const risk = calculateRiskLevel(recordData.h2sLevelPpm);
      const fallbackRecord: ExposureRecord = {
        ...recordData,
        id: `rec-${Date.now()}`,
        riskLevel: risk,
        reportGenerated: true,
        consulted: false,
      };
      setExposureRecords((prev) => [fallbackRecord, ...prev]);
      return fallbackRecord;
    }
  };

  const markAsConsulted = async (recordId: string) => {
    try {
      const updated = await api.markConsulted(recordId);
      setExposureRecords((prev) => prev.map((r) => (r.id === recordId ? updated : r)));
      await refreshData();
    } catch (err) {
      console.error('Failed to mark as consulted:', err);
      setExposureRecords((prevRecords) =>
        prevRecords.map((rec) =>
          rec.id === recordId ? { ...rec, consulted: true, consultedBy: 'Safety Officer' } : rec
        )
      );
    }
  };

  const updateThresholds = async (normal: number, high: number) => {
    try {
      const updated = await api.updateThreshold(normal, high);
      setThresholds(updated);
      await refreshData();
    } catch (err) {
      console.error('Failed to update thresholds:', err);
      setThresholds({ normalThreshold: normal, highThreshold: high });
    }
  };

  const generateReport = (recordId: string) => {
    setExposureRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, reportGenerated: true } : r))
    );
  };

  const addWorker = async (name: string, employeeId: string, department: string) => {
    try {
      const newWorker = await api.addWorker({
        userId: employeeId,
        fullName: name,
        department,
      });
      setUsers((prev) => [...prev, newWorker]);
      await refreshData();
    } catch (err) {
      console.error('Failed to add worker:', err);
    }
  };

  const addSafetyOfficer = async (name: string, employeeId: string, department: string) => {
    try {
      const newSo = await api.addSafetyOfficer({
        userId: employeeId,
        fullName: name,
        department,
      });
      setUsers((prev) => [...prev, newSo]);
      await refreshData();
    } catch (err) {
      console.error('Failed to add safety officer:', err);
    }
  };

  const deactivateUser = async (userId: string) => {
    try {
      await api.deactivateUser(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId || u.employeeId === userId ? { ...u, status: 'deactivated' } : u))
      );
    } catch (err) {
      console.error('Failed to deactivate user:', err);
    }
  };

  const deleteUser = async (userId: string) => {
    await deactivateUser(userId);
  };

  const markNotificationRead = async (notifId: string) => {
    try {
      await api.markNotificationRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
    }
  };

  return (
    <AppContext.Provider
      value={{
        users,
        exposureRecords,
        thresholds,
        notifications,
        lastScanResult,
        setLastScanResult,
        calculateRiskLevel,
        addExposureRecord,
        markAsConsulted,
        updateThresholds,
        generateReport,
        addWorker,
        addSafetyOfficer,
        deactivateUser,
        deleteUser,
        markNotificationRead,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

