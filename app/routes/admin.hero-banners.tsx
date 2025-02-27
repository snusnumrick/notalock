import { useLoaderData, Outlet, useLocation } from '@remix-run/react';
import type { LoaderFunctionArgs as LoaderArgs, TypedResponse } from '@remix-run/node';
import { HeroBannerList } from '~/features/hero-banners/components/admin';
import { adminBannersLoader, adminBannerAction } from '~/features/hero-banners/api';
import type { HeroBanner } from '~/features/hero-banners/types/hero-banner.types';

interface LoaderData {
  banners: HeroBanner[];
}

export const loader = async ({
  request,
  context,
}: LoaderArgs): Promise<TypedResponse<LoaderData>> => {
  return adminBannersLoader({ request, params: {}, context });
};

export const action = async ({ request, context }: LoaderArgs) => {
  return adminBannerAction({ request, params: {}, context });
};

export default function AdminHeroBannersPage() {
  const { banners } = useLoaderData<typeof loader>();
  const location = useLocation();

  return (
    <div className="container space-y-6 py-8 pl-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Hero Banners</h2>
        <p className="text-muted-foreground">Manage hero banners that appear on your homepage</p>
      </div>

      {/* Display the banners list only on the index route */}
      {location.pathname === '/admin/hero-banners' ? (
        <HeroBannerList banners={banners} />
      ) : (
        <Outlet />
      )}
    </div>
  );
}
