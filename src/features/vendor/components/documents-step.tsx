'use client';

import { FileText, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/common/error-message';
import { StatusChip, type ChipTone } from '@/components/common/status-chip';
import { useToast } from '@/components/common/toast';
import { myDocumentHref, useRemoveDocument, useUploadDocument } from '@/features/vendor/hooks/use-vendor';
import { AppError, fill, messageFor, requestIdOf, toAppError } from '@/lib/errors';
import { type Locale, type Messages } from '@/lib/i18n';
import { useMessages } from '@/lib/messages-context';
import { checkFile, formatSize, UPLOAD_RULES } from '@/lib/uploads';
import { DOCUMENT_TYPES, type DocumentType, type Vendor, type VendorDocument } from '@/features/vendor/types';
import { cn } from '@/utils/cn';

/**
 * Step 3, documents (Document 5, section 7.1; approved Stage 5): one row per document type with the newest file of that
 * type, its status and the reviewer's reason. One file at a time, with progress in text and a Cancel button; the
 * backend checks type and size and its answer is what counts. Files are private and open through our server.
 * A PAN card is always needed; a GST certificate when a GSTIN is given (area-2-vendors.md, "What is needed to submit").
 */
const DOC_TONE: Record<VendorDocument['status'], ChipTone> = { pending: 'info', approved: 'success', rejected: 'error' };

export function DocumentsStep({ lang, vendor }: { lang: Locale; vendor: Vendor }) {
  const t = useMessages();
  return (
    <section aria-labelledby="documents-heading" className="grid gap-4 rounded-1 border border-line bg-surface p-5 sm:p-6">
      <h2 id="documents-heading" className="type-h3 text-ink">
        {t.vendor.steps.documents}
      </h2>
      <ul className="grid gap-3">
        {DOCUMENT_TYPES.map((type) => (
          <li key={type}>
            <DocumentRow vendor={vendor} type={type} />
          </li>
        ))}
      </ul>
      <p className="type-small text-muted-foreground">{t.vendor.documents.help}</p>
      <div className="flex justify-end">
        <Button asChild>
          <Link href={`/${lang}/vendor/apply?step=review`} className="no-underline">
            {t.vendor.continueStep}
          </Link>
        </Button>
      </div>
    </section>
  );
}

function DocumentRow({ vendor, type }: { vendor: Vendor; type: DocumentType }) {
  const t = useMessages();
  const toast = useToast();
  const latest = vendor.documents.find((d) => d.type === type);
  const required = type === 'pan' || (type === 'gst_certificate' && Boolean(vendor.gstin));
  const needed = vendor.missing.includes(`document:${type}`);
  const uploadDocument = useUploadDocument();
  const removeDocument = useRemoveDocument();
  const input = useRef<HTMLInputElement>(null);
  const cancel = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [problem, setProblem] = useState<{ text: string; requestId?: string } | null>(null);
  const [unknown, setUnknown] = useState(false);
  const label = t.vendor.documents.types[type];
  const inputId = `document-file-${type}`;

  const send = (file: File) => {
    setProblem(null);
    setUnknown(false);
    const early = checkFile(file, 'document');
    if (early) {
      setProblem({ text: messageFor(new AppError({ code: early, status: 400 }), t) });
      return;
    }
    const controller = new AbortController();
    cancel.current = controller;
    setProgress(0);
    uploadDocument.mutate(
      { type, file, onProgress: setProgress, signal: controller.signal },
      {
        onSuccess: () => toast(fill(t.vendor.documents.uploaded, { document: label })),
        onError: (raw) => {
          const error = toAppError(raw);
          if (error.code === 'UPLOAD_CANCELLED') return;
          // The upload may or may not have arrived: the list is read again, and the person checks it (Document 3, section 6).
          if (error.outcomeUnknown) setUnknown(true);
          else setProblem({ text: messageFor(error, t), requestId: error.requestId });
        },
        onSettled: () => {
          setProgress(null);
          cancel.current = null;
        },
      },
    );
  };

  return (
    <div className={cn('grid gap-3 rounded-1 border p-4', problem || latest?.status === 'rejected' ? 'border-error' : 'border-line')}>
      <div className="flex flex-wrap items-start gap-3">
        <div aria-hidden="true" className="flex h-14 w-12 shrink-0 items-center justify-center rounded-1 bg-sunken text-ink-2">
          <FileText className="size-5" />
        </div>
        <div className="grid min-w-0 flex-1 gap-1">
          <p className="font-medium text-ink">
            {label}
            <span className="font-normal text-muted-foreground"> {required ? `(${t.vendor.documents.required})` : t.form.optional}</span>
          </p>
          {latest ? (
            <>
              <p className="truncate type-small text-ink-2">
                {latest.fileName} · {formatSize(latest.sizeBytes)}
              </p>
              <div>
                <StatusChip tone={DOC_TONE[latest.status]} label={t.vendor.documents.status[latest.status]} />
              </div>
              {latest.status === 'rejected' && latest.rejectReason ? (
                <p className="type-small text-ink">{fill(t.vendor.documents.rejectedReason, { reason: latest.rejectReason })}</p>
              ) : null}
            </>
          ) : (
            <>
              <p className="type-small text-ink-2">{t.vendor.documents.notAdded}</p>
              {needed ? (
                <div>
                  <StatusChip tone="warning" label={t.vendor.documents.needed} />
                </div>
              ) : null}
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {latest ? (
            <Button asChild variant="quiet" size="small">
              <a href={myDocumentHref(latest.id)} target="_blank" rel="noopener">
                {t.vendor.documents.view}
                <span className="sr-only">: {latest.fileName}</span>
              </a>
            </Button>
          ) : null}
          {latest?.status === 'pending' ? <RemoveDocument t={t} document={latest} label={label} busy={removeDocument.isPending} onRemove={() => removeDocument.mutate(latest.id, { onSuccess: () => toast(t.vendor.documents.removed) })} /> : null}
          <input
            ref={input}
            id={inputId}
            type="file"
            accept={UPLOAD_RULES.document.accept}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) send(file);
            }}
          />
          <Button type="button" variant="secondary" size="small" disabled={progress !== null} onClick={() => input.current?.click()}>
            <Upload aria-hidden="true" />
            {latest ? t.vendor.documents.replace : t.vendor.documents.add}
            <span className="sr-only">: {label}</span>
          </Button>
        </div>
      </div>
      {progress !== null ? (
        <div className="grid gap-1.5">
          <div className="flex items-center gap-3">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
              <div className="h-full bg-ink" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <Button type="button" variant="quiet" size="small" onClick={() => cancel.current?.abort()}>
              {t.common.cancel}
            </Button>
          </div>
          <p role="status" className="type-small text-ink-2 tabular-nums">
            {fill(t.vendor.documents.uploading, { percent: Math.round(progress * 100) })}
          </p>
        </div>
      ) : null}
      {problem ? <ErrorMessage text={problem.text} requestId={problem.requestId} messages={t} /> : null}
      {unknown ? <Banner tone="warning">{t.vendor.documents.uploadUnknown}</Banner> : null}
      {removeDocument.error ? <ErrorMessage text={messageFor(toAppError(removeDocument.error), t)} requestId={requestIdOf(removeDocument.error)} messages={t} /> : null}
    </div>
  );
}

function RemoveDocument({ t, document, label, busy, onRemove }: { t: Messages; document: VendorDocument; label: string; busy: boolean; onRemove: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" size="small" disabled={busy}>
          {t.vendor.documents.remove}
          <span className="sr-only">: {label}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.vendor.documents.removeTitle}</AlertDialogTitle>
          <AlertDialogDescription>{fill(t.vendor.documents.removeBody, { name: document.fileName })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction variant="destructiveConfirm" onClick={onRemove}>
            {t.vendor.documents.remove}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
