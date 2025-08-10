# Design Instruction

## 1. Apple-inspired luxury design language

Style the UI to match the elegance and premium feel of Apple's apps and websites.

Use clean, minimalistic layouts, refined typography, and a harmonious color palette.

Ensure the interface feels high-end—no cheap-looking elements.

Every element should have a polished, professional finish.

## 2. Mobile-first responsiveness

Design for small mobile devices first (iPhone SE 375×667) and scale up to tablets and large desktops.

Fit all elements neatly on small screens—no overflow, clipping, or cramped layouts.

Support breakpoints for:
- iPhone SE (375×667)
- iPhone 14
- Samsung Galaxy S22
- iPad/tablets
- Large desktops (1920px and above)

## 3. Touch-friendly interactions

- Buttons at least 48×48px
- Adequate spacing between clickable elements
- No hover-only features (must be accessible by touch)

## 4. Performance optimization

- Minimal animations for mobile
- Use lightweight assets
- Prioritize fast load times

## 5. Readability

- Font size minimum 14px
- Maintain high contrast between text and background
- Avoid overcrowding; give elements room to breathe

## 6. Visual polish

- Use smooth, subtle animations (Framer Motion or similar)
- Add depth with soft shadows, gradients, and large rounded corners (Apple aesthetic)
- Keep each screen clean, minimal, and balanced
- Consistent spacing and alignment across all devices

## 7. Large screen adaptation

- On desktops and large displays, introduce more whitespace and a grid-based layout for balance
- Avoid stretching elements to full width—maintain comfortable content widths
- Add enhanced animations and transitions for desktop while keeping mobile minimal

## 8. Before starting, always ask the user:

- Light or dark theme preference
- Brand/style preferences (playful, professional, elegant)
- Whether they want icons, illustrations, or special effects

## Deliverables:

- Fully responsive Next.js components
- Pixel-perfect implementation for both iOS and Android screen sizes
- No visual or functional breakage at any viewport