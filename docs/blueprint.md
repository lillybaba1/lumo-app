# **App Name**: Lumo

## Core Features:

- Product Display: Display products in an easy-to-browse grid layout, with clear images and pricing. The app should include categories like: Electronics, Beauty, Fashion, Food, Baby Products, etc. Even if you don’t need filtering yet, define category structure in your database early.
- Shopping Cart: Allow users to add items to a virtual cart for purchase. What should the page show if the cart is empty? Define placeholder components like “Oops! Your cart is empty.”
- Payment Processing: Enable secure payment processing, initially supporting Wave Money Transfer and Cash on Delivery.
- Product Management: Implement a system for Sillah to manage products (add, update, delete).
- Order Management: Allow Sillah to view and manage customer orders through the admin panel. User Authentication: Customers may want to track orders or save items. Firebase Auth setup (email only or OTP via phone) would be useful. Right now, it's focused on seller access only.
- AI Shopping Assistant: Offer an AI shopping assistant tool that answers user questions about product availability, pricing, and recommendations using Genkit. What should the page show if the Assistant has no match? Define placeholder components like “Oops! No items found.”
- Dashboard Analytics: Create a simple admin panel for Sillah to track key metrics such as orders and revenue, similar to the provided image with a clean and intuitive dashboard, sales overviews, and key performance indicators. The app is built with modular code to later support verified third-party sellers (manual approval required).

## Style Guidelines:

- Primary color: Lavender (#D0BFFF) to evoke feelings of trust, sophistication, and modernity.
- Background color: Light lavender (#E8E2FF) - a lighter, desaturated shade of the primary color to create a calming backdrop that is easy on the eyes.
- Accent color: Rose (#FFB3C6) as a contrasting accent to guide user actions and draw attention to important elements.
- Headline font: 'Belleza' (sans-serif) for headlines, creating a visually striking and contemporary feel. 'Belleza' suits art, fashion, and design, making it perfect for an e-commerce application featuring beauty and apparel products.
- Body font: 'Alegreya' (serif) for body text, providing an elegant, intellectual, and contemporary feel. It complements 'Belleza' for a clear reading experience.
- Use simple, line-based icons to maintain a clean and modern aesthetic. Ensure icons are intuitive and universally understood.
- Implement a mobile-first, grid-based layout to ensure responsiveness and visual appeal. Prioritize clear content hierarchy and easy navigation. What should the page show if there are no products in a category? Define placeholder components like “Oops! No items found.”