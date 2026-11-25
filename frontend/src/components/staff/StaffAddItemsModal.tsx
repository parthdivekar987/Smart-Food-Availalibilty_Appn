import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, Minus, Plus, Loader2, ConciergeBell } from 'lucide-react';
import toast from 'react-hot-toast';
import { guestApi } from '../../api/guestApi';
import { sessionApi } from '../../api/sessionApi';
import { getApiErrorMessage } from '../../api/axiosClient';
import { formatCurrency } from '../../utils/formatCurrency';
import { getPhotoUrl } from '../../utils/photoUrl';

interface MenuOption {
  id: string;
  name: string;
  price: number;
  status: string;
  categoryId?: string;
  photos?: { url: string; isPrimary?: boolean }[];
}

interface Props {
  sessionId: string;
  tableName: string;
  onClose: () => void;
  onAdded?: () => void;
}

/**
 * Waiter/admin adds dishes to a seated table's order (e.g. the guest asked at the table).
 * Prices come from the server; the guest's phone gets a real-time notification.
 */
export const StaffAddItemsModal: React.FC<Props> = ({ sessionId, tableName, onClose, onAdded }) => {
  const [menu, setMenu] = useState<MenuOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadMenu = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res: any = await guestApi.getMenuItems({ page: 1, limit: 200 });
      setMenu(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Could not load the menu'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !submitting && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menu.filter((m) => !q || m.name.toLowerCase().includes(q));
  }, [menu, search]);

  const selected = menu.filter((m) => (qty[m.id] || 0) > 0);
  const total = selected.reduce((sum, m) => sum + m.price * qty[m.id], 0);
  const count = selected.reduce((n, m) => n + qty[m.id], 0);

  const change = (id: string, delta: number) =>
    setQty((prev) => ({ ...prev, [id]: Math.max(0, Math.min(50, (prev[id] || 0) + delta)) }));

  const submit = async () => {
    if (selected.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      await sessionApi.addItemsToTable(
        sessionId,
        selected.map((m) => ({ id: m.id, quantity: qty[m.id], note: note.trim() || undefined }))
      );
      toast.success(`Added ${count} item${count > 1 ? 's' : ''} to ${tableName}. The guest has been notified.`);
      onAdded?.();
      onClose();
    } catch (err: any) {
      const status = err?.response?.status;
      toast.error(getApiErrorMessage(err, 'Could not add items'));
      if (status === 409) {
        // Table already checked out: nothing more can be added
        onAdded?.();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => !submitting && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-items-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[92vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ConciergeBell size={20} />
            </span>
            <div>
              <h2 id="add-items-title" className="font-bold text-gray-900">Add items</h2>
              <p className="text-xs text-gray-500">{tableName} · guest will be notified</p>
            </div>
          </div>
          <button onClick={onClose} disabled={submitting} aria-label="Close" className="p-2 rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pt-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {loading ? (
            <div className="py-12 flex justify-center text-gray-400"><Loader2 className="animate-spin" /></div>
          ) : loadError ? (
            <div className="py-10 text-center">
              <p className="text-sm text-red-600">{loadError}</p>
              <button onClick={loadMenu} className="mt-3 text-sm font-semibold text-amber-700">Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">No dishes match “{search}”.</p>
          ) : (
            filtered.map((m) => {
              const unavailable = m.status !== 'AVAILABLE';
              const q = qty[m.id] || 0;
              const photo = m.photos?.find((p) => p.isPrimary)?.url || m.photos?.[0]?.url;
              return (
                <div key={m.id} className={`flex items-center gap-3 p-2 rounded-2xl border ${q > 0 ? 'border-amber-300 bg-amber-50/50' : 'border-gray-100'} ${unavailable ? 'opacity-50' : ''}`}>
                  <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                    {photo && <img src={getPhotoUrl(photo)} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                    <p className="text-xs text-gray-500">{unavailable ? 'Unavailable' : formatCurrency(m.price)}</p>
                  </div>
                  {!unavailable && (
                    <div className="flex items-center gap-1.5">
                      {q > 0 && (
                        <>
                          <button onClick={() => change(m.id, -1)} aria-label={`Remove one ${m.name}`} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Minus size={14} /></button>
                          <span className="w-6 text-center text-sm font-bold">{q}</span>
                        </>
                      )}
                      <button onClick={() => change(m.id, 1)} aria-label={`Add one ${m.name}`} className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center"><Plus size={14} /></button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="border-t px-5 py-4 space-y-3 bg-white">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 200))}
            placeholder="Kitchen note (optional), e.g. less spicy"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-amber-400"
          />
          <button
            onClick={submit}
            disabled={selected.length === 0 || submitting}
            className="w-full py-3 rounded-xl bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {selected.length === 0 ? 'Select dishes to add' : `Add ${count} item${count > 1 ? 's' : ''} · ${formatCurrency(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffAddItemsModal;
