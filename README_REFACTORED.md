# ArquiNorma Frontend - Refactored

## Overview

The ArquiNorma frontend has been completely refactored to provide a clean, single-page chat interface that integrates with the new `/ask` endpoint. All document upload functionality has been removed from the frontend, focusing solely on the chat experience.

## 🎯 Key Changes

### ✅ **What's New**
- **Single-page chat interface** - Clean, focused design
- **Integration with `/ask` endpoint** - Uses the new backend API
- **Citation cards** - Clickable PDF links with page numbers
- **Loading states** - Better user experience during API calls
- **Locale selection** - Catalan and Spanish language support
- **Subscription status** - Visible rate limits and plan information
- **Chat bubbles** - Professional messaging interface
- **Auto-scroll** - Always shows latest messages

### ❌ **What's Removed**
- **Document upload UI** - No more file upload forms
- **Admin page** - Simplified to chat-only interface
- **Multi-page routing** - Single chat page focus
- **File management** - No frontend file handling

## 🏗️ Architecture

### Component Structure
```
src/
├── pages/
│   ├── LoginPage.jsx          # User authentication
│   ├── SignupPage.jsx         # User registration  
│   └── ChatPage.jsx           # Main chat interface (refactored)
├── components/
│   ├── ProtectedRoute.jsx     # Route protection
│   ├── ChatBox.jsx            # Legacy chat component (kept for reference)
│   └── CitationList.jsx       # Legacy citation component (kept for reference)
├── supabaseClient.js          # Supabase integration
├── stripeClient.js            # Stripe integration
├── App.jsx                    # Main app with simplified routing
└── main.jsx                   # React app entry point
```

### Routing Simplified
- `/` → Redirects to `/chat` (authenticated) or `/login` (guest)
- `/login` → User authentication
- `/signup` → User registration
- `/chat` → Main chat interface (protected)
- `*` → Catch-all redirects to appropriate page

## 🔧 Features

### Chat Interface
- **Real-time messaging** with user and bot bubbles
- **Citation display** with clickable PDF links
- **Confidence indicators** (High/Medium/Low)
- **Auto-scroll** to latest messages
- **Error handling** with user-friendly messages
- **Loading states** with typing indicators

### Locale Support
- **Catalan (ca)** - Default language
- **Spanish (es)** - Alternative language
- **Dynamic switching** - Changes interface language
- **Localized prompts** - Context-aware messaging

### Subscription Integration
- **Rate limit display** - Shows remaining questions
- **Subscription status** - Free/Personal/Corporate
- **Usage tracking** - Daily question limits
- **Upgrade prompts** - When limits are reached

### Citation Cards
```jsx
// Citation structure from /ask endpoint
{
  "text": "Verbatim clause excerpt",
  "document_title": "Building Code 2024", 
  "page": 42,
  "url": "https://storage.arquinorma.com/docs/cte.pdf#page=42",
  "score": 0.92
}
```

Features:
- **Clickable links** to PDF pages
- **Relevance scores** as percentages
- **Document titles** and page numbers
- **Excerpt preview** with full text

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Backend running on `http://localhost:8000`
- Environment variables configured

### Installation
```bash
cd frontend
npm install
```

### Environment Variables
Create `frontend/.env.local`:
```bash
# Backend API
VITE_BACKEND_URL=http://localhost:8000

# Supabase Configuration  
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key

# Optional
VITE_DEBUG_MODE=true
VITE_ENVIRONMENT=development
```

### Development
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Building for Production
```bash
npm run build
npm run preview  # Test production build
```

## 📱 User Experience

### Chat Flow
1. **User logs in** via Supabase Auth
2. **Subscription status** displayed in header
3. **User types question** in Catalan or Spanish
4. **Loading state** shows while processing
5. **Bot responds** with answer and citations
6. **Citations are clickable** to view PDF sources
7. **Rate limits** enforced based on subscription

### Message Format
```jsx
// User message
{
  id: 123,
  sender: 'user',
  text: 'Quina és l\'alçada mínima dels sostres?',
  timestamp: '10:30',
  quotes: [],
  confidence: null
}

// Bot response  
{
  id: 124,
  sender: 'bot', 
  text: 'Els sostres han de tenir 2,50m mínims...',
  timestamp: '10:31',
  quotes: [/* citation objects */],
  confidence: 'High'
}
```

## 🔗 API Integration

### `/ask` Endpoint Integration
```javascript
const payload = {
  question: userQuestion.trim(),
  locale: 'ca', // or 'es'
  user_id: user?.id || null
};

const response = await fetch(`${API_BASE_URL}/ask`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

### Rate Limiting
```javascript
// Check current limits
const limits = await fetch(`${API_BASE_URL}/ask/limits?user_id=${userId}`);

// Handle rate limit exceeded (429)
if (response.status === 429) {
  const error = await response.json();
  // Show upgrade message
}
```

### Error Handling
- **Network errors** - Connection issues
- **Rate limiting** - Daily question limits
- **Server errors** - Backend unavailable
- **Validation errors** - Invalid input
- **Authentication errors** - Session expired

## 🎨 Design System

### Color Palette
- **Primary**: Indigo (indigo-600, indigo-700)
- **Success**: Green (green-500, green-100)
- **Warning**: Yellow (yellow-500, yellow-100)  
- **Error**: Red (red-500, red-100)
- **Neutral**: Gray (gray-50 to gray-900)

### Typography
- **Headings**: font-semibold, font-bold
- **Body**: text-sm, text-base
- **Captions**: text-xs
- **Code**: font-mono

### Components
- **Chat bubbles**: Rounded corners, shadows, responsive
- **Citation cards**: Blue accent, hover effects
- **Buttons**: Indigo primary, disabled states
- **Forms**: Focus rings, validation states
- **Loading**: Spin animations, skeleton states

## 🔒 Security

### Authentication
- **Supabase Auth** integration
- **Protected routes** with redirect
- **Session management** with auto-refresh
- **Logout functionality** with cleanup

### Data Handling
- **Input validation** on all forms
- **XSS prevention** with proper escaping
- **CORS handling** for API requests
- **Environment variables** for secrets

## 📊 Performance

### Optimizations
- **Code splitting** at route level
- **Lazy loading** of components
- **Image optimization** (if needed)
- **Bundle analysis** with Vite

### Monitoring
- **Error boundaries** for crash recovery
- **Performance metrics** with Web Vitals
- **User analytics** (optional)
- **API response times** logging

## 🧪 Testing

### Manual Testing
Use `frontend/test_frontend.html` to verify:
- TailwindCSS loading
- Backend connectivity
- Environment variables
- Feature checklist

### Test Chat Flow
1. Start backend: `uvicorn app.main:app --reload`
2. Start frontend: `npm run dev`
3. Login with test user
4. Ask question: "Quina és l'alçada mínima dels sostres?"
5. Verify citation links work
6. Test locale switching
7. Check rate limiting

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Connect GitHub repo to Vercel
# Set environment variables in dashboard
# Deploy automatically on push
```

### Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
# Configure redirects for SPA
```

### Environment Variables (Production)
```bash
VITE_BACKEND_URL=https://api.arquinorma.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_STRIPE_PUBLIC_KEY=pk_live_your-live-stripe-key
VITE_ENVIRONMENT=production
```

## 📈 Future Enhancements

### Planned Features
- **Conversation history** - Save chat sessions
- **Document preview** - Inline PDF viewer
- **Advanced search** - Filter by document type
- **Export conversations** - PDF/email export
- **Mobile app** - React Native version

### Technical Improvements
- **WebSocket integration** - Real-time responses
- **Offline support** - Service worker caching
- **Progressive Web App** - PWA features
- **Accessibility audit** - WCAG compliance
- **Performance monitoring** - Real user metrics

## 🐛 Troubleshooting

### Common Issues

**White page on load:**
- Check environment variables in `.env.local`
- Verify Supabase URL and keys
- Check browser console for errors

**Backend connection failed:**
- Ensure backend is running on port 8000
- Check CORS settings in backend
- Verify `VITE_BACKEND_URL` is correct

**Authentication not working:**
- Check Supabase configuration
- Verify auth redirect URLs
- Clear browser cache and localStorage

**Citations not clickable:**
- Check PDF URLs in backend responses
- Verify document storage configuration
- Test with different browsers

### Debug Mode
Set `VITE_DEBUG_MODE=true` for:
- Detailed console logging
- API request/response logging
- State change notifications
- Performance metrics

## 📞 Support

For issues with the refactored frontend:
1. Check the browser console for errors
2. Verify environment variables are set
3. Test with `frontend/test_frontend.html`
4. Check network requests in DevTools
5. Review backend logs for API errors

The frontend is now focused, clean, and optimized for the chat experience with proper integration to the new `/ask` endpoint.
