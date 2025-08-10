# Main Rule: Build with Components First

The AI Agent must always:

- Think in independent, reusable components.
- Create each component in its own folder.
- Build screens/pages by assembling components, never writing raw HTML in pages directly.

## 📂 File & Folder Structure

Every component must be created in:

```
/components/ComponentName/index.tsx
```

If the component has custom styles:

```
/components/ComponentName/styles.ts
```

## 🛠️ Component Creation Rules

Every UI element (Button, Card, Header, Input, etc.) must be created as a component first.

Each component must:

- Be reusable.
- Accept props for all customizable values (text, colors, sizes, actions, etc.).
- Not contain hardcoded values unless they are defaults.

## ♻️ Reusability

- Components must work in different contexts using props.
- No inline one-off designs inside pages.

## 🧱 Page Composition

Pages can only import and compose components.

❌ **Forbidden in pages:**

- Raw HTML tags like `<div>`, `<p>`, `<button>` unless they are inside a component file.

✅ **Example:**

```tsx
// pages/index.tsx
import Header from '../components/Header';
import Card from '../components/Card';

export default function HomePage() {
  return (
    <>
      <Header title="Welcome" />
      <Card title="Premium Feature" description="Apple-style luxury" />
    </>
  );
}
```

## 🔒 Clean Code Rules

- No deeply nested JSX inside page files.
- No "spaghetti" HTML inside pages.

## 🎨 Styling & UI Libraries (Recommended)

- Tailwind CSS for utility classes.
- Framer Motion for smooth animations.
- Headless UI / Radix UI for accessible components.

**Rule:** Never rebuild a component from scratch if the library provides it—wrap and customize it instead.

## 🚫 Forbidden Practices

❌ No inline raw HTML in pages.
❌ No non-reusable, hardcoded components.
❌ No giant, unmanageable files.
❌ No ignoring props.

## 📐 Responsiveness Rules (Mobile → Large Screens)

### 1. Mobile-First

Start from smallest devices (375px width, iPhone SE).

Scale up to:
- iPhone 14
- Samsung Galaxy S22
- iPad/tablets
- Desktop (1920px+)

### 2. Font Sizes

❌ **Never:** `text-[16px]` directly without scaling consideration.

✅ **Always:** Use Tailwind's `text-sm`, `text-base`, `text-lg` with `sm:`, `md:`, `lg:` responsive prefixes.

Maintain minimum 14px font size.

### 3. Component Sizes

Use relative units (rem, %, vw, vh) instead of fixed px.

**Example:**
```tsx
className="w-[80%] sm:w-[400px] h-[10vh] p-[2vw]"
```

### 4. Spacing

Use Tailwind spacing scale (`p-4`, `m-2`) with breakpoints.

**Example:**
```tsx
className="p-4 sm:p-6 lg:p-8"
```

## 🖱️ Touch-Friendly Interactions

- Buttons at least 48×48px on mobile.
- Adequate spacing between elements.
- No hover-only features—always have tap equivalents.

## 🧪 Testing Requirements

Must look perfect on:

- Small phones (iPhone SE)
- Standard (Pixel 6, iPhone 14)
- Large phones (iPhone 14 Pro Max)
- Tablets (iPad Pro)
- Large desktop screens (4K)

## ✅ Example: Responsive Apple-Style Button Component

```tsx
// components/Button/index.tsx
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ButtonProps {
  label: string;
  onClick?: () => void;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({ label, onClick, color = 'bg-blue-500', size = 'md' }: ButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={clsx(
        'rounded-xl text-white shadow-lg transition-all duration-300',
        color,
        sizeClasses[size],
        'w-full sm:w-auto'
      )}
      style={{ minHeight: '48px' }}
    >
      {label}
    </motion.button>
  );
}
```