import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Button } from '~/components/ui/button';
import { Switch } from '~/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import type { Category, CategoryFormData } from '../types/category.types';

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  parent_id: z.string().optional(),
  sort_order: z.number().optional(),
  is_visible: z.boolean(),
  is_highlighted: z.boolean(),
  highlight_priority: z.number().min(0, 'Priority must be non-negative'),
});

interface CategoryFormProps {
  initialData?: Partial<Category>;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  categories?: Category[];
}

export function CategoryForm({ initialData, onSubmit, categories }: CategoryFormProps) {
  const defaultValues = {
    name: initialData?.name ?? '',
    slug: initialData?.slug ?? '',
    description: initialData?.description ?? '',
    parent_id: initialData?.parent_id ?? undefined,
    sort_order: initialData?.sort_order ?? 0,
    is_visible: initialData?.is_visible ?? true,
    is_highlighted: initialData?.is_highlighted ?? false,
    highlight_priority: initialData?.highlight_priority ?? 0,
  };

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues,
  });

  const handleSubmit = async (data: CategoryFormData) => {
    try {
      const formattedData: CategoryFormData = {
        name: data.name,
        slug: data.slug || '',
        description: data.description || '',
        is_visible: data.is_visible,
        is_highlighted: data.is_highlighted,
        highlight_priority: data.highlight_priority ?? 0,
        parent_id: data.parent_id || null,
        sort_order: data.sort_order ?? 0,
      };

      await onSubmit(formattedData);
      form.reset();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const submitButtonText = initialData?.id ? 'Update Category' : 'Create Category';

  // Watch is_highlighted to conditionally show priority field
  const isHighlighted = form.watch('is_highlighted');

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
        aria-label={submitButtonText}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {categories && (
          <FormField
            control={form.control}
            name="parent_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a parent category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">None</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="is_visible"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Active</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value === true} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_highlighted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Highlight on Homepage</FormLabel>
                  <FormDescription>
                    Show this category in the homepage highlights section
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value === true} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {isHighlighted && (
            <FormField
              control={form.control}
              name="highlight_priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Priority</FormLabel>
                  <FormDescription>
                    Higher numbers will be displayed first (0 is lowest priority)
                  </FormDescription>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      aria-label="Display Priority"
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <Button type="submit" className="w-full">
          {submitButtonText}
        </Button>
      </form>
    </Form>
  );
}
