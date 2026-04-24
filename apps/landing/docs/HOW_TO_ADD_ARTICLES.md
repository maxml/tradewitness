# How to Add Blog Articles

There are **two ways** to add articles to your blog:

## Option 1: Add Articles in Code (Quick & Easy)

Edit `src/components/blog/BlogPageClient.tsx` and add your article to the `samplePosts` array:

```typescript
const samplePosts: BlogPost[] = [
  {
    id: '1',
    title: 'My First Article',
    slug: 'my-first-article',
    excerpt: 'A brief description of what this article is about...',
    content: '',
    category: 'tech-ai', // Options: 'tech-ai', 'reviews', 'short-stories', 'culture'
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Add more articles here...
];
```

For the **full article content**, also add it to `src/app/blog/[slug]/page.tsx` in the `samplePosts` object:

```typescript
const samplePosts: Record<string, BlogPost> = {
  'my-first-article': {
    id: '1',
    title: 'My First Article',
    slug: 'my-first-article',
    excerpt: 'A brief description...',
    category: 'tech-ai',
    content: `# My First Article

Your article content here in markdown format.

## Section 1
Some text here...

## Section 2
More text...
`,
    published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};
```

## Option 2: Use Supabase (Recommended for Production)

### Setup Supabase:

1. Create a project at [supabase.com](https://supabase.com)
2. Run the schema from `supabase-schema.sql` in SQL Editor
3. Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

### Add Articles via Supabase Dashboard:

1. Go to **Table Editor** → **blog_posts**
2. Click **Insert Row**
3. Fill in:
   - `title`: Article title
   - `slug`: URL-friendly slug (e.g., `my-awesome-post`)
   - `excerpt`: Short description
   - `content`: Full article in markdown
   - `category`: One of `tech-ai`, `reviews`, `short-stories`, `culture`
   - `published`: Set to `true` to show on site
4. Click **Save**

---

## Category Options

| Value | Label |
|-------|-------|
| `tech-ai` | Tech/AI |
| `reviews` | Reviews |
| `short-stories` | Short Stories / Cerita Pendek |
| `culture` | Culture / Kultur |

---

## Tips

- **Slug** should be lowercase with hyphens (e.g., `my-article-title`)
- **Content** uses markdown formatting (headers with `#`, bold with `**text**`)
- Change `published` to `false` to hide a draft
