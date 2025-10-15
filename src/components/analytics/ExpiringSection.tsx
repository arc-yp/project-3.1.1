import React from 'react';
import { formatDate } from '../../utils/helpers';
import { ReviewCard } from '../../types';

export interface ExpiringCardRow extends ReviewCard {}

interface ExpiringSectionProps {
  title: React.ReactNode;
  rows: ExpiringCardRow[];
  emptyMessage: string;
  accentClass: string; // e.g. text-amber-300
  remainingBadgeClass: string; // e.g. bg-blue-500/10 text-blue-200 border-blue-400/20
  expiredBadgeClass?: string; // optional class when expired
  formatRemaining: (card: ReviewCard) => string;
  showIndexLimit?: number; // display top N
  id?: string;
}

export const ExpiringSection: React.FC<ExpiringSectionProps> = ({
  title,
  rows,
  emptyMessage,
  accentClass,
  remainingBadgeClass,
  expiredBadgeClass = 'bg-red-500/20 text-red-300 border-red-400/30',
  formatRemaining,
  showIndexLimit,
  id,
}) => {
  const list = showIndexLimit ? rows.slice(0, showIndexLimit) : rows;
  return (
    <section aria-labelledby={id} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 rounded-lg">
      <h2 id={id} className={`text-xl font-semibold text-white mb-4 flex items-center ${accentClass}`}>
        {title}
      </h2>
      <div className="bg-white/10 border border-white/20 rounded-xl overflow-hidden" role="table" aria-label={typeof title === 'string' ? title : undefined}>
        <div role="rowgroup">
          <div className="grid grid-cols-12 gap-0 px-4 py-2 text-slate-300 text-xs border-b border-white/10" role="row">
            <div className="col-span-1" role="columnheader">#</div>
            <div className="col-span-4" role="columnheader">Business</div>
            <div className="col-span-3" role="columnheader">Slug</div>
            <div className="col-span-2" role="columnheader">Ends</div>
            <div className="col-span-2" role="columnheader">Remaining</div>
          </div>
        </div>
        <div role="rowgroup">
          {list.length === 0 ? (
            <div className="p-4 text-slate-400 text-sm" role="row">
              <div role="cell">{emptyMessage}</div>
            </div>
          ) : (
            list.map((c, idx) => {
              const remaining = formatRemaining(c);
              const isExpired = remaining === 'Expired';
              return (
                <div key={c.id} className="grid grid-cols-12 gap-0 px-4 py-3 text-slate-200 border-t border-white/5 hover:bg-white/5" role="row">
                  <div className="col-span-1 font-mono text-xs" role="cell">{idx + 1}</div>
                  <div className="col-span-4" role="cell">
                    <div className="font-medium text-white text-sm line-clamp-1" title={c.businessName}>{c.businessName}</div>
                    <div className="text-xs text-slate-400">{c.category} • {c.type}</div>
                  </div>
                  <div className="col-span-3 font-mono text-[11px]" role="cell">/{c.slug}</div>
                  <div className="col-span-2 text-xs text-slate-300" role="cell">{c.expiresAt ? formatDate(c.expiresAt) : '—'}</div>
                  <div className="col-span-2 text-xs" role="cell">
                    <span className={`px-2 py-1 rounded-full border text-[10px] ${isExpired ? expiredBadgeClass : remainingBadgeClass}`}>{remaining}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default ExpiringSection;
