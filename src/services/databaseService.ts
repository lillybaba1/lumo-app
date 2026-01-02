'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';

const dbLogger = logger.child('DatabaseService');

export interface TableInfo {
  name: string;
  rowCount: number;
}

export interface TableData {
  columns: string[];
  rows: Record<string, unknown>[];
  total: number;
}

// List of tables that are safe to expose to admin
const ALLOWED_TABLES = [
  'users',
  'visitors',
  'page_views',
  'orders',
  'products',
  'categories',
  'profiles',
  'reviews',
  'coupons',
  'payments',
  'settings',
  'pages',
  'faq',
  'collections',
  'wishlist',
];

// Get list of tables with row counts
export async function getTableList(): Promise<TableInfo[]> {
  try {
    const tables: TableInfo[] = [];

    for (const tableName of ALLOWED_TABLES) {
      try {
        const { count, error } = await supabaseAdmin
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        // Only add table if it exists and no error
        if (!error && count !== null) {
          tables.push({ name: tableName, rowCount: count });
        }
      } catch {
        // Table might not exist, skip it
      }
    }

    return tables.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    dbLogger.error('Error getting table list:', error);
    return [];
  }
}

// Get data from a specific table
export async function getTableData(
  tableName: string,
  page: number = 1,
  limit: number = 50,
  orderBy?: string,
  ascending: boolean = false
): Promise<TableData | null> {
  try {
    // Security: Only allow approved tables
    if (!ALLOWED_TABLES.includes(tableName)) {
      dbLogger.warn('Table not allowed:', { tableName });
      return null;
    }

    let query = supabaseAdmin.from(tableName).select('*', { count: 'exact' });

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy, { ascending });
    } else {
      // Default ordering by created_at if exists, or first column
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      dbLogger.error('Error fetching table data:', error);
      // Try without ordering if created_at doesn't exist
      const { data: retryData, error: retryError, count: retryCount } = await supabaseAdmin
        .from(tableName)
        .select('*', { count: 'exact' })
        .range((page - 1) * limit, page * limit - 1);

      if (retryError) {
        return null;
      }

      const columns = retryData && retryData.length > 0 ? Object.keys(retryData[0]) : [];
      return { columns, rows: retryData || [], total: retryCount || 0 };
    }

    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
    return { columns, rows: data || [], total: count || 0 };
  } catch (error) {
    dbLogger.error('Error fetching table data:', error);
    return null;
  }
}

// Delete a row from a table
export async function deleteTableRow(tableName: string, id: string): Promise<boolean> {
  try {
    if (!ALLOWED_TABLES.includes(tableName)) {
      return false;
    }

    const { error } = await supabaseAdmin
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      dbLogger.error('Error deleting row:', error);
      return false;
    }

    return true;
  } catch (error) {
    dbLogger.error('Error deleting row:', error);
    return false;
  }
}

// Update a row in a table
export async function updateTableRow(
  tableName: string, 
  id: string, 
  data: Record<string, unknown>
): Promise<boolean> {
  try {
    if (!ALLOWED_TABLES.includes(tableName)) {
      return false;
    }

    // SECURITY: Field whitelist per table - prevent updating sensitive columns
    const BLOCKED_FIELDS: Record<string, string[]> = {
      users: ['id', 'password_hash', 'role', 'email', 'created_at'],
      profiles: ['id', 'email', 'role', 'created_at'],
      orders: ['id', 'user_id', 'created_at'],
      payments: ['id', 'order_id', 'user_id', 'created_at', 'transaction_id'],
      // Default blocked fields for all tables
      _default: ['id', 'created_at', 'password', 'password_hash', 'secret', 'token'],
    };

    const blockedForTable = BLOCKED_FIELDS[tableName] || BLOCKED_FIELDS._default;

    // Remove id and blocked fields from update data
    const { id: _, ...rawUpdateData } = data;
    const updateData = Object.fromEntries(
      Object.entries(rawUpdateData).filter(([key]) => !blockedForTable.includes(key))
    );

    if (Object.keys(updateData).length === 0) {
      dbLogger.warn('No valid fields to update after filtering', { tableName, id });
      return false;
    }

    const { error } = await supabaseAdmin
      .from(tableName)
      .update(updateData)
      .eq('id', id);

    if (error) {
      dbLogger.error('Error updating row:', error);
      return false;
    }

    return true;
  } catch (error) {
    dbLogger.error('Error updating row:', error);
    return false;
  }
}

// Execute a simple select query (read-only)
export async function executeQuery(
  tableName: string,
  filters?: { column: string; operator: string; value: string }[]
): Promise<TableData | null> {
  try {
    if (!ALLOWED_TABLES.includes(tableName)) {
      return null;
    }

    let query = supabaseAdmin.from(tableName).select('*', { count: 'exact' });

    // Apply filters
    if (filters) {
      for (const filter of filters) {
        switch (filter.operator) {
          case 'eq':
            query = query.eq(filter.column, filter.value);
            break;
          case 'neq':
            query = query.neq(filter.column, filter.value);
            break;
          case 'gt':
            query = query.gt(filter.column, filter.value);
            break;
          case 'lt':
            query = query.lt(filter.column, filter.value);
            break;
          case 'gte':
            query = query.gte(filter.column, filter.value);
            break;
          case 'lte':
            query = query.lte(filter.column, filter.value);
            break;
          case 'like': {
            // Sanitize pattern characters to prevent SQL injection
            const sanitizedLike = filter.value.replace(/[%_\\]/g, '\\$&');
            query = query.like(filter.column, `%${sanitizedLike}%`);
            break;
          }
          case 'ilike': {
            // Sanitize pattern characters to prevent SQL injection
            const sanitizedIlike = filter.value.replace(/[%_\\]/g, '\\$&');
            query = query.ilike(filter.column, `%${sanitizedIlike}%`);
            break;
          }
        }
      }
    }

    const { data, error, count } = await query.limit(100);

    if (error) {
      dbLogger.error('Error executing query:', error);
      return null;
    }

    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
    return { columns, rows: data || [], total: count || 0 };
  } catch (error) {
    dbLogger.error('Error executing query:', error);
    return null;
  }
}
