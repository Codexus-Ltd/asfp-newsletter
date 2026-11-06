This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Website branding standard (new customers)
After approving a website, publish its public brand profile at the Codexus Portal `public/brands/<portal-company-id>.json` and register it in `lib/website-brand.mjs`. It contains only presentation data: website, logo variants, favicon, palette and heading style. Never put contacts, credentials, prices or access grants in this file. Portal, Product Register, Billing and Newsletter consume this shared profile; profiles for legacy customers remain absent until explicitly approved. Cross-origin JSON is public and contains no workspace records.
Link the exact company ID during authorised app provisioning: register plan `portal_company_id`, newsletter company slug, and Billing member `brand_company_id` (apply `supabase/website-branding.sql` in Billing first). Billing uses the issuing business, never its invoice recipient, and existing financial isolation/sending configuration is unchanged. Changing presentation does not enable an app, subscription, card payment or sender identity. Shared profiles override local presentation fallbacks. Missing/unavailable profiles keep existing styling.
Codexus and CS Cleaning are the first published profiles. `/branding-preview` in the Portal shows clearly labelled sample views of all four apps; CS Cleaning currently has Website access only. Billing tax, sender and tenant provisioning require their own setup before customer launch. No newsletters or invoices are sent by this preview.
