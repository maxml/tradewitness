-- Supabase Schema for Portfolio Website
-- Run this in your Supabase SQL Editor

-- Create category types
-- Blog Categories: tech-ai, reviews, short-stories, culture
CREATE TYPE blog_category AS ENUM ('tech-ai', 'reviews', 'short-stories', 'culture');
-- Project Categories: ai-ml, web-dev, automation, data-analytics
CREATE TYPE project_category AS ENUM ('ai-ml', 'web-dev', 'automation', 'data-analytics');

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  tech_stack TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'web-dev',
  github_url TEXT,
  demo_url TEXT,
  image_url TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog posts table with category
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  category TEXT DEFAULT 'tech-ai',
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Public read access for projects
CREATE POLICY "Public can read projects" ON projects
  FOR SELECT USING (true);

-- Public read access for published blog posts
CREATE POLICY "Public can read published posts" ON blog_posts
  FOR SELECT USING (published = true);

-- Public can insert contact submissions
CREATE POLICY "Public can submit contact" ON contact_submissions
  FOR INSERT WITH CHECK (true);

-- Add views column (if not exists)
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- RPC Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(slug_input TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE blog_posts
  SET views = views + 1
  WHERE slug = slug_input;
END;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);

-- Sample data for testing (optional)
-- Sample data for testing (optional)
INSERT INTO projects (title, description, tech_stack, category, github_url, featured) VALUES
  ('Neural Network for Astrophysics Research', 'Final Year Project: Stellar age prediction and phase classification using Transformer and MLP Models on Gaia Data Release 3.', ARRAY['Python', 'PyTorch', 'Transformer', 'Pandas'], 'ai-ml', 'https://github.com/pranata-dev/stellar-evolution', true),
  ('N8N Job Vacancy Automation', 'Automated Job Vacancy Tracker using n8n, Jina AI, & Telegram Bot. Features duplicate checking, CAPTCHA fallback, and AI-powered parsing.', ARRAY['n8n', 'Jina AI', 'Telegram API', 'JavaScript'], 'automation', 'https://github.com/pranata-dev/n8n-job-vacancy-automation', true),
  ('N8N Receipt Scanner', 'An automated receipt scanning workflow built with n8n that extracts structured data from receipt images using AI-powered OCR and document understanding.', ARRAY['n8n', 'OCR', 'AI', 'JSON'], 'automation', 'https://github.com/pranata-dev/n8n-receipt-scanning', false),
  ('Smartband Health Monitoring', 'ESP32-based IoT system monitoring Heart Rate, SpO2, and Temp via Blynk. Integrates Hugging Face AI to provide automated medical advice when vitals are abnormal.', ARRAY['C++', 'ESP32', 'Blynk', 'Hugging Face'], 'automation', 'https://github.com/pranata-dev/smartband-healt-monitoring-iot', true),
  ('Personal Website Branding', 'Modern Personal Portfolio built with Next.js 16 (App Router), React 19, & Tailwind CSS v4. Features bilingual support (i18n), dark mode, and a hybrid blog system.', ARRAY['Next.js 16', 'React 19', 'Tailwind CSS v4', 'Supabase'], 'web-dev', 'https://github.com/pranata-dev/personal-website', true);

INSERT INTO blog_posts (title, slug, excerpt, content, category, published) VALUES
  ('Neo-Tokyo Cyberpunk in 1988: Menyusuri Distopia, Delusi dan Detonasi Diri dalam Akira (1988)', 'review-akira-1988', 'Apakah lo termasuk orang-orang yang gemar menonton film-film sci-fi, dystopia, cyberpunk semacam The Matrix, Inception atau mungkin main game Cyberpunk 2077? Kalo iya, lo bakal suka dan terkesima dengan film anime yang satu ini, Akira.', 'Apakah lo termasuk orang-orang yang gemar menonton film-film sci-fi, dystopia, cyberpunk semacam The Matrix, Inception atau mungkin main game Cyberpunk 2077? Kalo iya, lo bakal suka dan terkesima dengan film anime yang satu ini, Akira.

![Cover Film Akira (1988)](https://m.media-amazon.com/images/M/MV5BNjFmNWYzZjMtYWIyZi00NDVmLWIxY2EtN2RiMjZiMDk4MzcyXkEyXkFqcGdeQXVyMTg2NjYzOA@@._V1_.jpg)

Anime ini berlatar di tahun 2019 di kota futuristik Neo Tokyo yang dikisahkan pada tahun 1988 terjadi perang nuklir yang memporak-porandakan kota tersebut. Namun, pada 2019, kota itu berubah menjadi kota yang sangat futuristik namun sangat liar dan memiliki tingkat kriminalitas yang sangat tinggi. Ketika film baru dimulai, lo akan disuguhi pemandangan-pemandangan kota Neo Tokyo yang futuristik dengan billboard neon di mana-mana, geng motor, dan gang-gang kecil yang berada di antara gedung-gedung tinggi ala-ala film distopia.

Lo bakal langsung ngerasa kaya lagi diajak berkunjung ke tempat yang chaotic, brutal, tapi juga futuristik. Tidak lupa juga, di awal-awal film lo akan disuguhi dengan motor main character di film itu, Shotaro Kaneda, yang terlihat sangat futuristik dan ngebuat lo pengen punya motor kaya gitu di saat itu juga. Tidak lupa juga di awal film lo akan dikenali dengan geng motor yang dipimpin oleh Kaneda, The Capsules, yang nantinya bakal ngajarin lo tentang loyalitas dan pengkhianatan, serta kekuasaan dan kehancuran.

Tapi dibalik itu semua, tentu saja lo gak akan terlewat dengan yang namanya kekuasaan tanpa kontrol, demonstrasi, eksperimen manusia, kebebasan semu, dan pemerintah yang korup. Oh, gua hampir lupa, satu lagi yang perlu lo pahami adalah film ini menyajikan visual yang sangat menakjubkan padahal dirilis di tahun 1988. 37 Tahun yang lalu, bray!

![Motor Shotaro Kaneda yang melegenda](https://features.japantimes.co.jp/wp-content/uploads/2018/07/kaneda-bike.jpg)

![Neo-Tokyo](https://th.bing.com/th/id/OIP.djsBINC160igU3yRt6j_eQHaEK?w=319&h=180&c=7&r=0&o=7&dpr=1.1&pid=1.7&rm=3)

Di film ini lo akan dikenali dengan salah seorang teman Kaneda yaitu Tetsuo. Biar lo kebayang Tetsuo itu kaya gimana orangnya, bayangin aja temen lo ini yang selalu dibully saat kecil, disuruh-suruh ama teman-teman di atasnya, dan bukan seorang yang “pentolan” di gengnya. Intinya, Tetsuo tuh kaya anak-anak gen z jaman sekarang yang overwhelmed banget dengan keadaan dan kena pressure dari segala arah.

Sekarang bayangin gimana jadinya kalau orang seperti itu dikasih power yang sangat besar secara tiba-tiba? Yap, dia berubah dari yang tadinya orang yang pengen dihargai menjadi seseorang yang punya kekuatan setengah dewa. Gua engga melebih-lebihkan ketika nulis Tetsuo menjadi seseorang yang tiba-tiba menjadi punya kekuatan setengah dewa, karena benar-benar sebesar itu kekuatan dia. Kalau lo mengira film ini cuma sekedar cerita geng motor anak sekolahan biasa di masa depan yang distopia, lo salah besar. Film ini lebih dari itu. Film ini secara gamblang menceritakan bagaimana masa depan se-chaotic itu. Eksperimen manusia dilakukan secara diam-diam, kehancuran identitas manusia, pencarian makna dalam kekacauan, serta demonstrasi dan kekuasaan tanpa kontrol.

![Tetsuo](https://th.bing.com/th/id/OIP.08JQ5-PR7i7ZyttfnjEdCwHaD_?w=311&h=180&c=7&r=0&o=7&dpr=1.1&pid=1.7&rm=3)

Di sini, lo gak bakal disuapin moral of the story dari filmnya. Nonton film Akira tuh kaya lo ngedengerin orang dari masa depan yang tiba-tiba aja dateng ke depan rumah/kost lu dan ngajakin lo ngobrol di tengah malam. Obrolannya abstrak, kadang juga ngebuat lo bingung, “Ini orang ngomongin apaan, sih?”. Tapi, obrolan yang keluar dari mulut dia tuh ibarat potongan puzzle tentang kenyataan masa depan yang benar-benar harus lo susun satu per satu.


Verdict:
Akira tuh kaya mixtape post-apocalypse yang disampaikan dalam bentuk lukisan hidup. Lo nonton anime ini bukan buat paham, tapi buat ngerasain gimana ngerinya kalau teknologi berkembang sangat jauh dan lo hidup di masa distopia.

Rating? Solid 9.5/10.

**Tags:** Anime, Anime Review, Akira, Japanese Culture, Japan', 'reviews', true);
