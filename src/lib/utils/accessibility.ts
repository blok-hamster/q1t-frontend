/**
 * Accessibility utilities and helpers
 */

/**
 * Generate unique IDs for ARIA labels
 */
let idCounter = 0;
export function generateId(prefix: string = 'id'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * Announce to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (typeof document === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false;

  const tagName = element.tagName.toLowerCase();
  const focusableTags = ['a', 'button', 'input', 'select', 'textarea'];

  if (focusableTags.includes(tagName)) {
    return !element.hasAttribute('disabled');
  }

  return element.tabIndex >= 0;
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selectors));
}

/**
 * Trap focus within a container (for modals)
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Handle escape key
 */
export function onEscapeKey(callback: () => void): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      callback();
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Format number for screen readers
 */
export function formatForScreenReader(value: number, type: 'currency' | 'percentage' | 'number'): string {
  switch (type) {
    case 'currency':
      return `${value.toFixed(2)} dollars`;
    case 'percentage':
      return `${value} percent`;
    case 'number':
      return value.toString();
    default:
      return value.toString();
  }
}

/**
 * Get ARIA role for button action
 */
export function getAriaRole(action: string): string {
  const roleMap: Record<string, string> = {
    close: 'button',
    submit: 'button',
    menu: 'menuitem',
    tab: 'tab',
    checkbox: 'checkbox',
    radio: 'radio',
    switch: 'switch',
  };

  return roleMap[action] || 'button';
}

/**
 * Create visually hidden but screen-reader accessible element
 */
export const srOnlyStyles = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  borderWidth: '0',
};

/**
 * Keyboard navigation keys
 */
export const Keys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  HOME: 'Home',
  END: 'End',
} as const;

/**
 * Check if key is navigation key
 */
export function isNavigationKey(key: string): boolean {
  return Object.values(Keys).includes(key as any);
}

/**
 * Handle keyboard list navigation
 */
export function handleListNavigation(
  event: React.KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onSelect: (index: number) => void
): number {
  let newIndex = currentIndex;

  switch (event.key) {
    case Keys.ARROW_UP:
      event.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      break;
    case Keys.ARROW_DOWN:
      event.preventDefault();
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      break;
    case Keys.HOME:
      event.preventDefault();
      newIndex = 0;
      break;
    case Keys.END:
      event.preventDefault();
      newIndex = items.length - 1;
      break;
    case Keys.ENTER:
    case Keys.SPACE:
      event.preventDefault();
      onSelect(currentIndex);
      return currentIndex;
    default:
      return currentIndex;
  }

  items[newIndex]?.focus();
  return newIndex;
}

/**
 * Add skip link for keyboard navigation
 */
export function createSkipLink(): void {
  if (typeof document === 'undefined') return;

  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.textContent = 'Skip to main content';
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-primary focus:text-bg-primary focus:rounded-md';

  document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Reduce motion check
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * High contrast mode check
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}
