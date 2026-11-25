import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Activity, Armchair, ShoppingCart, ClipboardList, ConciergeBell, Receipt, CreditCard, LogOut,
  Clock, Users, X, Loader2, RefreshCw, Plus, Wifi, WifiOff, History,
} from 'lucide-react';
import { sessionApi, LiveSession, SessionEvent } from '../../api/sessionApi';
import { getApiErrorMessage } from '../../api/axiosClient';
import { useSocketStore } from '../../store/useSocketStore';
import { formatCurrency } from '../../utils/formatCurrency';
import StaffAddItemsModal from '../../components/staff/StaffAddItemsModal';

const EVENT_STYLE: Record<SessionEvent['type'], { icon: React.ElementType; color: string; label: string }> = {
  SESSION_STARTED: { icon: Armchair, color: 'bg-sky-100 text-sky-700', label: 'Seated' },
  CART_ITEM_ADDED: { icon: ShoppingCart, color: 'bg-gray-100 text-gray-600', label: 'Cart' },
  ORDER_PLACED: { icon: ClipboardList, color: 'bg-orange-100 text-orange-700', label: 'Order' },
  STAFF_ADDED_ITEMS: { icon: ConciergeBell, color: 'bg-amber-100 text-amber-700', label: 'Staff' },
  BILL_REQUESTED: { icon: Receipt, color: 'bg-violet-100 text-violet-700', label: 'Bill' },
  PAYMENT_COMPLETED: { icon: CreditCard, color: 'bg-emerald-100 text-emerald-700', label: 'Paid' },
  SESSION_CLOSED: { icon: LogOut, color: 'bg-gray-200 text-gray-700', label: 'Closed' },
};

const timeAgo = (iso: string, now: number) => {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
};

const duration = (iso: string, now: number) => {
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

const EventRow: React.FC<{ e: SessionEvent; now: number; showTable?: boolean }> = ({ e, now, showTable }) => {
  const style = EVENT_STYLE[e.type] || EVENT_STYLE.CART_ITEM_ADDED;
  const Icon = style.icon;
  return (
    <li className="flex gap-2.5">
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${style.color}`}>
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-800 leading-snug">
          {showTable && e.tableName && <span className="font-bold">{e.tableName}: </span>}
          {e.message}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {e.actor === 'STAFF' && e.actorName ? `${e.actorName} · ` : e.actor === 'GUEST' ? 'Guest · ' : ''}
          {timeAgo(e.createdAt, now)}
        </p>
      </div>
    </li>
  );
};

/**
 * Owner/manager view of every seated table in real time:
 * who is seated, what they add to their cart, what they order, staff additions, bill requests and checkout.
 */
export default function AdminLiveTablesPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [feed, setFeed] = useState<SessionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [timeline, setTimeline] = useState<{ session: LiveSession; events: SessionEvent[] | null } | null>(null);
  const [addItemsFor, setAddItemsFor] = useState<LiveSession | null>(null);
  const socket = useSocketStore((s) => s.socket);
  const isConnected = useSocketStore((s) => s.isConnected);
  const joinRoom = useSocketStore((s) => s.joinRoom);
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionsRef = useRef<LiveSession[]>([]);
  sessionsRef.current = sessions;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await sessionApi.getLiveSessions();
      const list = res.data || [];
      setSessions(list);
      setError(null);
      if (!silent) {
        // Seed the global feed from each table's recent activity
        const merged = list
          .flatMap((s) => s.events.map((e) => ({ ...e, tableName: s.table.name })))
          .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
          .slice(0, 40);
        setFeed(merged);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load live tables'));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  /** Coalesce bursts of events into one refresh */
  const scheduleRefetch = useCallback(() => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(() => load(true), 600);
  }, [load]);

  useEffect(() => {
    load();
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      clearInterval(tick);
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
    };
  }, [load]);

  // Live updates
  useEffect(() => {
    joinRoom({ role: 'ADMIN' });
    if (!socket) return;

    const onActivity = (e: SessionEvent) => {
      setFeed((prev) => [e, ...prev].slice(0, 60));
      setNow(Date.now());
      const known = sessionsRef.current.some((s) => s.id === e.tableSessionId);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === e.tableSessionId ? { ...s, lastActivityAt: e.createdAt, events: [e, ...s.events].slice(0, 12) } : s
        )
      );
      // New table or an order change: refresh the summary numbers
      if (!known || e.type !== 'CART_ITEM_ADDED') scheduleRefetch();
    };
    const onClosed = (data: { tableSessionId: string; tableName: string; reason: string }) => {
      setSessions((prev) => prev.filter((s) => s.id !== data.tableSessionId));
      setTimeline((t) => (t?.session.id === data.tableSessionId ? null : t));
      setAddItemsFor((a) => (a?.id === data.tableSessionId ? null : a));
      toast.success(`${data.tableName} checked out${data.reason === 'PAID' ? ' — bill paid' : ''}`);
    };

    socket.on('session_activity', onActivity);
    socket.on('table_session_closed', onClosed);
    socket.on('new_order', scheduleRefetch);
    socket.on('order_status_change', scheduleRefetch);
    socket.on('bill_requested', scheduleRefetch);
    socket.on('connect', scheduleRefetch); // catch up on anything missed while offline
    return () => {
      socket.off('session_activity', onActivity);
      socket.off('table_session_closed', onClosed);
      socket.off('new_order', scheduleRefetch);
      socket.off('order_status_change', scheduleRefetch);
      socket.off('bill_requested', scheduleRefetch);
      socket.off('connect', scheduleRefetch);
    };
  }, [socket, joinRoom, scheduleRefetch]);

  const openTimeline = async (session: LiveSession) => {
    setTimeline({ session, events: null });
    try {
      const res = await sessionApi.getSessionEvents(session.id);
      setTimeline((t) => (t?.session.id === session.id ? { session, events: res.data || [] } : t));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not load the timeline'));
      setTimeline(null);
    }
  };

  const stats = useMemo(() => ({
    tables: sessions.length,
    items: sessions.reduce((n, s) => n + (s.order?.itemCount || 0), 0),
    running: sessions.reduce((n, s) => n + (s.order?.totalAmount || 0), 0),
    bills: sessions.filter((s) => s.order?.billRequested).length,
  }), [sessions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <Activity className="text-orange-500" size={24} /> Live Tables
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Every seated table and what is happening there, in real time.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isConnected ? 'Live' : 'Reconnecting…'}
          </span>
          <button onClick={() => load()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Seated tables', value: stats.tables, icon: Armchair },
          { label: 'Items ordered', value: stats.items, icon: ClipboardList },
          { label: 'Running total', value: formatCurrency(stats.running), icon: CreditCard },
          { label: 'Bills requested', value: stats.bills, icon: Receipt, highlight: stats.bills > 0 },
        ].map(({ label, value, icon: Icon, highlight }) => (
          <div key={label} className={`p-4 rounded-2xl border bg-white ${highlight ? 'border-violet-300 ring-2 ring-violet-100' : 'border-gray-100'}`}>
            <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold"><Icon size={14} /> {label}</div>
            <p className="mt-1.5 text-xl font-black text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-gray-400"><Loader2 className="animate-spin" size={28} /></div>
      ) : error ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-red-100">
          <p className="text-red-600 font-semibold">{error}</p>
          <button onClick={() => load()} className="mt-3 text-sm font-bold text-orange-600">Try again</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
          {/* Table cards */}
          {sessions.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
              <Armchair className="mx-auto text-gray-300" size={40} />
              <p className="mt-3 font-bold text-gray-700">No tables are seated right now</p>
              <p className="text-sm text-gray-500">New guests appear here the moment they scan a table QR code.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
              {sessions.map((s) => (
                <div key={s.id} className={`bg-white rounded-2xl border shadow-sm flex flex-col ${s.order?.billRequested ? 'border-violet-300' : 'border-gray-100'}`}>
                  <div className="p-4 border-b border-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-black text-gray-900">{s.table.name}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1"><Clock size={12} /> {duration(s.startedAt, now)}</span>
                          <span className="flex items-center gap-1"><Users size={12} /> {s.table.capacity} seats</span>
                        </p>
                        {s.waiter && <p className="text-[11px] text-gray-400 mt-1">Server: {s.waiter.fullName}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {s.order ? (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">{s.order.status}</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">Browsing</span>
                        )}
                        {s.order?.billRequested && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-violet-600 text-white animate-pulse">Bill requested</span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                      <span className="text-xs text-gray-500">{s.order ? `${s.order.itemCount} item${s.order.itemCount === 1 ? '' : 's'} ordered` : 'No order yet'}</span>
                      <span className="text-lg font-black text-gray-900">{formatCurrency(s.order?.totalAmount || 0)}</span>
                    </div>
                  </div>

                  <ul className="p-4 space-y-3 flex-1">
                    {s.events.slice(0, 4).map((e) => <EventRow key={e.id} e={e} now={now} />)}
                    {s.events.length === 0 && <li className="text-xs text-gray-400">No activity yet.</li>}
                  </ul>

                  <div className="p-3 border-t border-gray-50 flex gap-2">
                    <button onClick={() => openTimeline(s)} className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5">
                      <History size={14} /> Timeline
                    </button>
                    <button onClick={() => setAddItemsFor(s)} className="flex-1 py-2 rounded-xl bg-gray-900 hover:bg-black text-xs font-bold text-white flex items-center justify-center gap-1.5">
                      <Plus size={14} /> Add items
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Global live feed */}
          <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm xl:sticky xl:top-4">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-black text-gray-800">Live activity</h2>
            </div>
            <ul className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {feed.length === 0 ? (
                <li className="text-xs text-gray-400">Activity from all tables will stream here.</li>
              ) : (
                feed.map((e) => <EventRow key={e.id} e={e} now={now} showTable />)
              )}
            </ul>
          </aside>
        </div>
      )}

      {/* Timeline drawer */}
      {timeline && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={() => setTimeline(null)}>
          <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-black text-gray-900">{timeline.session.table.name}</h2>
                <p className="text-xs text-gray-500">Seated {duration(timeline.session.startedAt, now)} · full timeline</p>
              </div>
              <button onClick={() => setTimeline(null)} aria-label="Close" className="p-2 rounded-full hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {timeline.events === null ? (
                <div className="py-16 flex justify-center text-gray-400"><Loader2 className="animate-spin" /></div>
              ) : (
                <ol className="relative border-l border-gray-200 ml-3 space-y-5">
                  {timeline.events.map((e) => {
                    const style = EVENT_STYLE[e.type] || EVENT_STYLE.CART_ITEM_ADDED;
                    const Icon = style.icon;
                    return (
                      <li key={e.id} className="ml-6">
                        <span className={`absolute -left-3.5 w-7 h-7 rounded-full flex items-center justify-center ring-4 ring-white ${style.color}`}>
                          <Icon size={13} />
                        </span>
                        <p className="text-sm text-gray-800">{e.message}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {e.actor === 'STAFF' && e.actorName ? ` · ${e.actorName}` : e.actor === 'GUEST' ? ' · Guest' : ''}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}

      {addItemsFor && (
        <StaffAddItemsModal
          sessionId={addItemsFor.id}
          tableName={addItemsFor.table.name}
          onClose={() => setAddItemsFor(null)}
          onAdded={() => load(true)}
        />
      )}
    </div>
  );
}
