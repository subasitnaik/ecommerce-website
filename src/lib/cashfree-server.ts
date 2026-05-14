import { getCashfreeEnv, getCashfreePgBaseUrl } from "@/lib/cashfree-config";

const API_VERSION = "2022-09-01";

/** Cashfree returns different error shapes; normalize for debugging in sandbox. */
function cashfreeErrorMessage(json: unknown, fallback: string): string {
  if (!json || typeof json !== "object") return fallback;
  const j = json as Record<string, unknown>;
  const parts: string[] = [];
  const msg = j.message;
  if (typeof msg === "string") parts.push(msg);
  else if (Array.isArray(msg) && msg[0] && typeof msg[0] === "object") {
    const m0 = msg[0] as Record<string, unknown>;
    if (typeof m0.message === "string") parts.push(m0.message);
  }
  if (typeof j.type === "string") parts.push(`(${j.type})`);
  if (typeof j.code === "string") parts.push(`code: ${j.code}`);
  return parts.length ? parts.join(" ") : fallback;
}

type CreateOrderCustomer = {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

export type CreateCashfreeOrderInput = {
  orderId: string;
  orderAmountRupees: number;
  currency: string;
  returnUrl: string;
  customer: CreateOrderCustomer;
  orderNote?: string;
};

export async function cashfreeCreateOrder(
  input: CreateCashfreeOrderInput,
): Promise<{ payment_session_id: string }> {
  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secret = process.env.CASHFREE_SECRET_KEY?.trim();
  if (!appId || !secret) {
    throw new Error("CASHFREE_APP_ID and CASHFREE_SECRET_KEY must be set");
  }

  const base = getCashfreePgBaseUrl();
  const body = {
    order_id: input.orderId,
    order_amount: Math.round(input.orderAmountRupees * 100) / 100,
    order_currency: input.currency,
    customer_details: {
      customer_id: input.customer.customerId,
      customer_name: input.customer.customerName,
      customer_email: input.customer.customerEmail,
      customer_phone: input.customer.customerPhone,
    },
    order_meta: {
      return_url: input.returnUrl,
    },
    ...(input.orderNote ? { order_note: input.orderNote } : {}),
  };

  const res = await fetch(`${base}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-version": API_VERSION,
      "x-client-id": appId,
      "x-client-secret": secret,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as {
    payment_session_id?: string;
    message?: string;
    type?: string;
    code?: string;
  };

  if (!res.ok) {
    throw new Error(
      cashfreeErrorMessage(json, `${res.status} ${res.statusText}`),
    );
  }

  if (!json.payment_session_id) {
    throw new Error(
      cashfreeErrorMessage(json, "Cashfree did not return payment_session_id"),
    );
  }

  return { payment_session_id: json.payment_session_id };
}

export async function cashfreeGetOrder(orderId: string): Promise<{
  order_status?: string;
  order_id?: string;
}> {
  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secret = process.env.CASHFREE_SECRET_KEY?.trim();
  if (!appId || !secret) {
    throw new Error("CASHFREE_APP_ID and CASHFREE_SECRET_KEY must be set");
  }

  const base = getCashfreePgBaseUrl();
  const res = await fetch(
    `${base}/orders/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-api-version": API_VERSION,
        "x-client-id": appId,
        "x-client-secret": secret,
      },
    },
  );

  const raw = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    throw new Error(cashfreeErrorMessage(raw, `${res.status}`));
  }

  const nested =
    raw && typeof raw === "object" && "data" in raw && raw.data
      ? (raw.data as Record<string, unknown>)
      : raw;

  const order_status =
    typeof nested.order_status === "string"
      ? nested.order_status
      : typeof raw.order_status === "string"
        ? raw.order_status
        : undefined;

  const order_id =
    typeof nested.order_id === "string"
      ? nested.order_id
      : typeof raw.order_id === "string"
        ? raw.order_id
        : undefined;

  return { order_status, order_id };
}

export function cashfreeModeForClient(): "sandbox" | "production" {
  return getCashfreeEnv() === "production" ? "production" : "sandbox";
}
