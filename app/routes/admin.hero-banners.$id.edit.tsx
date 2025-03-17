import { useLoaderData, useActionData, useNavigation, Link } from '@remix-run/react';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { HeroBannerForm } from '~/features/hero-banners/components/admin';
import { adminBannerLoader } from '~/features/hero-banners/api';
import { updateBannerAction } from '~/features/hero-banners/api/actions';
import { Button } from '~/components/ui/button';

export const loader = async ({ request, params, context }: LoaderFunctionArgs) => {
  return adminBannerLoader({ request, params, context });
};

export const action = async ({ request, params, context }: ActionFunctionArgs) => {
  return updateBannerAction({ request, params, context });
};

export default function AdminEditHeroBannerPage() {
  const { banner } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="container space-y-6 py-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Edit Hero Banner</h2>
          <p className="text-muted-foreground">Edit details for &quot;{banner.title}&quot;</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin/hero-banners">Back to Hero Banners</Link>
        </Button>
      </div>

      <HeroBannerForm
        initialData={banner}
        formError={actionData?.error}
        isSubmitting={isSubmitting}
        onSubmit={formData => {
          formData.append('_action', 'update');
        }}
      />
    </div>
  );
}
