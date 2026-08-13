// Thin typed wrapper around the native `HealthConnectPlugin` (Kotlin,
// frontend/android/app/src/main/java/com/vitaltwin/app/HealthConnectPlugin.kt).
// Only ever meaningful on native Android (Capacitor) — never touched on web.
//
// `WELLNESS_DATA_TYPES` are the SAME identifiers the backend's
// `health_normalization_service.HEALTH_CONNECT_TYPES` recognizes — kept in
// sync manually (no shared package between the two repos), matching this
// project's established convention for source-type label lists.

import { registerPlugin, Capacitor } from '@capacitor/core';

export const WELLNESS_DATA_TYPES = [
  'steps',
  'distance',
  'active-calories',
  'total-calories',
  'exercise-session',
  'heart-rate',
  'resting-heart-rate',
  'heart-rate-variability',
  'oxygen-saturation',
  'respiratory-rate',
  'body-temperature',
  'weight',
  'sleep-session',
] as const;

export type HealthConnectDataType = (typeof WELLNESS_DATA_TYPES)[number];

export type HealthConnectRawRecord = Record<string, unknown>;

export interface HealthConnectPluginInterface {
  checkAvailability(): Promise<{ available: boolean; status: string }>;
  getGrantedWellnessPermissions(): Promise<{ granted: string[] }>;
  requestWellnessPermissions(options: { dataTypes: string[] }): Promise<{ granted: string[] }>;
  readWellnessRecords(options: { dataType: string; days?: number }): Promise<{ records: HealthConnectRawRecord[] }>;
}

const HealthConnect = registerPlugin<HealthConnectPluginInterface>('HealthConnect');

export function isHealthConnectSupportedPlatform(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export default HealthConnect;
