import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ExposureRecord, NotificationItem, ThresholdConfig, RiskLevel, ExposureAnalysisResult, AttendanceRecord } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { appStorage } from '../services/storage';

interface AppContextType {
  users: User[];
  exposureRecords: ExposureRecord[];
  thresholds: ThresholdConfig;
  notifications: NotificationItem[];
  attendance: AttendanceRecord | null;
  isAttendanceLoading: boolean;
  hasCheckedInToday: boolean;
  allTodayAttendance: AttendanceRecord[];
  lastScanResult: ExposureAnalysisResult | null;
  setLastScanResult: (result: ExposureAnalysisResult | null) => void;
  calculateRiskLevel: (h2sPpm: number) => RiskLevel;
  addExposureRecord: (record: Omit<ExposureRecord, 'id' | 'riskLevel'>) => Promise<ExposureRecord>;
  markAsConsulted: (recordId: string) => Promise<void>;
  updateThresholds: (normal: number, high: number) => Promise<void>;
  generateReport: (recordId: string) => void;
  addWorker: (name: string, employeeId: string, department: string, password?: string) => Promise<void>;
  addSafetyOfficer: (name: string, employeeId: string, department: string, password?: string) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  markNotificationRead: (notifId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  checkInAttendance: (shiftName: string, department?: string) => Promise<AttendanceRecord>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({
  users: [],
  exposureRecords: [],
  thresholds: { normalThreshold: 5.0, highThreshold: 9.0 },
  notifications: [],
  attendance: null,
  isAttendanceLoading: false,
  hasCheckedInToday: false,
  allTodayAttendance: [],
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
  markAllNotificationsRead: async () => {},
  checkInAttendance: async () => ({} as AttendanceRecord),
  refreshData: async () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, role } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [exposureRecords, setExposureRecords] = useState<ExposureRecord[]>([]);
  const [thresholds, setThresholds] = useState<ThresholdConfig>({ normalThreshold: 5.0, highThreshold: 9.0 });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState<boolean>(true);
  const [allTodayAttendance, setAllTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [lastScanResult, setLastScanResult] = useState<ExposureAnalysisResult | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const workerKey = currentUser?.employeeId || currentUser?.id || 'worker';
  const hasCheckedInToday = Boolean(
    attendance ||
    (currentUser?.employeeId && appStorage.getItemSync(`attendance_checked_in_${workerKey}_${todayStr}`) === 'true')
  );

  const calculateRiskLevel = (h2sPpm: number): RiskLevel => {
    const normalMax = thresholds.normalThreshold ?? 5.0;
    const highMax = thresholds.highThreshold ?? 9.0;
    if (h2sPpm <= normalMax) return 'normal';
    if (h2sPpm <= highMax) return 'average';
    return 'high';
  };

  const refreshData = async () => {
    if (!currentUser) return;
    setIsAttendanceLoading(true);
    try {
      // 1. Fetch Thresholds & Notifications in parallel
      const [fetchedThresholds, fetchedNotifs] = await Promise.all([
        api.getThreshold().catch(() => ({ normalThreshold: 5.0, highThreshold: 9.0 })),
        api.getMyNotifications(role || 'worker').catch(() => []),
      ]);
      setThresholds(fetchedThresholds);
      setNotifications(fetchedNotifs);

      // 2. Fetch Exposure Records & Attendance strictly based on Role
      if (role === 'worker') {
        const [myExposures, att] = await Promise.all([
          api.getMyExposures().catch(() => []),
          api.getTodayAttendance().catch(() => null),
        ]);
        setExposureRecords(myExposures);
        setAttendance(att);
        if (att) {
          appStorage.setItem(`attendance_checked_in_${workerKey}_${todayStr}`, 'true');
        }
        setIsAttendanceLoading(false);
      } else {
        setIsAttendanceLoading(false);
        const [allExposures, allAtt, allUsers] = await Promise.all([
          api.getAllExposures().catch(() => []),
          api.getAllTodayAttendance().catch(() => []),
          (role === 'safetyOfficer' || role === 'admin') ? api.getAllUsers().catch(() => []) : Promise.resolve([]),
        ]);
        setExposureRecords(allExposures);
        setAllTodayAttendance(allAtt);
        if (role === 'safetyOfficer' || role === 'admin') {
          setUsers(allUsers);
        }
      }
    } catch (e) {
      setIsAttendanceLoading(false);
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
      setAttendance(null);
      setAllTodayAttendance([]);
    }
  }, [currentUser]);

  const addExposureRecord = async (recordData: Omit<ExposureRecord, 'id' | 'riskLevel'>): Promise<ExposureRecord> => {
    const workerIdToUse = recordData.workerId || currentUser?.employeeId || currentUser?.id || 'WORKER';

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
        prevRecords.map((r) =>
          r.id === recordId
            ? { ...r, consulted: true, consultedAt: new Date().toLocaleTimeString() }
            : r
        )
      );
    }
  };

  const updateThresholds = async (normal: number, high: number) => {
    try {
      const updated = await api.updateThreshold(normal, high);
      setThresholds(updated);
    } catch (err) {
      console.error('Failed to update threshold:', err);
      setThresholds({ normalThreshold: normal, highThreshold: high });
    }
  };

  const generateReport = (recordId: string) => {
    setExposureRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, reportGenerated: true } : r))
    );
  };

  const addWorker = async (name: string, employeeId: string, department: string, password?: string) => {
    try {
      const newWorker = await api.addWorker({
        userId: employeeId,
        fullName: name,
        department,
        password,
      });
      setUsers((prev) => [...prev, newWorker]);
    } catch (err) {
      console.error('Failed to add worker:', err);
      throw err;
    }
  };

  const addSafetyOfficer = async (name: string, employeeId: string, department: string, password?: string) => {
    try {
      const newOfficer = await api.addSafetyOfficer({
        userId: employeeId,
        fullName: name,
        department,
        password,
      });
      setUsers((prev) => [...prev, newOfficer]);
    } catch (err) {
      console.error('Failed to add safety officer:', err);
      throw err;
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

  const markAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const checkInAttendance = async (shiftName: string, department?: string): Promise<AttendanceRecord> => {
    try {
      const record = await api.checkInAttendance(shiftName, department);
      setAttendance(record);
      setIsAttendanceLoading(false);
      appStorage.setItem(`attendance_checked_in_${workerKey}_${todayStr}`, 'true');
      await refreshData();
      return record;
    } catch (err) {
      console.error('Failed to check in attendance:', err);
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        users,
        exposureRecords,
        thresholds,
        notifications,
        attendance,
        isAttendanceLoading,
        hasCheckedInToday,
        allTodayAttendance,
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
        markAllNotificationsRead,
        checkInAttendance,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
