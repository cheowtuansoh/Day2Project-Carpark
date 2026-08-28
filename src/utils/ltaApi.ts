/**
 * Client-side service for LTA DataMall Serverless API
 */

import { Carpark } from '../types';

const STORAGE_KEY_LTA = 'parkfinder_custom_lta_key';

export interface LTAStatusResult {
  service: string;
  isApiKeyConfigured: boolean;
  keySource: string;
  maskedKey: string | null;
  supportedAgencies: string[];
}

export interface LTAVerifyResult {
  success: boolean;
  valid: boolean;
  statusCode: number;
  message: string;
  count?: number;
  keySource?: string;
  maskedKey?: string;
  sample?: any;
}

/**
 * Get stored custom session LTA AccountKey
 */
export function getStoredLTAKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_LTA) || '';
  } catch {
    return '';
  }
}

/**
 * Store custom session LTA AccountKey
 */
export function setStoredLTAKey(key: string): void {
  try {
    if (key && key.trim()) {
      localStorage.setItem(STORAGE_KEY_LTA, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_LTA);
    }
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Build headers for backend requests, including custom LTA key if stored
 */
export function getLTAHeaders(): Record<string, string> {
  const customKey = getStoredLTAKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (customKey) {
    headers['x-lta-api-key'] = customKey;
  }
  return headers;
}

/**
 * Fetch live carparks from the backend / serverless endpoint with automatic fallback
 */
export async function fetchLiveCarparksApi(): Promise<{
  carparks: Carpark[];
  isLive: boolean;
  isLiveApi: boolean;
  count: number;
  apiKeySource?: string;
  maskedKey?: string | null;
  notice?: string;
} | null> {
  const endpoints = ['/api/carparks/live', '/api/carparks', '/api/lta/carparks'];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: getLTAHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.carparks && Array.isArray(data.carparks)) {
          return {
            carparks: data.carparks,
            isLive: data.isLiveApi ?? data.isLive ?? false,
            isLiveApi: data.isLiveApi ?? false,
            count: data.count || data.carparks.length,
            apiKeySource: data.apiKeySource,
            maskedKey: data.maskedKey,
            notice: data.notice,
          };
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch from ${endpoint}:`, err);
    }
  }
  return null;
}

/**
 * Check LTA DataMall Connection Status
 */
export async function checkLTAStatus(): Promise<LTAStatusResult | null> {
  try {
    const response = await fetch('/api/carparks/status', {
      headers: getLTAHeaders(),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('LTA status check failed:', err);
  }
  return null;
}

/**
 * Verify whether an AccountKey is valid and active on LTA DataMall
 */
export async function verifyLTAKey(apiKey?: string): Promise<LTAVerifyResult> {
  try {
    const keyToTest = apiKey !== undefined ? apiKey : getStoredLTAKey();
    const response = await fetch('/api/lta/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: keyToTest }),
    });

    const data = await response.json();
    return data as LTAVerifyResult;
  } catch (err: any) {
    return {
      success: false,
      valid: false,
      statusCode: 500,
      message: `Failed to reach verification endpoint: ${err.message}`,
    };
  }
}
