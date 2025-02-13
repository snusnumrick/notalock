import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Plus } from 'lucide-react';
import type { VariantManagementProps } from '../types/variant.types';
import VariantForm from './VariantForm';
import VariantList from './VariantList';

export default function VariantManagement({
  productId,
  variants,
  options,
  optionValues,
  onVariantCreate,
  onVariantUpdate,
  onVariantDelete,
}: VariantManagementProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<string | null>(null);

  const handleEditVariant = (variantId: string) => {
    setEditingVariant(variantId);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingVariant(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Product Variants</CardTitle>
        {productId && (
          <Button onClick={() => setIsFormOpen(true)} className="ml-4" variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Variant
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!productId ? (
          <div className="text-center py-6 text-gray-500">
            Save the product first to manage variants
          </div>
        ) : (
          <>
            <VariantList
              variants={variants}
              options={options}
              optionValues={optionValues}
              onEdit={handleEditVariant}
              onDelete={onVariantDelete}
            />

            <VariantForm
              isOpen={isFormOpen}
              onClose={handleCloseForm}
              variantId={editingVariant}
              productId={productId}
              options={options}
              optionValues={optionValues}
              variants={variants}
              onSubmit={async data => {
                if (editingVariant) {
                  await onVariantUpdate(editingVariant, data);
                } else {
                  await onVariantCreate(data);
                }
                handleCloseForm();
              }}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
