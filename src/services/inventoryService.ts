'use server';

import { dbAdmin, isFirebaseAdminInitialized } from '@/lib/firebaseAdmin';
import { WarehouseLocation, InventoryTransaction, StockAlert, Product } from '@/lib/types';
import { getProducts, getProductById } from './productService';

// ===== WAREHOUSE LOCATIONS =====

export async function getWarehouses(): Promise<WarehouseLocation[]> {
  try {
    if (!isFirebaseAdminInitialized() || !dbAdmin) {
      return getDefaultWarehouse();
    }

    const adminDb = dbAdmin();
    const snap = await adminDb.collection('warehouses').where('isActive', '==', true).get();

    if (snap.empty) {
      return getDefaultWarehouse();
    }

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WarehouseLocation));
  } catch (error) {
    console.error('Failed to get warehouses:', error);
    return getDefaultWarehouse();
  }
}

function getDefaultWarehouse(): WarehouseLocation[] {
  return [{
    id: 'default',
    name: 'Main Warehouse',
    type: 'warehouse',
    isActive: true,
    createdAt: new Date().toISOString()
  }];
}

export async function addWarehouse(warehouse: Omit<WarehouseLocation, 'id'>): Promise<WarehouseLocation> {
  try {
    const adminDb = dbAdmin();
    const ref = await adminDb.collection('warehouses').add({
      ...warehouse,
      createdAt: new Date().toISOString()
    });

    return { id: ref.id, ...warehouse };
  } catch (error) {
    console.error('Failed to add warehouse:', error);
    throw new Error('Could not add warehouse');
  }
}

export async function updateWarehouse(warehouse: WarehouseLocation): Promise<void> {
  try {
    const { id, ...data } = warehouse;
    const adminDb = dbAdmin();
    await adminDb.collection('warehouses').doc(id).update(data);
  } catch (error) {
    console.error('Failed to update warehouse:', error);
    throw new Error('Could not update warehouse');
  }
}

export async function deleteWarehouse(id: string): Promise<void> {
  try {
    const adminDb = dbAdmin();
    // Soft delete by marking as inactive
    await adminDb.collection('warehouses').doc(id).update({ isActive: false });
  } catch (error) {
    console.error('Failed to delete warehouse:', error);
    throw new Error('Could not delete warehouse');
  }
}

// ===== INVENTORY TRANSACTIONS =====

export async function getInventoryTransactions(
  productId?: string,
  limit: number = 100
): Promise<InventoryTransaction[]> {
  try {
    if (!isFirebaseAdminInitialized() || !dbAdmin) {
      return [];
    }

    const adminDb = dbAdmin();
    let query = adminDb.collection('inventory_transactions')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (productId) {
      query = query.where('productId', '==', productId) as any;
    }

    const snap = await query.get();

    if (snap.empty) {
      return [];
    }

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryTransaction));
  } catch (error) {
    console.error('Failed to get inventory transactions:', error);
    return [];
  }
}

export async function addInventoryTransaction(
  transaction: Omit<InventoryTransaction, 'id' | 'createdAt'>
): Promise<InventoryTransaction> {
  try {
    const adminDb = dbAdmin();
    const ref = await adminDb.collection('inventory_transactions').add({
      ...transaction,
      createdAt: new Date().toISOString()
    });

    return { id: ref.id, ...transaction, createdAt: new Date().toISOString() };
  } catch (error) {
    console.error('Failed to add inventory transaction:', error);
    throw new Error('Could not add inventory transaction');
  }
}

// ===== STOCK ALERTS =====

export async function getStockAlerts(status?: 'active' | 'resolved' | 'ignored'): Promise<StockAlert[]> {
  try {
    if (!isFirebaseAdminInitialized() || !dbAdmin) {
      return [];
    }

    const adminDb = dbAdmin();
    let query = adminDb.collection('stock_alerts').orderBy('createdAt', 'desc') as any;

    if (status) {
      query = query.where('status', '==', status);
    }

    const snap = await query.get();

    if (snap.empty) {
      return [];
    }

    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockAlert));
  } catch (error) {
    console.error('Failed to get stock alerts:', error);
    return [];
  }
}

export async function generateStockAlerts(): Promise<StockAlert[]> {
  try {
    const products = await getProducts();
    const alerts: StockAlert[] = [];

    for (const product of products) {
      if (!product.trackInventory) continue;

      const reorderPoint = product.reorderPoint || 10;
      const currentStock = product.stock || 0;

      if (currentStock <= reorderPoint) {
        const severity: 'critical' | 'warning' | 'info' =
          currentStock === 0 ? 'critical' :
          currentStock <= reorderPoint / 2 ? 'warning' : 'info';

        alerts.push({
          id: `alert-${product.id}-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          currentStock,
          reorderPoint,
          severity,
          status: 'active',
          createdAt: new Date().toISOString()
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error('Failed to generate stock alerts:', error);
    return [];
  }
}

export async function updateStockAlert(
  id: string,
  updates: Partial<StockAlert>
): Promise<void> {
  try {
    const adminDb = dbAdmin();
    await adminDb.collection('stock_alerts').doc(id).update({
      ...updates,
      ...(updates.status === 'resolved' && { resolvedAt: new Date().toISOString() })
    });
  } catch (error) {
    console.error('Failed to update stock alert:', error);
    throw new Error('Could not update stock alert');
  }
}

// ===== STOCK MOVEMENTS =====

export async function transferStock(
  productId: string,
  fromLocationId: string,
  toLocationId: string,
  quantity: number,
  notes: string,
  userId: string
): Promise<void> {
  try {
    const product = await getProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Create transaction
    await addInventoryTransaction({
      productId,
      productName: product.name,
      sku: product.sku,
      type: 'transfer',
      quantity,
      fromLocationId,
      toLocationId,
      notes,
      createdBy: userId
    });

    // Update stock by location if implemented
    // This would update the stockByLocation field on the product
  } catch (error) {
    console.error('Failed to transfer stock:', error);
    throw new Error('Could not transfer stock');
  }
}

export async function adjustStock(
  productId: string,
  quantity: number,
  reason: string,
  notes: string,
  userId: string
): Promise<void> {
  try {
    const product = await getProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Create transaction
    await addInventoryTransaction({
      productId,
      productName: product.name,
      sku: product.sku,
      type: 'adjustment',
      quantity,
      reason,
      notes,
      createdBy: userId
    });

    // Update product stock
    const adminDb = dbAdmin();
    const newStock = (product.stock || 0) + quantity;
    await adminDb.collection('products').doc(productId).update({
      stock: Math.max(0, newStock)
    });
  } catch (error) {
    console.error('Failed to adjust stock:', error);
    throw new Error('Could not adjust stock');
  }
}
