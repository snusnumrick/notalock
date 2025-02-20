import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
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

export interface FilterOptions {
  search?: string;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  minStock?: number | undefined;
  maxStock?: number | undefined;
  isActive?: boolean;
  hasVariants?: boolean;
  sortBy?: 'name' | 'price' | 'stock' | 'created' | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

interface ProductSearchProps {
  onFilterChange: (filters: FilterOptions) => void;
  defaultFilters?: FilterOptions;
}

export default function ProductSearch({ onFilterChange, defaultFilters = {} }: ProductSearchProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [searchTerm, setSearchTerm] = useState(defaultFilters.search || '');

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleFilterChange({ search: value });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({});
    onFilterChange({});
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== undefined).length;
  };

  return (
    <div className="flex items-center gap-2 w-full max-w-3xl">
      <div className="relative flex-1">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      </div>

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
        <SheetContent className="w-[400px]">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Filters</SheetTitle>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 lg:px-3">
                Reset
                {/*<X className="ml-2 h-4 w-4" />*/}
              </Button>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
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
                    handleFilterChange({ maxPrice: parseFloat(e.target.value) || undefined })
                  }
                />
              </div>
            </div>

            {/* Stock Range */}
            <div className="space-y-2">
              <Label>Stock Level</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minStock || ''}
                  onChange={e =>
                    handleFilterChange({ minStock: parseInt(e.target.value) || undefined })
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxStock || ''}
                  onChange={e =>
                    handleFilterChange({ maxStock: parseInt(e.target.value) || undefined })
                  }
                />
              </div>
            </div>

            {/* Status Switches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Active Products Only</Label>
                <Switch
                  checked={filters.isActive || false}
                  onCheckedChange={checked => handleFilterChange({ isActive: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Has Variants</Label>
                <Switch
                  checked={filters.hasVariants || false}
                  onCheckedChange={checked => handleFilterChange({ hasVariants: checked })}
                />
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select
                value={filters.sortBy ?? ''}
                onValueChange={value =>
                  handleFilterChange({
                    sortBy: (value || undefined) as
                      | 'name'
                      | 'price'
                      | 'stock'
                      | 'created'
                      | undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sort field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="created">Created Date</SelectItem>
                </SelectContent>
              </Select>

              {filters.sortBy && (
                <Select
                  value={filters.sortOrder || ''}
                  onValueChange={value =>
                    handleFilterChange({ sortOrder: value as 'asc' | 'desc' })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
