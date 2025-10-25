'use server';

import {
  getStockAlerts as getStockAlertsService,
  getInventoryTransactions as getInventoryTransactionsService,
  adjustStock as adjustStockService,
  generateStockAlerts
} from '@/services/inventoryService';
import { getCurrentUser } from '@/lib/auth-admin';
import { revalidatePath } from 'next/cache';

export async function getStockAlerts(status?: 'active' | 'resolved' | 'ignored') {
  try {
    // First generate fresh alerts
    await generateStockAlerts();

    // Then fetch them
    const alerts = await getStockAlertsService(status);
    return alerts;
  } catch (error) {
    console.error('Failed to get stock alerts:', error);
    return [];
  }
}

export async function getInventoryTransactions(productId?: string) {
  try {
    return await getInventoryTransactionsService(productId);
  } catch (error) {
    console.error('Failed to get inventory transactions:', error);
    return [];
  }
}

export async function adjustStock(
  productId: string,
  quantity: number,
  reason: string,
  notes: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    await adjustStockService(productId, quantity, reason, notes, user.userId);

    revalidatePath('/admin/inventory');
    revalidatePath('/admin/products');
  } catch (error) {
    console.error('Failed to adjust stock:', error);
    throw error;
  }
}
