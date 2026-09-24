import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { User, UserRole, ExposureRecord, ThresholdConfig, NotificationItem, RiskLevel, AttendanceRecord } from '../types';

// Automatically resolve PC's IP address when running on a physical phone, or localhost on web
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    const host = (typeof window !== 'undefined' && window.location?.hostname) ? window.location.hostname : 'localhost';
    return `http://${host}:8080`;
  }
  const debuggerHost = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (debuggerHost) {
    const hostIp = debuggerHost.split(':')[0];
    return `http://${hostIp}:8080`;
  }
  return 'http://localhost:8080';
};

// API Gateway base URL
const BASE_URL = getBaseUrl();

const TOKEN_STORAGE_KEY = 'h2s_auth_token';

import { appStorage } from './storage';

// In-memory token storage with cross-platform persistence via appStorage
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    appStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    appStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

export const getAuthToken = () => {
  if (!authToken) {
    authToken = appStorage.getItemSync(TOKEN_STORAGE_KEY);
  }
  return authToken;
};

// Ensure token is present without forging artificial logins
export const ensureAuthToken = async (): Promise<string | null> => {
  if (authToken) return authToken;
  const persisted = await appStorage.getItem(TOKEN_STORAGE_KEY);
  if (persisted) {
    authToken = persisted;
    return persisted;
  }
  return null;
};

// Helper to standardise Headers
const getHeaders = (isMultipart = false) => {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Role mapper: Backend UPPERCASE enum -> Frontend camelCase
export const mapBackendRoleToFrontend = (role: string): UserRole => {
  switch (role?.toUpperCase()) {
    case 'ADMIN':
      return 'admin';
    case 'SAFETY_OFFICER':
      return 'safetyOfficer';
    case 'WORKER':
    default:
      return 'worker';
  }
};

export const mapFrontendRoleToBackend = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'ADMIN';
    case 'safetyOfficer':
      return 'SAFETY_OFFICER';
    case 'worker':
    default:
      return 'WORKER';
  }
};

// Risk level mapper: Evaluates numeric PPM first (ground truth) then falls back to level string
export const mapBackendRiskToFrontend = (level?: string, ppm?: number): RiskLevel => {
  // 1. Numeric PPM is the objective scientific threshold (>9.0 PPM High, >5.0 PPM Average)
  if (typeof ppm === 'number' && !isNaN(ppm) && ppm > 0) {
    if (ppm > 9.0) return 'high';
    if (ppm > 5.0) return 'average';
    return 'normal';
  }

  // 2. Fall back to backend category string
  const norm = level?.toUpperCase().replace(/\s+/g, '_');
  if (norm === 'HIGH' || norm === 'HIGH_RISK' || norm === 'CRITICAL') {
    return 'high';
  }
  if (norm === 'AVERAGE' || norm === 'MODERATE' || norm === 'MEDIUM') {
    return 'average';
  }
  if (norm === 'NORMAL' || norm === 'LOW' || norm === 'SAFE') {
    return 'normal';
  }

  return 'normal';
};

// User mapper
export const mapUserDtoToUser = (dto: any): User => ({
  id: String(dto.id || dto.userId),
  employeeId: dto.userId,
  name: dto.fullName || dto.userId,
  email: dto.email || '',
  phone: dto.phoneNumber || '',
  department: dto.department || 'Operations',
  role: mapBackendRoleToFrontend(dto.role),
  status: dto.active ? 'active' : 'deactivated',
  currentRiskLevel: mapBackendRiskToFrontend(dto.currentRiskLevel, dto.latestH2sPpm),
  latestH2sPpm: dto.latestH2sPpm || 0,
});

// Exposure record mapper
export const mapExposureDtoToRecord = (dto: any): ExposureRecord => {
  const dateObj = dto.exposureDateTime ? new Date(dto.exposureDateTime) : new Date();
  const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    id: String(dto.id),
    workerId: dto.workerId,
    workerName: dto.workerName || dto.workerId,
    timestamp: timeStr,
    date: dateStr,
    h2sLevelPpm: dto.predictedPpm ?? 0,
    exposureDurationMinutes: dto.exposureDuration ?? 0,
    riskLevel: mapBackendRiskToFrontend(dto.exposureLevel, dto.predictedPpm),
    confidencePercentage: 95,
    reportGenerated: dto.reportGeneratedStatus ?? true,
    consulted: dto.consultationStatus === 'CONSULTED',
    consultedAt: dto.consultedAt ? new Date(dto.consultedAt).toLocaleString() : undefined,
    consultedBy: dto.consultedBy || undefined,
  };
};

// Notification mapper
export const mapNotificationDtoToItem = (dto: any, role: UserRole = 'worker'): NotificationItem => {
  const dateObj = dto.createdAt ? new Date(dto.createdAt) : new Date();
  const timeAgo = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let notifType: NotificationItem['type'] = 'system';
  if (dto.notificationType === 'EXPOSURE_ALERT' || dto.notificationType === 'HIGH_EXPOSURE') notifType = 'exposure';
  else if (dto.notificationType === 'REPORT_GENERATED') notifType = 'report';
  else if (dto.notificationType === 'CONSULTATION_UPDATE') notifType = 'consultation';
  else if (dto.notificationType === 'ATTENDANCE_CHECKIN') notifType = 'attendance';

  return {
    id: String(dto.id),
    role: role,
    title: dto.title,
    message: dto.message,
    timestamp: timeAgo,
    read: dto.read ?? false,
    recordId: dto.referenceId ? String(dto.referenceId) : undefined,
    type: notifType,
  };
};

// API Methods
export const api = {
  // Auth
  async login(userId: string, pass: string) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId: userId.trim(), password: pass.trim() }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = errText;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.message) errorMsg = parsed.message;
      } catch {}
      throw new Error(errorMsg || `Login failed with status ${res.status}`);
    }

    const data = await res.json();
    setAuthToken(data.accessToken);
    return data;
  },

  // User Profile
  async getMyProfile(): Promise<User> {
    const res = await fetch(`${BASE_URL}/api/users/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    const data = await res.json();
    return mapUserDtoToUser(data);
  },

  async updateMyProfile(updated: { fullName?: string; phoneNumber?: string; email?: string; department?: string }): Promise<User> {
    const res = await fetch(`${BASE_URL}/api/users/me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updated),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    const data = await res.json();
    return mapUserDtoToUser(data);
  },

  async getAllUsers(): Promise<User[]> {
    const res = await fetch(`${BASE_URL}/api/users`, {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(mapUserDtoToUser);
  },

  async addWorker(workerData: { userId: string; fullName: string; department: string; phoneNumber?: string; email?: string; password?: string }): Promise<User> {
    await ensureAuthToken();
    const res = await fetch(`${BASE_URL}/api/users/workers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        userId: workerData.userId,
        fullName: workerData.fullName,
        department: workerData.department,
        role: 'WORKER',
        phoneNumber: workerData.phoneNumber || 'N/A',
        email: workerData.email || `${workerData.userId.toLowerCase()}@h2sguard.com`,
        password: workerData.password || 'password123',
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Failed to create worker');
    }
    const data = await res.json();
    return mapUserDtoToUser(data);
  },

  async addSafetyOfficer(soData: { userId: string; fullName: string; department: string; phoneNumber?: string; email?: string; password?: string }): Promise<User> {
    await ensureAuthToken();
    const res = await fetch(`${BASE_URL}/api/users/safety-officers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        userId: soData.userId,
        fullName: soData.fullName,
        department: soData.department,
        role: 'SAFETY_OFFICER',
        phoneNumber: soData.phoneNumber || 'N/A',
        email: soData.email || `${soData.userId.toLowerCase()}@h2sguard.com`,
        password: soData.password || 'password123',
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Failed to create safety officer');
    }
    const data = await res.json();
    return mapUserDtoToUser(data);
  },

  async deactivateUser(userId: string): Promise<void> {
    await fetch(`${BASE_URL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  // Thresholds
  async getThreshold(): Promise<ThresholdConfig> {
    try {
      const res = await fetch(`${BASE_URL}/api/exposures/threshold`, {
        headers: getHeaders(),
      });
      if (!res.ok) return { normalThreshold: 5.0, highThreshold: 9.0 };
      const data = await res.json();
      return {
        normalThreshold: data.normalMaxPpm ?? 5.0,
        highThreshold: data.averageMaxPpm ?? 9.0,
      };
    } catch {
      return { normalThreshold: 5.0, highThreshold: 9.0 };
    }
  },

  async updateThreshold(normal: number, high: number): Promise<ThresholdConfig> {
    const res = await fetch(`${BASE_URL}/api/exposures/threshold`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ normalMaxPpm: normal, averageMaxPpm: high }),
    });
    if (!res.ok) throw new Error('Failed to update threshold');
    const data = await res.json();
    return {
      normalThreshold: data.normalMaxPpm,
      highThreshold: data.averageMaxPpm,
    };
  },

  // Exposure Records
  async getMyExposures(): Promise<ExposureRecord[]> {
    await ensureAuthToken();
    try {
      const res = await fetch(`${BASE_URL}/api/exposures/my`, {
        headers: getHeaders(),
      });
      if (res.status === 403) {
        // Fallback for admin or supervisor roles who have permission for /all
        return this.getAllExposures();
      }
      if (!res.ok) return [];
      const data = await res.json();
      return data.map(mapExposureDtoToRecord);
    } catch {
      return [];
    }
  },

  async getAllExposures(): Promise<ExposureRecord[]> {
    await ensureAuthToken();
    try {
      const res = await fetch(`${BASE_URL}/api/exposures/all`, {
        headers: getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.map(mapExposureDtoToRecord);
    } catch {
      return [];
    }
  },

  async recordExposure(record: { workerId: string; predictedPpm: number; exposureDuration: number }): Promise<ExposureRecord> {
    await ensureAuthToken();
    const res = await fetch(`${BASE_URL}/api/exposures`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        workerId: record.workerId,
        predictedPpm: record.predictedPpm,
        exposureDuration: record.exposureDuration,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Failed to record exposure (${res.status}):`, errText);
      throw new Error(`Failed to record exposure (${res.status}): ${errText}`);
    }
    const data = await res.json();
    return mapExposureDtoToRecord(data);
  },

  async markConsulted(exposureId: string): Promise<ExposureRecord> {
    const res = await fetch(`${BASE_URL}/api/exposures/${exposureId}/consult`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark exposure as consulted');
    const data = await res.json();
    return mapExposureDtoToRecord(data);
  },

  // Notifications
  async getMyNotifications(userRole: UserRole = 'worker'): Promise<NotificationItem[]> {
    const res = await fetch(`${BASE_URL}/api/notifications/my`, {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((n: any) => mapNotificationDtoToItem(n, userRole));
  },

  async markNotificationRead(notifId: string): Promise<void> {
    await fetch(`${BASE_URL}/api/notifications/${notifId}/read`, {
      method: 'PUT',
      headers: getHeaders(),
    });
  },

  async markAllNotificationsRead(): Promise<void> {
    await ensureAuthToken();
    await fetch(`${BASE_URL}/api/notifications/my/read-all`, {
      method: 'PUT',
      headers: getHeaders(),
    });
  },

  // Daily Worker Shift Attendance
  async checkInAttendance(shiftName: string, department?: string): Promise<AttendanceRecord> {
    await ensureAuthToken();
    const res = await fetch(`${BASE_URL}/api/users/attendance/check-in`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ shiftName, department }),
    });
    if (!res.ok) {
      if (res.status === 409) {
        // Worker already checked in today - retrieve and return existing active attendance
        const existing = await this.getTodayAttendance();
        if (existing) return existing;
        return {
          id: 'existing',
          workerId: '',
          workerName: '',
          shiftName: shiftName || 'Shift A: 06:00–14:00',
          checkInDate: new Date().toISOString().split('T')[0],
          checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          department: department || 'Operations',
        };
      }
      const err = await res.text();
      let errMsg = 'Failed to record attendance';
      try {
        const parsed = JSON.parse(err);
        errMsg = parsed.message || parsed.error || errMsg;
      } catch {}
      throw new Error(errMsg);
    }
    const data = await res.json();
    return {
      id: String(data.id),
      workerId: data.workerId,
      workerName: data.workerName,
      shiftName: data.shiftName,
      checkInDate: data.checkInDate,
      checkInTime: data.checkInTime,
      department: data.department,
    };
  },

  async getTodayAttendance(): Promise<AttendanceRecord | null> {
    await ensureAuthToken();
    try {
      const res = await fetch(`${BASE_URL}/api/users/attendance/today`, {
        headers: getHeaders(),
      });
      if (res.status === 204 || !res.ok) return null;
      const data = await res.json();
      if (!data || !data.id) return null;
      return {
        id: String(data.id),
        workerId: data.workerId,
        workerName: data.workerName,
        shiftName: data.shiftName,
        checkInDate: data.checkInDate,
        checkInTime: data.checkInTime,
        department: data.department,
      };
    } catch {
      return null;
    }
  },

  async getAllTodayAttendance(): Promise<AttendanceRecord[]> {
    await ensureAuthToken();
    try {
      const res = await fetch(`${BASE_URL}/api/users/attendance/all-today`, {
        headers: getHeaders(),
      });
      if (!res.ok) return [];
      const list = await res.json();
      return list.map((data: any) => ({
        id: String(data.id),
        workerId: data.workerId,
        workerName: data.workerName,
        shiftName: data.shiftName,
        checkInDate: data.checkInDate,
        checkInTime: data.checkInTime,
        department: data.department,
      }));
    } catch {
      return [];
    }
  },

  // AI Image Analysis (FastAPI AI Microservice + Spring Gateway fallback)
  async analyzeImage(imageUri: string, workerId: string = 'W001', preloadedBase64?: string | null) {
    try {
      await ensureAuthToken();
    } catch (_) {}

    let hostIp = 'localhost';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.location?.hostname) {
        hostIp = window.location.hostname;
      }
    } else {
      const debuggerHost = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
      if (debuggerHost) hostIp = debuggerHost.split(':')[0];
    }
    const AI_DIRECT_URL = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_AI_API_URL) || `http://${hostIp}:5000`;

    const PUBLIC_TUNNEL = 'https://h2sguard-ai.loca.lt';
    const endpoints = Platform.OS === 'web'
      ? [
          `${AI_DIRECT_URL}/api/analysis`,
          `${BASE_URL}/api/analysis`,
          `${PUBLIC_TUNNEL}/api/analysis`,
        ]
      : [
          `${BASE_URL}/api/analysis`,
          `${AI_DIRECT_URL}/api/analysis`,
          `${PUBLIC_TUNNEL}/api/analysis`,
        ];

    const rawFilename = imageUri.split('/').pop()?.split('?')[0] || 'photo.jpg';
    const filename = rawFilename.includes('.') ? rawFilename : `${rawFilename}.jpg`;
    const fileType = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    const mapAiResponse = (data: any) => ({
      h2sLevel: data.h2sLevelPpm ?? data.predictedPpm ?? 0,
      exposureDuration: data.recommendedDurationMinutes || 15,
      confidence: data.confidencePercentage || data.confidence || 95,
      riskLevel: data.riskLevel || 'normal',
      exposureLevel: data.exposureLevel || 'NORMAL',
      riskCategory: data.riskCategory || 'Normal / Safe',
      status: data.status || 'PROCESSED',
      sensorStatus: data.sensorStatus || 'VALID_CALIBRATED_RANGE',
      retakeRequired: data.retakeRequired || false,
      warning: data.warning || null,
      message: data.message || null,
      isMock: data.isMock || false,
      features: data.features || {},
      presenceInfo: data.presenceInfo || {},
      sensorDetected: data.sensorDetected !== undefined ? data.sensorDetected : true,
      sensorConfidence: data.sensorConfidence ?? 0,
      imageQuality: data.imageQuality || 'GOOD',
      predictionConfidence: data.predictionConfidence ?? 0,
    });

    // 1. Resolve Base64 representation (immune to React Native FormData bugs)
    let base64Data = preloadedBase64 || null;
    if (!base64Data) {
      if (Platform.OS === 'web') {
        try {
          const blobRes = await fetch(imageUri);
          const blob = await blobRes.blob();
          base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const resStr = reader.result as string;
              resolve(resStr.includes(',') ? resStr.split(',')[1] : resStr);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn('[AI Engine] Web base64 reading failed:', e);
        }
      } else {
        try {
          const FileSystem = require('expo-file-system/legacy');
          base64Data = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (fsErr) {
          try {
            const FileSystem = require('expo-file-system');
            if (typeof FileSystem.readAsStringAsync === 'function') {
              base64Data = await FileSystem.readAsStringAsync(imageUri, {
                encoding: 'base64',
              });
            }
          } catch (e2) {
            console.warn('[AI Engine] Native FileSystem read base64 failed:', e2);
          }
        }
      }
    }

    // 2. Primary Execution: Pure JSON POST with Base64 payload
    if (base64Data) {
      for (const endpoint of endpoints) {
        try {
          const isDirectAi = endpoint.includes(':5000') || endpoint.includes('loca.lt');
          const reqHeaders: Record<string, string> = isDirectAi
            ? { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' }
            : { ...getHeaders(), 'Bypass-Tunnel-Reminder': 'true' };

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: reqHeaders,
            body: JSON.stringify({
              image: base64Data,
              workerId: workerId || 'ANONYMOUS',
              fileName: filename,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
              const preview = await res.text().catch(() => '');
              console.warn(`[AI Engine] ${endpoint} returned non-JSON content-type (${contentType}):`, preview.slice(0, 120));
              continue;
            }
            const data = await res.json();
            console.log(`[AI Engine] Success via Base64 JSON from ${endpoint}:`, data);
            return mapAiResponse(data);
          } else {
            const errBody = await res.text().catch(() => '');
            console.warn(`[AI Engine] HTTP ${res.status} from ${endpoint}:`, errBody.slice(0, 150));
          }
        } catch (err: any) {
          console.warn(`[AI Engine] Base64 JSON attempt failed for ${endpoint}:`, err?.message || err);
        }
      }
    }

    // 3. Native Fallback: Use native OkHttp FileSystem.uploadAsync on iOS & Android
    if (Platform.OS !== 'web') {
      try {
        const FileSystem = require('expo-file-system/legacy');
        if (typeof FileSystem.uploadAsync === 'function') {
          for (const endpoint of endpoints) {
            try {
              const uploadRes = await FileSystem.uploadAsync(endpoint, imageUri, {
                httpMethod: 'POST',
                uploadType: FileSystem.FileSystemUploadType.MULTIPART,
                fieldName: 'file',
                parameters: { workerId: workerId || 'ANONYMOUS' },
                headers: {
                  'Bypass-Tunnel-Reminder': 'true',
                  ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
                },
              });
              if (uploadRes.status >= 200 && uploadRes.status < 300) {
                if (uploadRes.body.trim().startsWith('<')) {
                  console.warn(`[AI Engine] uploadAsync received HTML from ${endpoint}, skipping...`);
                  continue;
                }
                const data = JSON.parse(uploadRes.body);
                console.log(`[AI Engine] Success via native uploadAsync from ${endpoint}:`, data);
                return mapAiResponse(data);
              }
            } catch (upErr: any) {
              console.warn(`[AI Engine] uploadAsync failed for ${endpoint}:`, upErr?.message || upErr);
            }
          }
        }
      } catch (_) {}
    }

    console.warn('All AI analysis endpoints offline; falling back to local simulation.');
    return null;
  },
};
