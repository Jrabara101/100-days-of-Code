# TODO: PrismCard Engine Implementation

- [x] Initialize Vite React TypeScript project in React/Holographic-Card
- [ ] Install dependencies: tailwindcss@3, autoprefixer, postcss, gsap, @gsap/react, react-bits
- [ ] Configure Tailwind CSS (tailwind.config.js, postcss.config.js, style.css)
- [ ] Create directory structure: src/components/bits/, src/components/HoloCard/, src/hooks/
- [ ] Implement useGyroscope.ts hook (permission logic & sensor mapping)
- [ ] Implement useTiltMath.ts hook (normalizing -90/90 to 0/1 scale)
- [ ] Implement CardContainer.tsx (3D perspective wrapper)
- [ ] Implement FoilLayer.tsx (holographic shimmer logic)
- [ ] Implement CardContent.tsx (integrate ElectricBorder & GradientText)
- [ ] Update App.tsx to render HoloCard component
- [ ] Add useGSAP animations for smooth interpolation (tilt, shimmer, parallax)
- [ ] Install dependencies and run dev server for testing
- [ ] Test gyro permissions on mobile and mouse fallback on desktop
