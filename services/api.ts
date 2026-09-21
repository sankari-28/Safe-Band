import { User, UserRole, ExposureRecord, ThresholdConfig, NotificationItem, RiskLevel } from '../types';

// API Gateway base URL
const BASE_URL = 'http://localhost:8080';

// In-memory token storage (can be augmented with AsyncStorage in RN if needed)
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

// Helper to standardise Headers
const getHeaders = (isMultipart = false) => {
  const headers: Record<string, string> = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
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

// Risk level mapper: Backend UPPERCASE -> Frontend lowercase
export const mapBackendRiskToFrontend = (level?: string): RiskLevel => {
  switch (level?.toUpperCase()) {
    case 'HIGH':
      return 'high';
    case 'AVERAGE':
      return 'average';
    case 'NORMAL':
    default:
      return 'normal';
  }
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
  currentRiskLevel: mapBackendRiskToFrontend(dto.currentRiskLevel),
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
    riskLevel: mapBackendRiskToFrontend(dto.exposureLevel),
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
  if (dto.notificationType === 'EXPOSURE_ALERT') notifType = 'exposure';
  else if (dto.notificationType === 'REPORT_GENERATED') notifType = 'report';
  else if (dto.notificationType === 'CONSULTATION_UPDATE') notifType = 'consultation';

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
      throw new Error(errText || `Login failed with status ${res.status}`);
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
    const res = await fetch(`${BASE_URL}/api/users/workers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        userId: workerData.userId,
        fullName: workerData.fullName,
        department: workerData.department,
        phoneNumber: workerData.phoneNumber || 'N/A',
        email: workerData.email || `${workerData.userId.toLowerCase()}@h2sguard.com`,
        password: workerData.password || 'password123',
      }),
    });
    if (!res.ok) throw new Error('Failed to create worker');
    const data = await res.json();
    return mapUserDtoToUser(data);
  },

  async addSafetyOfficer(soData: { userId: string; fullName: string; department: string; phoneNumber?: string; email?: string; password?: string }): Promise<User> {
    const res = await fetch(`${BASE_URL}/api/users/safety-officers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        userId: soData.userId,
        fullName: soData.fullName,
        department: soData.department,
        phoneNumber: soData.phoneNumber || 'N/A',
        email: soData.email || `${soData.userId.toLowerCase()}@h2sguard.com`,
        password: soData.password || 'password123',
      }),
    });
    if (!res.ok) throw new Error('Failed to create safety officer');
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
    const res = await fetch(`${BASE_URL}/api/exposures/threshold`, {
      headers: getHeaders(),
    });
    if (!res.ok) return { normalThreshold: 15, highThreshold: 35 };
    const data = await res.json();
    return {
      normalThreshold: data.normalMaxPpm ?? 15,
      highThreshold: data.averageMaxPpm ?? 35,
    };
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
    const res = await fetch(`${BASE_URL}/api/exposures/my`, {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(mapExposureDtoToRecord);
  },

  async getAllExposures(): Promise<ExposureRecord[]> {
    const res = await fetch(`${BASE_URL}/api/exposures/all`, {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(mapExposureDtoToRecord);
  },

  async recordExposure(record: { workerId: string; predictedPpm: number; exposureDuration: number }): Promise<ExposureRecord> {
    const res = await fetch(`${BASE_URL}/api/exposures`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        workerId: record.workerId,
        predictedPpm: record.predictedPpm,
        exposureDuration: record.exposureDuration,
      }),
    });
    if (!res.ok) throw new Error('Failed to record exposure');
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

  // AI Image Analysis
  async analyzeImage(imageUri: string, workerId: string) {
    try {
      const formData = new FormData();
      // Handle React Native / Web FormData image payload
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const fileType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';

      formData.append('file', {
        uri: imageUri,
        name: filename,
        type: fileType,
      } as any);

      const res = await fetch(`${BASE_URL}/api/analysis`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Analysis endpoint returned ${res.status}`);
      }

      const data = await res.json();
      return {
        h2sLevel: data.h2sLevelPpm,
        exposureDuration: data.recommendedDurationMinutes || 15,
        confidence: data.confidencePercentage || 95,
      };
    } catch (e) {
      console.warn('Backend AI analysis fallback:', e);
      return null;
    }
  },
};
