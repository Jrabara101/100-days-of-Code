# Dark Mode Toggle - CSS Custom Properties

A beautiful dark mode toggle implementation using CSS custom properties (CSS variables) with smooth transitions and localStorage persistence.

## 🌟 Features

- ✨ **Smooth Theme Transitions** - Beautiful animations when switching themes
- 💾 **Persistent Storage** - Theme preference saved in localStorage
- 🎨 **CSS Custom Properties** - Learn how to use CSS variables for theming
- 🌓 **System Preference Detection** - Automatically detects user's system theme
- ⌨️ **Keyboard Shortcut** - Toggle with `Ctrl/Cmd + Shift + D`
- 📱 **Fully Responsive** - Works perfectly on all devices
- ♿ **Accessible** - Proper ARIA labels and keyboard support

## 📁 Files Structure

```
Dark Mode Toggle/
├── index.html      # HTML structure
├── style.css       # CSS with custom properties
├── script.js       # JavaScript for theme switching
└── README.md       # This file
```

## 🚀 How to Use

1. Open `index.html` in your web browser
2. Click the toggle button in the header to switch themes
3. Your preference is automatically saved!

## 🎓 Learning CSS Custom Properties

### What are CSS Custom Properties?

CSS custom properties (also called CSS variables) allow you to store values that can be reused throughout your stylesheet. They're perfect for theming!

### Basic Syntax

```css
/* Define a custom property */
:root {
    --primary-color: #6366f1;
    --bg-color: #ffffff;
}

/* Use a custom property */
.element {
    background-color: var(--bg-color);
    color: var(--primary-color);
}
```

### How This Project Uses CSS Variables

#### 1. Define Variables for Light Theme

```css
:root {
    --bg-primary: #ffffff;
    --bg-secondary: #f9fafb;
    --text-primary: #1f2937;
    --accent: #6366f1;
    /* ... more variables */
}
```

#### 2. Override Variables for Dark Theme

```css
[data-theme="dark"] {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --text-primary: #f1f5f9;
    --accent: #818cf8;
    /* ... same variable names, different values */
}
```

#### 3. Use Variables Throughout CSS

```css
.card {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border);
}
```

### Benefits of CSS Custom Properties

1. **Easy Theme Switching** - Change one attribute to switch entire theme
2. **Maintainable** - Update colors in one place
3. **Dynamic** - Can be changed with JavaScript
4. **Cascading** - Inherit and override values
5. **Fallback Support** - Can provide default values

## 💻 JavaScript Implementation

### Theme Toggle Function

```javascript
function toggleTheme() {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}
```

### Key Features

- **localStorage Persistence** - Saves user preference
- **System Preference Detection** - Respects user's OS theme
- **Smooth Transitions** - CSS handles animations automatically
- **Keyboard Shortcuts** - `Ctrl/Cmd + Shift + D` to toggle

## 🎨 Customization

### Change Colors

Edit the CSS variables in `style.css`:

```css
:root {
    --accent: #your-color;
    --bg-primary: #your-bg-color;
    /* ... */
}
```

### Change Transition Speed

```css
:root {
    --transition-base: 0.5s ease; /* Change from 0.3s */
}
```

## 🔧 Browser Support

- Chrome (all versions)
- Firefox (all versions)
- Safari (all versions)
- Edge (all versions)

CSS custom properties are supported in all modern browsers!

## 📚 Key Concepts Learned

1. **CSS Custom Properties** - Variables in CSS
2. **Data Attributes** - Using `data-theme` for state
3. **localStorage** - Persisting user preferences
4. **Media Queries** - Detecting system preferences
5. **CSS Transitions** - Smooth theme changes
6. **Accessibility** - ARIA labels and keyboard support

## 🎯 Try It Out

Open the browser console and try:

```javascript
// Toggle theme
themeUtils.toggle()

// Get current theme
themeUtils.getCurrent()

// Check if dark mode
themeUtils.isDark()

// Set theme directly
themeUtils.set('dark')
themeUtils.set('light')
```

## 📝 Notes

- Theme preference persists across page reloads
- Respects system preference if no saved preference exists
- All transitions are handled by CSS (no JavaScript animations needed)
- Fully accessible with proper ARIA labels

## 🎉 Enjoy Learning!

This project demonstrates a modern, efficient way to implement dark mode using CSS custom properties. The same technique can be used for any theme switching needs!

