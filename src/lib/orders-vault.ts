/** Guest order anchors saved after checkout (`sessionStorage`) — browse without re-entering credentials. */
export type VaultOrderRef = {
  email: string;
  token: string;
  orderNumber: number;
  savedAt: string;
};
