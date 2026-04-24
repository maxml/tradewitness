import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BlogPost, BlogCategory, BLOG_CATEGORIES } from '@/types';
import { Calendar, ArrowLeft, Tag } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ViewCounter } from '@/components/blog/ViewCounter';
import { Eye } from 'lucide-react';

// Prevent caching for accurate view counts
export const revalidate = 0;

// Force dynamic rendering for Supabase data
export const dynamic = 'force-dynamic';

// Sample posts for fallback - Add your articles here with full content
const samplePosts: Record<string, BlogPost> = {
    'review-akira-1988': {
        id: '1',
        title: 'Neo-Tokyo Cyberpunk in 1988: Menyusuri Distopia, Delusi dan Detonasi Diri dalam Akira (1988)',
        slug: 'review-akira-1988',
        excerpt: 'Apakah lo termasuk orang-orang yang gemar menonton film-film sci-fi, dystopia, cyberpunk semacam The Matrix, Inception atau mungkin main game Cyberpunk 2077? Kalo iya, lo bakal suka dan terkesima dengan film anime yang satu ini, Akira.',
        category: 'reviews',
        content: `Apakah lo termasuk orang-orang yang gemar menonton film-film sci-fi, dystopia, cyberpunk semacam The Matrix, Inception atau mungkin main game Cyberpunk 2077? Kalo iya, lo bakal suka dan terkesima dengan film anime yang satu ini, Akira.


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

Jadi, kalo lo terbiasa nonton anime shonen yang villain atau mc nya ceramah panjang lebar tentang kehidupan, sorry to say, lo bakal sedikit bingung di sini. Tapi, kalo lo seneng dengan film-film yang ngebuat lo selama nonton mikir kek, “Ini maksudnya apaan ya?” atau “Ini ngomongin apaan, sih?” dan setelah itu lo cari tahu tentang film ini di reddit atau forum anime lainnya, lo cocok buat nonton film ini.

Soundtrack dari film ini? Untuk sebuah film anime yang rilis di tahun 1988 dan dengan tema cyberpunk nya, jujur aja soundtrack nya benar-benar memukau. Kalau lu dengar selama nonton film ini mungkin biasa aja, tapi bagi gua soundtrack nya tuh ngeri, asli. Ngeri bukan karena akan ada adegan horor atau jumpscare, tapi lebih ke ngebuat sadar gimana rapuhnya eksistensial manusia di tengah teknologi yang sangat maju dan kekuasaan yang dikuasai oleh pemerintah.

Film anime Akira gua akuin memang bukan buat semua orang. Dengan banyaknya adegan-adegan yang intens secara visual, penuh dengan konflik, pacing yang cukup lompat-lompat ngebuat gak semua orang tahan dengan film seperti ini. Tapi, kalo lo cari tontonan anime baru karena bosan dengan anime-anime belakangan ini, lo wajib banget buat nonton Akira.


Verdict:
Akira tuh kaya mixtape post-apocalypse yang disampaikan dalam bentuk lukisan hidup. Lo nonton anime ini bukan buat paham, tapi buat ngerasain gimana ngerinya kalau teknologi berkembang sangat jauh dan lo hidup di masa distopia.

Rating? Solid 9.5/10.

**Tags:** Anime, Anime Review, Akira, Japanese Culture, Japan
`,
        views: 0,
        published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
};

const categoryColors: Record<BlogCategory, string> = {
    'tech-ai': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    'reviews': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    'short-stories': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    'culture': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
};

async function getBlogPost(slug: string): Promise<BlogPost | null> {
    try {
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('slug', slug)
            .eq('published', true)
            .single();

        if (error || !data) {
            return samplePosts[slug] || null;
        }

        return data;
    } catch {
        return samplePosts[slug] || null;
    }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const post = await getBlogPost(slug);

    if (!post) {
        return { title: 'Post Not Found' };
    }

    return {
        title: post.title,
        description: post.excerpt || undefined,
    };
}

export default async function BlogPostPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const post = await getBlogPost(slug);

    if (!post) {
        notFound();
    }

    const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const categoryLabel = BLOG_CATEGORIES.find(c => c.value === post.category)?.label || post.category;

    return (
        <div className="pt-24 pb-16">
            <ViewCounter slug={slug} />
            <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back link */}
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to blog
                </Link>

                {/* Header */}
                <header className="mb-12">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium ${categoryColors[post.category]}`}>
                            <Tag className="w-4 h-4" />
                            {categoryLabel}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <Calendar className="w-4 h-4" />
                            <time dateTime={post.created_at}>{formattedDate}</time>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <Eye className="w-4 h-4" />
                            <span>{post.views || 0} Views</span>
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white">
                        {post.title}
                    </h1>
                </header>

                {/* Content */}
                <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown
                        rehypePlugins={[rehypeRaw]}
                        components={{
                            img: ({ node, ...props }: any) => (
                                <div className="my-8 flex flex-col items-center">
                                    <img
                                        {...props}
                                        className="w-full h-auto rounded-lg shadow-md mb-2"
                                        alt={props.alt || ''}
                                    />
                                    {props.alt && (
                                        <p className="text-sm text-center text-neutral-500 italic m-0">
                                            {props.alt}
                                        </p>
                                    )}
                                </div>
                            ),
                            h1: ({ node, ...props }: any) => <h1 className="text-3xl md:text-4xl font-bold mb-6 mt-8" {...props} />,
                            h2: ({ node, ...props }: any) => <h2 className="text-2xl md:text-3xl font-bold mt-12 mb-4" {...props} />,
                            h3: ({ node, ...props }: any) => <h3 className="text-xl md:text-2xl font-bold mt-8 mb-3" {...props} />,
                            p: ({ node, ...props }: any) => <p className="text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed" {...props} />,
                            ul: ({ node, ...props }: any) => <ul className="list-disc pl-6 space-y-2 mb-4 text-neutral-600 dark:text-neutral-400" {...props} />,
                            ol: ({ node, ...props }: any) => <ol className="list-decimal pl-6 space-y-2 mb-4 text-neutral-600 dark:text-neutral-400" {...props} />,
                            a: ({ node, ...props }: any) => <a className="text-blue-600 dark:text-blue-400 hover:underline" {...props} />,
                            strong: ({ node, ...props }: any) => <strong className="font-semibold text-neutral-800 dark:text-neutral-200" {...props} />,
                            em: ({ node, ...props }: any) => <em className="italic text-neutral-600 dark:text-neutral-400" {...props} />,
                        }}
                    >
                        {post.content || ''}
                    </ReactMarkdown>
                </div>
            </article>
        </div>
    );
}
