import { getTableList } from '@/services/databaseService';
import { Card, CardContent } from '@/components/ui/card';
import { Database, Table, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DatabaseBrowser from './database-browser';

export const dynamic = 'force-dynamic';

export default async function DatabasePage() {
  const tables = await getTableList();

  const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Database Browser
          </h1>
          <p className="text-muted-foreground">View and manage your database tables</p>
        </div>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Admin Access Only:</strong> This page provides direct access to your database tables. 
          Be careful when modifying or deleting data as changes cannot be easily undone.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tables</p>
                <p className="text-2xl font-bold">{tables.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Table className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rows</p>
                <p className="text-2xl font-bold">{totalRows.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <Database className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-2xl font-bold text-green-600">Connected</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Browser */}
      <DatabaseBrowser tables={tables} />
    </div>
  );
}
