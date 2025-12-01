'use client';

import { useState, useTransition } from 'react';
import { TableInfo } from '@/services/databaseService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table as TableIcon,
  Search,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DatabaseBrowserProps {
  tables: TableInfo[];
}

interface TableData {
  columns: string[];
  rows: Record<string, any>[];
  total: number;
}

export default function DatabaseBrowser({ tables }: DatabaseBrowserProps) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPending, startTransition] = useTransition();
  const [viewingRow, setViewingRow] = useState<Record<string, any> | null>(null);
  const [editingRow, setEditingRow] = useState<Record<string, any> | null>(null);
  const [deletingRow, setDeletingRow] = useState<{ table: string; id: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const limit = 25;

  const loadTableData = async (tableName: string, pageNum: number = 1) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/database/${tableName}?page=${pageNum}&limit=${limit}`);
        const data = await res.json();
        if (data.error) {
          toast({ title: 'Error', description: data.error, variant: 'destructive' });
          return;
        }
        setTableData(data);
        setSelectedTable(tableName);
        setPage(pageNum);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load table data', variant: 'destructive' });
      }
    });
  };

  const handleDelete = async () => {
    if (!deletingRow) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/database/${deletingRow.table}/${deletingRow.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Deleted', description: 'Row deleted successfully' });
        loadTableData(deletingRow.table, page);
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to delete row', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete row', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeletingRow(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRow || !selectedTable) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/database/${selectedTable}/${editingRow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRow),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Saved', description: 'Row updated successfully' });
        loadTableData(selectedTable, page);
        setEditingRow(null);
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to update row', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update row', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
  };

  const truncateValue = (value: string, maxLength: number = 50): string => {
    if (value.length <= maxLength) return value;
    return value.substring(0, maxLength) + '...';
  };

  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = tableData ? Math.ceil(tableData.total / limit) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Table List */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tables</CardTitle>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="space-y-1 p-2">
              {filteredTables.map((table) => (
                <Button
                  key={table.name}
                  variant={selectedTable === table.name ? 'secondary' : 'ghost'}
                  className="w-full justify-between"
                  onClick={() => loadTableData(table.name)}
                >
                  <span className="flex items-center gap-2">
                    <TableIcon className="h-4 w-4" />
                    {table.name}
                  </span>
                  <Badge variant="outline" className="ml-2">
                    {table.rowCount}
                  </Badge>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Table Data */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {selectedTable ? (
                  <>
                    <TableIcon className="h-5 w-5" />
                    {selectedTable}
                  </>
                ) : (
                  'Select a table'
                )}
              </CardTitle>
              {tableData && (
                <CardDescription>
                  {tableData.total} total rows • Page {page} of {totalPages}
                </CardDescription>
              )}
            </div>
            {selectedTable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadTableData(selectedTable, page)}
                disabled={isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isPending ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !selectedTable ? (
            <div className="text-center py-12 text-muted-foreground">
              <TableIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a table from the list to view its data</p>
            </div>
          ) : !tableData || tableData.rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No data in this table</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {tableData.columns.slice(0, 6).map((col) => (
                        <TableHead key={col} className="whitespace-nowrap">
                          {col}
                        </TableHead>
                      ))}
                      {tableData.columns.length > 6 && (
                        <TableHead>+{tableData.columns.length - 6} more</TableHead>
                      )}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.rows.map((row, i) => (
                      <TableRow key={row.id || i}>
                        {tableData.columns.slice(0, 6).map((col) => (
                          <TableCell key={col} className="max-w-[200px]">
                            <span className="truncate block" title={formatCellValue(row[col])}>
                              {truncateValue(formatCellValue(row[col]))}
                            </span>
                          </TableCell>
                        ))}
                        {tableData.columns.length > 6 && (
                          <TableCell className="text-muted-foreground">...</TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingRow(row)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRow({ ...row })}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {row.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeletingRow({ table: selectedTable!, id: row.id })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, tableData.total)} of {tableData.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadTableData(selectedTable, page - 1)}
                    disabled={page <= 1 || isPending}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadTableData(selectedTable, page + 1)}
                    disabled={page >= totalPages || isPending}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Row Dialog */}
      <Dialog open={!!viewingRow} onOpenChange={() => setViewingRow(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Row</DialogTitle>
            <DialogDescription>Full row data</DialogDescription>
          </DialogHeader>
          {viewingRow && (
            <div className="space-y-3">
              {Object.entries(viewingRow).map(([key, value]) => (
                <div key={key} className="grid grid-cols-3 gap-2 py-2 border-b">
                  <span className="font-medium text-muted-foreground">{key}</span>
                  <pre className="col-span-2 text-sm bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
                    {formatCellValue(value)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Row Dialog */}
      <Dialog open={!!editingRow} onOpenChange={() => setEditingRow(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Row</DialogTitle>
            <DialogDescription>Modify row data (be careful!)</DialogDescription>
          </DialogHeader>
          {editingRow && (
            <div className="space-y-3">
              {Object.entries(editingRow).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <label className="text-sm font-medium">{key}</label>
                  {key === 'id' ? (
                    <Input value={formatCellValue(value)} disabled className="bg-muted" />
                  ) : typeof value === 'object' ? (
                    <textarea
                      className="w-full min-h-[80px] p-2 border rounded-md text-sm font-mono"
                      value={JSON.stringify(value, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setEditingRow({ ...editingRow, [key]: parsed });
                        } catch {
                          // Invalid JSON, keep as string
                        }
                      }}
                    />
                  ) : (
                    <Input
                      value={value === null ? '' : String(value)}
                      onChange={(e) => setEditingRow({ ...editingRow, [key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRow(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingRow} onOpenChange={() => setDeletingRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Row</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this row? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
