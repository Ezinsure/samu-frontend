"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/shared/form-field";
import { OptionSelect } from "@/components/shared/option-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sendSms } from "@/lib/api";

const CUSTOM = "custom";

interface SendSmsFormProps {
  /** Template ids from the messaging status endpoint. */
  templates: string[];
  /** Called after the message was recorded (refresh the outbox). */
  onSent: () => void;
}

/** Compose and "send" an SMS (recorded in the outbox; no gateway yet). */
export function SendSmsForm({ templates, onSent }: SendSmsFormProps) {
  const [toPhone, setToPhone] = useState("");
  const [template, setTemplate] = useState(templates[0] ?? CUSTOM);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const isCustom = template === CUSTOM;
  const canSend = toPhone.trim().length >= 7 && (!isCustom || body.trim());

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    const result = await sendSms({
      toPhone: toPhone.trim(),
      templateId: isCustom ? undefined : template,
      body: isCustom ? body.trim() : undefined,
    });
    setSending(false);

    if (!result.ok) {
      toast.error("Could not send SMS", { description: result.error });
      return;
    }
    toast.success("SMS recorded", {
      description: "Stored in the outbox — no real SMS gateway is connected yet.",
    });
    setToPhone("");
    setBody("");
    onSent();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send SMS</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <FormField label="Phone number" htmlFor="sms-phone">
            <Input
              id="sms-phone"
              type="tel"
              placeholder="+250 7XX XXX XXX"
              value={toPhone}
              onChange={(event) => setToPhone(event.target.value)}
            />
          </FormField>
          <FormField label="Message" htmlFor="sms-template">
            <OptionSelect
              id="sms-template"
              value={template}
              onChange={setTemplate}
              options={[
                ...templates.map((id) => ({ value: id, label: id })),
                { value: CUSTOM, label: "Custom message" },
              ]}
            />
          </FormField>
          {isCustom ? (
            <FormField
              label="Custom text"
              htmlFor="sms-body"
              className="md:col-span-2"
            >
              <Textarea
                id="sms-body"
                rows={3}
                maxLength={500}
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </FormField>
          ) : (
            <p className="text-xs text-foreground-secondary md:col-span-2">
              The template text is managed in Settings.
            </p>
          )}
          <div className="md:col-span-2">
            <Button type="submit" disabled={!canSend || sending}>
              <Send className="h-4 w-4" />
              {sending ? "Sending…" : "Send SMS"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
