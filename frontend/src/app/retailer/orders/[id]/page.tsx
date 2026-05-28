'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PresignedImage from '@/app/components/PresignedProductImage';
import { orderService, OrderDetail } from '@/services/order.service';
import { usePodUrl } from '@/hooks/usePresignedUrl';

export type EscrowState = 'INITIATED' | 'LOCKED' | 'DELIVERED' | 'RELEASED' | 'BLOCKED';

const LEDGER_STEPS: EscrowState[] = ['INITIATED', 'LOCKED', 'DELIVERED', 'RELEASED'];

const stepMeta: Record<EscrowState, { label: string; icon: JSX.Element }> = {
  INITIATED: { label: 'Initiated',    icon: <InitiatedIcon /> },
  LOCKED:    { label: 'Funds Locked', icon: <LockedIcon /> },
  DELIVERED: { label: 'Delivered',    icon: <DeliveredIcon /> },
  RELEASED:  { label: 'Released',     icon: <ReleasedIcon /> },
  BLOCKED:   { label: 'Blocked',      icon: <BlockedIcon /> },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [podOpen, setPodOpen] = useState(false);

  const shouldLoadPod =
    order?.transaction?.status === 'RELEASED' &&
    order.transaction.proofOfDelivery;

  const { url: podUrl, loadingpod } = usePodUrl(
    shouldLoadPod ? order.transaction?.id : undefined
  );

  useEffect(() => {
    orderService
      .getOrder(id)
      .then(setOrder)
      .catch(() => router.push('/retailer/orders'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const tx            = order.transaction;
  const currentStatus = tx?.status as EscrowState | undefined;
  const isBlocked     = currentStatus === 'BLOCKED';
  const isReleased    = currentStatus === 'RELEASED';

  const currentStepIndex =
    currentStatus && !isBlocked
      ? LEDGER_STEPS.indexOf(currentStatus)
      : -1;

  // The status the order was in before it got BLOCKED
  const prevStatusBeforeBlock = isBlocked
    ? (tx?.ledgerEntries
        .slice()
        .reverse()
        .find((e) => e.currentStatus === 'BLOCKED')?.previousStatus as EscrowState | undefined)
    : undefined;

  return (
    <div className="p-6 pt-16 max-w-6xl mx-auto">

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/farmer/orders"
          className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          ← Back to Orders
        </Link>
        <span className="text-gray-200">|</span>
        <span className="text-sm font-mono text-gray-500">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </span>
        {currentStatus && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isBlocked
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-amber-50 text-amber-600 border border-amber-100'
            }`}
          >
            {stepMeta[currentStatus]?.label}
          </span>
        )}
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Transaction Details</h1>

      {/* ── Blocked alert banner ─────────────────────────────────────────────── */}
      {isBlocked && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <span className="mt-0.5 text-red-500 flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 15a1 1 0 110-2 1 1 0 010 2zm1-4a1 1 0 01-2 0V7a1 1 0 012 0v6z" />
            </svg>
          </span>
          <div>
            <p className="font-semibold text-red-700 text-sm">
              This order is currently blocked by an administrator.
            </p>
            {prevStatusBeforeBlock && (
              <p className="text-red-500 text-xs mt-0.5">
                It was in{' '}
                <span className="font-semibold">
                  {stepMeta[prevStatusBeforeBlock]?.label}
                </span>{' '}
                state before being blocked. Please contact support for more information.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Main grid ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Transaction Ledger ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <LedgerIcon /> Transaction Ledger
          </h2>

          <div className="relative">
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />

            <div className="space-y-6">

              {/* Blocked sub-banner inside timeline */}
              {isBlocked && (
                <div className="mb-2 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                  <span className="text-red-500">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" />
                    </svg>
                  </span>
                  <span className="text-xs font-semibold text-red-600">
                    Order is currently blocked — lifecycle is paused
                  </span>
                </div>
              )}

              {LEDGER_STEPS.map((step, idx) => {
                const ledgerEntry = tx?.ledgerEntries.find(
                  (e) => e.currentStatus === step
                );
                const isDone = !isBlocked && idx <= currentStepIndex;

                return (
                  <div key={step} className="flex gap-4 relative">
                    {/* Step circle */}
                    <div
                      className={`w-8 h-8 rounded-full z-10 flex items-center justify-center flex-shrink-0
                        ${
                          isDone
                            ? 'bg-primary text-white'
                            : isBlocked
                            ? 'bg-white border-2 border-red-200 text-red-300'
                            : 'bg-white border-2 border-gray-200 text-gray-400'
                        }`}
                    >
                      {stepMeta[step].icon}
                    </div>

                    {/* Step content */}
                    <div className="pt-1 flex-1">
                      <div className="flex justify-between items-center">
                        <span
                          className={`font-semibold text-sm ${
                            isDone ? 'text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {stepMeta[step].label}
                        </span>

                        {step === 'RELEASED' && isReleased ? (
                          <button
                            onClick={() => setPodOpen(true)}
                            className="text-xs px-3 py-1 rounded-lg bg-white text-primary hover:bg-gray-50 border border-gray-200"
                          >
                            Show POD
                          </button>
                        ) : ledgerEntry ? (
                          <span className="font-bold text-primary text-sm">
                            ${Number(ledgerEntry.amount).toFixed(2)}
                          </span>
                        ) : null}
                      </div>

                      {ledgerEntry ? (
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(ledgerEntry.timestamp).toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-300 mt-1">Pending…</div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Extra BLOCKED step — only shown when actually blocked */}
              {isBlocked && (
                <div className="flex gap-4 relative">
                  <div className="w-8 h-8 rounded-full z-10 flex items-center justify-center flex-shrink-0 bg-red-500 text-white">
                    <BlockedIcon />
                  </div>
                  <div className="pt-1 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-red-600">
                        Blocked by Admin
                      </span>
                    </div>
                    {tx?.ledgerEntries
                      .slice()
                      .reverse()
                      .find((e) => e.currentStatus === 'BLOCKED') && (
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(
                          tx!.ledgerEntries
                            .slice()
                            .reverse()
                            .find((e) => e.currentStatus === 'BLOCKED')!.timestamp,
                        ).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ── Order Summary ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <OrderIcon /> Order Summary
          </h2>

          <div className="space-y-4 mb-6">
            {order.orderItems.map((item) => {
              const image    = item.product.images?.[0];
              const subtotal = Number(item.unitPriceAtOrder) * item.quantity;
              return (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                    {image ? (
                      <PresignedImage
                        productId={item.product.id}
                        imageId={image.id}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-gray-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{item.product.name}</p>
                    <p className="text-xs text-gray-400">
                      Qty: {item.quantity} × ${Number(item.unitPriceAtOrder).toFixed(2)}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-800 text-sm">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-100 pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">Total Amount</span>
              <span className="font-bold text-[#2B6E44] text-lg">
                ${Number(order.totalAmount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Logistics */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TruckIcon /> Logistics Details
            </h3>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">
                Delivery Address
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {order.shippingAddress}
              </p>
            </div>
            {order.note && (
              <div className="mt-3">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Note</p>
                <p className="text-sm text-gray-600 italic">{order.note}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── POD Modal ─────────────────────────────────────────────────────────── */}
      {podOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">
                Proof of Delivery{' '}
                <span className="text-gray-400">#{order.id.slice(0, 8)}</span>
              </h3>
              <button
                onClick={() => setPodOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="bg-gray-100 h-[400px] flex items-center justify-center rounded-lg">
              {loadingpod ? (
                <div className="text-gray-500 text-sm">Loading…</div>
              ) : podUrl ? (
                <img
                  src={podUrl}
                  className="w-full h-full object-contain"
                  alt="Proof of Delivery"
                />
              ) : (
                <p className="text-gray-500 text-sm">No proof of delivery available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function InitiatedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function LockedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
      <path d="M17 10V8a5 5 0 00-10 0v2H5v10h14V10h-2zm-8 0V8a3 3 0 016 0v2H9z" />
    </svg>
  );
}

function DeliveredIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
      <path d="M3 7h13v8H3z" />
      <path d="M16 10h3l2 3v2h-5z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}

function ReleasedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
      <path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z" />
    </svg>
  );
}

function BlockedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 15a1 1 0 110-2 1 1 0 010 2zm1-4a1 1 0 01-2 0V7a1 1 0 012 0v6z" />
    </svg>
  );
}

function LedgerIcon() {
  return (
    <svg fill="#7a7575" height="30px" width="30px" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 511.999 511.999">
      <g>
        <path d="M438.052,141.469c4.329,0,7.837-3.508,7.837-7.837V68.723c0-26.756-21.768-48.524-48.525-48.524H290.442 C283.668,8.156,270.772,0,255.999,0c-14.773,0-27.669,8.156-34.443,20.198H114.635c-26.757,0-48.525,21.768-48.525,48.524v394.742 c0,26.762,21.768,48.536,48.525,48.536h282.728c26.757,0,48.525-21.774,48.525-48.536V167.832c0-4.329-3.508-7.837-7.837-7.837 s-7.837,3.508-7.837,7.837v295.633c0,18.121-14.737,32.862-32.852,32.862H114.635c-18.114,0-32.852-14.741-32.852-32.862V68.723 c0-18.114,14.737-32.851,32.852-32.851h102.039c-0.11,1.195-0.173,2.403-0.173,3.627v5.862h-15.503 c-15.848,0-28.741,12.894-28.741,28.742v1.319h-37.184c-11.281,0-20.458,9.173-20.458,20.449v144.624 c0,4.329,3.508,7.837,7.837,7.837c4.329,0,7.837-3.508,7.837-7.837V95.869c0-2.634,2.146-4.775,4.785-4.775h37.185v8.782 c0,4.329,3.508,7.837,7.837,7.837h151.81c4.329,0,7.837-3.508,7.837-7.837v-8.782h37.185c2.638,0,4.785,2.142,4.785,4.775v351.41 c0,2.634-2.146,4.775-4.785,4.775H135.073c-2.638,0-4.785-2.142-4.785-4.775v-170.58c0-4.329-3.508-7.837-7.837-7.837 c-4.329,0-7.837,3.508-7.837,7.837v170.58c0,11.276,9.177,20.449,20.458,20.449h241.852c11.281,0,20.458-9.173,20.458-20.449 V95.869c0-11.275-9.177-20.449-20.458-20.449h-37.185v-1.319c0-15.848-12.893-28.742-28.741-28.742h-15.503v-5.862 c0-1.224-0.064-2.432-0.173-3.627h102.04c18.114,0,32.852,14.737,32.852,32.851v64.909 C430.215,137.96,433.724,141.469,438.052,141.469z M232.175,39.498c0-13.136,10.688-23.825,23.825-23.825 c13.136,0,23.825,10.688,23.825,23.825v5.862h-47.649V39.498z M311,61.034c7.206,0,13.069,5.862,13.069,13.069V92.04H187.931 V74.102c0-7.206,5.862-13.069,13.068-13.069H311z"/>
        <path d="M179.43,159.992c-15.288,0-27.725,12.437-27.725,27.726s12.437,27.726,27.725,27.726 c15.289,0,27.726-12.437,27.726-27.726S194.719,159.992,179.43,159.992z M179.43,199.77c-6.646,0-12.052-5.407-12.052-12.053 s5.405-12.053,12.052-12.053c6.646,0,12.053,5.407,12.053,12.053S186.076,199.77,179.43,199.77z"/>
        <path d="M179.43,243.85c-15.288,0-27.725,12.437-27.725,27.726s12.437,27.726,27.725,27.726c15.289,0,27.726-12.437,27.726-27.726 C207.157,256.287,194.719,243.85,179.43,243.85z M179.43,283.629c-6.646,0-12.052-5.407-12.052-12.053s5.405-12.053,12.052-12.053 c6.646,0,12.053,5.407,12.053,12.053C191.483,278.222,186.076,283.629,179.43,283.629z"/>
        <path d="M179.43,327.71c-15.288,0-27.725,12.437-27.725,27.725c0,15.289,12.437,27.726,27.725,27.726 c15.289,0,27.726-12.437,27.726-27.726C207.157,340.148,194.719,327.71,179.43,327.71z M179.43,367.489 c-6.646,0-12.052-5.407-12.052-12.053s5.405-12.052,12.052-12.052c6.646,0,12.053,5.406,12.053,12.052 C191.483,362.081,186.076,367.489,179.43,367.489z"/>
        <path d="M340.023,179.88H237.328c-4.329,0-7.837,3.508-7.837,7.837c0,4.329,3.508,7.837,7.837,7.837h102.695 c4.329,0,7.837-3.508,7.837-7.837C347.86,183.388,344.352,179.88,340.023,179.88z"/>
        <path d="M340.023,263.74H237.328c-4.329,0-7.837,3.508-7.837,7.837c0,4.329,3.508,7.837,7.837,7.837h102.695 c4.329,0,7.837-3.508,7.837-7.837C347.86,267.247,344.352,263.74,340.023,263.74z"/>
        <path d="M340.023,347.599H237.328c-4.329,0-7.837,3.508-7.837,7.837c0,4.329,3.508,7.837,7.837,7.837h102.695 c4.329,0,7.837-3.508,7.837-7.837C347.86,351.107,344.352,347.599,340.023,347.599z"/>
      </g>
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg fill="#7a7575" height="30px" width="30px" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path d="M55.873,21.7808c-.5488-.4834-1.1465-.897-1.7744-1.228-1.3103-.6929-2.8191-.6383-4.0703,.015v-2.4266c0-.1636-.0801-.3164-.2139-.4102-.045-.0311-.0979-.0422-.1492-.0571l.0037-.0127-21-6.1411c-.0918-.0264-.1895-.0264-.2812,0L7.3877,17.6611l.0038,.0129c-.0514,.0149-.1044,.026-.1493,.0569-.1338,.0938-.2139,.2466-.2139,.4102v25.043c0,1.0322,.6484,1.9717,1.6143,2.3384l19.709,7.4673c.0566,.0215,.1172,.0322,.1768,.0322s.1201-.0107,.1768-.0322l4.7718-1.8079c.1243,.5645,.2361,.9236,.2516,.972,.0674,.2075,.2598,.3462,.4756,.3462l.0322-.001c.1895-.0122,4.665-.3325,7.7754-3.0176l-.01-.0116c.0338-.0291,.0732-.0506,.0989-.089l1.3146-1.9651,4.9998-1.8938c.9648-.3662,1.6133-1.3057,1.6133-2.3379v-5.6538l6.6016-9.8682c1.252-1.8716,.9268-4.3999-.7568-5.8813ZM28.5283,12.521l19.4025,5.674-8.9662,3.2903-17.9672-6.762,7.5309-2.2023Zm0,12.7939l-19.4025-7.1199,10.2748-3.0048,18.1273,6.8222-8.9996,3.3025ZM8.0283,43.1841V18.8574l20,7.3391v25.6014l-19.0312-7.2104c-.5801-.2197-.9688-.7837-.9688-1.4033Zm21,8.6138V26.1965l20-7.3391v2.4217c-.2537,.2375-.4925,.496-.6943,.7975l-14.5459,21.7441c-.0239,.0358-.0175,.079-.0311,.1183l-.0236-.0084c-.8105,2.2712-.6904,4.6404-.4419,6.252l-4.2632,1.6152Zm5.4162-6.7241c1.8631,1.9025,3.9426,3.3076,6.2037,4.1861-2.2558,1.5803-5.05,2.0708-6.0759,2.1992-.2536-.9896-.8016-3.7194-.1277-6.3853Zm7.0369,3.4341c-2.4697-.8613-4.6494-2.3242-6.6436-4.4575l12.3685-18.4886c2.8398,.3173,5.0165,1.7821,6.6361,4.4679l-12.361,18.4783Zm7.5469-5.3237c0,.6196-.3896,1.1836-.9678,1.4028l-3.6871,1.3965,4.6549-6.9583v4.159Zm6.7695-16.0776l-1.3502,2.0183c-1.6509-2.5337-3.8733-4.0389-6.625-4.4844l1.3433-2.008c.9844-1.4727,2.9473-2.0005,4.4658-1.1953,.5586,.2944,1.0908,.6631,1.5811,1.0947,1.3076,1.1514,1.5596,3.1182,.585,4.5747Z"/>
      </g>
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg fill="#7a7575" height="20px" width="20px" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.84375 13C1.285156 13 0 14.285156 0 15.84375L0 42C0 43.660156 1.339844 45 3 45L7.09375 45C7.570313 47.835938 10.035156 50 13 50C15.964844 50 18.429688 47.835938 18.90625 45L28.15625 45C28.894531 45 29.554688 44.6875 30.0625 44.21875C30.582031 44.675781 31.246094 44.992188 32 45L33.09375 45C33.570313 47.835938 36.035156 50 39 50C42.300781 50 45 47.300781 45 44C45 40.699219 42.300781 38 39 38C36.035156 38 33.570313 40.164063 33.09375 43L32 43C31.8125 43 31.527344 42.871094 31.3125 42.65625C31.097656 42.441406 31 42.183594 31 42L31 23C31 22.625 31.625 22 32 22L40 22C40.785156 22 41.890625 22.839844 42.65625 23.75C42.664063 23.761719 42.679688 23.769531 42.6875 23.78125L42.84375 24L38 24C36.40625 24 35 25.289063 35 27L35 31C35 31.832031 35.375 32.5625 35.90625 33.09375C36.4375 33.625 37.167969 34 38 34L48 34L48 42C48 42.375 47.375 43 47 43L45 43L45 45L47 45C48.660156 45 50 43.660156 50 42L50 32.375C50 30.085938 48.40625 28.0625 48.40625 28.0625L48.375 28.0625L44.25 22.5625L44.25 22.53125L44.21875 22.5C43.296875 21.386719 41.914063 20 40 20L32 20C31.644531 20 31.316406 20.074219 31 20.1875L31 15.90625C31 14.371094 29.789063 13 28.1875 13 Z M 2.84375 15L28.1875 15C28.617188 15 29 15.414063 29 15.90625L29 42.15625C29 42.625 28.628906 43 28.15625 43L18.90625 43C18.429688 40.164063 15.964844 38 13 38C10.035156 38 7.570313 40.164063 7.09375 43L3 43C2.625 43 2 42.371094 2 42L2 15.84375C2 15.375 2.367188 15 2.84375 15 Z M 38 26L44.34375 26L46.78125 29.25C46.78125 29.25 47.6875 30.800781 47.875 32L38 32C37.832031 32 37.5625 31.875 37.34375 31.65625C37.125 31.4375 37 31.167969 37 31L37 27C37 26.496094 37.59375 26 38 26 Z M 13 40C15.222656 40 17 41.777344 17 44C17 46.222656 15.222656 48 13 48C10.777344 48 9 46.222656 9 44C9 41.777344 10.777344 40 13 40 Z M 39 40C41.222656 40 43 41.777344 43 44C43 46.222656 41.222656 48 39 48C36.777344 48 35 46.222656 35 44C35 41.777344 36.777344 40 39 40Z"/>
    </svg>
  );
}