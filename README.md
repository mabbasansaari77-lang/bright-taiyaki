# Brand Collection — Online Clothing Store

An online clothing store for Pakistan selling streetwear for men, women and kids: hoodies, jackets, cargo pants, tees and kurtis. Prices are in PKR.

**Live site:** https://bright-taiyaki-758f38.netlify.app

## Features

- Shop pages for men, women, kids, collections and sale
- Product pages, cart and checkout
- Payment options: Cash on Delivery, bank transfer, JazzCash, Easypaisa
- Customer accounts and order tracking
- Admin panel to manage products and orders
- Blog, FAQ, size guide, and shipping, returns and privacy policies
- SEO: sitemap, robots.txt, page titles and descriptions

## Technology

| Part | Tool |
| --- | --- |
| Frontend | HTML, CSS, JavaScript |
| Database and login | Supabase (schema in `data/supabase_schema.sql`) |
| Hosting | Netlify (`vercel.json` also included) |

## Project files

| File / folder | Purpose |
| --- | --- |
| `index.html` | Home page |
| `shop.html`, `men.html`, `women.html`, `kids.html` | Shop pages |
| `products/` | One page per product |
| `cart.html`, `checkout.html` | Cart and checkout |
| `account.html`, `track-order.html` | Customer account and order tracking |
| `admin.html` | Admin panel |
| `assets/` | CSS, JavaScript and images |
| `data/supabase_schema.sql` | Database tables for Supabase |

## Run locally

Static site, no build step. Open `index.html` in a browser, or run `npx serve .` and open the address it shows.

## Deploy

Connected to Netlify. Every push to `main` updates the live site.

## Author

Muhammad Abbas Ansaari
