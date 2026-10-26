"use client";

import { useParams } from "next/navigation";
import { FeedbackDetail } from "@/features/coap/feedback-detail";
import { RecordGate } from "@/features/coap/record-states";
import { useAuth } from "@/lib/auth/auth-context";
import { canManageCoap, getFeedbackById } from "@/lib/api";
import { useUserData } from "@/lib/hooks/use-user-data";

export default function FeedbackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const state = useUserData(() => getFeedbackById(id), `feedback:${id}`);

  return (
    <RecordGate
      state={state}
      notFoundTitle="Feedback not found"
      backHref="/feedback"
    >
      {(item) => (
        <FeedbackDetail
          item={item}
          canWrite={canManageCoap(user)}
          onSaved={state.reload}
        />
      )}
    </RecordGate>
  );
}
