import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from '@remix-run/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '~/lib/utils';
import type { HeroBanner } from '../types/hero-banner.types';

interface HeroSliderProps {
  banners: HeroBanner[];
  autoplaySpeed?: number;
  pauseOnHover?: boolean;
}

export function HeroSlider({
  banners,
  autoplaySpeed = 5000,
  pauseOnHover = true,
}: HeroSliderProps) {
  // console.log('HeroSlider received banners:', banners);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(prevIndex => (prevIndex + 1) % banners.length);
    setTimeout(() => setIsTransitioning(false), 500); // match transition duration
  }, [banners.length, isTransitioning]);

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(prevIndex => (prevIndex - 1 + banners.length) % banners.length);
    setTimeout(() => setIsTransitioning(false), 500); // match transition duration
  }, [banners.length, isTransitioning]);

  const goToSlide = useCallback(
    (index: number) => {
      if (isTransitioning || index === currentIndex) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 500); // match transition duration
    },
    [currentIndex, isTransitioning]
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToNext, goToPrevious]);

  // Handle touch events for swipe
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX.current = e.changedTouches[0].clientX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const touchDiff = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 50;

      if (touchDiff > minSwipeDistance) {
        goToNext(); // Swipe left -> go to next
      } else if (touchDiff < -minSwipeDistance) {
        goToPrevious(); // Swipe right -> go to previous
      }
    };

    slider.addEventListener('touchstart', handleTouchStart);
    slider.addEventListener('touchend', handleTouchEnd);

    return () => {
      slider.removeEventListener('touchstart', handleTouchStart);
      slider.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goToNext, goToPrevious]);

  // Autoplay timer
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const interval = setInterval(goToNext, autoplaySpeed);
    return () => clearInterval(interval);
  }, [banners.length, goToNext, autoplaySpeed, isPaused]);

  // Return null if no banners
  if (!banners || banners.length === 0) {
    console.log('HeroSlider: No banners to display');
    return null;
  }

  // If there's only one banner, display it without controls
  if (banners.length === 1) {
    const banner = banners[0];
    return <SingleBanner banner={banner} />;
  }

  return (
    <div
      ref={sliderRef}
      className="relative overflow-hidden bg-white"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Hero Image Slider"
    >
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className="w-full flex-shrink-0"
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${index + 1} of ${banners.length}: ${banner.title}`}
            aria-hidden={index !== currentIndex}
          >
            <SingleBanner banner={banner} />
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/50 p-2 text-gray-800 shadow hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onClick={goToPrevious}
        aria-label="Previous slide"
        disabled={isTransitioning}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/50 p-2 text-gray-800 shadow hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onClick={goToNext}
        aria-label="Next slide"
        disabled={isTransitioning}
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Indicator dots */}
      <div
        className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2"
        role="tablist"
        aria-label="Slider pagination"
      >
        {banners.map((_, index) => (
          <button
            key={index}
            className={cn(
              'h-2 w-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              index === currentIndex ? 'bg-blue-600 w-4' : 'bg-gray-300'
            )}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            aria-selected={index === currentIndex}
            role="tab"
            tabIndex={index === currentIndex ? 0 : -1}
          ></button>
        ))}
      </div>

      {/* Visually hidden live region for screen reader users */}
      <div className="sr-only" aria-live="polite">
        Showing slide {currentIndex + 1} of {banners.length}
      </div>
    </div>
  );
}

interface SingleBannerProps {
  banner: HeroBanner;
}

function SingleBanner({ banner }: SingleBannerProps) {
  const hasSecondaryAction = banner.secondary_cta_text && banner.secondary_cta_link;
  const textColor = banner.text_color || 'white';

  return (
    <div
      className="relative overflow-hidden h-96 md:h-[500px]"
      style={{
        backgroundColor: banner.background_color || undefined,
      }}
      data-testid="banner-container"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={banner.image_url} alt={banner.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black opacity-30"></div>
      </div>

      {/* Content */}
      <div className="relative flex items-center justify-center h-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl" style={{ color: textColor }}>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              {banner.title}
            </h1>
            {banner.subtitle && (
              <p className="mt-3 text-lg sm:mt-5 sm:text-xl md:mt-5 md:text-2xl">
                {banner.subtitle}
              </p>
            )}

            {banner.cta_text && banner.cta_link && (
              <div className="mt-8 sm:flex sm:space-x-4">
                <div className="rounded-md shadow">
                  <Link
                    to={banner.cta_link}
                    className="flex w-full items-center justify-center rounded-md border border-transparent bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 md:py-4 md:px-10 md:text-lg"
                    prefetch="intent"
                  >
                    {banner.cta_text}
                  </Link>
                </div>

                {hasSecondaryAction && (
                  <div className="mt-3 sm:mt-0">
                    <Link
                      to={banner.secondary_cta_link!}
                      className="flex w-full items-center justify-center rounded-md border border-transparent bg-white px-8 py-3 text-base font-medium text-blue-600 hover:bg-gray-50 md:py-4 md:px-10 md:text-lg"
                      prefetch="intent"
                    >
                      {banner.secondary_cta_text}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
