# Hex Color Generator

A beautiful and functional hex color generator with a modern dark theme UI.

## Features

- 🎨 Generate random hex colors with one click
- 📋 Copy hex codes to clipboard instantly
- ✏️ Manually enter hex color codes
- 💾 Recent colors history (up to 12 colors)
- ⌨️ Keyboard shortcuts support
- 📱 Fully responsive design

## How to Use

1. Open `index.html` in your web browser
2. Click "Generate Color" to create random hex colors
3. Click "Copy" to copy the hex code to clipboard
4. Or manually enter a hex code in the input field

## Keyboard Shortcuts

- `Space` - Generate new random color
- `Ctrl/Cmd + C` - Copy hex code (when not typing)
- `Enter` - Apply manually entered hex code

## Troubleshooting

### Content Security Policy (CSP) Errors

If you see CSP errors in the browser console like:
- "Loading the font 'https://r2cdn.perplexity.ai/...' violates CSP"
- "Connecting to 'http://127.0.0.1:5502/.well-known/...' violates CSP"

**These errors are NOT from your code!** They are caused by:

1. **Browser Extensions** - Extensions like Perplexity AI or other browser add-ons trying to inject resources
2. **Chrome DevTools** - Developer tools trying to connect to local servers

**Solutions:**

1. **Ignore them** - These errors are harmless and don't affect the functionality of your app
2. **Disable browser extensions** - Temporarily disable extensions if the errors bother you
3. **Use a clean browser profile** - Open the file in an incognito/private window
4. **Filter console errors** - In Chrome DevTools, you can filter out CSP errors in the console

### File Not Found (404) Error

If you see a 404 error for `index.html`:
- Make sure you're opening the file from the correct directory
- Check that all files (`index.html`, `style.css`, `script.js`) are in the same folder
- Try opening the file directly by double-clicking it, or use a local server

## File Structure

```
Hex Color Generator/
├── index.html      # Main HTML structure
├── style.css       # Styling and animations
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Notes

- Colors are saved in browser's localStorage
- Recent colors persist across page reloads
- No external dependencies - pure HTML, CSS, and JavaScript

