'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';
import type { PresetHelpGuide } from '@/lib/preset-help-content';
import { cn } from '@/lib/utils/cn';

interface PresetInfoButtonProps {
  guide: PresetHelpGuide;
  accentClassName?: string;
  className?: string;
}

export function PresetInfoButton({
  guide,
  accentClassName = 'text-[#20B2AA]',
  className,
}: PresetInfoButtonProps) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`Learn how ${guide.title} works`}
        title={`How ${guide.title} works`}
        className={cn(
          'inline-flex items-center justify-center h-5 w-5 rounded-full border border-[#2A313A] bg-[#080A0C] text-[#8B949E] hover:text-[#E1E4E8] hover:border-[#20B2AA]/60 transition-colors cursor-pointer shrink-0',
          className
        )}
      >
        <Info className="h-3 w-3" />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        {...({ closedby: 'any' } as Record<string, string>)}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // Fallback light-dismiss on backdrop click for browsers without closedby="any"
          if (e.target === dialogRef.current) {
            setOpen(false);
          }
        }}
        className="backdrop:bg-black/75 backdrop:backdrop-blur-xs bg-transparent p-3 sm:p-4 max-w-xl w-full m-auto open:flex items-center justify-center"
      >
        <div className="w-full bg-[#0F1215] border border-[#2A313A] rounded-sm shadow-2xl text-left font-sans text-[#E1E4E8] overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#1B2026] bg-[#16191E]/80 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Info className={cn('h-4 w-4 shrink-0', accentClassName)} />
                <h3
                  id={titleId}
                  className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-[#E1E4E8]"
                >
                  {guide.title}
                </h3>
              </div>
              <p className="text-xs text-[#8B949E] mt-1">{guide.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close guide"
              className="p-1 text-[#8B949E] hover:text-[#E1E4E8] border border-transparent hover:border-[#2A313A] rounded-xs transition-colors cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-4 max-h-[70vh] overflow-y-auto space-y-4">
            <p className="text-xs sm:text-[13px] text-[#C9D1D9] leading-relaxed">
              {guide.overview}
            </p>

            <div className="space-y-2.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#8B949E] block">
                AVAILABLE OPTIONS
              </span>
              {guide.options.map((opt) => (
                <div
                  key={opt.name}
                  className="p-3 bg-[#080A0C] border border-[#1B2026] rounded-xs space-y-1"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-[#E1E4E8]">
                      {opt.name}
                    </span>
                    {opt.badge && (
                      <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 bg-[#20B2AA]/15 text-[#20B2AA] border border-[#20B2AA]/35 rounded-xs">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8B949E] leading-relaxed">
                    {opt.summary}
                  </p>
                  {opt.example && (
                    <p className="text-[11px] text-[#C9D1D9]/90 pt-1 border-t border-[#1B2026]/80">
                      <span className="font-mono text-[10px] uppercase text-[#20B2AA] mr-1.5">
                        Example:
                      </span>
                      {opt.example}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {guide.tip && (
              <div className="p-3 bg-[#20B2AA]/8 border border-[#20B2AA]/25 rounded-xs text-xs text-[#C9D1D9] leading-relaxed">
                <span className="font-mono text-[10px] font-bold uppercase text-[#20B2AA] mr-1.5">
                  Tip:
                </span>
                {guide.tip}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-[#1B2026] bg-[#16191E]/50 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-[11px] font-mono font-bold uppercase bg-[#20B2AA]/15 text-[#20B2AA] border border-[#20B2AA]/40 hover:bg-[#20B2AA]/25 rounded-xs transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

