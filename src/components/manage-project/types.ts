export type OfferView = {
  id: string;
  status: "submitted" | "viewed" | "shortlisted" | "rejected" | "hired" | "withdrawn" | "refunded";
  message: string;
  priceAmount: number | null;
  priceType: "fixed" | "hourly" | "monthly" | "to_discuss";
  estimatedDays: number | null;
  isAuto: boolean;
  boosted: boolean;
  isNew: boolean;
  createdAt: string;
  conversationId: string | null;
  rejectionReason: string | null;
  /** Telefonul/emailul prestatorului: doar pentru oferta aleasă, după ce prestatorul confirmă colaborarea. */
  contact: { phone: string | null; email: string } | null;
  provider: {
    id: string;
    name: string;
    avatarPath: string | null;
    slug: string | null;
    headline: string | null;
    ratingAvg: number | null;
    ratingCount: number;
    completedCount: number;
    issuesInvoice: boolean;
    legalEntity: "none" | "pfa" | "ii" | "srl" | "other";
    phoneVerified: boolean;
    distanceKm: number | null;
  };
};
