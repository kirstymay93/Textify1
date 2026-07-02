# Accessibility & Mobile Responsiveness Guide

## Overview

Textify1 is designed to be accessible and responsive across all devices and screen sizes.

## Accessibility (a11y)

### WCAG 2.1 AA Compliance

We aim for WCAG 2.1 Level AA conformance:

#### Perceivable
- [ ] Color contrast ratios ≥ 4.5:1 for text
- [ ] Color contrast ratios ≥ 3:1 for UI components
- [ ] All images have alt text
- [ ] Content is readable at 200% zoom

#### Operable
- [ ] Full keyboard navigation support
- [ ] Tab order follows visual order
- [ ] No keyboard traps
- [ ] Focus indicators are visible

#### Understandable
- [ ] Clear labels for all form controls
- [ ] Error messages are clear and helpful
- [ ] Consistent navigation patterns
- [ ] Language is clear and simple

#### Robust
- [ ] Valid HTML/CSS
- [ ] Proper ARIA attributes
- [ ] Works with screen readers (NVDA, JAWS, VoiceOver)

### Implementation Checklist

**Semantic HTML**
```tsx
// ✅ Good
<button onClick={handleClick} aria-label="Select layer">
  <Eye size={16} />
</button>

// ❌ Bad
<div onClick={handleClick}>
  <Eye size={16} />
</div>
```

**ARIA Attributes**
```tsx
// Label buttons
<button aria-label="Toggle visibility" />

// Describe complex widgets
<div role="listbox" aria-label="Layers" />

// Indicate state
<button aria-pressed={isSelected} />
```

**Keyboard Navigation**
```tsx
// All interactive elements should be focusable
<button tabIndex={0} onKeyDown={handleKeyDown} />

// Custom components need proper focus management
const MyComponent = forwardRef((props, ref) => (
  <div ref={ref} role="button" tabIndex={0} />
));
```

**Color & Contrast**
- Use Tailwind's accessible color combinations
- Test with tools like WebAIM Contrast Checker
- Don't rely on color alone for information

**Focus Management**
```tsx
const focusElement = useCallback(() => {
  inputRef.current?.focus();
}, []);
```

### Testing

```bash
# Install axe DevTools browser extension
# Run automated accessibility scans
npm run test:a11y

# Manual testing with screen readers
# macOS: VoiceOver (Cmd + F5)
# Windows: NVDA (free)
# Windows: JAWS (commercial)
```

---

## Mobile Responsiveness

### Breakpoints

Using Tailwind CSS breakpoints:

```
- sm: 640px   (mobile)
- md: 768px   (tablet)
- lg: 1024px  (desktop)
- xl: 1280px  (large desktop)
- 2xl: 1536px (very large)
```

### Layout Patterns

**Mobile-First Approach**
```tsx
// Start with mobile, add complexity for larger screens
<div className="flex flex-col md:flex-row lg:gap-6">
  <Sidebar className="md:w-80" />
  <Canvas className="flex-1" />
</div>
```

**Responsive Typography**
```tsx
<h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl" />
<p className="text-sm md:text-base lg:text-lg" />
```

**Touch-Friendly Targets**
```tsx
// Minimum 44x44px touch targets
<button className="p-3" /> {/* 48x48px with padding */}
<input className="h-10 px-3" /> {/* 40px tall */}
```

### Screen Sizes to Test

- **Mobile**: 375px (iPhone SE), 390px (iPhone), 412px (Galaxy S21)
- **Tablet**: 768px (iPad), 1024px (iPad Pro)
- **Desktop**: 1366px (common), 1920px (Full HD), 2560px (4K)

### Testing

```bash
# Chrome DevTools
# F12 -> Toggle device toolbar (Ctrl+Shift+M)
# Test responsive design at different breakpoints

# Run automated tests
npm run test:responsive
```

### Components & Responsive Behavior

**Editor Layout**
```tsx
// Mobile: Stacked vertically
// Tablet: Side-by-side with adjustable split
// Desktop: Full layout with all panels
<div className="flex flex-col lg:flex-row">
  <Canvas className="flex-1" />
  <Sidebar className="w-full lg:w-80" />
</div>
```

**Layer Sidebar**
```tsx
// Mobile: Collapsed/drawer
// Tablet+: Side panel
<Sidebar className="hidden md:block" />
```

**Properties Panel**
```tsx
// Mobile: Bottom sheet or modal
// Desktop: Side panel
<PropertiesPanel className="fixed bottom-0 md:relative md:bottom-auto" />
```

---

## Performance & Accessibility

### Optimizations

- **Lazy load** images and heavy components
- **Code split** for faster initial load
- **Compress** images for mobile networks
- **Cache** static assets

### Network Awareness

```tsx
const connection = navigator.connection;
if (connection?.effectiveType === '4g') {
  // Load full quality assets
} else {
  // Load optimized assets for slower connections
}
```

---

## QA Checklist

### Accessibility
- [ ] Navigate using only keyboard (Tab, Enter, Space, Arrow keys)
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] All images have alt text
- [ ] Focus order is logical
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] No flashing content (< 3 Hz)
- [ ] Zoom to 200% works correctly

### Mobile Responsiveness
- [ ] Layout works at 320px (old phones)
- [ ] Touch targets are ≥ 44x44px
- [ ] Text is readable without horizontal scroll
- [ ] Images scale appropriately
- [ ] Buttons/inputs work on touch devices
- [ ] No overflow issues
- [ ] Tested on iOS and Android

### Cross-Browser
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (Mac)
- [ ] Safari (iOS)
- [ ] Samsung Internet

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind Accessibility](https://tailwindcss.com/docs/responsive-design)
- [WebAIM](https://webaim.org/)
- [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Accessibility Insights](https://accessibilityinsights.io/)
