'use client';

import React, { useEffect } from 'react';
import { useLifeOs } from '@/store/life-os-context';
import { CloseIcon } from './Icons';

export function CustomizeWidgetsModal() {
  const {
    widgets,
    customizeOpen,
    setCustomizeOpen,
    toggleWidgetVisibility,
    moveWidget,
    resetWidgets,
  } = useLifeOs();

  useEffect(() => {
    if (!customizeOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCustomizeOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [customizeOpen, setCustomizeOpen]);

  if (!customizeOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customize-widgets-title"
      onClick={() => setCustomizeOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-2xl card-canvas shadow-xl p-5 max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
          <div>
            <h2 id="customize-widgets-title" className="text-base font-bold">Kustomisasi 13 Widget Overview</h2>
            <p className="text-xs text-[var(--ink-muted)]">Tampilkan, sembunyikan, atau ubah urutan seluruh widget blueprint.</p>
          </div>
          <button
            type="button"
            onClick={() => setCustomizeOpen(false)}
            aria-label="Tutup dialog kustomisasi widget"
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)]"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="overflow-y-auto thin-scroll py-3 space-y-2 flex-1">
          {widgets.map((w, idx) => (
            <div key={w.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl card-surface">
              <label htmlFor={`wg-${w.id}`} className="flex items-center gap-2.5 text-xs font-medium flex-1">
                <input
                  id={`wg-${w.id}`}
                  type="checkbox"
                  checked={w.visible}
                  onChange={() => toggleWidgetVisibility(w.id)}
                  className="w-4 h-4 accent-[var(--cta-primary)]"
                />
                <span>{w.label}</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveWidget(w.id, -1)}
                  aria-label={`Geser ${w.label} ke atas`}
                  className="px-2 py-1 text-xs rounded-lg card-canvas"
                >
                  Naik
                </button>
                <button
                  type="button"
                  disabled={idx === widgets.length - 1}
                  onClick={() => moveWidget(w.id, 1)}
                  aria-label={`Geser ${w.label} ke bawah`}
                  className="px-2 py-1 text-xs rounded-lg card-canvas"
                >
                  Turun
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-hairline)]">
          <button
            type="button"
            onClick={resetWidgets}
            className="px-3 py-2 rounded-xl text-xs font-semibold card-surface"
          >
            Reset Default
          </button>
          <button
            type="button"
            onClick={() => setCustomizeOpen(false)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--cta-primary)] text-white"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
