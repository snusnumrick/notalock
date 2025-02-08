import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet';
import { Button } from '~/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Input } from '~/components/ui/input';
import { Switch } from '~/components/ui/switch';
import { Label } from '~/components/ui/label';
import { Settings2 } from 'lucide-react';
import { Alert, AlertDescription } from '~/components/ui/alert';

interface BulkOperationsProps {
  selectedIds: string[];
  onBulkDelete: (ids: string[]) => Promise<void>;
  onBulkUpdate: (
    ids: string[],
    updates: {
      is_active?: boolean;
      retail_price_adjustment?: number;
      business_price_adjustment?: number;
      stock_adjustment?: number;
    }
  ) => Promise<void>;
}

type UpdateType = 'status' | 'retail_price' | 'business_price' | 'stock';

export default function BulkOperations({
  selectedIds,
  onBulkDelete,
  onBulkUpdate,
}: BulkOperationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [updateType, setUpdateType] = useState<UpdateType>('status');
  const [isActive, setIsActive] = useState(true);
  const [priceAdjustment, setPriceAdjustment] = useState('');
  const [stockAdjustment, setStockAdjustment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (selectedIds.length === 0) {
      setError('No products selected');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const updates: {
        is_active?: boolean;
        retail_price_adjustment?: number;
        business_price_adjustment?: number;
        stock_adjustment?: number;
      } = {};

      switch (updateType) {
        case 'status':
          updates.is_active = isActive;
          break;
        case 'retail_price': {
          const retailPrice = parseFloat(priceAdjustment);
          if (isNaN(retailPrice)) {
            setError('Invalid retail price adjustment');
            return;
          }
          updates.retail_price_adjustment = retailPrice;
          break;
        }
        case 'business_price': {
          const businessPrice = parseFloat(priceAdjustment);
          if (isNaN(businessPrice)) {
            setError('Invalid business price adjustment');
            return;
          }
          updates.business_price_adjustment = businessPrice;
          break;
        }
        case 'stock': {
          const stock = parseInt(stockAdjustment);
          if (isNaN(stock)) {
            setError('Invalid stock adjustment');
            return;
          }
          updates.stock_adjustment = stock;
          break;
        }
      }

      await onBulkUpdate(selectedIds, updates);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      setError('No products selected');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await onBulkDelete(selectedIds);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative" disabled={selectedIds.length === 0}>
          <Settings2 className="h-4 w-4 mr-2" />
          Bulk Operations
          {selectedIds.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {selectedIds.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px]">
        <SheetHeader>
          <SheetTitle>Bulk Operations</SheetTitle>
          <SheetDescription>
            Apply changes to {selectedIds.length} selected products
          </SheetDescription>
        </SheetHeader>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label>Operation Type</Label>
            <Select
              value={updateType}
              onValueChange={value => {
                setUpdateType(value as UpdateType);
                setPriceAdjustment('');
                setStockAdjustment('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select operation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Update Status</SelectItem>
                <SelectItem value="retail_price">Adjust Retail Price</SelectItem>
                <SelectItem value="business_price">Adjust Business Price</SelectItem>
                <SelectItem value="stock">Adjust Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {updateType === 'status' && (
            <div className="flex items-center justify-between">
              <Label>Status</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          )}

          {(updateType === 'retail_price' || updateType === 'business_price') && (
            <div className="space-y-2">
              <Label>Price Adjustment</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter adjustment amount"
                value={priceAdjustment}
                onChange={e => setPriceAdjustment(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Enter a positive or negative number to adjust the price
              </p>
            </div>
          )}

          {updateType === 'stock' && (
            <div className="space-y-2">
              <Label>Stock Adjustment</Label>
              <Input
                type="number"
                placeholder="Enter adjustment amount"
                value={stockAdjustment}
                onChange={e => setStockAdjustment(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Enter a positive or negative number to adjust the stock
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? 'Updating...' : 'Update Selected Products'}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete Selected Products'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
