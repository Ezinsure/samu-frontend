"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type DocumentViewerSource = {
  url: string;
  contentType: string;
  originalName: string;
};

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** When provided synchronously (already signed). */
  source?: DocumentViewerSource | null;
  /** Lazy loader for short-lived signed URLs. */
  loadSource?: () => Promise<DocumentViewerSource>;
  className?: string;
}

function isImage(contentType: string) {
  return contentType.startsWith("image/");
}

function isPdf(contentType: string) {
  return (
    contentType === "application/pdf" ||
    contentType.includes("pdf")
  );
}

/** Reusable in-app preview for PDFs and images (signed URLs). */
export function DocumentViewer({
  open,
  onOpenChange,
  title = "Document",
  source,
  loadSource,
  className,
}: DocumentViewerProps) {
  const [resolved, setResolved] = useState<DocumentViewerSource | null>(
    source ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setError(null);
      if (!source) setResolved(null);
      return;
    }
    if (source) {
      setResolved(source);
      return;
    }
    if (!loadSource) return;

    let active = true;
    setLoading(true);
    setError(null);
    void loadSource()
      .then((data) => {
        if (active) setResolved(data);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not open file");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, source, loadSource]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] max-w-4xl flex-col gap-3 overflow-hidden",
          className,
        )}
      >
        <DialogHeader>
          <DialogTitle className="truncate pr-8">
            {resolved?.originalName ?? title}
          </DialogTitle>
          <DialogDescription>
            Secure preview — link expires automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-foreground-muted">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading document…
            </div>
          ) : error ? (
            <p className="rounded-md border border-danger/30 bg-danger-bg/40 px-3 py-4 text-sm text-danger">
              {error}
            </p>
          ) : resolved ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary">
                  <a href={resolved.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Open in new tab
                  </a>
                </Button>
                <Button asChild size="sm" variant="secondary">
                  <a href={resolved.url} download={resolved.originalName}>
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
              </div>

              <div className="min-h-[50vh] flex-1 overflow-auto rounded-[var(--radius-lg)] border border-border bg-muted/40">
                {isImage(resolved.contentType) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolved.url}
                    alt={resolved.originalName}
                    className="mx-auto max-h-[70vh] w-auto max-w-full object-contain p-2"
                  />
                ) : isPdf(resolved.contentType) ? (
                  <iframe
                    title={resolved.originalName}
                    src={resolved.url}
                    className="h-[70vh] w-full border-0"
                  />
                ) : (
                  <div className="flex h-64 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-foreground-secondary">
                    <FileText className="h-8 w-8" />
                    <p>Preview is not available for this file type.</p>
                    <p>Use Open or Download instead.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-foreground-muted">No document selected.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
