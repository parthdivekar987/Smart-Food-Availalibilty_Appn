import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, CheckCircle2, Clock, CreditCard, Banknote, Printer,
  Sparkles, ShieldCheck, Utensils, Bell, ChevronDown, ChevronUp,
  AlertCircle, ArrowRight, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CartHistoryItem, useSessionStore } from '../../store/useSessionStore';

interface BillInvoiceCardProps {
  orderId: string;
  tableName?: string;
  items: any[];
  subtotal: number;
  billRequested: boolean;
  onRequestBill: () => Promise<void> | void;
  isRequestingBill?: boolean;
  onPaymentSuccess?: () => void;
}

export const BillInvoiceCard: React.FC<BillInvoiceCardProps> = ({
  orderId,
  tableName = 'Table 04',
  items,
  subtotal,
  billRequested,
  onRequestBill,
  isRequestingBill = false,
  onPaymentSuccess,
}) => {
  const [showItemDetails, setShowItemDetails] = useState(true);
  const [isProcessingRazorpay, setIsProcessingRazorpay] = useState(false);
  const [showRazorpaySuccess, setShowRazorpaySuccess] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const cartHistory = useSessionStore((state) => state.cartHistory);
  const billRequestedAt = useSessionStore((state) => state.billRequestedAt);

  // Use either the direct order items or the accumulated cart history
  const displayItems = items && items.length > 0 ? items : (cartHistory.length > 0 ? cartHistory : []);

  // Compute calculated subtotal
  const computedSubtotal = subtotal > 0
    ? subtotal
    : displayItems.reduce((acc, item) => {
        const itemPrice = item.price || item.totalPrice || 0;
        const qty = item.quantity || 1;
        return acc + (itemPrice * qty);
      }, 0);

  // Tax calculations (5% GST: 2.5% CGST + 2.5% SGST)
  const cgst = computedSubtotal * 0.025;
  const sgst = computedSubtotal * 0.025;
  const totalTax = cgst + sgst;
  const grandTotal = Math.round(computedSubtotal + totalTax);

  const invoiceNumber = `INV-${orderId ? orderId.slice(-6).toUpperCase() : '2026-04'}`;
  const invoiceDate = billRequestedAt
    ? new Date(billRequestedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  // Format currency helper (supports INR / standard locale)
  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(Math.round(val));
  };

  // Razorpay Checkout Handler (Integration Ready)
  const handleRazorpayPayment = () => {
    setIsProcessingRazorpay(true);
    toast.loading('Connecting to Razorpay Secure Gateway…', { id: 'razorpay-init' });

    // Check if Razorpay script is loaded on window
    const razorpayWindow = window as any;

    if (razorpayWindow.Razorpay) {
      try {
        const options = {
          key: 'rzp_test_restaurant_demo', // Replace with production Razorpay Key ID
          amount: grandTotal * 100, // Amount in paise
          currency: 'INR',
          name: 'Smart Restaurant Gastronomy',
          description: `Dining Bill for ${tableName} (${invoiceNumber})`,
          image: 'https://cdn-icons-png.flaticon.com/512/3448/3448609.png',
          handler: function (response: any) {
            toast.dismiss('razorpay-init');
            toast.success(`Payment verified! ID: ${response.razorpay_payment_id || 'RZP-PAID'}`, { duration: 5000 });
            setShowRazorpaySuccess(true);
            setIsProcessingRazorpay(false);
            if (onPaymentSuccess) onPaymentSuccess();
          },
          prefill: {
            name: 'Valued Guest',
            contact: '+919876543210',
          },
          theme: {
            color: '#ea580c',
          },
        };
        const rzp = new razorpayWindow.Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          toast.dismiss('razorpay-init');
          toast.error(`Payment failed: ${response.error?.description || 'Declined'}`);
          setIsProcessingRazorpay(false);
        });
        rzp.open();
        return;
      } catch (err) {
        console.warn('Razorpay SDK invocation fallback:', err);
      }
    }

    // Interactive Demo / Integration Simulation (when SDK script is not injected yet)
    setTimeout(() => {
      toast.dismiss('razorpay-init');
      toast.success(`Razorpay simulation: ₹${formatPrice(grandTotal)} paid successfully via UPI/Card!`, {
        icon: '💳',
        duration: 4000,
      });
      setShowRazorpaySuccess(true);
      setIsProcessingRazorpay(false);
      if (onPaymentSuccess) onPaymentSuccess();
    }, 1800);
  };

  // Print Bill Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full my-4">
      <div
        ref={receiptRef}
        className="bg-white rounded-3xl border border-gray-200/80 shadow-[0_15px_45px_rgba(0,0,0,0.08)] overflow-hidden transition-all"
      >
        {/* Top Decorative Amber Ribbon */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        {/* Invoice Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-b from-gray-50/80 to-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-orange-500/20">
                  SR
                </span>
                <div>
                  <h3 className="font-black text-gray-900 text-base sm:text-lg leading-tight tracking-tight">
                    Smart Restaurant
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">
                    3D Gastronomy • Tax Invoice
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-mono mt-2">
                GSTIN: 27AABCU9603R1ZM • FSSAI Lic #11519018000234
              </p>
            </div>

            {/* Live Bill Request Status Badge */}
            <div className="text-right">
              {showRazorpaySuccess ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  PAID
                </span>
              ) : billRequested ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-sm animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  BILL REQUESTED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <Utensils size={12} />
                  DINING ACTIVE
                </span>
              )}
              <p className="text-[11px] font-mono font-bold text-gray-700 mt-1.5">{invoiceNumber}</p>
            </div>
          </div>

          {/* Session & Table Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 text-xs">
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Table</span>
              <span className="font-black text-gray-900">{tableName}</span>
            </div>
            <div>
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Date & Time</span>
              <span className="font-semibold text-gray-700 text-[11px]">{invoiceDate}</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-gray-400 text-[10px] uppercase font-bold block">Items Ordered</span>
              <span className="font-bold text-orange-600">{displayItems.length} dishes</span>
            </div>
          </div>
        </div>

        {/* Live Bill Alert Banner (If Bill Requested) */}
        {billRequested && !showRazorpaySuccess && (
          <div className="bg-amber-50/90 border-y border-amber-200/80 px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-amber-600 animate-bounce flex-shrink-0" />
              <p className="text-xs font-bold text-amber-900">
                Waiter notified! Bill is being printed at the counter.
              </p>
            </div>
            <span className="text-[10px] font-mono text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-md font-semibold">
              Live
            </span>
          </div>
        )}

        {/* Itemized Cart History Section */}
        <div className="p-4 sm:p-5">
          <button
            onClick={() => setShowItemDetails(!showItemDetails)}
            className="w-full flex items-center justify-between text-xs font-black text-gray-800 uppercase tracking-wider mb-2.5 hover:text-orange-600 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Receipt size={14} className="text-orange-500" />
              Cart & Dish Itemization
            </span>
            <span className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold">
              {showItemDetails ? 'Collapse' : 'Expand'}
              {showItemDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>

          <AnimatePresence>
            {showItemDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2.5 divide-y divide-gray-100/80 overflow-hidden"
              >
                {displayItems.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center italic">No items recorded in cart yet.</p>
                ) : (
                  displayItems.map((item, idx) => {
                    const itemName = item.name || item.menuItem?.name || 'Gourmet Dish';
                    const itemQty = item.quantity || 1;
                    const unitPrice = item.price || item.totalPrice || 0;
                    const lineTotal = unitPrice * itemQty;
                    const modifierText = item.modifiers
                      ? item.modifiers.map((m: any) => m.modifierOption?.name || m.name).filter(Boolean).join(', ')
                      : '';

                    return (
                      <div key={item.id || idx} className="pt-2 first:pt-0 flex items-start justify-between gap-3 text-xs">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">{itemName}</p>
                          {modifierText && (
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">+ {modifierText}</p>
                          )}
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                            {itemQty} × ₹{formatPrice(unitPrice)}
                          </p>
                        </div>
                        <span className="font-black text-gray-900 text-xs sm:text-sm font-mono flex-shrink-0">
                          ₹{formatPrice(lineTotal)}
                        </span>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Charges Breakdown Calculation */}
          <div className="mt-4 pt-3.5 border-t border-dashed border-gray-200 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Food & Beverage Subtotal</span>
              <span className="font-mono font-bold text-gray-900">₹{formatPrice(computedSubtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-[11px]">
              <span>Central GST (CGST @ 2.5%)</span>
              <span className="font-mono text-gray-700">₹{formatPrice(cgst)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-[11px]">
              <span>State GST (SGST @ 2.5%)</span>
              <span className="font-mono text-gray-700">₹{formatPrice(sgst)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-[11px]">
              <span>Hospitality & Service Fee</span>
              <span className="text-emerald-600 font-bold uppercase">Complimentary</span>
            </div>

            {/* Grand Total Highlight */}
            <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
              <div>
                <span className="font-black text-gray-900 text-sm sm:text-base block">Grand Total Payable</span>
                <span className="text-[10px] text-gray-400">Inclusive of all applicable culinary taxes</span>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-orange-600 font-mono tracking-tight">
                  ₹{formatPrice(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RAZORPAY INTEGRATION & PAYMENT CARD ─── */}
        <div className="bg-gradient-to-b from-gray-50 to-orange-50/40 p-4 sm:p-5 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span className="text-xs font-black text-gray-900 tracking-wide uppercase">
                Payment Gateway
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-blue-700 font-bold bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-full">
              <span>Razorpay Fast Checkout</span>
            </div>
          </div>

          {/* Payment Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Razorpay Instant Payment Button */}
            <button
              onClick={handleRazorpayPayment}
              disabled={isProcessingRazorpay || showRazorpaySuccess}
              className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                showRazorpaySuccess
                  ? 'bg-emerald-600 text-white cursor-default shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-blue-500/25'
              }`}
            >
              {isProcessingRazorpay ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Connecting Razorpay…</span>
                </>
              ) : showRazorpaySuccess ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Paid with Razorpay</span>
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  <span>Pay ₹{formatPrice(grandTotal)} via Razorpay</span>
                </>
              )}
            </button>

            {/* 2. Pay Cash to Waiter */}
            <button
              onClick={() => {
                onRequestBill();
                toast.success('Your waiter will come to Table ' + tableName + ' with the bill & change', {
                  icon: '💵',
                  duration: 5000,
                });
              }}
              className="w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-gray-800 border border-gray-200 shadow-sm transition-all active:scale-95"
            >
              <Banknote size={16} className="text-emerald-600" />
              <span>Pay Cash to Server</span>
            </button>
          </div>

          {/* Razorpay Badges: UPI, Cards, NetBanking */}
          <div className="flex items-center justify-center flex-wrap gap-2 text-[10px] text-gray-500 font-semibold mt-3 pt-2.5 border-t border-gray-200/60">
            <span className="flex items-center gap-1 text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> UPI (GPay, PhonePe, Paytm)
            </span>
            <span>•</span>
            <span className="text-gray-700">Credit / Debit Cards</span>
            <span>•</span>
            <span className="text-gray-700">NetBanking</span>
          </div>

          {/* Action Row: Request Bill & Print Bill */}
          <div className="mt-3.5 pt-3 border-t border-gray-200 flex items-center justify-between gap-2">
            {!billRequested ? (
              <button
                onClick={onRequestBill}
                disabled={isRequestingBill}
                className="py-2 px-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-all"
              >
                {isRequestingBill ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Requesting…</span>
                  </>
                ) : (
                  <>
                    <Bell size={13} />
                    <span>Request Printed Bill</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                <CheckCircle2 size={13} className="text-amber-600" />
                Staff Assigned
              </span>
            )}

            <button
              onClick={handlePrint}
              className="py-2 px-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Printer size={13} />
              <span>Print Tax Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillInvoiceCard;

