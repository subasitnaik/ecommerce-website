/**
 * Fake orders for storefront `/orders` UI while developing (`npm run dev`).
 * Wired from `OrdersHubClient` whenever NODE_ENV === "development",
 * unless the URL sets `?real_orders=1` or `?empty=1`.
 * Not used in production builds.
 */
import type { VaultOrderRef } from "@/lib/orders-vault";
import { normalizeOrderStatus, orderWorkflowLabel } from "@/lib/order-workflow";

export const STOREFRONT_ORDERS_LAYOUT_PREVIEW_EMAIL =
  "preview-layout@demo.local";

const PREVIEW_SHIPPING_ADDR = {
  shippingLine1: "Flat 402, Jasmine Apartments",
  shippingLine2: "14th Main Rd, Sector 6",
  shippingCity: "Bengaluru",
  shippingState: "Karnataka",
  shippingPostalCode: "560102",
  shippingCountry: "IN",
} as const;

type ListShape = {
  guestAccessToken: string;
  orderNumber: number;
  status: string;
  statusLabel: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  trackingNumber: string | null;
  resolvedTrackingUrl: string | null;
  itemCount: number;
  primaryItemName: string | null;
};

type DetailShape = {
  orderNumber: number;
  status: string;
  statusLabel: string;
  totalCents: number;
  currency: string;
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  paymentProvider: string | null;
  trackingNumber: string | null;
  courierLabel: string | null;
  resolvedTrackingUrl: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
  items: {
    id: string;
    productName: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    size: string | null;
    variantLabel: string | null;
  }[];
};

const PREVIEW_ROWS: {
  guestAccessToken: string;
  list: Omit<ListShape, "statusLabel">;
  detail: DetailShape;
}[] = [
  {
    guestAccessToken: "00000000-0000-4000-8000-000000000001",
    list: {
      guestAccessToken: "00000000-0000-4000-8000-000000000001",
      orderNumber: 10042,
      status: "processing",
      totalCents: 179_800,
      currency: "INR",
      createdAt: "2026-04-14T09:05:18.000Z",
      trackingNumber: null,
      resolvedTrackingUrl: null,
      itemCount: 1,
      primaryItemName: "Essential crew tee · black",
    },
    detail: {
      orderNumber: 10042,
      status: "processing",
      statusLabel: orderWorkflowLabel(
        normalizeOrderStatus("processing"),
      ),
      totalCents: 179_800,
      currency: "INR",
      createdAt: "2026-04-14T09:05:18.000Z",
      customerName: "Neha Rao",
      customerEmail: STOREFRONT_ORDERS_LAYOUT_PREVIEW_EMAIL,
      customerPhone: "+91 98110 77220",
      ...PREVIEW_SHIPPING_ADDR,
      paymentProvider: "cashfree",
      trackingNumber: null,
      courierLabel: null,
      resolvedTrackingUrl: null,
      items: [
        {
          id: "mock-li-1",
          productName: "Essential crew tee · black",
          quantity: 2,
          unitPriceCents: 89_900,
          lineTotalCents: 179_800,
          size: "M",
          variantLabel: "Classic fit",
        },
      ],
    },
  },
  {
    guestAccessToken: "00000000-0000-4000-8000-000000000002",
    list: {
      guestAccessToken: "00000000-0000-4000-8000-000000000002",
      orderNumber: 10039,
      status: "shipped",
      totalCents: 243_990,
      currency: "INR",
      createdAt: "2026-04-12T15:41:52.000Z",
      trackingNumber: "FAST9988776611",
      resolvedTrackingUrl: "https://example.com/track?awb=DEMO9988776611",
      itemCount: 2,
      primaryItemName: "Graphic street tee · midnight",
    },
    detail: {
      orderNumber: 10039,
      status: "shipped",
      statusLabel: orderWorkflowLabel(normalizeOrderStatus("shipped")),
      totalCents: 243_990,
      currency: "INR",
      createdAt: "2026-04-12T15:41:52.000Z",
      customerName: "Adam Irani",
      customerEmail: STOREFRONT_ORDERS_LAYOUT_PREVIEW_EMAIL,
      customerPhone: "+91 98655 44112",
      ...PREVIEW_SHIPPING_ADDR,
      paymentProvider: "cod",
      trackingNumber: "FAST9988776611",
      courierLabel: "Demo Express",
      resolvedTrackingUrl: "https://example.com/track?awb=DEMO9988776611",
      items: [
        {
          id: "mock-li-2a",
          productName: "Graphic street tee · midnight",
          quantity: 1,
          unitPriceCents: 79_990,
          lineTotalCents: 79_990,
          size: "L",
          variantLabel: "Relaxed shoulder",
        },
        {
          id: "mock-li-2b",
          productName: "Slim chinos · moss",
          quantity: 1,
          unitPriceCents: 164_000,
          lineTotalCents: 164_000,
          size: "32",
          variantLabel: "Taper ankle",
        },
      ],
    },
  },
  {
    guestAccessToken: "00000000-0000-4000-8000-000000000003",
    list: {
      guestAccessToken: "00000000-0000-4000-8000-000000000003",
      orderNumber: 10028,
      status: "delivered",
      totalCents: 389_990,
      currency: "INR",
      createdAt: "2026-04-02T12:09:41.000Z",
      trackingNumber: null,
      resolvedTrackingUrl: null,
      itemCount: 1,
      primaryItemName: "Pullover fleece hoodie · birch",
    },
    detail: {
      orderNumber: 10028,
      status: "delivered",
      statusLabel: orderWorkflowLabel(normalizeOrderStatus("delivered")),
      totalCents: 389_990,
      currency: "INR",
      createdAt: "2026-04-02T12:09:41.000Z",
      customerName: "Saira Menon",
      customerEmail: STOREFRONT_ORDERS_LAYOUT_PREVIEW_EMAIL,
      customerPhone: "+91 97400 88901",
      ...PREVIEW_SHIPPING_ADDR,
      paymentProvider: "cashfree",
      trackingNumber: null,
      courierLabel: null,
      resolvedTrackingUrl: null,
      items: [
        {
          id: "mock-li-3",
          productName: "Pullover fleece hoodie · birch",
          quantity: 1,
          unitPriceCents: 389_990,
          lineTotalCents: 389_990,
          size: "S",
          variantLabel: null,
        },
      ],
    },
  },
  {
    guestAccessToken: "00000000-0000-4000-8000-000000000004",
    list: {
      guestAccessToken: "00000000-0000-4000-8000-000000000004",
      orderNumber: 10061,
      status: "paid",
      totalCents: 45_996,
      currency: "INR",
      createdAt: "2026-04-17T06:54:06.000Z",
      trackingNumber: null,
      resolvedTrackingUrl: null,
      itemCount: 1,
      primaryItemName: "Heavyweight tote · graphite",
    },
    detail: {
      orderNumber: 10061,
      status: "paid",
      statusLabel: orderWorkflowLabel(normalizeOrderStatus("paid")),
      totalCents: 45_996,
      currency: "INR",
      createdAt: "2026-04-17T06:54:06.000Z",
      customerName: "Leo Verghese",
      customerEmail: STOREFRONT_ORDERS_LAYOUT_PREVIEW_EMAIL,
      customerPhone: "+91 88002 66113",
      ...PREVIEW_SHIPPING_ADDR,
      paymentProvider: "cashfree",
      trackingNumber: null,
      courierLabel: null,
      resolvedTrackingUrl: null,
      items: [
        {
          id: "mock-li-4",
          productName: "Heavyweight tote · graphite",
          quantity: 3,
          unitPriceCents: 15_332,
          lineTotalCents: 45_996,
          size: null,
          variantLabel: "Carry‑all depth",
        },
      ],
    },
  },
];

export function storefrontOrdersLayoutPreviewRefs(): VaultOrderRef[] {
  const savedAt = "2026-04-08T09:30:00.000Z";
  return PREVIEW_ROWS.map((r) => ({
    email: STOREFRONT_ORDERS_LAYOUT_PREVIEW_EMAIL,
    token: r.guestAccessToken,
    orderNumber: r.list.orderNumber,
    savedAt,
  }));
}

/** Same shape as `POST /api/shop/orders/list` rows. */
export function storefrontOrdersLayoutPreviewSummariesByToken(): Record<
  string,
  ListShape
> {
  const m: Record<string, ListShape> = {};
  for (const row of PREVIEW_ROWS) {
    const wf = normalizeOrderStatus(row.list.status);
    m[row.guestAccessToken] = {
      ...row.list,
      statusLabel: orderWorkflowLabel(wf),
    };
  }
  return m;
}

/** Same shape as `POST /api/shop/orders/detail` `.order`. */
export function storefrontOrdersLayoutPreviewDetail(
  guestAccessToken: string,
): DetailShape | null {
  const row = PREVIEW_ROWS.find(
    (r) => r.guestAccessToken === guestAccessToken,
  );
  return row?.detail ?? null;
}
