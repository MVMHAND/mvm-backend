# My Virtual Mate - Backend Admin Panel

Internal administrative platform for managing users, roles, and permissions with a strict RBAC system.

## Features

- 🔐 **Secure Authentication** - Invitation-only access via Supabase Auth
- 👥 **User Management** - Complete CRUD operations for admin users
- 🎭 **Role-Based Access Control** - Dynamic permissions with code-driven navigation
- 📧 **Email Integration** - Automated invitations via Resend
- 🛡️ **Super Admin** - Single immutable admin with full privileges
- 📊 **Audit Logging** - Comprehensive tracking of all actions

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Email**: Resend API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm
- Supabase account
- Resend account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd my-virtual-mate
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase and Resend credentials.

4. Run database migrations (see `supabase/migrations/` folder)

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
my-virtual-mate/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/              # Utility functions and configurations
│   ├── types/            # TypeScript type definitions
│   ├── actions/          # Server actions
│   └── hooks/            # Custom React hooks
├── supabase/
│   └── migrations/       # Database migration files
├── public/               # Static assets
└── middleware.ts         # Route protection middleware
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types

## Branding

- **Primary Color**: MVM Blue `#025fc7`
- **Accent Color**: MVM Yellow `#ba9309`
- **Gradient**: Linear gradient from blue to yellow

## Environment Variables

See `.env.local.example` for required environment variables.

## Database Schema

The application uses the following main tables:
- `profiles` - Admin user profiles
- `roles` - User roles
- `permissions` - Permission definitions
- `role_permissions` - Role-permission mappings
- `audit_logs` - Action audit trail

## License

Proprietary - All rights reserved
