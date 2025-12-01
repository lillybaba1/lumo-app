'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface TableInfo {
  name: string;
  rowCount: number;
}

export interface TableData {
  columns: string[];
  rows: Record<string, any>[];
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
    console.error('Error getting table list:', error);
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
      console.error('Table not allowed:', tableName);
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
      console.error('Error fetching table data:', error);
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
    console.error('Error fetching table data:', error);
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
      console.error('Error deleting row:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting row:', error);
    return false;
  }
}

// Update a row in a table
export async function updateTableRow(
  tableName: string, 
  id: string, 
  data: Record<string, any>
): Promise<boolean> {
  try {
    if (!ALLOWED_TABLES.includes(tableName)) {
      return false;
    }

    // Remove id from update data
    const { id: _, ...updateData } = data;

    const { error } = await supabaseAdmin
      .from(tableName)
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating row:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating row:', error);
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
          case 'like':
            query = query.like(filter.column, `%${filter.value}%`);
            break;
          case 'ilike':
            query = query.ilike(filter.column, `%${filter.value}%`);
            break;
        }
      }
    }

    const { data, error, count } = await query.limit(100);

    if (error) {
      console.error('Error executing query:', error);
      return null;
    }

    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
    return { columns, rows: data || [], total: count || 0 };
  } catch (error) {
    console.error('Error executing query:', error);
    return null;
  }
}
