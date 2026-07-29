-- =====================================================
-- Brellis — Complete Schema
-- Run this in Supabase SQL Editor (Project → SQL → New Query)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- USERS (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  avatar_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 600),
  country TEXT DEFAULT 'Pakistan',
  timezone TEXT DEFAULT 'Asia/Karachi',
  languages JSONB DEFAULT '[]'::jsonb,
  is_seller BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SELLER PROFILES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.seller_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tagline TEXT CHECK (char_length(tagline) <= 100),
  description TEXT CHECK (char_length(description) <= 3000),
  skills TEXT[] DEFAULT '{}',
  seller_level TEXT DEFAULT 'new_seller'
    CHECK (seller_level IN ('new_seller','level_one','level_two','top_rated')),
  response_time_hours INTEGER,
  response_rate INTEGER CHECK (response_rate BETWEEN 0 AND 100),
  on_time_delivery_rate INTEGER DEFAULT 100 CHECK (on_time_delivery_rate BETWEEN 0 AND 100),
  order_completion_rate INTEGER DEFAULT 100 CHECK (order_completion_rate BETWEEN 0 AND 100),
  total_earnings_lifetime DECIMAL(10,2) DEFAULT 0.00,
  balance_pending_clearance DECIMAL(10,2) DEFAULT 0.00,
  balance_available DECIMAL(10,2) DEFAULT 0.00,
  total_orders_completed INTEGER DEFAULT 0,
  total_orders_cancelled INTEGER DEFAULT 0,
  total_reviews_received INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (average_rating BETWEEN 0 AND 5),
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  mock_bank_name TEXT,
  mock_account_last4 TEXT,
  portfolio_items JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  is_available BOOLEAN DEFAULT TRUE,
  vacation_mode BOOLEAN DEFAULT FALSE,
  vacation_start DATE,
  vacation_end DATE,
  vacation_message TEXT,
  auto_reply_message TEXT,
  days_active INTEGER DEFAULT 0,
  joined_as_seller_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CATEGORIES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'Globe',
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  gig_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- GIGS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.gigs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  subcategory_id UUID REFERENCES public.categories(id),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 10 AND 80),
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL CHECK (char_length(description) >= 120),
  short_description TEXT CHECK (char_length(short_description) <= 150),
  tags TEXT[] DEFAULT '{}' CHECK (array_length(tags, 1) <= 5),
  thumbnail_url TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  intro_video_url TEXT,
  faq JSONB DEFAULT '[]'::jsonb,
  requirements TEXT,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','pending_approval','active','paused','rejected','deleted')),
  rejection_reason TEXT,
  rejection_details TEXT,
  total_orders INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_favorites INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  search_vector TSVECTOR
);
CREATE INDEX IF NOT EXISTS gigs_search_idx ON public.gigs USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS gigs_seller_idx ON public.gigs(seller_id);
CREATE INDEX IF NOT EXISTS gigs_category_idx ON public.gigs(category_id);
CREATE INDEX IF NOT EXISTS gigs_status_idx ON public.gigs(status);

-- Populate search_vector via trigger (GENERATED column would require IMMUTABLE
-- expressions; to_tsvector with a text config is treated as non-immutable on Supabase).
CREATE OR REPLACE FUNCTION public.gigs_update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english'::regconfig, coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english'::regconfig, coalesce(array_to_string(NEW.tags, ' '), '')), 'B') ||
    setweight(to_tsvector('english'::regconfig, coalesce(NEW.short_description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gigs_search_vector_trigger ON public.gigs;
CREATE TRIGGER gigs_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, tags, short_description ON public.gigs
  FOR EACH ROW EXECUTE FUNCTION public.gigs_update_search_vector();

-- =====================================================
-- GIG PACKAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.gig_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  package_type TEXT NOT NULL CHECK (package_type IN ('basic','standard','premium')),
  name TEXT NOT NULL CHECK (char_length(name) <= 40),
  description TEXT NOT NULL CHECK (char_length(description) <= 100),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 5.00),
  delivery_days INTEGER NOT NULL CHECK (delivery_days BETWEEN 1 AND 365),
  revisions INTEGER NOT NULL DEFAULT 1 CHECK (revisions >= -1),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(gig_id, package_type)
);

-- =====================================================
-- GIG EXTRAS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.gig_extras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 70),
  description TEXT CHECK (char_length(description) <= 100),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 5.00),
  delivery_days_added INTEGER DEFAULT 0 CHECK (delivery_days_added >= 0),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- ORDERS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  seller_id UUID NOT NULL REFERENCES public.users(id),
  gig_id UUID NOT NULL REFERENCES public.gigs(id),
  package_id UUID NOT NULL REFERENCES public.gig_packages(id),
  package_snapshot JSONB NOT NULL,
  selected_extras JSONB DEFAULT '[]'::jsonb,
  is_custom_offer BOOLEAN DEFAULT FALSE,
  gig_base_price DECIMAL(10,2) NOT NULL,
  extras_price DECIMAL(10,2) DEFAULT 0.00,
  order_subtotal DECIMAL(10,2) NOT NULL,
  buyer_service_fee DECIMAL(10,2) NOT NULL,
  buyer_total_paid DECIMAL(10,2) NOT NULL,
  platform_commission DECIMAL(10,2) NOT NULL,
  seller_earnings DECIMAL(10,2) NOT NULL,
  tip_amount DECIMAL(10,2) DEFAULT 0.00,
  tip_platform_cut DECIMAL(10,2) DEFAULT 0.00,
  seller_tip_earnings DECIMAL(10,2) DEFAULT 0.00,
  status TEXT DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment','active','requires_requirements','in_progress',
    'delivered','revision_requested','completed','cancelled','disputed'
  )),
  requirements_submitted BOOLEAN DEFAULT FALSE,
  buyer_requirements TEXT,
  buyer_requirements_files TEXT[] DEFAULT '{}',
  delivery_days INTEGER NOT NULL,
  delivery_due_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  delivery_message TEXT,
  delivery_files TEXT[] DEFAULT '{}',
  auto_complete_at TIMESTAMP WITH TIME ZONE,
  revisions_allowed INTEGER NOT NULL DEFAULT 1,
  revisions_used INTEGER DEFAULT 0,
  revision_message TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  cancellation_requested_by UUID REFERENCES public.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  funds_cleared BOOLEAN DEFAULT FALSE,
  funds_cleared_at TIMESTAMP WITH TIME ZONE,
  funds_transferred BOOLEAN DEFAULT FALSE,
  funds_transferred_at TIMESTAMP WITH TIME ZONE,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS orders_buyer_idx ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS orders_seller_idx ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_gig_idx ON public.orders(gig_id);

-- Sequence for sequential order numbers like SB-2025-00001
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

-- =====================================================
-- CUSTOM OFFERS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.custom_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.users(id),
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  conversation_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 5.00),
  delivery_days INTEGER NOT NULL CHECK (delivery_days >= 1),
  revisions INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- REVIEWS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id),
  gig_id UUID NOT NULL REFERENCES public.gigs(id),
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  seller_id UUID NOT NULL REFERENCES public.users(id),
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  communication_rating INTEGER NOT NULL CHECK (communication_rating BETWEEN 1 AND 5),
  service_as_described_rating INTEGER NOT NULL CHECK (service_as_described_rating BETWEEN 1 AND 5),
  would_recommend BOOLEAN NOT NULL,
  review_text TEXT NOT NULL CHECK (char_length(review_text) BETWEEN 15 AND 1000),
  seller_response TEXT CHECK (char_length(seller_response) <= 1000),
  seller_responded_at TIMESTAMP WITH TIME ZONE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reviews_gig_idx ON public.reviews(gig_id);
CREATE INDEX IF NOT EXISTS reviews_seller_idx ON public.reviews(seller_id);

-- =====================================================
-- CONVERSATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  seller_id UUID NOT NULL REFERENCES public.users(id),
  order_id UUID REFERENCES public.orders(id),
  subject TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_preview TEXT,
  buyer_unread_count INTEGER DEFAULT 0,
  seller_unread_count INTEGER DEFAULT 0,
  is_archived_buyer BOOLEAN DEFAULT FALSE,
  is_archived_seller BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(buyer_id, seller_id, order_id)
);

-- =====================================================
-- MESSAGES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text','file','image','custom_offer','order_update','system')),
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  custom_offer_id UUID REFERENCES public.custom_offers(id),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON public.messages(sender_id);

-- =====================================================
-- FAVORITES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, gig_id)
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(user_id, is_read);

-- =====================================================
-- DISPUTES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id),
  opened_by UUID NOT NULL REFERENCES public.users(id),
  reason TEXT NOT NULL CHECK (reason IN (
    'not_as_described','not_delivered','quality_issue','communication','other'
  )),
  description TEXT NOT NULL CHECK (char_length(description) >= 50),
  evidence_files TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open','admin_reviewing','waiting_response','resolved_buyer','resolved_seller','closed'
  )),
  admin_assigned UUID REFERENCES public.users(id),
  admin_notes TEXT,
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- WITHDRAWALS (mock)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 20.00),
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing','completed','failed')),
  mock_bank_name TEXT,
  mock_account_last4 TEXT,
  notes TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- TIPS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  buyer_id UUID NOT NULL REFERENCES public.users(id),
  seller_id UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 1.00),
  platform_commission DECIMAL(10,2) NOT NULL,
  seller_amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- REPORTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.users(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('gig','user','review')),
  reported_gig_id UUID REFERENCES public.gigs(id),
  reported_user_id UUID REFERENCES public.users(id),
  reported_review_id UUID REFERENCES public.reviews(id),
  reason TEXT NOT NULL CHECK (reason IN (
    'inappropriate_content','spam','fake_reviews','scam','copyright','misleading','other'
  )),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','action_taken','dismissed')),
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EMAIL LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  template_name TEXT NOT NULL,
  html_body TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent','failed')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SELLER LEVEL HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS public.seller_level_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.users(id),
  previous_level TEXT NOT NULL,
  new_level TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT
);

-- =====================================================
-- PLATFORM SETTINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.platform_settings (key, value, description) VALUES
  ('seller_commission_rate', '0.20', 'Platform commission on seller earnings (20%)'),
  ('buyer_service_fee_rate', '0.055', 'Service fee added to buyer total (5.5%)'),
  ('buyer_small_order_fee', '2.50', 'Flat fee on orders under small_order_threshold'),
  ('buyer_small_order_threshold', '50.00', 'Order amount below which small order fee applies'),
  ('clearing_days_new_seller', '14', 'Fund clearing days for new sellers'),
  ('clearing_days_level_one', '14', 'Fund clearing days for level one sellers'),
  ('clearing_days_level_two', '10', 'Fund clearing days for level two sellers'),
  ('clearing_days_top_rated', '7', 'Fund clearing days for top rated sellers'),
  ('auto_complete_days', '3', 'Days after delivery before auto-completion'),
  ('min_withdrawal_amount', '20.00', 'Minimum withdrawal amount in USD'),
  ('custom_offer_expiry_days', '7', 'Days before custom offer expires'),
  ('level_one_min_orders', '10', 'Minimum orders for Level One'),
  ('level_one_min_earnings', '400', 'Minimum earnings for Level One'),
  ('level_one_min_days', '60', 'Minimum days active for Level One'),
  ('level_two_min_orders', '50', 'Minimum orders for Level Two'),
  ('level_two_min_earnings', '2000', 'Minimum earnings for Level Two'),
  ('level_two_min_days', '120', 'Minimum days active for Level Two'),
  ('top_rated_min_orders', '100', 'Minimum orders for Top Rated'),
  ('top_rated_min_earnings', '20000', 'Minimum earnings for Top Rated')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gig_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public profiles viewable" ON public.users;
CREATE POLICY "Public profiles viewable" ON public.users FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Seller profiles public" ON public.seller_profiles;
CREATE POLICY "Seller profiles public" ON public.seller_profiles FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Sellers manage own seller profile" ON public.seller_profiles;
CREATE POLICY "Sellers manage own seller profile" ON public.seller_profiles FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Active gigs public" ON public.gigs;
CREATE POLICY "Active gigs public" ON public.gigs FOR SELECT USING (status = 'active' OR seller_id = auth.uid());

DROP POLICY IF EXISTS "Sellers manage own gigs" ON public.gigs;
CREATE POLICY "Sellers manage own gigs" ON public.gigs FOR ALL USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "Packages public" ON public.gig_packages;
CREATE POLICY "Packages public" ON public.gig_packages FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Sellers manage own packages" ON public.gig_packages;
CREATE POLICY "Sellers manage own packages" ON public.gig_packages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.gigs g WHERE g.id = gig_id AND g.seller_id = auth.uid())
);

DROP POLICY IF EXISTS "Extras public" ON public.gig_extras;
CREATE POLICY "Extras public" ON public.gig_extras FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Sellers manage own extras" ON public.gig_extras;
CREATE POLICY "Sellers manage own extras" ON public.gig_extras FOR ALL USING (
  EXISTS (SELECT 1 FROM public.gigs g WHERE g.id = gig_id AND g.seller_id = auth.uid())
);

DROP POLICY IF EXISTS "Order participants only" ON public.orders;
CREATE POLICY "Order participants only" ON public.orders FOR ALL USING (
  buyer_id = auth.uid() OR seller_id = auth.uid()
) WITH CHECK (
  buyer_id = auth.uid() OR seller_id = auth.uid()
);

DROP POLICY IF EXISTS "Own notifications only" ON public.notifications;
CREATE POLICY "Own notifications only" ON public.notifications FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Conversation participants only" ON public.conversations;
CREATE POLICY "Conversation participants only" ON public.conversations FOR ALL USING (
  buyer_id = auth.uid() OR seller_id = auth.uid()
);

DROP POLICY IF EXISTS "Messages: conversation participants only" ON public.messages;
CREATE POLICY "Messages: conversation participants only" ON public.messages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Reviews public" ON public.reviews;
CREATE POLICY "Reviews public" ON public.reviews FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Buyers write reviews" ON public.reviews;
CREATE POLICY "Buyers write reviews" ON public.reviews FOR INSERT WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "Sellers respond to reviews" ON public.reviews;
CREATE POLICY "Sellers respond to reviews" ON public.reviews FOR UPDATE USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "Own favorites" ON public.favorites;
CREATE POLICY "Own favorites" ON public.favorites FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Own withdrawals" ON public.withdrawals;
CREATE POLICY "Own withdrawals" ON public.withdrawals FOR ALL USING (seller_id = auth.uid());

DROP POLICY IF EXISTS "Tips participants" ON public.tips;
CREATE POLICY "Tips participants" ON public.tips FOR ALL USING (buyer_id = auth.uid() OR seller_id = auth.uid());

DROP POLICY IF EXISTS "Disputes participants" ON public.disputes;
CREATE POLICY "Disputes participants" ON public.disputes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid()))
);

DROP POLICY IF EXISTS "Own reports" ON public.reports;
CREATE POLICY "Own reports" ON public.reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Custom offers participants" ON public.custom_offers;
CREATE POLICY "Custom offers participants" ON public.custom_offers FOR ALL USING (
  seller_id = auth.uid() OR buyer_id = auth.uid()
);

DROP POLICY IF EXISTS "Categories public" ON public.categories;
CREATE POLICY "Categories public" ON public.categories FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Platform settings public read" ON public.platform_settings;
CREATE POLICY "Platform settings public read" ON public.platform_settings FOR SELECT USING (TRUE);

-- email_logs has no SELECT/INSERT policies for normal users (server-only access via service role)

-- =====================================================
-- TRIGGERS — auto-create user row on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '_', 'g'))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- TRIGGER — updated_at on tables
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS seller_profiles_updated_at ON public.seller_profiles;
CREATE TRIGGER seller_profiles_updated_at BEFORE UPDATE ON public.seller_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS gigs_updated_at ON public.gigs;
CREATE TRIGGER gigs_updated_at BEFORE UPDATE ON public.gigs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- CATEGORIES SEED
-- =====================================================
INSERT INTO public.categories (id, name, slug, icon_name, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Web Development', 'web-development', 'Globe', 1),
  ('22222222-2222-2222-2222-222222222222', 'Mobile Development', 'mobile-development', 'Smartphone', 2),
  ('33333333-3333-3333-3333-333333333333', 'Design & Creative', 'design-creative', 'Palette', 3),
  ('44444444-4444-4444-4444-444444444444', 'AI & Automation', 'ai-automation', 'Bot', 4),
  ('55555555-5555-5555-5555-555555555555', 'Digital Marketing', 'digital-marketing', 'TrendingUp', 5),
  ('66666666-6666-6666-6666-666666666666', 'Business Support', 'business-support', 'Briefcase', 6)
ON CONFLICT (slug) DO NOTHING;

-- Web Dev subcategories
INSERT INTO public.categories (name, slug, parent_id, sort_order) VALUES
  ('Frontend Development', 'frontend-development', '11111111-1111-1111-1111-111111111111', 1),
  ('Backend Development', 'backend-development', '11111111-1111-1111-1111-111111111111', 2),
  ('Full Stack Development', 'full-stack-development', '11111111-1111-1111-1111-111111111111', 3),
  ('WordPress & CMS', 'wordpress-cms', '11111111-1111-1111-1111-111111111111', 4),
  ('No-Code Development', 'no-code-development', '11111111-1111-1111-1111-111111111111', 5),
  ('E-commerce Development', 'ecommerce-development', '11111111-1111-1111-1111-111111111111', 6),
  ('Landing Pages', 'landing-pages', '11111111-1111-1111-1111-111111111111', 7)
ON CONFLICT (slug) DO NOTHING;

-- Mobile subcategories
INSERT INTO public.categories (name, slug, parent_id, sort_order) VALUES
  ('iOS Development', 'ios-development', '22222222-2222-2222-2222-222222222222', 1),
  ('Android Development', 'android-development', '22222222-2222-2222-2222-222222222222', 2),
  ('React Native', 'react-native', '22222222-2222-2222-2222-222222222222', 3),
  ('Flutter', 'flutter', '22222222-2222-2222-2222-222222222222', 4),
  ('App UI Design', 'app-ui-design', '22222222-2222-2222-2222-222222222222', 5)
ON CONFLICT (slug) DO NOTHING;

-- Design subcategories
INSERT INTO public.categories (name, slug, parent_id, sort_order) VALUES
  ('Logo Design', 'logo-design', '33333333-3333-3333-3333-333333333333', 1),
  ('UI/UX Design', 'ui-ux-design', '33333333-3333-3333-3333-333333333333', 2),
  ('Graphic Design', 'graphic-design', '33333333-3333-3333-3333-333333333333', 3),
  ('Video Editing', 'video-editing', '33333333-3333-3333-3333-333333333333', 4),
  ('Brand Identity', 'brand-identity', '33333333-3333-3333-3333-333333333333', 5)
ON CONFLICT (slug) DO NOTHING;

-- AI subcategories
INSERT INTO public.categories (name, slug, parent_id, sort_order) VALUES
  ('AI Integration', 'ai-integration', '44444444-4444-4444-4444-444444444444', 1),
  ('Chatbot Development', 'chatbot-development', '44444444-4444-4444-4444-444444444444', 2),
  ('Workflow Automation', 'workflow-automation', '44444444-4444-4444-4444-444444444444', 3),
  ('Prompt Engineering', 'prompt-engineering', '44444444-4444-4444-4444-444444444444', 4)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- STORAGE BUCKETS (run these manually if SQL fails)
-- =====================================================
-- Buckets to create in Supabase Dashboard → Storage:
--   avatars        (public)
--   gig-media      (public)
--   portfolio      (public)
--   order-files    (private — signed URLs only)
-- =====================================================
