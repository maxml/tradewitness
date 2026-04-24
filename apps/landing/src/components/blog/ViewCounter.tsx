'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function ViewCounter({ slug }: { slug: string }) {
    useEffect(() => {
        const incrementView = async () => {
            await supabase.rpc('increment_view_count', { slug_input: slug });
        };

        incrementView();
    }, [slug]);

    return null;
}
