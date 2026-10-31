'use client';

import { useState } from 'react';
import { Mic } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { JobRequestItem } from '@/types';
import { cn } from '@/utils/cn';

/** Photos de la demande (agrandies au toucher) et note vocale. */
export function RequestMedia({ request, compact }: { request: JobRequestItem; compact?: boolean }) {
  const photos = request.media.filter((m) => m.kind === 'PHOTO');
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div className={cn('grid gap-2', photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2', !compact && photos.length > 2 && 'sm:grid-cols-4')}>
          {photos.map((m, i) => (
            <button
              key={m.url}
              type="button"
              onClick={() => setOpen(m.url)}
              className={cn('overflow-hidden rounded-lg bg-muted', photos.length === 1 ? 'aspect-[16/10] max-h-64 w-full' : 'aspect-square', compact && photos.length > 1 && 'max-h-40')}
              aria-label={`Agrandir la photo ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.thumbnailUrl ?? m.url} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      {request.voiceUrl && (
        <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2">
          <Mic className="h-4 w-4 shrink-0 text-brand-700 dark:text-brand-300" aria-hidden="true" />
          <audio src={request.voiceUrl} controls preload="none" className="h-9 min-w-0 flex-1" aria-label="Note vocale du client" />
          {request.voiceSeconds ? <span className="tabular shrink-0 text-[13px] text-muted-foreground">{request.voiceSeconds} s</span> : null}
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl overflow-hidden bg-gray-950 p-0">
          <DialogTitle className="sr-only">Photo de la demande</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {open && <img src={open} alt="" className="max-h-[80vh] w-full object-contain" />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
