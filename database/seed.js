const { query } = require('../config/database');

const seedData = async () => {
  try {
    console.log('Starting database seeding...');

    // Insert categories
    const categories = [
      { name: 'AI & Machine Learning', slug: 'ai', description: 'Articles about AI, ML, and LLMs' },
      { name: 'Frontend Development', slug: 'frontend', description: 'React, Vue, CSS, and modern frontend' },
      { name: 'Systems & DevOps', slug: 'systems', description: 'Linux, Docker, Kubernetes, and infrastructure' },
      { name: 'Design', slug: 'design', description: 'UI/UX, design systems, and visual design' }
    ];

    for (const cat of categories) {
      await query(
        'INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING',
        [cat.name, cat.slug, cat.description]
      );
    }
    console.log('Categories seeded');

    // Insert projects
    const projects = [
      {
        title: 'Neural Canvas',
        slug: 'neural-canvas',
        description: 'AI-powered generative art platform using stable diffusion and custom neural networks.',
        long_description: 'A comprehensive platform for creating AI-generated artwork with support for custom models, style transfer, and batch processing.',
        status: 'shipped',
        year: 2024,
        featured: true,
        highlight: true,
        github_url: 'https://github.com/Theophilus/neural-canvas',
        live_url: 'https://neuralcanvas.ai',
        stars: 128,
        forks: 34,
        tags: ['AI/ML', 'Python', 'React', 'WebGL']
      },
      {
        title: 'Quantum UI Kit',
        slug: 'quantum-ui-kit',
        description: 'A comprehensive design system with 100+ components for modern web applications.',
        long_description: 'Built with React, TypeScript, and Tailwind CSS. Includes Storybook documentation and Figma design files.',
        status: 'shipped',
        year: 2024,
        featured: true,
        highlight: false,
        github_url: 'https://github.com/Theophilus/quantum-ui',
        live_url: 'https://quantum-ui.dev',
        stars: 256,
        forks: 45,
        tags: ['React', 'TypeScript', 'Storybook', 'Figma']
      },
      {
        title: 'DataFlow Engine',
        slug: 'dataflow-engine',
        description: 'Real-time data visualization engine for processing complex datasets.',
        long_description: 'High-performance data processing and visualization with WebSocket support for live updates.',
        status: 'shipped',
        year: 2023,
        featured: false,
        highlight: false,
        github_url: 'https://github.com/Theophilus/dataflow',
        live_url: 'https://dataflow.dev',
        stars: 89,
        forks: 12,
        tags: ['D3.js', 'Node.js', 'WebSockets', 'MongoDB']
      },
      {
        title: 'Synth Lab',
        slug: 'synth-lab',
        description: 'Browser-based synthesizer with modular audio routing and MIDI support.',
        long_description: 'Experimental web audio synthesizer with support for custom patches and MIDI controllers.',
        status: 'in-progress',
        year: 2024,
        featured: false,
        highlight: true,
        github_url: 'https://github.com/Theophilus/synth-lab',
        live_url: 'https://synthlab.audio',
        stars: 45,
        forks: 8,
        tags: ['Web Audio API', 'TypeScript', 'Vue.js']
      },
      {
        title: 'Code Curator',
        slug: 'code-curator',
        description: 'Smart code snippet manager with AI-powered categorization.',
        long_description: 'Desktop application for managing code snippets with intelligent search and tagging.',
        status: 'shipped',
        year: 2023,
        featured: false,
        highlight: false,
        github_url: 'https://github.com/Theophilus/code-curator',
        live_url: null,
        stars: 167,
        forks: 23,
        tags: ['Electron', 'React', 'SQLite', 'OpenAI']
      },
      {
        title: 'Motion Lab',
        slug: 'motion-lab',
        description: 'Experimental animation toolkit for complex motion graphics.',
        long_description: 'Create stunning animations in the browser with GSAP and Three.js integration.',
        status: 'in-progress',
        year: 2024,
        featured: false,
        highlight: false,
        github_url: 'https://github.com/Theophilus/motion-lab',
        live_url: 'https://motionlab.dev',
        stars: 34,
        forks: 5,
        tags: ['GSAP', 'Three.js', 'Canvas', 'WebGL']
      },
      {
        title: 'API Forge',
        slug: 'api-forge',
        description: 'Visual API builder and testing platform with auto documentation.',
        long_description: 'Build, test, and document APIs with a visual interface. Supports OpenAPI spec generation.',
        status: 'shipped',
        year: 2023,
        featured: false,
        highlight: false,
        github_url: 'https://github.com/Theophilus/api-forge',
        live_url: 'https://apiforge.io',
        stars: 78,
        forks: 15,
        tags: ['Node.js', 'Express', 'PostgreSQL', 'Docker']
      },
      {
        title: 'Legacy CMS',
        slug: 'legacy-cms',
        description: 'Content management system built for small businesses.',
        long_description: 'Simple CMS for small business websites. No longer actively maintained.',
        status: 'archived',
        year: 2020,
        featured: false,
        highlight: false,
        github_url: 'https://github.com/Theophilus/legacy-cms',
        live_url: null,
        stars: 12,
        forks: 3,
        tags: ['PHP', 'MySQL', 'jQuery']
      }
    ];

    for (const proj of projects) {
      await query(
        `INSERT INTO projects
         (title, slug, description, long_description, status, year, featured, highlight, github_url, live_url, stars, forks, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (slug) DO NOTHING`,
        [proj.title, proj.slug, proj.description, proj.long_description, proj.status, proj.year,
         proj.featured, proj.highlight, proj.github_url, proj.live_url, proj.stars, proj.forks, proj.tags]
      );
    }
    console.log('Projects seeded');

    // Insert blog posts
    const blogPosts = [
      {
        title: 'MCP Protocol in LLM Applications',
        slug: 'mcp-protocol-llm-applications',
        excerpt: 'Implementing Model Context Protocol for seamless AI model interactions with vector databases in RAG applications.',
        content: 'Full article content here...',
        category_slug: 'ai',
        tags: ['llm', 'rag', 'mcp', 'vector-db'],
        featured: false,
        read_time: '8 min read',
        published: true,
        published_at: '2025-04-28'
      },
      {
        title: 'Next.js 16 + Tailwind CSS v4 Migration Guide',
        slug: 'nextjs-16-tailwind-v4-migration',
        excerpt: 'Exploring the new features in Next.js 16 and migrating to Tailwind CSS v4\'s new configuration system.',
        content: 'Full article content here...',
        category_slug: 'frontend',
        tags: ['nextjs', 'tailwind', 'react', 'migration'],
        featured: true,
        read_time: '10 min read',
        published: true,
        published_at: '2024-12-10'
      },
      {
        title: 'Self-Hosting LLMs with FastAPI',
        slug: 'self-hosting-llms-fastapi',
        excerpt: 'Running Llama2 locally and building a personal chatbot API for natural language tasks.',
        content: 'Full article content here...',
        category_slug: 'ai',
        tags: ['llm', 'python', 'fastapi', 'self-hosting'],
        featured: false,
        read_time: '15 min read',
        published: true,
        published_at: '2024-10-05'
      },
      {
        title: 'Rust + WebAssembly Performance Deep Dive',
        slug: 'rust-wasm-performance',
        excerpt: 'Benchmarking Rust compiled to WebAssembly vs native JavaScript. When does WASM shine?',
        content: 'Full article content here...',
        category_slug: 'systems',
        tags: ['rust', 'wasm', 'performance', 'benchmarking'],
        featured: false,
        read_time: '11 min read',
        published: true,
        published_at: '2024-09-18'
      },
      {
        title: 'Building a Design Token System',
        slug: 'design-tokens-system',
        excerpt: 'Creating a scalable design token architecture that works across platforms.',
        content: 'Full article content here...',
        category_slug: 'design',
        tags: ['design-systems', 'css', 'tokens', 'figma'],
        featured: false,
        read_time: '9 min read',
        published: true,
        published_at: '2024-08-22'
      },
      {
        title: 'Understanding LTI: Integrating Learning Tools',
        slug: 'lti-learning-platforms-integration',
        excerpt: 'A comprehensive guide to Learning Tools Interoperability (LTI) 1.3 for educational platforms.',
        content: 'Full article content here...',
        category_slug: 'systems',
        tags: ['lti', 'education', 'integration', 'standards'],
        featured: false,
        read_time: '12 min read',
        published: true,
        published_at: '2024-07-15'
      }
    ];

    for (const post of blogPosts) {
      const categoryResult = await query('SELECT id FROM categories WHERE slug = $1', [post.category_slug]);
      const category_id = categoryResult.rows[0]?.id || null;

      await query(
        `INSERT INTO blog_posts
         (title, slug, excerpt, content, category_id, tags, featured, read_time, published, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (slug) DO NOTHING`,
        [post.title, post.slug, post.excerpt, post.content, category_id, post.tags,
         post.featured, post.read_time, post.published, post.published_at]
      );
    }
    console.log('Blog posts seeded');

    // Insert lab notes
    const labNotes = [
      {
        title: 'Exploring WebGPU',
        description: 'Notes on the new WebGPU API and its potential for high-performance graphics.',
        content: 'Detailed notes on WebGPU...',
        link: '/notes/webgpu-exploration',
        icon: 'gpu'
      },
      {
        title: 'State Machine Patterns',
        description: 'Common state machine patterns for managing complex UI interactions.',
        content: 'Notes on state machines...',
        link: '/notes/state-machine-patterns',
        icon: 'code'
      },
      {
        title: 'Color Theory for Devs',
        description: 'Practical color theory concepts for developers building user interfaces.',
        content: 'Notes on color theory...',
        link: '/notes/color-theory',
        icon: 'palette'
      }
    ];

    for (const note of labNotes) {
      await query(
        `INSERT INTO lab_notes (title, description, content, link, icon)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [note.title, note.description, note.content, note.link, note.icon]
      );
    }
    console.log('Lab notes seeded');

    // Insert workbench items
    const workbenchItems = [
      {
        title: 'Portfolio Redesign',
        description: 'Complete overhaul of personal portfolio with new design system.',
        progress: 75,
        status: 'active',
        priority: 'high'
      },
      {
        title: 'Open Source CLI Tool',
        description: 'Building a developer productivity tool for terminal workflows.',
        progress: 40,
        status: 'active',
        priority: 'medium'
      },
      {
        title: 'Learning Rust',
        description: 'Deep diving into Rust for systems programming and WebAssembly.',
        progress: 25,
        status: 'paused',
        priority: 'low'
      }
    ];

    for (const item of workbenchItems) {
      await query(
        `INSERT INTO workbench_items (title, description, progress, status, priority)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [item.title, item.description, item.progress, item.status, item.priority]
      );
    }
    console.log('Workbench items seeded');

    // Insert settings
    const settings = [
      { key: 'site_title', value: 'Theophilus Digital Lab' },
      { key: 'site_description', value: 'A digital laboratory exploring the intersection of code, design, and experimentation.' },
      { key: 'author_name', value: 'Theophilus' },
      { key: 'author_role', value: 'Full-Stack Developer' },
      { key: 'theme', value: 'golden' },
      { key: 'dark_mode', value: 'true' },
      { key: 'github_url', value: 'https://github.com/Theophilus' },
      { key: 'twitter_url', value: 'https://twitter.com/Theophilus' },
      { key: 'linkedin_url', value: 'https://linkedin.com/in/Theophilus' },
      { key: 'contact_email', value: 'hello@Theophilus.dev' }
    ];

    for (const setting of settings) {
      await query(
        `INSERT INTO settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
        [setting.key, setting.value]
      );
    }
    console.log('Settings seeded');

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedData;
