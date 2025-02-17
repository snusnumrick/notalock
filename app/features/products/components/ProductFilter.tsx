import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';
import { Card } from '~/components/ui/card';

export interface CustomerFilterOptions {
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  inStockOnly?: boolean;
  sortOrder?: 'featured' | 'price_asc' | 'price_desc' | 'newest';
}

interface ProductFilterProps {
  onFilterChange: (filters: CustomerFilterOptions) => void;
  defaultFilters?: CustomerFilterOptions;
  categories: Array<{ id: string; name: string }>;
  isMobile?: boolean;
}

export default function ProductFilter({
  onFilterChange,
  defaultFilters = {},
  categories,
  isMobile = false,
}: ProductFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<CustomerFilterOptions>(defaultFilters);

  const handleFilterChange = (newFilters: Partial<CustomerFilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const getActiveFilterCount = () => {
    let count = 0;

    // Count only actually applied filters
    if (filters.minPrice !== undefined) count++;
    if (filters.maxPrice !== undefined) count++;
    if (filters.categoryId !== undefined) count++;
    if (filters.inStockOnly === true) count++; // Only count if true, since false is default

    return count;
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div className="space-y-2">
        <Label>Price Range</Label>
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={e =>
              handleFilterChange({
                minPrice: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={e =>
              handleFilterChange({
                maxPrice: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>

      {/* Category Selection */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={filters.categoryId || 'all'}
          onValueChange={value =>
            handleFilterChange({ categoryId: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* In Stock Only Switch */}
      <div className="flex items-center justify-between">
        <Label>Show In Stock Only</Label>
        <Switch
          checked={filters.inStockOnly || false}
          onCheckedChange={checked => handleFilterChange({ inStockOnly: checked })}
        />
      </div>

      {/* Sort Options */}
      <div className="space-y-2">
        <Label>Sort By</Label>
        <Select
          value={filters.sortOrder || 'featured'}
          onValueChange={value =>
            handleFilterChange({
              sortOrder: (value as CustomerFilterOptions['sortOrder']) || undefined,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="flex items-center gap-2 w-full">
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {getActiveFilterCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {getActiveFilterCount()}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle>Filters</SheetTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-2 lg:px-3"
                >
                  Reset
                  <X className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <Card className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Filters</h3>
        {getActiveFilterCount() > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <FilterContent />
    </Card>
  );
}
