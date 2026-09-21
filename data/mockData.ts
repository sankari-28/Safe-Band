import { User, ExposureRecord, NotificationItem, ThresholdConfig } from '../types';

export const initialUsers: User[] = [];

export const initialThresholds: ThresholdConfig = {
  normalThreshold: 15,
  highThreshold: 35,
};

export const initialExposureRecords: ExposureRecord[] = [];

export const initialNotifications: NotificationItem[] = [];
