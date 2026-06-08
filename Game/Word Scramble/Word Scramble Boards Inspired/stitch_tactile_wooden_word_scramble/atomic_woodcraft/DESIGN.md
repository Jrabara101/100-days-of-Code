---
name: Atomic Woodcraft
colors:
  surface: '#0f1415'
  surface-dim: '#0f1415'
  surface-bright: '#343a3b'
  surface-container-lowest: '#090f10'
  surface-container-low: '#171d1e'
  surface-container: '#1b2122'
  surface-container-high: '#252b2c'
  surface-container-highest: '#303637'
  on-surface: '#dee3e4'
  on-surface-variant: '#bcc9cb'
  inverse-surface: '#dee3e4'
  inverse-on-surface: '#2b3132'
  outline: '#869395'
  outline-variant: '#3d494b'
  surface-tint: '#56d7e9'
  primary: '#6fecfe'
  on-primary: '#00363c'
  primary-container: '#4dd0e1'
  on-primary-container: '#00565f'
  inverse-primary: '#006973'
  secondary: '#f8bd2a'
  on-secondary: '#402d00'
  secondary-container: '#d9a200'
  on-secondary-container: '#533c00'
  tertiary: '#ffd3aa'
  on-tertiary: '#492900'
  tertiary-container: '#ffae55'
  on-tertiary-container: '#724200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#93f1ff'
  primary-fixed-dim: '#56d7e9'
  on-primary-fixed: '#001f23'
  on-primary-fixed-variant: '#004f57'
  secondary-fixed: '#ffdfa0'
  secondary-fixed-dim: '#f8bd2a'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#ffb86e'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#693c00'
  background: '#0f1415'
  on-background: '#dee3e4'
  surface-variant: '#303637'
  wood-teak-light: '#8d6e63'
  wood-mahogany-dark: '#5d4037'
  walnut-inlay: '#3e2723'
  atomic-teal: '#4dd0e1'
  sun-gold: '#fbc02d'
  cream-wallpaper: '#f5f5f0'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: 0.15em
  display-lg-mobile:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: 0.1em
  score-readout:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  tile-letter:
    fontFamily: Montserrat
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  grid-gap: 4px
  slot-size: 48px
  board-padding: 24px
  margin-sm: 8px
  margin-md: 16px
  margin-lg: 32px
---

# Design Specification: Mid-Century Inlay Word Scramble

## Visual Direction
A retro-futuristic "Atomic Age" aesthetic that blends organic mid-century textures with playful, vibrant geometry. The design focuses on "Visual Depth Physics," using skeuomorphic CSS techniques to create a tactile, three-dimensional game board that feels physically weighted.

## Color Palette
- **Primary Wood (Teak/Mahogany)**: `radial-gradient(circle, #8d6e63 0%, #5d4037 100%)`
- **Accent Teal (Atomic)**: `#4dd0e1` (used for highlights, buttons, and "glow" effects)
- **Accent Gold**: `#fbc02d` (used for score indicators and secondary actions)
- **Base Board Inlay**: `#3e2723` (deep walnut for the routed grid)
- **Background Texture**: Creamy off-white with a subtle cyan/gold dot-grid pattern reminiscent of 1950s wallpaper.

## Typography
- **Primary Header**: "Word Scramble" in a bold, sans-serif font (e.g., 'Futura', 'Montserrat') with a significant 3D offset effect.
- **Visual Style**: Heavy letter-spacing, uppercase, with a teal/white layered text-shadow to create an "extruded" look.

## Layout & Components

### 1. The Main Board
- **Structure**: A 10x10 routed grid set into a mahogany-style wood block.
- **Routing Effect**: Inset channels created with deep inner shadows (`inset 3px 3px 6px rgba(0,0,0,0.6)`) and a subtle light-source reflection on the bottom-right edge.
- **Atomic Scoring**: A circular badge in the top-right corner featuring intersecting "orbit" lines, a gold background, and a "SCORE 000" readout.

### 2. Tactile Tiles
- **Material**: Polished wood blocks with high-contrast character engraving.
- **Depth Physics**: 
    - **Raised State**: Outset drop shadows (`0 6px 10px rgba(0,0,0,0.4)`) combined with a top-edge highlight (`inset 0 2px 0px rgba(255,255,255,0.3)`) to simulate height.
    - **Inlaid State**: When placed on the board, tiles sit precisely within the routed slots, reducing shadow spread to simulate "dropping" into the wood.

### 3. Controls
- **Action Buttons**: Two primary buttons ("RESET" in gold, "SUBMIT" in teal) positioned directly below the board.
- **Feedback**: Buttons use a 3D "depress" animation (`translateY(4px)`) with a corresponding shift in their bottom border shadows to mimic mechanical press.

## Animation & Feel
- **Movement**: Hard-ware accelerated `translate3d()` movements for tiles.
- **Easing**: Custom `cubic-bezier(0.25, 1, 0.5, 1)` curve providing a "swift slide and snap" feel, mimicking low-friction wood sliding on wood.
- **Grid Snapping**: Tiles mathematically align to the center of the routed matrix slots using absolute coordinate mapping.