# Personal Website

A modern, high-performance personal website and blog built with the latest web technologies. Designed to showcase projects, share thoughts via a blog, and highlight technical skills with a clean, responsive UI.

Features

* **Bleeding Edge Tech**: Built with **Next.js 16.1** and **React 19**.
* **Zero-Config Styling**: Utilizes **Tailwind CSS v4** for lightning-fast styling without complex config files.
* **Smooth Animations**: Interactive UI elements powered by **Framer Motion**.
* **Bilingual Support (i18n)**: Native support for English (`en`) and Indonesian (`id`) content.
* **Hybrid Blog System**:
    * **Supabase Integration**: Manage posts via a database.
    * **Local Fallback**: Works perfectly without a database using local Markdown files/page.tsx].
* **Dark/Light Mode**: Fully thematic UI with system preference detection.
* **Categorized Content**: Filter blog posts by Tech/AI, Reviews, Short Stories, and Culture.

## Tech Stack

* **Framework**: Next.js 16 (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS v4
* **Database**: Supabase (PostgreSQL)
* **Icons**: Lucide React
* **Animation**: Framer Motion
* **Deployment**: Vercel / Netlify

## Getting Started

### Prerequisites

* Node.js 18+ or later
* npm or pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/username/portfolio-v2.git](https://github.com/username/portfolio-v2.git)
    cd portfolio-v2
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**
    Create a `.env.local` file in the root directory. You can use the example below (or leave it empty to use local fallbacks):
    
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```bash
├── docs/               # Documentation guides
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React components (UI, Layouts, Features)
│   ├── context/        # Global contexts (Locale, Theme)
│   ├── lib/            # Utilities (Supabase client, i18n config)
│   └── types/          # TypeScript definition
├── supabase-schema.sql # Database schema setup
└── ...
