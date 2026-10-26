"use client";

import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { FilterSelect } from "@/components/shared/filter-select";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CoapListTable } from "@/features/coap/coap-list-table";
import { MESSAGE_COLUMNS } from "@/features/messaging/message-columns";
import { SendSmsForm } from "@/features/messaging/send-sms-form";
import {
  getMessages,
  getMessagingStatus,
  messageStatusLabel,
  type MessageStatus,
} from "@/lib/api";
import { filterValue, useListFilters } from "@/lib/hooks/use-list-filters";
import { useUserData } from "@/lib/hooks/use-user-data";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = (
  ["stub_queued", "stub_sent", "stub_failed"] as MessageStatus[]
).map((value) => ({ value, label: messageStatusLabel(value) }));

export default function MessagingPage() {
  // No text search on the outbox; `search` only satisfies the hook's shape.
  const { filters, applied, key, setFilters, setPage } = useListFilters({
    search: "",
    status: "all",
  });

  const status = useUserData(() => getMessagingStatus(), "messaging-status");
  const messages = useUserData(
    () =>
      getMessages({
        page: applied.page,
        pageSize: PAGE_SIZE,
        status: filterValue<MessageStatus>(applied.status),
      }),
    `messages:${key}`,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messaging"
        description="Send SMS and review the outbox."
      />

      {status.error ? (
        <ErrorState
          title="Could not load messaging"
          description={status.error}
          onRetry={status.reload}
        />
      ) : !status.data ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          {status.data.provider === "stub" ? (
            <Card>
              <CardContent className="p-4 text-sm">
                <p className="font-medium">Stub provider</p>
                <p className="text-foreground-secondary">{status.data.note}</p>
              </CardContent>
            </Card>
          ) : null}
          <SendSmsForm
            templates={status.data.templates}
            onSent={() => {
              messages.reload();
              status.reload();
            }}
          />
        </>
      )}

      <FilterBar
        filters={
          <FilterSelect
            value={filters.status}
            onChange={(next) => setFilters({ status: next })}
            placeholder="Status"
            allLabel="All statuses"
            options={STATUS_OPTIONS}
            widthClass="w-[180px]"
          />
        }
      />

      <CoapListTable
        state={messages}
        columns={MESSAGE_COLUMNS}
        page={filters.page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        emptyTitle="No messages yet"
        emptyDescription="Sent SMS will appear here."
      />
    </div>
  );
}
