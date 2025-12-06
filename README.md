# ArquiNorma Frontend

Assistent d'IA per a la consulta de normativa urbanística de Catalunya.

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_STRIPE_PUBLIC_KEY=pk_test_your-stripe-key
VITE_BACKEND_URL=http://localhost:8000
```

See `env.example.txt` for a template.

## 🛠️ Tech Stack

- **React 19** - UI Framework
- **Vite** - Build Tool
- **React Router** - Routing
- **TailwindCSS** - Styling
- **Supabase** - Backend & Authentication
- **Stripe** - Payments
- **i18next** - Internationalization

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable React components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── config/         # Configuration files
│   ├── utils/          # Utility functions
│   └── locales/        # Translation files
├── public/             # Static assets
└── dist/               # Production build output
```

## 🚢 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy!

## 📝 License

UNLICENSED - Proprietary software

---

For deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
