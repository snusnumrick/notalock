-- Create storage bucket for product images if it doesn't exist
insert into storage.buckets (id, name)
values ('product-images', 'product-images')
on conflict (id) do nothing;

-- Enable RLS on the bucket
alter table storage.objects enable row level security;

-- Clean up existing policies
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Admin Access" on storage.objects;
drop policy if exists "Authenticated Upload Access" on storage.objects;

-- Create policies for the product-images bucket
create policy "Public Read Access"
  on storage.objects for select
  using ( bucket_id = 'product-images' );

create policy "Admin Insert Access"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images' 
    and auth.role() = 'authenticated'
    and exists (
      select 1 from auth.users
      join public.profiles on profiles.id = auth.users.id
      where profiles.role = 'admin'
      and auth.users.id = auth.uid()
    )
  );

create policy "Admin Update Access"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from auth.users
      join public.profiles on profiles.id = auth.users.id
      where profiles.role = 'admin'
      and auth.users.id = auth.uid()
    )
  );

create policy "Admin Delete Access"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
    and exists (
      select 1 from auth.users
      join public.profiles on profiles.id = auth.users.id
      where profiles.role = 'admin'
      and auth.users.id = auth.uid()
    )
  );

-- Enable RLS on product_images table
alter table public.product_images enable row level security;

-- Clean up existing policies
drop policy if exists "Public Read Access" on public.product_images;
drop policy if exists "Admin Access" on public.product_images;

-- Create policies for product_images table
create policy "Public Read Access"
  on public.product_images for select
  using ( true );

create policy "Admin All Access"
  on public.product_images for all
  using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from auth.users
      join public.profiles on profiles.id = auth.users.id
      where profiles.role = 'admin'
      and auth.users.id = auth.uid()
    )
  );