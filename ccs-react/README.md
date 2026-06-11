# Celebration Cake Shop — React Frontend

## Tech Stack
- **React 18** + TypeScript
- **Vite** — build tool (blazing fast)
- **Tailwind CSS** — utility-first styling with CCS design tokens
- **React Router v6** — client-side routing
- **Zustand** — state management (auth + cart, persisted to localStorage)
- **TanStack Query** — server state, caching, auto-refetch
- **React Hot Toast** — toast notifications
- **Axios** — HTTP client with auto token injection + response unwrapping

## Project Structure
```
src/
├── components/
│   ├── ui/           # Button, Input, Modal, Badge, Spinner, etc.
│   ├── customer/     # CustomerLayout (navbar + cart drawer)
│   └── ProtectedRoute.tsx
├── pages/
│   ├── Login.tsx           # Unified login (all 4 roles)
│   ├── customer/
│   │   ├── Home.tsx        # Hero + categories + products
│   │   ├── Catalog.tsx     # Full product grid + filters
│   │   ├── ProductDetail.tsx
│   │   ├── Checkout.tsx
│   │   ├── Track.tsx
│   │   └── Account.tsx
│   ├── chef/
│   │   └── ChefPortal.tsx  # Kitchen dashboard
│   ├── delivery/
│   │   └── DeliveryPortal.tsx
│   └── admin/
│       └── AdminPortal.tsx # Full admin with sidebar
├── store/
│   ├── auth.ts    # Zustand auth store (persisted)
│   └── cart.ts    # Zustand cart store (persisted)
├── lib/
│   ├── api.ts     # All API calls (auto-token, auto-unwrap)
│   ├── types.ts   # TypeScript types
│   └── utils.ts   # Helpers (formatPrice, cn, etc.)
└── App.tsx        # Router + providers
```

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (proxies /api to EC2 backend)
npm run dev

# Opens at http://localhost:5173
# API calls proxy to http://65.2.75.137:4000
```

## Production Build

```bash
npm run build
# Output in dist/
```

## Deploy to EC2

```bash
# On EC2 — install Node 20 (if not present)
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# Upload project to EC2
scp -r ccs-react root@65.2.75.137:/home/ec2-user/

# On EC2
cd /home/ec2-user/ccs-react
npm install
npm run build

# Copy built files to nginx
sudo cp -r dist/* /var/www/celebration-cake-shop/public/

# Add this to nginx config for React Router to work:
# location / {
#   try_files $uri $uri/ /index.html;
# }
sudo systemctl reload nginx
```

## Nginx Config (SPA routing)

Add inside your server block:
```nginx
location / {
    root /var/www/celebration-cake-shop/public;
    try_files $uri $uri/ /index.html;
}

location /api {
    proxy_pass http://localhost:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Environment Variables (optional)

Create `.env` in project root:
```
VITE_API_URL=http://65.2.75.137:4000
```

## Phase 2 additions (coming next)
- [ ] WebSocket real-time order updates (no more polling)
- [ ] Razorpay payment integration
- [ ] Redis session caching
- [ ] Push notifications
- [ ] Product image upload
