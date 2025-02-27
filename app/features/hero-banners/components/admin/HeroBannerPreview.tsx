import type { HeroBanner } from '../../types/hero-banner.types';

interface HeroBannerPreviewProps {
  banner: HeroBanner;
}

export function HeroBannerPreview({ banner }: HeroBannerPreviewProps) {
  const textColorStyle = banner.text_color ? { color: banner.text_color } : {};
  const hasSecondaryAction = banner.secondary_cta_text && banner.secondary_cta_link;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        backgroundColor: banner.background_color || undefined,
      }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={banner.image_url} alt={banner.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black opacity-30"></div>
      </div>

      {/* Content */}
      <div className="relative p-6 sm:p-8">
        <div className="max-w-xl text-white" style={textColorStyle}>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            {banner.title}
          </h1>
          {banner.subtitle && <p className="mt-2 text-base sm:text-lg">{banner.subtitle}</p>}

          {banner.cta_text && banner.cta_link && (
            <div className="mt-4 flex flex-col space-y-2 sm:flex-row sm:space-x-3 sm:space-y-0">
              <div>
                <span className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  {banner.cta_text}
                </span>
              </div>

              {hasSecondaryAction && (
                <div>
                  <span className="inline-block rounded-md bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-gray-50">
                    {banner.secondary_cta_text}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
