import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { Switch } from '~/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Button } from '~/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import type {
  ProductOption,
  ProductOptionValue,
  ProductVariant,
  ProductVariantFormData,
} from '../types/variant.types';

interface VariantFormProps {
  isOpen: boolean;
  onClose: () => void;
  variantId: string | null;
  productId: string;
  options: ProductOption[];
  optionValues: ProductOptionValue[];
  variants: ProductVariant[];
  onSubmit: (data: ProductVariantFormData) => Promise<void>;
}

const variantFormSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  retail_price: z.string().min(1, 'Retail price is required'),
  business_price: z.string().min(1, 'Business price is required'),
  stock: z.string().min(1, 'Stock is required'),
  is_active: z.boolean(),
  options: z.record(z.string(), z.string()),
});

export default function VariantForm({
  isOpen,
  onClose,
  variantId,
  options,
  optionValues,
  variants,
  onSubmit,
}: VariantFormProps) {
  const editingVariant = variantId ? variants.find(v => v.id === variantId) : null;

  const form = useForm<ProductVariantFormData>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: editingVariant
      ? {
          sku: editingVariant.sku,
          retail_price: editingVariant.retail_price.toString(),
          business_price: editingVariant.business_price.toString(),
          stock: editingVariant.stock.toString(),
          is_active: editingVariant.is_active,
          options:
            editingVariant.options?.reduce(
              (acc, opt) => ({
                ...acc,
                [opt.option_value?.option_id || '']: opt.option_value_id,
              }),
              {}
            ) || {},
        }
      : {
          sku: '',
          retail_price: '',
          business_price: '',
          stock: '0',
          is_active: true,
          options: options.reduce(
            (acc, opt) => ({
              ...acc,
              [opt.id]: '',
            }),
            {}
          ),
        },
  });

  const handleSubmit = async (data: ProductVariantFormData) => {
    try {
      await onSubmit(data);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error submitting variant:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingVariant ? 'Edit Variant' : 'Add Variant'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="retail_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retail Price</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="business_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Price</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Active</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {options.map(option => (
              <FormField
                key={option.id}
                control={form.control}
                name={`options.${option.id}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{option.name}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${option.name}`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {optionValues
                          .filter(v => v.option_id === option.id)
                          .map(value => (
                            <SelectItem key={value.id} value={value.id}>
                              {value.value}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            ))}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{editingVariant ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
