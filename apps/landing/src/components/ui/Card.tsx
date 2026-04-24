import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
}

export function Card({ children, className = '', hover = true }: CardProps) {
    return (
        <motion.div
            whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
            transition={{ duration: 0.2 }}
            className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm ${className}`}
        >
            {children as any}
        </motion.div>
    );
}
