# Show / Hide Password Component

A beautiful password input component with smooth GSAP animations for toggling password visibility. Built with React, Vite, and GSAP.

## Features

- 👁️ Toggle password visibility with eye icon
- ✨ Smooth GSAP animations
- 🎨 Modern, dark-themed UI
- 📱 Fully responsive design
- ♿ Accessible with proper ARIA labels
- 🎯 Focus animations
- 🔒 Secure password input

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Usage

### Basic Usage

```jsx
import ShowHidePassword from './components/ShowHidePassword'

function App() {
  const [password, setPassword] = useState('')

  return (
    <ShowHidePassword
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Enter your password"
    />
  )
}
```

### With All Props

```jsx
<ShowHidePassword
  id="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="Enter your password"
  className="custom-class"
  // ... any other input props
/>
```

## Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | - | Input ID attribute |
| `value` | `string` | - | Controlled input value |
| `onChange` | `function` | - | Change handler function |
| `placeholder` | `string` | `'Enter password'` | Input placeholder text |
| `className` | `string` | `''` | Additional CSS classes |
| `...props` | `object` | - | Any other standard input props |

## GSAP Animations

The component includes several GSAP animations:

1. **Eye Icon Animation**: Scales and bounces when toggling visibility
2. **Container Focus**: Scales up slightly when input is focused
3. **Toggle Shake**: Subtle shake animation when clicking the toggle button

## Technologies

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **GSAP 3** - Animation library
- **CSS3** - Styling with modern features

## Project Structure

```
Show-Hide Password/
├── src/
│   ├── components/
│   │   └── ShowHidePassword.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Customization

### Styling

You can customize the appearance by modifying the CSS variables in `src/index.css`:

```css
:root {
  --primary-bg: #0f172a;
  --accent: #6366f1;
  --text-primary: #f1f5f9;
  /* ... more variables */
}
```

### Animation Speed

Modify the GSAP animation durations in `ShowHidePassword.jsx`:

```jsx
gsap.to(eyeIconRef.current, {
  scale: 1.2,
  duration: 0.2, // Change this value
  ease: 'back.out(1.7)'
})
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

