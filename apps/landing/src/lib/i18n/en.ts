// English translations
export const en = {
    // Navigation
    nav: {
        home: 'Home',
        about: 'About',
        projects: 'Projects',
        experience: 'Experience',
        skills: 'Skills',
        blog: 'Blog',
        contact: 'Contact',
    },

    // Hero Section
    hero: {
        badge: 'Open to opportunities',
        greeting: "Hi, I'm",
        name: 'Dzulfikar Yudha Pranata',
        tagline: 'Physics Student • Astrophysics, AI, and Tech Enthusiast • Automation Engineer',
        description: 'Exploring the intersection of physics and artificial intelligence. Building tools that automate the mundane and amplify human potential.',
        cta: {
            projects: 'View Projects',
            contact: 'Get in Touch',
            tutor: 'Register Belajar Bareng Nata',
        },
    },

    // About Page
    about: {
        title: 'About Me',
        subtitle: 'A little bit about who I am and what I do.',
        intro: "Final-year Physics student at IPB University with a strong technical foundation in AI, Intelligent IoT, and Embedded Systems. I specialize in bridging the gap between theoretical physics and practical engineering to build data-driven hardware solutions.",
        story1: 'Throughout my journey, I have engineered high-accuracy systems, including an autonomous grass-cutting robot and a smart health monitoring band (85-90% accuracy) utilizing ESP32, TensorFlow, and PyTorch. My passion for innovation extends to my research, where I apply Neural Networks to classify stellar evolutionary phases and synthesize Carbon Quantum Dots for cancer theranostics systems.',
        story2: "Beyond technical skills, I am an experienced leader who served as Vice President of HIMAFI, coordinating 60+ staff members and managing cross-departmental programs. As a Laboratory Assistant for Sensor and Analog Electronics, I have mentored over 130 students, focusing on troubleshooting and signal analysis.",
        story3: "When I'm not coding or studying, you'll find me writing about tech trends, reviewing the latest AI tools, or exploring new frameworks and libraries.",
        interests: {
            ml: {
                title: 'Machine Learning',
                description: 'Developing predictive models and neural networks for complex physics problems.',
            },
            automation: {
                title: 'IoT Systems',
                description: 'focus on connecting physical devices to the internet, enabling them to collect, exchange, and analyze data in real time',
            },
            ai: {
                title: 'AI Engineering / Automation',
                description: 'Creating intelligent applications that solve real-world challenges & Building systems that streamline workflows and eliminate repetitive tasks.',
            },
            research: {
                title: 'Research',
                description: 'Exploring theoretical physics and its computational applications.',
            },
        },
        quickFacts: {
            title: 'Quick Facts',
            location: '📍 Based in Bogor / Jakarta',
            education: '🎓 Physics Student at IPB University',
            status: '💼 Open to freelance & collaborations',
            learning: '🌱 Currently learning: Neural Networks and AI Engineering',
        },
    },

    // Projects Page
    projects: {
        title: 'Projects',
        subtitle: "A selection of projects I've worked on, from AI research tools to automation systems.",
        viewCode: 'Code',
        viewDemo: 'Demo',
        categories: {
            'ai-ml': 'AI & Machine Learning',
            'web-dev': 'Web Development',
            'automation': 'Automation & Tools',
            'data-analytics': 'Data Analytics',
        },
    },

    // Experience Page
    experience: {
        title: 'Experience',
        subtitle: 'My journey through academia, research, and professional work.',
        types: {
            academic: 'Academic',
            research: 'Research',
            freelance: 'Freelance',
            project: 'Project',
            'part-time': 'Part-time',
            'full-time': 'Full-time',
        },
    },

    // Skills Page
    skills: {
        title: 'Skills & Tech Stack',
        subtitle: 'Technologies and tools I work with on a daily basis.',
        currentlyLearning: "I'm constantly learning and expanding my toolkit. Currently exploring:",
        learningTopics: 'MLOps, AI Automation, Rust, and WebAssembly',
        categories: {
            languages: 'Programming Languages',
            aiml: 'AI & Machine Learning',
            web: 'Web Development',
            automation: 'Automation & DevOps',
            data: 'Data & Analytics',
            tools: 'Tools & Platforms',
        },
    },

    // Blog Page
    blog: {
        title: 'Blog',
        subtitle: 'Thoughts on AI, automation, physics, and everything in between.',
        readMore: 'Read more',
        backToBlog: 'Back to blog',
        allCategories: 'All',
        noPosts: 'No posts in this category yet. Check back soon!',
        categories: {
            'tech-ai': 'Tech/AI',
            'reviews': 'Reviews',
            'short-stories': 'Short Stories',
            'culture': 'Culture',
        },
    },

    // Contact Page
    contact: {
        title: 'Get in Touch',
        subtitle: "Have a project in mind or want to collaborate? I'd love to hear from you.",
        workTogether: "Let's work together",
        description: 'Whether you need help with AI/ML projects, automation solutions, or just want to chat about physics and technology — feel free to reach out!',
        email: 'Email',
        location: 'Location',
        proTip: 'Pro tip: The more details you share about your project, the better I can help. Include timeline, budget range, and specific requirements if you have them!',
        form: {
            name: 'Name',
            namePlaceholder: 'Your name',
            email: 'Email',
            emailPlaceholder: 'your@email.com',
            message: 'Message',
            messagePlaceholder: 'Tell me about your project...',
            submit: 'Send Message',
            sending: 'Sending...',
            success: "Message sent successfully! I'll get back to you soon.",
            error: 'Something went wrong. Please try again.',
        },
    },

    // Footer
    footer: {
        description: 'Physics student exploring the intersection of AI, machine learning, and automation engineering.',
        quickLinks: 'Quick Links',
        connect: 'Connect',
        copyright: '© {year} Pranata Yudha. All rights reserved.',
    },

    // Common
    common: {
        loading: 'Loading...',
        error: 'Something went wrong',
        switchLanguage: 'Switch language',
    },
};

export type Translations = typeof en;
