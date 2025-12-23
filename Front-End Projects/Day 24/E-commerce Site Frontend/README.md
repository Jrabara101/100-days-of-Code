# E-commerce Site Frontend

A modern, responsive e-commerce website built with vanilla JavaScript and Tailwind CSS.

## Features

- 🛍️ Product catalog with infinite scroll
- 🛒 Shopping cart with drawer
- 📱 Responsive design
- 🎨 Modern UI with Tailwind CSS
- ⚡ Fast and lightweight (no frameworks)
- 🔍 Product search and filtering
- 📄 Product detail pages
- 💳 Checkout process

## How to Run

### Option 1: Using Python (Recommended)

1. Make sure you have Python installed
2. Open a terminal in this directory
3. Run:
   ```bash
   python server.py
   ```
4. Open your browser to `http://localhost:8000`

### Option 2: Using Node.js

If you have Node.js installed, you can use `npx`:

```bash
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: Using VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Why a Server is Needed

This project uses ES6 modules (`import`/`export`), which require a web server to run. Opening the HTML file directly in a browser (using `file://` protocol) will not work due to browser security restrictions.

## Project Structure

```
├── index.html          # Main HTML file
├── style.css           # Custom styles
├── js/
│   ├── app.js          # Main application entry
│   ├── store.js        # State management
│   ├── router.js       # Client-side routing
│   ├── catalog.js      # Product catalog page
│   ├── product-detail.js # Product detail page
│   ├── cart.js         # Cart drawer and cart page
│   └── checkout.js     # Checkout page
└── server.py           # Simple Python HTTP server
```

## Browser Support

- Chrome (recommended)
- Firefox
- Edge
- Safari

Make sure your browser supports ES6 modules (all modern browsers do).

