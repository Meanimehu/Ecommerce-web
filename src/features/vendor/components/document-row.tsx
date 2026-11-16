'use client';

import { FileText, Upload } from 'lucide-react';
import { useRef } from 'react';
import { ErrorMessage } from '@/components/common/error-message';
import { StatusChip, type ChipTone } from '@/components/common/status-chip';
import { useToast } from '@/components/common/toast';
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
import { fill, messageFor } from '@/lib/errors';
import { useMessages } from '@/lib/messages-context';
import { formatSize, UPLOAD_RULES } from '@/lib/uploads';
import { cn } from '@/utils/cn';
import { useDocumentUpload } from '@/features/vendor/hooks/use-document-upload';
import { myDocumentHref, useRemoveVendorDocument } from '@/features/vendor/hooks/use-vendor';
import {
  DocumentStatus,
  DocumentType,
  isEditable,
  MISSING_DOCUMENT_PREFIX,
  type Vendor,
  type VendorDocument,
} from '@/features/vendor/types';

/**
 * One document type on the application (Document 5, section 7.1; approved Stage 5): the newest file
 * of that type (the backend lists documents newest first), its status and the reviewer's reason,
 * and Add, Replace, View and Remove. What happens on upload is in
 * `features/vendor/hooks/use-document-upload.ts`. A PAN card is always needed; a GST certificate
 * when a GSTIN is given (area-2-vendors.md, "What is needed to submit").
 */
export const DOCUMENT_TONES: Record<DocumentStatus, ChipTone> = {
  [DocumentStatus.Pending]: 'info',
  [DocumentStatus.Approved]: 'success',
  [DocumentStatus.Rejected]: 'error',
};

export function DocumentRow({
  vendor,
  type,
  canChange = true,
}: {
  vendor: Vendor;
  type: DocumentType;
  /** False shows the document and its status only (the business profile of a vendor not approved). */
  canChange?: boolean;
}) {
  const messages = useMessages();
  const documentMessages = messages.vendor.documents;
  const label = documentMessages.types[type];
  const latest = vendor.documents.find((vendorDocument) => vendorDocument.type === type);
  const isRequired =
    type === DocumentType.Pan || (type === DocumentType.GstCertificate && Boolean(vendor.gstin));
  const isNeeded = vendor.missing.includes(`${MISSING_DOCUMENT_PREFIX}${type}`);
  const documentUpload = useDocumentUpload({ type, label });
  const { uploadError, progress } = documentUpload;
  const removeVendorDocument = useRemoveVendorDocument();
  const removeError = removeVendorDocument.error;
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const showsProblem = Boolean(uploadError) || latest?.status === DocumentStatus.Rejected;

  return (
    <div
      className={cn(
        'grid gap-3 rounded-1 border p-4',
        showsProblem ? 'border-error' : 'border-line',
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        <div
          aria-hidden="true"
          className="flex h-14 w-12 shrink-0 items-center justify-center rounded-1 bg-sunken text-ink-2"
        >
          <FileText className="size-5" />
        </div>
        <div className="grid min-w-0 flex-1 gap-1">
          <p className="font-medium text-ink">
            {label}
            <span className="font-normal text-muted-foreground">
              {' '}
              {isRequired ? `(${documentMessages.required})` : messages.form.optional}
            </span>
          </p>
          {latest ? (
            <LatestDocument latest={latest} />
          ) : (
            <>
              <p className="type-small text-ink-2">{documentMessages.notAdded}</p>
              {isNeeded ? (
                <div>
                  <StatusChip tone="warning" label={documentMessages.needed} />
                </div>
              ) : null}
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {latest ? (
            <Button asChild variant="quiet" size="small">
              <a href={myDocumentHref(latest.id)} target="_blank" rel="noopener">
                {documentMessages.view}
                <span className="sr-only">: {latest.fileName}</span>
              </a>
            </Button>
          ) : null}
          {/* A pending document can be removed only while the application is a draft or rejected. */}
          {canChange && isEditable(vendor.status) && latest?.status === DocumentStatus.Pending ? (
            <RemoveDocument
              vendorDocument={latest}
              label={label}
              isRemoving={removeVendorDocument.isPending}
              onRemove={() =>
                removeVendorDocument.mutate(latest.id, {
                  onSuccess: () => toast(documentMessages.removed),
                })
              }
            />
          ) : null}
          {canChange ? (
            <>
              <input
                ref={fileInput}
                id={`document-file-${type}`}
                type="file"
                accept={UPLOAD_RULES.document.accept}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) documentUpload.uploadFile(file);
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="small"
                disabled={documentUpload.isUploading}
                onClick={() => fileInput.current?.click()}
              >
                <Upload aria-hidden="true" />
                {latest ? documentMessages.replace : documentMessages.add}
                <span className="sr-only">: {label}</span>
              </Button>
            </>
          ) : null}
        </div>
      </div>
      {progress !== null ? (
        <UploadProgress progress={progress} onCancel={documentUpload.cancelUpload} />
      ) : null}
      {uploadError ? (
        <ErrorMessage
          text={messageFor(uploadError, messages)}
          requestId={uploadError.requestId}
          messages={messages}
        />
      ) : null}
      {documentUpload.isOutcomeUnknown ? (
        <Banner tone="warning">{documentMessages.uploadUnknown}</Banner>
      ) : null}
      {removeError ? (
        <ErrorMessage
          text={messageFor(removeError, messages)}
          requestId={removeError.requestId}
          messages={messages}
        />
      ) : null}
    </div>
  );
}

function LatestDocument({ latest }: { latest: VendorDocument }) {
  const messages = useMessages();
  const documentMessages = messages.vendor.documents;
  return (
    <>
      <p className="truncate type-small text-ink-2">
        {latest.fileName} · {formatSize(latest.sizeBytes)}
      </p>
      <div>
        <StatusChip
          tone={DOCUMENT_TONES[latest.status]}
          label={documentMessages.status[latest.status]}
        />
      </div>
      {latest.status === DocumentStatus.Rejected && latest.rejectReason ? (
        <p className="type-small text-ink">
          {fill(documentMessages.rejectedReason, { reason: latest.rejectReason })}
        </p>
      ) : null}
    </>
  );
}

function UploadProgress({ progress, onCancel }: { progress: number; onCancel: () => void }) {
  const messages = useMessages();
  const percent = Math.round(progress * 100);
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <div className="h-full bg-ink" style={{ width: `${percent}%` }} />
        </div>
        <Button type="button" variant="quiet" size="small" onClick={onCancel}>
          {messages.common.cancel}
        </Button>
      </div>
      <p role="status" className="type-small text-ink-2 tabular-nums">
        {fill(messages.vendor.documents.uploading, { percent })}
      </p>
    </div>
  );
}

/** Removing a document nobody has reviewed yet asks first. */
function RemoveDocument({
  vendorDocument,
  label,
  isRemoving,
  onRemove,
}: {
  vendorDocument: VendorDocument;
  label: string;
  isRemoving: boolean;
  onRemove: () => void;
}) {
  const messages = useMessages();
  const documentMessages = messages.vendor.documents;
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" size="small" disabled={isRemoving}>
          {documentMessages.remove}
          <span className="sr-only">: {label}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{documentMessages.removeTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {fill(documentMessages.removeBody, { name: vendorDocument.fileName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{messages.common.cancel}</AlertDialogCancel>
          <AlertDialogAction variant="destructiveConfirm" onClick={onRemove}>
            {documentMessages.remove}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
