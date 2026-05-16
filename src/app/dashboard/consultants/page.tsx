"use client";

import { useEffect, useMemo, useState } from "react";
import { BubbleCard } from "@/components/ui/BubbleCard";
import { BubbleButton } from "@/components/ui/BubbleButton";
import { clientApi, User, ConsultantSubscription } from "@/lib/api";

export default function ConsultantsPage() {
  const [consultants, setConsultants] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<ConsultantSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  const subscribedIds = useMemo(
    () => new Set(subscriptions.map((s) => s.consultant_id)),
    [subscriptions]
  );

  const load = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        clientApi.getConsultants(),
        clientApi.getSubscriptions(),
      ]);
      setConsultants(c);
      setSubscriptions(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Consultants</h1>
        <p className="text-foreground/60">Follow or subscribe to consultants. You can subscribe to multiple consultants.</p>
      </div>

      {loading && <p className="text-foreground/60">Loading...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {consultants.map((consultant) => {
          const subscribed = subscribedIds.has(consultant.id);
          return (
            <BubbleCard key={consultant.id} className="p-5 flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">{consultant.username}</p>
                <p className="text-sm text-foreground/60">{consultant.email}</p>
              </div>
              {subscribed ? (
                <BubbleButton
                  variant="secondary"
                  onClick={async () => {
                    await clientApi.unsubscribeFromConsultant(consultant.id);
                    await load();
                  }}
                >
                  Unfollow
                </BubbleButton>
              ) : (
                <BubbleButton
                  onClick={async () => {
                    await clientApi.subscribeToConsultant(consultant.id);
                    await load();
                  }}
                >
                  Follow
                </BubbleButton>
              )}
            </BubbleCard>
          );
        })}
      </div>
    </div>
  );
}
