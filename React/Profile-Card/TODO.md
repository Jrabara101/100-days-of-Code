# TODO: ProCard Engine Implementation

## 1. Setup Tailwind CSS and Project Configuration
- [x] Create `tailwind.config.js`
- [x] Create `postcss.config.js`
- [x] Update `src/style.css` to include Tailwind directives
- [x] Update `src/main.ts` to render a React app

## 2. Create Directory Structure
- [x] Create `src/components/ProfileCard/` directory
- [x] Create `src/hooks/` directory
- [x] Create `src/theme/` directory

## 3. Implement Variant Config (First Task)
- [x] Create `src/components/ProfileCard/styles.ts` with CVA for card styles (intent: minimal, glass, dark; size: sm, lg)

## 4. Build Core Components
- [x] Create `src/components/ProfileCard/ProfileCard.tsx` (main wrapper with compound pattern, variants, accessibility)
- [x] Create `src/components/ProfileCard/CardHeader.tsx` (image/avatar with shimmer, fallbacks, lazy loading)
- [x] Create `src/components/ProfileCard/index.tsx` (exports compound components: ProfileCard, Header, Body, Actions)

## 5. Add Hooks and Theme
- [x] Create `src/hooks/useImageInView.ts` (Intersection Observer for lazy loading)
- [x] Create `src/theme/tokens.ts` (design tokens: colors, spacing)

## 6. Implement Advanced Features
- [ ] Add shimmer/skeleton loading states
- [ ] Implement Intl API for number formatting (followers count)
- [ ] Add hover parallax effect (suggest installing react-spring)
- [ ] Ensure accessibility: ARIA roles, screen reader text, keyboard navigation

## 7. Testing Setup
- [ ] Configure Vitest with React Testing Library
- [ ] Create unit tests for components and accessibility

## 8. Documentation
- [ ] Set up Storybook for showcasing variants and states

## 9. Followup Steps
- [ ] Run `npm run dev` to test the app
- [ ] Ensure WCAG compliance
