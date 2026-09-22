export type UserRole = 'worker' | 'safetyOfficer' | 'admin';

export type RiskLevel = 'normal' | 'average' | 'high';

export interface User {
  id: string;
  name: string;
  employeeId: string;
  role: UserRole;
  department: string;
  status: 'active' | 'deactivated';
  currentRiskLevel?: RiskLevel;
  latestH2sPpm?: number;
  phone?: string;
  email?: string;
}

export interface ExposureRecord {
  id: string;
  workerId: string;
  workerName: string;
  timestamp: string;
  date: string;
  h2sLevelPpm: number;
  exposureDurationMinutes: number;
  riskLevel: RiskLevel;
  confidencePercentage: number;
  reportGenerated: boolean;
  consulted?: boolean;
  consultedAt?: string;
  consultedBy?: string;
  notes?: string;
  imageUri?: string;
}

export interface ThresholdConfig {
  normalThreshold: number; // e.g. 15 ppm
  highThreshold: number;   // e.g. 35 ppm
}

export interface NotificationItem {
  id: string;
  role: UserRole;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  workerId?: string;
  recordId?: string;
  type?: 'exposure' | 'report' | 'consultation' | 'system';
}

export interface ExposureAnalysisResult {
  h2sLevel: number;
  exposureDuration: number;
  confidence: number;
  timestamp: string;
  date: string;
  riskLevel: RiskLevel;
  riskCategory?: string;
  isMock?: boolean;
  sensorStatus?: string;
  retakeRequired?: boolean;
  warning?: string;
  message?: string;
}

export interface AnalysisProgressStep {
  id: number;
  title: string;
  subtitle: string;
  completed: boolean;
}

