import { Form } from '@remix-run/react';
import { useEffect, useState } from 'react';
import type { HeroBanner, HeroBannerFormData } from '../../types/hero-banner.types';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { Switch } from '~/components/ui/switch';
import { Card, CardContent } from '~/components/ui/card';
import { useToast } from '~/hooks/use-toast';
import { HeroBannerPreview } from './HeroBannerPreview';

interface HeroBannerFormProps {
  initialData?: HeroBanner;
  onSubmit?: (data: FormData) => void;
  isSubmitting?: boolean;
  formError?: string;
}

export function HeroBannerForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  formError,
}: HeroBannerFormProps) {
  const { toast } = useToast();
  const [previewData, setPreviewData] = useState<HeroBannerFormData>({
    title: initialData?.title || 'Banner Title',
    subtitle: initialData?.subtitle || 'Banner Subtitle',
    image_url: initialData?.image_url || 'https://placehold.co/1200x600/333/FFF',
    cta_text: initialData?.cta_text || 'Learn More',
    cta_link: initialData?.cta_link || '#',
    secondary_cta_text: initialData?.secondary_cta_text || '',
    secondary_cta_link: initialData?.secondary_cta_link || '',
    is_active: initialData?.is_active ?? true,
    position: initialData?.position ?? 0,
    background_color: initialData?.background_color || '',
    text_color: initialData?.text_color || '',
  });

  useEffect(() => {
    if (formError) {
      toast({
        title: 'Error',
        description: formError,
        variant: 'destructive',
      });
    }
  }, [formError, toast]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setPreviewData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setPreviewData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div>
        <Form method="post" onSubmit={e => onSubmit && onSubmit(new FormData(e.currentTarget))}>
          <div className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                defaultValue={initialData?.title}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Textarea
                id="subtitle"
                name="subtitle"
                defaultValue={initialData?.subtitle || ''}
                onChange={handleFormChange}
                rows={3}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                name="image_url"
                defaultValue={initialData?.image_url}
                onChange={handleFormChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Recommended dimensions: 1200x600 pixels
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="background_color">Background Color (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="background_color"
                    name="background_color"
                    type="color"
                    className="w-12 h-9 p-1 cursor-pointer"
                    defaultValue={initialData?.background_color || '#000000'}
                    onChange={handleFormChange}
                  />
                  <Input
                    type="text"
                    value={previewData.background_color || ''}
                    onChange={e =>
                      setPreviewData(prev => ({ ...prev, background_color: e.target.value }))
                    }
                    placeholder="#000000 or rgba(0,0,0,0.5)"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="text_color">Text Color (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="text_color"
                    name="text_color"
                    type="color"
                    className="w-12 h-9 p-1 cursor-pointer"
                    defaultValue={initialData?.text_color || '#ffffff'}
                    onChange={handleFormChange}
                  />
                  <Input
                    type="text"
                    value={previewData.text_color || ''}
                    onChange={e =>
                      setPreviewData(prev => ({ ...prev, text_color: e.target.value }))
                    }
                    placeholder="#ffffff or rgba(255,255,255,0.9)"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cta_text">Call to Action Text</Label>
              <Input
                id="cta_text"
                name="cta_text"
                defaultValue={initialData?.cta_text || ''}
                onChange={handleFormChange}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cta_link">Call to Action Link</Label>
              <Input
                id="cta_link"
                name="cta_link"
                defaultValue={initialData?.cta_link || ''}
                onChange={handleFormChange}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="secondary_cta_text">Secondary Call to Action Text (optional)</Label>
              <Input
                id="secondary_cta_text"
                name="secondary_cta_text"
                defaultValue={initialData?.secondary_cta_text || ''}
                onChange={handleFormChange}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="secondary_cta_link">Secondary Call to Action Link (optional)</Label>
              <Input
                id="secondary_cta_link"
                name="secondary_cta_link"
                defaultValue={initialData?.secondary_cta_link || ''}
                onChange={handleFormChange}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                name="position"
                type="number"
                min="0"
                defaultValue={initialData?.position || 0}
                onChange={handleFormChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first in the slider
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                name="is_active"
                defaultChecked={initialData?.is_active ?? true}
                onCheckedChange={checked => handleSwitchChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Active</Label>
              <input
                type="hidden"
                name="is_active"
                value={previewData.is_active ? 'true' : 'false'}
              />
            </div>

            {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : initialData ? 'Update Banner' : 'Create Banner'}
              </Button>
            </div>
          </div>
        </Form>
      </div>

      <div>
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 text-lg font-medium">Preview</h3>
            <div className="overflow-hidden rounded-md border">
              <HeroBannerPreview banner={previewData as HeroBanner} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
