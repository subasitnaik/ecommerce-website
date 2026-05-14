import { prisma } from "@/lib/prisma";
import type { OrderWorkflowStatus } from "@/lib/order-workflow";
import { normalizeOrderStatus } from "@/lib/order-workflow";

export type AdminOrderLine = {
  id: string;
  productName: string;
  quantity: number;
  /** Unit price at checkout (minor units). */
  priceCents: number;
  size: string | null;
  variantLabel: string | null;
  variantId: string | null;
};

export type AdminOrderRow = {
  id: string;
  /** Sequential order reference (matches customer-facing order number). */
  displayId: string;
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  /** Raw Order.status string from DB */
  status: string;
  normalizedStatus: OrderWorkflowStatus;
  totalCents: number;
  currency: string;
  /** Sum of line quantities. */
  itemCount: number;
  lineItems: AdminOrderLine[];
  paymentProvider: string | null;
  adminSeenAt: string | null;
  /** AWB / consignment — optional, shown on storefront. */
  trackingNumber: string | null;
  /** Id of preset in ShopSettings `courierPresets` JSON — storefront builds URL + AWB. */
  courierPresetId: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
};

/** Demo display numbers when DB has no orders (starts at 10001). */
function demoDisplayId(seed: number): string {
  return String(10001 + seed);
}

function mapDbLines(
  items: {
    id: string;
    quantity: number;
    priceCents: number;
    size: string | null;
    variantId: string | null;
    variantLabel: string | null;
    product: { name: string };
  }[],
): AdminOrderLine[] {
  return items.map((it) => ({
    id: it.id,
    productName: it.product.name,
    quantity: it.quantity,
    priceCents: it.priceCents,
    size: it.size,
    variantLabel: it.variantLabel,
    variantId: it.variantId,
  }));
}

function itemCountFromLines(lines: AdminOrderLine[]): number {
  return lines.reduce((a, l) => a + l.quantity, 0);
}

function mapPrismaOrderToRow(o: {
  id: string;
  orderNumber: number;
  createdAt: Date;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  status: string;
  totalCents: number;
  currency: string;
  paymentProvider: string | null;
  adminSeenAt: Date | null;
  trackingNumber: string | null;
  courierPresetId: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
  items: {
    id: string;
    quantity: number;
    priceCents: number;
    size: string | null;
    variantId: string | null;
    variantLabel: string | null;
    product: { name: string };
  }[];
}): AdminOrderRow {
  const lineItems = mapDbLines(o.items);
  const normalized = normalizeOrderStatus(o.status);
  return {
    id: o.id,
    displayId: String(o.orderNumber),
    createdAt: o.createdAt.toISOString(),
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    status: o.status,
    normalizedStatus: normalized,
    totalCents: o.totalCents,
    currency: o.currency,
    itemCount: itemCountFromLines(lineItems),
    lineItems,
    paymentProvider: o.paymentProvider,
    adminSeenAt: o.adminSeenAt?.toISOString() ?? null,
    trackingNumber: o.trackingNumber ?? null,
    courierPresetId: o.courierPresetId ?? null,
    shippingLine1: o.shippingLine1 ?? null,
    shippingLine2: o.shippingLine2 ?? null,
    shippingCity: o.shippingCity ?? null,
    shippingState: o.shippingState ?? null,
    shippingPostalCode: o.shippingPostalCode ?? null,
    shippingCountry: o.shippingCountry ?? null,
  };
}

/** Single order for admin detail — DB or demo id (e.g. `demo-order-paid`). */
export async function getAdminOrderById(id: string): Promise<AdminOrderRow | null> {
  try {
    const o = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { id: "asc" },
          include: { product: { select: { name: true } } },
        },
      },
    });
    if (o) return mapPrismaOrderToRow(o);
  } catch {
    /* fall through to demo */
  }
  return getDemoAdminOrders().find((d) => d.id === id) ?? null;
}

export async function getAdminOrdersForList(): Promise<AdminOrderRow[]> {
  try {
    const rows = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        items: {
          orderBy: { id: "asc" },
          include: { product: { select: { name: true } } },
        },
      },
    });
    if (rows.length === 0) return getDemoAdminOrders();

    return rows.map((o) => mapPrismaOrderToRow(o));
  } catch {
    return getDemoAdminOrders();
  }
}

/** Demo rows when DB is empty or offline — varied workflow stages. */
function getDemoAdminOrders(): AdminOrderRow[] {
  const now = Date.now();
  let demoN = 0;
  const nextDemo = () => demoN++;

  const demoShipping = {
    shippingLine1: "12, Brigade Road · Near UB City",
    shippingLine2: "4th Floor, Wing B",
    shippingCity: "Bengaluru",
    shippingState: "Karnataka",
    shippingPostalCode: "560025",
    shippingCountry: "IN",
  } as const satisfies Pick<
    AdminOrderRow,
    | "shippingLine1"
    | "shippingLine2"
    | "shippingCity"
    | "shippingState"
    | "shippingPostalCode"
    | "shippingCountry"
  >;

  const mk = (
    id: string,
    status: OrderWorkflowStatus,
    name: string,
    email: string,
    totalRupees: number,
    daysAgo: number,
    lineItems: AdminOrderLine[],
    payment: string | null,
    seen: boolean,
    shipment?: {
      trackingNumber: string | null;
      courierPresetId: string | null;
    },
  ): AdminOrderRow => ({
    id,
    displayId: demoDisplayId(nextDemo()),
    createdAt: new Date(now - daysAgo * 86400000).toISOString(),
    customerName: name,
    customerEmail: email,
    customerPhone: "+91 90000 00000",
    status,
    normalizedStatus: status,
    totalCents: totalRupees * 100,
    currency: "INR",
    itemCount: itemCountFromLines(lineItems),
    lineItems,
    paymentProvider: payment,
    adminSeenAt: seen ? new Date(now - 3600000).toISOString() : null,
    trackingNumber: shipment?.trackingNumber ?? null,
    courierPresetId: shipment?.courierPresetId ?? null,
    ...demoShipping,
  });

  return [
    mk(
      "demo-order-pending-pay",
      "pending_payment",
      "Asha Menon",
      "asha@example.com",
      1299,
      0,
      [
        {
          id: "demo-li-pp-1",
          productName: "Indigo tee",
          quantity: 1,
          priceCents: 64950,
          size: "M",
          variantLabel: "Regular fit",
          variantId: "v-reg",
        },
        {
          id: "demo-li-pp-2",
          productName: "Everyday socks (pack)",
          quantity: 1,
          priceCents: 64950,
          size: null,
          variantLabel: "Mixed",
          variantId: null,
        },
      ],
      "cod",
      false,
    ),
    mk(
      "demo-order-paid",
      "paid",
      "Rohan Das",
      "rohan@example.com",
      499,
      0,
      [
        {
          id: "demo-li-paid-1",
          productName: "Everyday hoodie",
          quantity: 1,
          priceCents: 49900,
          size: "L",
          variantLabel: "Heather grey",
          variantId: "v-hg",
        },
      ],
      "cashfree",
      false,
    ),
    mk(
      "demo-order-processing",
      "processing",
      "Priya K.",
      "priya.k@example.com",
      2198,
      1,
      [
        {
          id: "demo-li-pr-1",
          productName: "Linen trousers",
          quantity: 2,
          priceCents: 54950,
          size: "32",
          variantLabel: "Navy",
          variantId: "v-nvy",
        },
        {
          id: "demo-li-pr-2",
          productName: "Leather belt",
          quantity: 1,
          priceCents: 55000,
          size: null,
          variantLabel: "Brown · 110 cm",
          variantId: null,
        },
        {
          id: "demo-li-pr-3",
          productName: "Cotton scarf",
          quantity: 1,
          priceCents: 54900,
          size: null,
          variantLabel: null,
          variantId: null,
        },
      ],
      "cashfree",
      true,
    ),
    mk(
      "demo-order-shipped",
      "shipped",
      "Neil Shah",
      "neil@example.com",
      849,
      2,
      [
        {
          id: "demo-li-sh-1",
          productName: "Classic tee bundle",
          quantity: 2,
          priceCents: 42450,
          size: "M",
          variantLabel: "White / black",
          variantId: "v-bun",
        },
      ],
      "cashfree",
      true,
      {
        trackingNumber: "XYZ123ABC",
        courierPresetId: null,
      },
    ),
    mk(
      "demo-order-delivered",
      "delivered",
      "Maria Lopes",
      "maria@example.com",
      3150,
      5,
      [
        {
          id: "demo-li-dl-1",
          productName: "Winter hoodie",
          quantity: 1,
          priceCents: 189900,
          size: "XL",
          variantLabel: "Fleece lined",
          variantId: "v-fl",
        },
        {
          id: "demo-li-dl-2",
          productName: "Wool beanie",
          quantity: 2,
          priceCents: 62550,
          size: null,
          variantLabel: "Charcoal",
          variantId: null,
        },
      ],
      "cod",
      true,
    ),
    mk(
      "demo-order-cancelled",
      "cancelled",
      "Test User",
      "test@example.com",
      699,
      3,
      [
        {
          id: "demo-li-ca-1",
          productName: "Sample product",
          quantity: 1,
          priceCents: 69900,
          size: "S",
          variantLabel: null,
          variantId: null,
        },
      ],
      null,
      true,
    ),
  ];
}
