# Theophilus - Full Stack Developer Portfolio

A modern, full-stack developer portfolio built with **PostgreSQL**, **Node.js**, **Express.js**, **EJS**, **CSS**, and **JavaScript**.

![Theophilus Preview](https://via.placeholder.com/800x400?text=Theophilus+Portfolio)

## Features

- **Dynamic Content**: All projects, blog posts, and notes are stored in PostgreSQL and rendered dynamically
- **Responsive Design**: Fully responsive layout that works on all devices
- **Dark/Light Mode**: Toggle between dark and light themes
- **Interactive UI**: Cursor glow effects, smooth animations, and micro-interactions
- **Admin Dashboard**: Built-in dashboard for managing content
- **RESTful API**: Full CRUD API for all content types
- **SEO Friendly**: Server-side rendering with EJS for better SEO

## Tech Stack

| Layer | Technology |
|-------|------------|
| Database | PostgreSQL |
| Backend | Node.js, Express.js |
| Templating | EJS (Embedded JavaScript) |
| Styling | CSS3 with CSS Custom Properties |
| Frontend | Vanilla JavaScript |

## Project Structure

```
Theophilus-app/
├── config/
│   └── database.js          # PostgreSQL connection configuration
├── database/
│   ├── schema.sql           # Database schema
│   └── seed.js              # Sample data seeding script
├── models/
│   ├── Project.js           # Project model
│   ├── BlogPost.js          # Blog post model
│   ├── LabNote.js           # Lab note model
│   ├── WorkbenchItem.js     # Workbench item model
│   ├── Settings.js          # Settings model
│   └── index.js             # Models export
├── public/
│   ├── css/
│   │   └── main.css         # Main stylesheet
│   └── js/
│       └── main.js          # Main JavaScript file
├── routes/
│   └── index.js             # All application routes
├── views/
│   ├── partials/
│   │   ├── header.ejs       # Header partial
│   │   └── footer.ejs       # Footer partial
│   ├── layout.ejs           # Main layout template
│   ├── index.ejs            # Home page
│   ├── projects.ejs         # Projects page
│   ├── blog.ejs             # Blog page
│   ├── dashboard.ejs        # Admin dashboard
│   └── error.ejs            # Error page
├── .env                     # Environment variables
├── .env.example             # Example environment file
├── .gitignore               # Git ignore file
├── package.json             # NPM dependencies
├── server.js                # Main server file
└── README.md                # This file
```

## Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Theophilus-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and update it with your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Theophilus_db
DB_USER=postgres
DB_PASSWORD=your_password

# Server Configuration
PORT=3000
NODE_ENV=development

# Session Secret
SESSION_SECRET=your_random_secret_key

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
```

### 4. Create the Database

Connect to PostgreSQL and create the database:

```bash
psql -U postgres
```

```sql
CREATE DATABASE Theophilus_db;
\q
```

### 5. Run the Database Schema

```bash
psql -U postgres -d Theophilus_db -f database/schema.sql
```

### 6. Seed the Database (Optional)

Populate the database with sample data:

```bash
npm run seed
```

### 7. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start at `http://localhost:3000`

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `projects` | Portfolio projects with status, tags, and metadata |
| `blog_posts` | Blog articles with categories and tags |
| `lab_notes` | Quick notes and observations |
| `workbench_items` | Current work items with progress tracking |
| `categories` | Blog post categories |
| `tags` | Reusable tags |
| `settings` | Site configuration |

### Relationships

- `blog_posts` → `categories` (many-to-one)
- `blog_posts` have array of tags
- `projects` have array of tags

## API Endpoints

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| GET | `/api/projects?status=shipped` | Filter by status |
| GET | `/api/projects?featured=true` | Get featured projects |
| POST | `/api/projects` | Create new project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### Blog Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blog-posts` | List all posts |
| GET | `/api/blog-posts?category=slug` | Filter by category |
| GET | `/api/blog-posts?featured=true` | Get featured posts |
| POST | `/api/blog-posts` | Create new post |
| PUT | `/api/blog-posts/:id` | Update post |
| DELETE | `/api/blog-posts/:id` | Delete post |

### Lab Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lab-notes` | List all notes |
| POST | `/api/lab-notes` | Create new note |
| PUT | `/api/lab-notes/:id` | Update note |
| DELETE | `/api/lab-notes/:id` | Delete note |

### Workbench Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workbench-items` | List all items |
| POST | `/api/workbench-items` | Create new item |
| PUT | `/api/workbench-items/:id` | Update item |
| DELETE | `/api/workbench-items/:id` | Delete item |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get public settings |
| PUT | `/api/settings` | Update settings |

### Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Get dashboard statistics |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home page with featured projects, recent posts, and workbench |
| `/projects` | All projects with filtering |
| `/projects/:slug` | Individual project detail |
| `/blog` | Blog listing with categories and tags |
| `/blog/:slug` | Individual blog post |
| `/dashboard` | Admin dashboard for content management |

## Customization

### Themes

The app uses CSS Custom Properties for theming. Edit `:root` in `public/css/main.css`:

```css
:root {
  --primary: oklch(0.65 0.18 85);  /* Golden theme */
  /* Change to your preferred color */
}
```

### Adding New Projects

Use the API or insert directly into the database:

```sql
INSERT INTO projects (title, slug, description, status, year, featured, tags)
VALUES ('My Project', 'my-project', 'Description here', 'shipped', 2024, true, ARRAY['React', 'Node.js']);
```

### Adding Blog Posts

```sql
INSERT INTO blog_posts (title, slug, excerpt, content, category_id, tags, published, published_at)
VALUES ('My Post', 'my-post', 'Excerpt here', 'Content here', 1, ARRAY['javascript'], true, NOW());
```

## Deployment

### Environment Variables for Production

```env
NODE_ENV=production
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=Theophilus_db
DB_USER=your-db-user
DB_PASSWORD=your-db-password
SESSION_SECRET=your-production-secret
```

### Deploy to Railway/Render/Heroku

1. Push your code to GitHub
2. Connect your repository to your hosting platform
3. Add environment variables
4. Deploy!

### Database Migration on Production

```bash
# Run schema
psql $DATABASE_URL -f database/schema.sql

# Seed data (optional)
node database/seed.js
```

## Development

### Running in Development Mode

```bash
npm run dev
```

This uses `nodemon` for auto-reloading on file changes.

### Code Style

- Use ES6+ features
- Follow existing code patterns
- Add comments for complex logic
- Use semantic HTML

### Adding New Features

1. Create model in `models/`
2. Add routes in `routes/index.js`
3. Create view in `views/`
4. Add styles in `public/css/main.css`
5. Add JavaScript in `public/js/main.js`

## License

MIT License - feel free to use this for your own portfolio!

## Credits

- Fonts: [Geist](https://vercel.com/font) by Vercel
- Icons: Custom SVG icons
- Design: Theophilus Digital Laboratory

## Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with details
3. Contact: hello@Theophilus.dev

---

Built with ❤️ and ☕ by Theophilus
