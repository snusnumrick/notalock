import { useEffect, useRef, useState } from 'react';
import { useSubmit, useSearchParams } from '@remix-run/react';
import { Filter } from 'lucide-react';
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
import { Separator } from '~/components/ui/separator';

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
  const [searchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const submitTimeoutRef = useRef<NodeJS.Timeout>();
  const minPriceRef = useRef<HTMLInputElement>(null);
  const maxPriceRef = useRef<HTMLInputElement>(null);
  const lastFocusedInput = useRef<'minPrice' | 'maxPrice' | null>(null);
  const lastCaretPosition = useRef<number | null>(null);

  const initialMinPrice = searchParams.get('minPrice') || defaultFilters.minPrice?.toString() || '';
  const initialMaxPrice = searchParams.get('maxPrice') || defaultFilters.maxPrice?.toString() || '';
  const initialCategoryId = searchParams.get('categoryId') || defaultFilters.categoryId || 'all';
  const initialInStockOnly =
    searchParams.get('inStockOnly') === 'true' || defaultFilters.inStockOnly || false;
  const initialSortOrder =
    (searchParams.get('sortOrder') as CustomerFilterOptions['sortOrder']) ||
    defaultFilters.sortOrder ||
    'featured';

  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [inStockOnly, setInStockOnly] = useState(initialInStockOnly);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const submit = useSubmit();

  // Restore focus after render
  useEffect(() => {
    if (lastFocusedInput.current === 'minPrice' && minPriceRef.current) {
      minPriceRef.current.focus();
      if (lastCaretPosition.current !== null) {
        minPriceRef.current.setSelectionRange(lastCaretPosition.current, lastCaretPosition.current);
      }
    } else if (lastFocusedInput.current === 'maxPrice' && maxPriceRef.current) {
      maxPriceRef.current.focus();
      if (lastCaretPosition.current !== null) {
        maxPriceRef.current.setSelectionRange(lastCaretPosition.current, lastCaretPosition.current);
      }
    }
  });

  const debouncedSubmit = (formData: FormData) => {
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }

    submitTimeoutRef.current = setTimeout(() => {
      if (formData.get('categoryId') === 'all') {
        formData.delete('categoryId');
      }

      for (const [key, value] of formData.entries()) {
        if (!value || value === '') {
          formData.delete(key);
        }
      }

      submit(formData, {
        method: 'get',
        preventScrollReset: true,
        replace: true,
      });
    }, 500);
  };

  const handlePriceInput = (
    e: React.FormEvent<HTMLInputElement>,
    field: 'minPrice' | 'maxPrice'
  ) => {
    const input = e.currentTarget;
    lastFocusedInput.current = field;
    lastCaretPosition.current = input.selectionStart;
    const value = input.value;

    const formData = new FormData();

    // Copy all current filter values except cursor and the changing price field
    searchParams.forEach((paramValue, key) => {
      if (key !== 'cursor' && key !== field) {
        formData.set(key, paramValue);
      }
    });

    if (field === 'minPrice') {
      setMinPrice(value);
      if (value) formData.set('minPrice', value);
    } else {
      setMaxPrice(value);
      if (value) formData.set('maxPrice', value);
    }

    debouncedSubmit(formData);
  };

  const handleOtherChanges = (
    value: string | boolean,
    field: 'categoryId' | 'inStockOnly' | 'sortOrder'
  ) => {
    const formData = new FormData();

    // Copy all current filter values except cursor
    searchParams.forEach((paramValue, key) => {
      if (key !== 'cursor') {
        formData.set(key, paramValue);
      }
    });

    // Update the changed field
    if (field === 'categoryId') {
      setCategoryId(value as string);
      if (value !== 'all') {
        formData.set('categoryId', value as string);
        onFilterChange({ ...defaultFilters, categoryId: value as string });
      } else {
        formData.delete('categoryId');
        onFilterChange({ ...defaultFilters, categoryId: undefined });
      }
    } else if (field === 'inStockOnly') {
      setInStockOnly(value as boolean);
      if (value) {
        formData.set('inStockOnly', 'true');
      } else {
        formData.delete('inStockOnly');
      }
      onFilterChange({ ...defaultFilters, inStockOnly: value as boolean });
    } else if (field === 'sortOrder') {
      setSortOrder((value as CustomerFilterOptions['sortOrder']) || 'featured');
      formData.set('sortOrder', value as string);
    }

    submit(formData, {
      method: 'get',
      preventScrollReset: true,
      replace: true,
    });
  };

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  const handleBlur = () => {
    // We need to use requestAnimationFrame to ensure we check focus state after React's updates
    requestAnimationFrame(() => {
      if (
        document.activeElement !== minPriceRef.current &&
        document.activeElement !== maxPriceRef.current
      ) {
        lastFocusedInput.current = null;
        lastCaretPosition.current = null;
      }
    });
  };

  const clearFilters = () => {
    setCategoryId('all');
    setInStockOnly(false);
    setMinPrice('');
    setMaxPrice('');
    const formData = new FormData();

    const currentView = searchParams.get('view');
    if (currentView) {
      formData.set('view', currentView);
    }

    formData.set('sortOrder', sortOrder);

    submit(formData, {
      method: 'get',
      preventScrollReset: true,
      replace: true,
    });
    onFilterChange({});
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (defaultFilters.minPrice !== undefined) count++;
    if (defaultFilters.maxPrice !== undefined) count++;
    if (defaultFilters.categoryId !== undefined) count++;
    if (defaultFilters.inStockOnly === true) count++;
    return count;
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div className="space-y-2">
        <Label>Price Range</Label>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="minPrice"
            type="number"
            name="minPrice"
            placeholder="Min"
            aria-label="Minimum price"
            value={minPrice}
            onChange={e => handlePriceInput(e, 'minPrice')}
            onBlur={handleBlur}
            ref={minPriceRef}
          />
          <Input
            id="maxPrice"
            type="number"
            name="maxPrice"
            placeholder="Max"
            aria-label="Maximum price"
            value={maxPrice}
            onChange={e => handlePriceInput(e, 'maxPrice')}
            onBlur={handleBlur}
            ref={maxPriceRef}
          />
        </div>
      </div>

      {/* Category Selection */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          name="categoryId"
          value={categoryId}
          onValueChange={value => handleOtherChanges(value, 'categoryId')}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a category" />
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
        <Label htmlFor="inStockOnly">Show In Stock Only</Label>
        <Switch
          id="inStockOnly"
          name="inStockOnly"
          checked={inStockOnly}
          onCheckedChange={checked => handleOtherChanges(checked, 'inStockOnly')}
        />
      </div>

      {/* Sort Options */}
      <div className="space-y-2">
        <Label>Sort By</Label>
        <Select
          name="sortOrder"
          value={sortOrder}
          onValueChange={value => handleOtherChanges(value, 'sortOrder')}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select sorting" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {getActiveFilterCount() > 0 && (
        <Button
          variant="destructive"
          size="sm"
          onClick={clearFilters}
          data-testid="reset_desktop"
          className="h-8 px-2 w-full"
        >
          Reset all filters
        </Button>
      )}
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
                <span
                  data-testid="filter-count-badge"
                  className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                >
                  {getActiveFilterCount()}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col h-full">
              <div className="flex-1 mt-6">
                <FilterContent />
              </div>
              {getActiveFilterCount() > 0 && (
                <div className="mt-6 pb-8">
                  <Separator className="mb-6" />
                  <Button
                    variant="destructive"
                    data-testid="reset_mobile"
                    onClick={clearFilters}
                    className="w-full h-12 text-base"
                    aria-label="Reset all filters"
                  >
                    Reset all filters
                  </Button>
                </div>
              )}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 px-2"
            aria-label="Reset all filters"
          >
            Reset all filters
          </Button>
        )}
      </div>
      <FilterContent />
    </Card>
  );
}
