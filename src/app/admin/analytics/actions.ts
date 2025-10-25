'use server';

import { exportAnalyticsToCSV, DateRange } from '@/services/analyticsService';

export async function downloadAnalyticsCSV(startDate?: string, endDate?: string) {
  try {
    const dateRange: DateRange = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const csvData = await exportAnalyticsToCSV(dateRange);
    return { success: true, data: csvData };
  } catch (error) {
    console.error('Failed to export analytics:', error);
    return { success: false, error: 'Failed to export analytics data' };
  }
}
