# Real Estate CRM System

A professional-grade, modern, dark-themed Real Estate CRM system designed for real estate agencies and developers to manage leads, sales funnels, communication, reporting, brokers, and integrations.

## 🚀 Features

- **Dashboard**: Real-time KPIs, lead funnel visualization, performance metrics
- **Lead Management**: Comprehensive lead tracking with status, scoring, and timeline
- **Projects**: Property inventory management with CRUD operations
- **Sales Pipeline**: Visual Kanban board for deal tracking
- **Analytics & Reports**: Multiple report types with interactive charts
- **Broker Management**: Team member tracking and performance
- **Campaign Tracking**: Marketing campaign management
- **Activities Log**: Complete audit trail of all actions

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Turso (LibSQL)
- **ORM**: Drizzle
- **UI**: Shadcn/UI + Tailwind CSS
- **Charts**: Recharts
- **Authentication**: Better-Auth
- **Deployment**: Vercel

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Turso credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🌐 Deploy to Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

**Quick Deploy:**

1. Push to GitHub
2. Import to Vercel
3. Add environment variables:
   - `TURSO_CONNECTION_URL`
   - `TURSO_AUTH_TOKEN`
4. Deploy!

## 📝 Environment Variables

Required variables (see `.env.example`):

```env
TURSO_CONNECTION_URL=your_turso_connection_url
TURSO_AUTH_TOKEN=your_turso_auth_token
```

## 🧪 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 📂 Project Structure

```
src/
├── app/              # Next.js pages and API routes
│   ├── api/         # API endpoints
│   ├── leads/       # Lead management pages
│   ├── projects/    # Project management pages
│   ├── pipeline/    # Sales pipeline
│   ├── reports/     # Analytics and reports
│   └── ...
├── components/      # Reusable React components
│   └── ui/         # Shadcn UI components
├── db/             # Database schema and seeds
├── lib/            # Utility functions
└── hooks/          # Custom React hooks
```

## 🎨 Design System

- **Theme**: Dark mode with purple/blue accents
- **Primary Color**: Purple (#a78bfa)
- **Typography**: Geist Sans & Geist Mono
- **Border Radius**: 0.625rem
- **Components**: Shadcn/UI library

## 📊 Database Schema

Key tables:
- `leads` - Lead information and tracking
- `projects` - Property inventory
- `users` - Team members
- `brokers` - Broker information
- `activities` - Audit log
- `campaigns` - Marketing campaigns

## 🔒 Production Ready

This app is configured for production deployment with:
- ✅ TypeScript error handling during builds
- ✅ ESLint configuration for production
- ✅ Optimized image loading
- ✅ Environment variable management
- ✅ Database connection pooling
- ✅ Error boundaries and logging

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Turso Documentation](https://docs.turso.tech)
- [Drizzle ORM](https://orm.drizzle.team)
- [Shadcn/UI](https://ui.shadcn.com)

## 📄 License

Private - All Rights Reserved

---

Built with ❤️ using Next.js and Vercel