import { useState } from 'react';
import { Link, useFetcher } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Badge } from '~/components/ui/badge';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { HeroBanner } from '../../types/hero-banner.types';
import { useToast } from '~/hooks/use-toast';

interface HeroBannerListProps {
  banners: HeroBanner[];
}

export function HeroBannerList({ banners }: HeroBannerListProps) {
  const fetcher = useFetcher();
  const { toast } = useToast();
  const [bannerToDelete, setBannerToDelete] = useState<HeroBanner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isReordering = fetcher.state !== 'idle' && fetcher.formData?.get('_action') === 'reorder';

  const handleDelete = () => {
    if (!bannerToDelete) return;

    setIsDeleting(true);

    const formData = new FormData();
    formData.append('_action', 'delete');
    formData.append('id', bannerToDelete.id);

    fetcher.submit(formData, { method: 'post' });

    // Clean up
    setIsDeleting(false);
    setBannerToDelete(null);

    toast({
      title: 'Banner Deleted',
      description: `"${bannerToDelete.title}" has been deleted.`,
    });
  };

  const handleMoveUp = (banner: HeroBanner, index: number) => {
    if (index === 0) return;

    const reorderedBanners = [...banners];
    const targetPosition = reorderedBanners[index - 1].position;

    const formData = new FormData();
    formData.append('_action', 'reorder');
    formData.append('id', banner.id);
    formData.append('position', targetPosition.toString());

    fetcher.submit(formData, { method: 'post' });
  };

  const handleMoveDown = (banner: HeroBanner, index: number) => {
    if (index === banners.length - 1) return;

    const reorderedBanners = [...banners];
    const targetPosition = reorderedBanners[index + 1].position;

    const formData = new FormData();
    formData.append('_action', 'reorder');
    formData.append('id', banner.id);
    formData.append('position', targetPosition.toString());

    fetcher.submit(formData, { method: 'post' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>{/* Empty div to push button to right */}</div>
        {banners.length > 0 && (
          <Button asChild>
            <Link to="/admin/hero-banners/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Banner
            </Link>
          </Button>
        )}
      </div>

      {banners.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center">
          <h3 className="mb-2 font-medium text-muted-foreground">No Hero Banners Found</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Create your first hero banner to display on your site.
          </p>
          <Button asChild>
            <Link to="/admin/hero-banners/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Hero Banner
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Position</TableHead>
                <TableHead className="w-[180px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner, index) => (
                <TableRow key={banner.id}>
                  <TableCell className="font-medium">{banner.title}</TableCell>
                  <TableCell>
                    <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{banner.position}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={index === 0 || isReordering}
                        onClick={() => handleMoveUp(banner, index)}
                        data-testid={`arrow-up-button-${index}`}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={index === banners.length - 1 || isReordering}
                        onClick={() => handleMoveDown(banner, index)}
                        data-testid={`arrow-down-button-${index}`}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" asChild>
                        <Link to={`/admin/hero-banners/${banner.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setBannerToDelete(banner)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!bannerToDelete} onOpenChange={open => !open && setBannerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hero Banner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{bannerToDelete?.title}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete Banner'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
