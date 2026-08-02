'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils/cn';
import { X } from 'lucide-react';

export interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: string; // e.g. 'max-h-[85vh]'
  showCloseButton?: boolean;
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = 'max-h-[88vh]',
  showCloseButton = true,
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[110] flex flex-col justify-end">
      {/* Dark Overlay Backdrop with Blur */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-Up Sheet Container */}
      <div
        ref={sheetRef}
        className={cn(
          'relative w-full bg-[#0F1215] border-t border-[#1B2026] rounded-t-2xl shadow-2xl overflow-hidden font-mono flex flex-col',
          'animate-in slide-in-from-bottom duration-300',
          maxHeight
        )}
      >
        {/* Top Drag Bar Handle */}
        <div
          className="w-full py-2.5 flex items-center justify-center cursor-grab active:cursor-grabbing bg-[#0F1215] select-none"
          onClick={onClose}
        >
          <div className="w-12 h-1.5 rounded-full bg-[#2A313A] hover:bg-[#20B2AA]/60 transition-colors" />
        </div>

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="px-4 pb-3 pt-1 border-b border-[#1B2026] flex items-center justify-between shrink-0 bg-[#16191E]/60">
            <div>
              {title && (
                <h3 className="text-xs font-bold text-[#E1E4E8] tracking-wider uppercase">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[10px] text-[#8B949E] mt-0.5">{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xs text-[#8B949E] hover:text-[#E1E4E8] hover:bg-[#16191E] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-4 overflow-y-auto scrollbar-thin text-xs text-[#E1E4E8] space-y-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(content, document.body)
    : null;
}
