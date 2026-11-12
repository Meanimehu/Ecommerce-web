/**
 * Upload limits, copied from the backend so the browser can say at once when a file will not be taken (Document 3,
 * section 10). The backend always decides: it reads the real file type, and its answer is what counts.
 * Sources: area-2-vendors.md (documents: PDF, JPEG or PNG, 5 MB); area-3b-products.md (photos: JPEG, PNG or WebP, 10 MB,
 * 8 per product).
 */
const MB = 1024 * 1024;

export const UPLOAD_RULES = {
  document: { maxBytes: 5 * MB, types: ['application/pdf', 'image/jpeg', 'image/png'], accept: '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png' },
  photo: { maxBytes: 10 * MB, types: ['image/jpeg', 'image/png', 'image/webp'], accept: '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp' },
} as const;

export type UploadKind = keyof typeof UPLOAD_RULES;

/** The backend's own code for a file the browser can already tell will be refused, or null. */
export function checkFile(file: { size: number; type: string }, kind: UploadKind): 'FILE_TOO_LARGE' | 'FILE_TYPE_NOT_ALLOWED' | null {
  const rule = UPLOAD_RULES[kind];
  if (file.size > rule.maxBytes) return 'FILE_TOO_LARGE';
  // An empty type means the browser could not tell; the backend reads the file and decides.
  if (file.type && !(rule.types as readonly string[]).includes(file.type)) return 'FILE_TYPE_NOT_ALLOWED';
  return null;
}

/** "2.4 MB", "320 KB": file sizes as people read them. */
export function formatSize(bytes: number): string {
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
