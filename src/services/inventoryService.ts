'use server';

import { createClient } from '@/lib/supabase/server';
import { WarehouseLocation, InventoryTransaction, StockAlert, Product } from '@/lib/types';
import { getProducts, getProductById } from './productService';

// ===== WAREHOUSE LOCATIONS =====

export async function getWarehouses(): Promise<WarehouseLocation[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get warehouses:', error);
      return getDefaultWarehouse();
    }

    if (!data || data.length === 0) {
      return getDefaultWarehouse();
    }

    return data.map(warehouse => ({
      id: warehouse.id,
      name: warehouse.name,
      type: warehouse.type,
      address: warehouse.address,
      isActive: warehouse.is_active,
      createdAt: warehouse.created_at,
    }));
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
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('warehouses')
      .insert([{
        name: warehouse.name,
        type: warehouse.type,
        address: warehouse.address,
        is_active: warehouse.isActive,
      }])
      .select()
      .single();

    if (error) {
      console.error('Failed to add warehouse:', error);
      throw new Error('Could not add warehouse');
    }

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      address: data.address,
      isActive: data.is_active,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Failed to add warehouse:', error);
    throw new Error('Could not add warehouse');
  }
}

export async function updateWarehouse(warehouse: WarehouseLocation): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('warehouses')
      .update({
        name: warehouse.name,
        type: warehouse.type,
        address: warehouse.address,
        is_active: warehouse.isActive,
      })
      .eq('id', warehouse.id);

    if (error) {
      console.error('Failed to update warehouse:', error);
      throw new Error('Could not update warehouse');
    }
  } catch (error) {
    console.error('Failed to update warehouse:', error);
    throw new Error('Could not update warehouse');
  }
}

export async function deleteWarehouse(id: string): Promise<void> {
  try {
    const supabase = await createClient();
    // Soft delete by marking as inactive
    const { error } = await supabase
      .from('warehouses')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Failed to delete warehouse:', error);
      throw new Error('Could not delete warehouse');
    }
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
    const supabase = await createClient();
    let query = supabase
      .from('inventory_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get inventory transactions:', error);
      return [];
    }

    return (data || []).map(transaction => ({
      id: transaction.id,
      productId: transaction.product_id,
      productName: transaction.product_name,
      sku: transaction.sku,
      type: transaction.type,
      quantity: transaction.quantity,
      fromLocationId: transaction.from_location_id,
      toLocationId: transaction.to_location_id,
      reason: transaction.reason,
      notes: transaction.notes,
      createdBy: transaction.created_by,
      createdAt: transaction.created_at,
    }));
  } catch (error) {
    console.error('Failed to get inventory transactions:', error);
    return [];
  }
}

export async function addInventoryTransaction(
  transaction: Omit<InventoryTransaction, 'id' | 'createdAt'>
): Promise<InventoryTransaction> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('inventory_transactions')
      .insert([{
        product_id: transaction.productId,
        product_name: transaction.productName,
        sku: transaction.sku,
        type: transaction.type,
        quantity: transaction.quantity,
        from_location_id: transaction.fromLocationId,
        to_location_id: transaction.toLocationId,
        reason: transaction.reason,
        notes: transaction.notes,
        created_by: transaction.createdBy,
      }])
      .select()
      .single();

    if (error) {
      console.error('Failed to add inventory transaction:', error);
      throw new Error('Could not add inventory transaction');
    }

    return {
      id: data.id,
      productId: data.product_id,
      productName: data.product_name,
      sku: data.sku,
      type: data.type,
      quantity: data.quantity,
      fromLocationId: data.from_location_id,
      toLocationId: data.to_location_id,
      reason: data.reason,
      notes: data.notes,
      createdBy: data.created_by,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Failed to add inventory transaction:', error);
    throw new Error('Could not add inventory transaction');
  }
}

// ===== STOCK ALERTS =====

export async function getStockAlerts(status?: 'active' | 'resolved' | 'ignored'): Promise<StockAlert[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('stock_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to get stock alerts:', error);
      return [];
    }

    return (data || []).map(alert => ({
      id: alert.id,
      productId: alert.product_id,
      productName: alert.product_name,
      sku: alert.sku,
      currentStock: alert.current_stock,
      reorderPoint: alert.reorder_point,
      severity: alert.severity,
      status: alert.status,
      resolvedAt: alert.resolved_at,
      createdAt: alert.created_at,
    }));
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
    const supabase = await createClient();
    const updateData: Record<string, any> = {};

    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.severity !== undefined) updateData.severity = updates.severity;
    if (updates.status === 'resolved') updateData.resolved_at = new Date().toISOString();

    const { error } = await supabase
      .from('stock_alerts')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Failed to update stock alert:', error);
      throw new Error('Could not update stock alert');
    }
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
    const supabase = await createClient();
    const newStock = (product.stock || 0) + quantity;
    const { error } = await supabase
      .from('products')
      .update({ stock: Math.max(0, newStock) })
      .eq('id', productId);

    if (error) {
      console.error('Failed to update product stock:', error);
      throw new Error('Could not update product stock');
    }
  } catch (error) {
    console.error('Failed to adjust stock:', error);
    throw new Error('Could not adjust stock');
  }
}
