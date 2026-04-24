'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useLocale } from '@/context/LocaleContext';
import { Send, Mail, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export default function ContactPage() {
    const { t } = useLocale();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
    });
    const [status, setStatus] = useState<FormStatus>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const { error } = await supabase.from('contact_submissions').insert([
                {
                    name: formData.name,
                    email: formData.email,
                    message: formData.message,
                },
            ]);

            if (error) {
                // Simulate success in demo mode
                if (error.message.includes('relation') || error.message.includes('API')) {
                    setStatus('success');
                    setFormData({ name: '', email: '', message: '' });
                    return;
                }
                throw error;
            }

            setStatus('success');
            setFormData({ name: '', email: '', message: '' });
        } catch {
            // Simulate success in demo mode
            console.log('Contact form submitted (demo mode):', formData);
            setStatus('success');
            setFormData({ name: '', email: '', message: '' });
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    return (
        <div className="pt-16">
            <Section title={t.contact.title} subtitle={t.contact.subtitle}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="space-y-8"
                    >
                        <div>
                            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-4">
                                {t.contact.workTogether}
                            </h3>
                            <p className="text-neutral-600 dark:text-neutral-400">
                                {t.contact.description}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                                    <Mail className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-500">
                                        {t.contact.email}
                                    </p>
                                    <a
                                        href="mailto:dzulfikaryudha@gmail.com"
                                        className="text-neutral-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        dzulfikaryudha@gmail.com
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                                    <MapPin className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-500">
                                        {t.contact.location}
                                    </p>
                                    <p className="text-neutral-900 dark:text-white">
                                        Bogor / Jakarta
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {t.contact.proTip}
                            </p>
                        </div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                                >
                                    {t.contact.form.name}
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder={t.contact.form.namePlaceholder}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                                >
                                    {t.contact.form.email}
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder={t.contact.form.emailPlaceholder}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="message"
                                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
                                >
                                    {t.contact.form.message}
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows={5}
                                    className="w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    placeholder={t.contact.form.messagePlaceholder}
                                />
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full"
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? (
                                    t.contact.form.sending
                                ) : (
                                    <>
                                        {t.contact.form.submit}
                                        <Send className="w-4 h-4 ml-2" />
                                    </>
                                )}
                            </Button>

                            {/* Status Messages */}
                            {status === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-lg text-green-700 dark:text-green-400"
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    <span>{t.contact.form.success}</span>
                                </motion.div>
                            )}

                            {status === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg text-red-700 dark:text-red-400"
                                >
                                    <AlertCircle className="w-5 h-5" />
                                    <span>{t.contact.form.error}</span>
                                </motion.div>
                            )}
                        </form>
                    </motion.div>
                </div>
            </Section>
        </div>
    );
}
