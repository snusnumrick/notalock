import { Skeleton } from '~/components/ui/skeleton';

export function HeroSliderSkeleton() {
  return (
    <div className="relative overflow-hidden bg-white">
      <div className="h-96 w-full md:h-[500px]">
        <Skeleton className="h-full w-full" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-xl px-4">
            <Skeleton className="mb-3 h-12 w-3/4" />
            <Skeleton className="mb-6 h-6 w-full" />
            <Skeleton className="mb-2 h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />

            <div className="mt-8 flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Skeleton className="h-12 w-40" />
              <Skeleton className="h-12 w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
