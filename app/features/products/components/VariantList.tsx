import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { Button } from '~/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import type { ProductOption, ProductOptionValue, ProductVariant } from '../types/variant.types';

interface VariantListProps {
  variants: ProductVariant[];
  options: ProductOption[];
  optionValues: ProductOptionValue[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

export default function VariantList({
  variants,
  options,
  optionValues,
  onEdit,
  onDelete,
}: VariantListProps) {
  const getOptionValueName = (optionValueId: string) => {
    const optionValue = optionValues.find(v => v.id === optionValueId);
    return optionValue?.value || '';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            {options.map(option => (
              <TableHead key={option.id}>{option.name}</TableHead>
            ))}
            <TableHead>Retail Price</TableHead>
            <TableHead>Business Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={options.length + 6} className="text-center text-muted-foreground">
                No variants found
              </TableCell>
            </TableRow>
          ) : (
            variants.map(variant => (
              <TableRow key={variant.id}>
                <TableCell>{variant.sku}</TableCell>
                {options.map(option => (
                  <TableCell key={option.id}>
                    {variant.options?.find(
                      opt =>
                        optionValues.find(v => v.id === opt.option_value_id)?.option_id ===
                        option.id
                    )?.option_value_id
                      ? getOptionValueName(
                          variant.options.find(
                            opt =>
                              optionValues.find(v => v.id === opt.option_value_id)?.option_id ===
                              option.id
                          )!.option_value_id
                        )
                      : '-'}
                  </TableCell>
                ))}
                <TableCell>{formatPrice(variant.retail_price)}</TableCell>
                <TableCell>{formatPrice(variant.business_price)}</TableCell>
                <TableCell>{variant.stock}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      variant.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {variant.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(variant.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(variant.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
