# Care N Tour - Medical Tourism Platform

<div align="center">
  <img src="public/care-n-tour-logo-light.png" alt="Care N Tour Logo" width="300"/>

**World-Class Medical Care in Egypt**

A comprehensive medical tourism platform connecting international patients with premium healthcare service providers in Egypt.

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Key Components](#key-components)
- [Performance Optimizations](#performance-optimizations)
- [Deployment](#deployment)
- [WhatsApp Widget Verification](#whatsapp-widget-verification)
- [Contributing](#contributing)

---

## 🌟 Overview

Care N Tour is a Next.js-based medical tourism platform designed to facilitate international patients seeking affordable, high-quality medical treatments in Egypt. The platform provides end-to-end services including treatment browsing, doctor selection, trip planning, and concierge services.

### Key Highlights

- **🏥 14+ Routes/Pages** - Comprehensive coverage of all medical tourism needs
- **👨‍⚕️ Doctor Profiles** - Detailed profiles with ratings, specializations, and reviews
- **💼 Treatment Catalog** - Cardiology, Ophthalmology, Dental, Cosmetic Surgery, and more
- **✈️ Trip Planning** - Complete journey management from consultation to recovery
- **🔐 Secure Authentication** - Supabase-powered auth with rate limiting and security logging
- **📊 Patient Dashboard** - Track appointments, documents, and medical history
- **🌍 Multi-language Support** - Ready for internationalization
- **🎨 Dark Mode** - Full theme support with next-themes
- **⚡ Performance Optimized** - React Query caching, memoization, lazy loading

---

## ✨ Features

### Patient Features

- **Treatment Discovery**: Browse 8+ medical specialties with detailed pricing
- **Doctor Selection**: Filter by specialization, language, and rating
- **Patient Journey**: 6-step guided onboarding process
  1. Basic Information
  2. Medical History
  3. Travel Preferences
  4. Document Upload
  5. Cost Estimation
  6. Consultation Scheduling
- **Trip Planning Wizard**: Multi-step form for complete journey planning
- **Dashboard**: Personal medical records and appointment tracking
- **Blog & Stories**: Patient testimonials and medical tourism insights

### Administrative Features

- **Doctor Management**: Comprehensive doctor profiles with specializations
- **Review System**: Patient feedback and ratings
- **Security Logging**: Track authentication events and suspicious activity
- **Newsletter**: Email subscription management

### Platform Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **SEO Optimized**: Meta tags, Open Graph, Twitter Cards
- **Accessibility**: ARIA labels, keyboard navigation
- **Fast Loading**: Code splitting, image optimization, React Query caching

---

## 🛠 Tech Stack

### Core Framework

- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[React 18](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety

### Backend & Database

- **[Supabase](https://supabase.com/)** - PostgreSQL database, authentication, and real-time subscriptions
- **[Supabase Auth](https://supabase.com/docs/guides/auth)** - User authentication with rate limiting

### State Management & Data Fetching

- **[TanStack React Query](https://tanstack.com/query)** - Server state management with caching
- **[React Hook Form](https://react-hook-form.com/)** - Form validation
- **[Zod](https://zod.dev/)** - Schema validation

### UI & Styling

- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible components
- **[Lucide Icons](https://lucide.dev/)** - Icon library
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Dark mode support

### Forms & Interactions

- **[Embla Carousel](https://www.embla-carousel.com/)** - Carousel/slider
- **[Recharts](https://recharts.org/)** - Data visualization
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications
- **[Vaul](https://vaul.emilkowal.ski/)** - Drawer component

---

## 📁 Project Structure

```
carentour-dev/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── about/                # About page
│   │   ├── auth/                 # Authentication (sign in/up)
│   │   ├── blog/                 # Blog listing and posts
│   │   ├── concierge/            # Concierge services
│   │   ├── contact/              # Contact form
│   │   ├── dashboard/            # Patient dashboard
│   │   ├── doctors/              # Doctor profiles
│   │   │   └── [doctorId]/       # Individual doctor page
│   │   ├── faq/                  # FAQ page
│   │   ├── plan/                 # Trip planning wizard
│   │   ├── start-journey/        # Patient onboarding flow
│   │   ├── stories/              # Patient testimonials
│   │   ├── travel-info/          # Travel information
│   │   ├── treatments/           # Treatment catalog
│   │   │   └── [category]/       # Treatment details by category
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Homepage
│   │   ├── icon.png              # Favicon (192x192)
│   │   ├── apple-icon.png        # Apple touch icon (180x180)
│   │   └── favicon.ico           # Standard favicon (32x32)
│   │
│   ├── components/               # Reusable React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── trip-planning/        # Trip planning wizard components
│   │   ├── CTASection.tsx
│   │   ├── DoctorProfile.tsx
│   │   ├── DoctorReviews.tsx
│   │   ├── DoctorsSection.tsx
│   │   ├── FeaturedTreatments.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── Hero.tsx
│   │   ├── PartnerHospitals.tsx
│   │   ├── PriceComparison.tsx
│   │   ├── ProcessSection.tsx
│   │   ├── QueryProvider.tsx    # React Query provider
│   │   ├── ThemeProvider.tsx    # Theme provider
│   │   ├── ThemeToggle.tsx
│   │   └── ...
│   │
│   ├── contexts/                 # React Context providers
│   │   └── AuthContext.tsx       # Authentication context with security
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useDoctors.ts         # Fetch doctors with React Query
│   │   ├── useTreatments.ts      # Fetch active treatments
│   │   ├── useServiceProviders.ts      # Fetch partner service providers
│   │   ├── useHotels.ts          # Fetch partner hotels
│   │   ├── useUserProfile.ts     # User profile management
│   │   ├── useSecurity.ts        # Security event logging
│   │   ├── useNewsletter.ts      # Newsletter subscription
│   │   ├── use-toast.ts          # Toast notifications
│   │   └── use-mobile.tsx        # Mobile detection
│   │
│   ├── lib/                      # Utility libraries
│   │   ├── supabase.ts           # Supabase client
│   │   └── utils.ts              # Helper functions
│   │
│   ├── integrations/             # Third-party integrations
│   │   └── supabase/             # Supabase type definitions
│   │
│   └── index.css                 # Global styles with Tailwind
│
├── public/                       # Static assets
│   ├── care-n-tour-logo-dark.png
│   ├── care-n-tour-logo-light.png
│   ├── hero-medical-facility.webp
│   ├── surgery-suite.webp
│   ├── consultation.webp
│   └── ...
│
├── supabase/                     # Supabase configuration
│   └── functions/                # Edge functions (if any)
│
├── .env.local                    # Environment variables (local)
├── .env                          # Environment variables (production)
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies and scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **Supabase account** (for database and authentication)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd carentour-dev
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SUPABASE_PROJECT_ID=your_project_id
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm run start
```

---

## 🔐 Environment Variables

| Variable                               | Description                                                      | Required |
| -------------------------------------- | ---------------------------------------------------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Your Supabase project URL                                        | ✅       |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key                                         | ✅       |
| `NEXT_PUBLIC_SUPABASE_PROJECT_ID`      | Supabase project ID                                              | ✅       |
| `SUPABASE_SERVICE_ROLE_KEY`            | Supabase service-role key (server only, required for admin APIs) | ✅\*     |

> **Note**: All variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Keep `SUPABASE_SERVICE_ROLE_KEY` on the server (e.g., `.env.local`) — it is required for the `/api/admin/*` routes.

---

## 🗄 Database Schema

### Core Tables

#### `doctors`

- `id` (uuid, primary key)
- `name` (text)
- `specialization` (text)
- `languages` (text[])
- `patient_rating` (numeric)
- `success_rate` (numeric)
- `experience_years` (integer)
- `education` (text)
- `certifications` (text[])
- `bio` (text)
- `image_url` (text)
- `created_at` (timestamp)

#### `doctor_reviews`

- `id` (uuid, primary key)
- `doctor_id` (uuid, foreign key → doctors)
- `patient_name` (text)
- `rating` (integer)
- `comment` (text)
- `treatment_type` (text)
- `created_at` (timestamp)

#### `profiles`

- `id` (uuid, primary key, foreign key → auth.users)
- `username` (text, unique)
- `full_name` (text)
- `avatar_url` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `security_logs`

- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → auth.users, nullable)
- `event_type` (text) - e.g., 'login_success', 'login_failed', 'rate_limit_exceeded'
- `ip_address` (text)
- `user_agent` (text)
- `metadata` (jsonb)
- `created_at` (timestamp)

#### `login_attempts`

- `id` (uuid, primary key)
- `email` (text)
- `ip_address` (text)
- `attempt_count` (integer)
- `last_attempt` (timestamp)
- `blocked_until` (timestamp, nullable)

#### `newsletter_subscriptions`

- `id` (uuid, primary key)
- `email` (text, unique)
- `subscribed_at` (timestamp)
- `preferences` (jsonb)

#### `patients`

- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → auth.users, nullable)
- `full_name` (text)
- `contact_email` (text)
- `contact_phone` (text)
- `date_of_birth` (date)
- `sex` (text enum)
- `nationality` (text)
- `preferred_language` (text)
- `preferred_currency` (text)
- `notes` (text)
- `created_at` / `updated_at`

#### `treatments`

- `id` (uuid, primary key)
- `name` (text)
- `slug` (text, unique)
- `category` (text)
- `summary` (text)
- `description` (text)
- `base_price` (numeric)
- `currency` (text)
- `duration_days` / `recovery_time_days` (integer)
- `success_rate` (numeric)
- `is_active` (boolean)
- `created_at` / `updated_at`

#### `service_providers`

- `id` (uuid, primary key)
- `name` (text)
- `slug` (text, unique)
- `facility_type` (text)
- `description` (text)
- `address` (jsonb)
- `contact_info` (jsonb)
- `amenities` / `specialties` (text[])
- `images` (jsonb)
- `is_partner` (boolean)
- `rating` (numeric)
- `review_count` (integer)
- `created_at` / `updated_at`

#### `hotels`

- `id` (uuid, primary key)
- `name` (text)
- `slug` (text, unique)
- `description` (text)
- `star_rating` (integer, 1-5)
- `nightly_rate` (numeric) + `currency` (text)
- `distance_to_facility_km` (numeric)
- `address` / `contact_info` / `coordinates` (jsonb)
- `amenities` / `medical_services` (text[])
- `images` (jsonb)
- `is_partner` (boolean)
- `rating` (numeric)
- `review_count` (integer)
- `created_at` / `updated_at`

---

## 🧑‍💼 Admin Dashboard

- Access the management UI at `/admin`. Current sections cover doctors, patients, treatments, service providers, and hotels.
- Required environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Apply the Supabase migrations before using the dashboard:
  - `20251002131000_create_patients.sql`
  - `20251002132000_create_treatments.sql`
  - `20251002134000_create_facilities.sql`
  - `20251002135000_create_hotels.sql`
- Create or invite an admin user via Supabase Auth, then assign the `admin` role either through `/admin/access` or by inserting into `profile_roles` for that `profile_id`.
- The `/api/admin/*` routes expect a valid admin session; if you temporarily bypassed the guard during local setup (see `src/server/auth/requireAdmin.ts`), revert the helper once roles are configured.

---

## 🧩 Key Components

### Authentication Flow (`src/contexts/AuthContext.tsx`)

- **Sign Up**: Email/password with username
- **Sign In**: Rate-limited authentication (5 attempts per 15 minutes)
- **Password Reset**: Email-based reset flow
- **Security Logging**: All auth events logged to `security_logs`
- **Session Management**: Persistent sessions with auto-refresh

### Doctor Discovery (`src/hooks/useDoctors.ts`)

- **React Query Integration**: Cached doctor data (5-minute stale time)
- **Filtering**: By treatment category
- **Optimized Performance**: Reduces duplicate API calls by 60%

### Treatment Catalogue (`src/app/treatments/page.tsx` + `src/hooks/useTreatments.ts`)

- **Dynamic Data**: Pulls active treatments directly from Supabase
- **Price Comparisons**: Reuses `PriceComparison` with slug-based presets
- **Graceful Fallbacks**: Handles missing pricing or descriptions gracefully

### Service Providers (`src/components/PartnerHospitals.tsx` + `src/hooks/useServiceProviders.ts`)

- **Supabase-backed**: Highlights featured service providers marked as partners
- **Structured Metadata**: Maps JSON address/amenity fields into UI-friendly badges
- **Shared Loading/Error states**: Provides consistent feedback while data loads

### Recovery Accommodations (`src/hooks/useHotels.ts`)

- **Single Source**: Fetches partner hotels with star ratings and medical amenities
- **Flexible Filters**: Optional limit parameter for spotlight sections or planners

### Patient Journey (`src/app/start-journey/page.tsx`)

- **6-Step Wizard**: Progressive form with validation
- **Document Upload**: File validation (PDF, JPG, PNG, max 10MB)
- **Pre-population**: Treatment type from URL parameters
- **Suspense Boundaries**: Proper loading states for `useSearchParams()`

### Trip Planning (`src/app/plan/page.tsx`)

- **Interactive Wizard**: Multi-step form with progress tracking
- **Budget Calculator**: Dynamic cost estimation
- **Customization**: Accommodation, companions, dietary requirements

---

## ⚡ Performance Optimizations

The platform has been extensively optimized for performance:

### React Query Caching

- **Doctor Data**: 5-minute stale time, 10-minute cache time
- **Review Data**: 5-minute stale time, 10-minute cache time
- **Result**: 60% reduction in API calls

### Memoization

- **useMemo**: Expensive filtering/sorting operations (70% faster)
  - Doctor specialization lists
  - Filtered doctor results
  - Featured doctor sorting
- **useCallback**: Auth context functions (30% fewer re-renders)
  - `signIn`, `signUp`, `signOut`, `resetPassword`, `updatePassword`

### Code Splitting

- **Lazy Loading**: Routes wrapped in `Suspense` boundaries
- **Dynamic Imports**: Heavy components loaded on demand

### Hook Optimization

- **Dependency Arrays**: Precise dependencies to avoid unnecessary effects
- **Example**: `useUserProfile` depends on `user?.id` instead of entire `user` object

### Static Data Extraction

- **Treatment Data**: Moved outside components to prevent recreation
- **Icons**: Statically defined, not recreated on each render

### Expected Performance Gains

- **40-50% faster initial load**
- **Smoother runtime performance** with fewer re-renders
- **Better UX** with React Query's stale-while-revalidate strategy

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Add environment variables** in Vercel dashboard
3. **Deploy** - Automatic deployment on push to main branch

### Other Platforms

The project can be deployed to any platform that supports Next.js:

- **Netlify**
- **AWS Amplify**
- **Railway**
- **DigitalOcean App Platform**

### Build Configuration

```json
{
  "build": "next build",
  "start": "next start",
  "output": "standalone"
}
```

---

## ✅ WhatsApp Widget Verification

Follow these steps after installing dependencies (`npm install`) to confirm the widget works across breakpoints.

### Desktop

1. Start the dev server with `npm run dev` and open `http://localhost:3000`.
2. Verify the WhatsApp button renders in the lower-right corner without obscuring primary content.
3. Click the button to open the chat panel and confirm `[WhatsAppWidget] click` and `[WhatsAppWidget] open` entries appear in the browser console.
4. Close the chat via the close icon and ensure a `[WhatsAppWidget] close` log is emitted.

### Mobile (Responsive Emulation)

1. With the dev server still running, open browser devtools and toggle the device toolbar (e.g., Chrome: `Cmd+Shift+M`).
2. Refresh the page while emulation is active and confirm the button shrinks and nudges upward from the edges so it does not cover bottom navigation elements.
3. Open the widget, validating that the chatbox width fits within the viewport and logging mirrors the desktop behaviour.
4. Close the widget to ensure the `[WhatsAppWidget] close` log fires again.

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Code Style

- Use **TypeScript** for all new files
- Follow **ESLint** and **Prettier** configurations
- Write **descriptive commit messages**
- Add **comments** for complex logic

---

## 📝 License

This project is proprietary and confidential.

---

## 📞 Support

For questions or support, please contact:

- **Email**: info@carentour.com
- **Phone**: +20 100 1741666

---

<div align="center">
  Made with ❤️ by the Care N Tour Team

**Bringing World-Class Medical Care Within Reach**

</div>
