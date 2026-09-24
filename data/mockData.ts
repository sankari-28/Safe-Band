import { User, ExposureRecord, NotificationItem, ThresholdConfig } from '../types';

export const initialUsers: User[] = [];

export const initialThresholds: ThresholdConfig = {
  normalThreshold: 5.0,
  highThreshold: 9.0,
};

export const initialExposureRecords: ExposureRecord[] = [];

export const initialNotifications: NotificationItem[] = [];
