export interface HeroBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url: string;
  cta_text?: string | null;
  cta_link?: string | null;
  secondary_cta_text?: string | null;
  secondary_cta_link?: string | null;
  is_active: boolean;
  position: number;
  background_color?: string | null;
  text_color?: string | null;
  created_by?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface HeroBannerFormData {
  title: string;
  subtitle?: string | null;
  image_url: string;
  cta_text?: string | null;
  cta_link?: string | null;
  secondary_cta_text?: string | null;
  secondary_cta_link?: string | null;
  is_active: boolean;
  position: number;
  background_color?: string | null;
  text_color?: string | null;
  created_by?: string | null;
}
