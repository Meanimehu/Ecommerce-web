import { z } from 'zod';
import { pageOf } from '@/types/common';
import type { components } from '@/types/generated/backend-api';
import { paiseToRupees, rupeesToPaise } from '@/features/product/types';
import { isoToIst, istToIso } from '@/features/sales/types';

/**
 * Backend Area 5, part 3, coupons: response shapes written by hand from the API reference (D3-01),
 * the staff's coupon form and small rules the screens share. Source: Meanimehu/Ecommerce
 * docs/api/reference/area-5-sales-cart-coupons.md, "Part 3. Coupons". Extra fields are ignored; a
 * missing or wrong required field is a mismatch (D3-02). The enum values are the backend's words.
 */

export enum CouponStatus {
  Active = 'active',
  /** A vendor or split coupon waiting for the vendor to accept its exact terms. */
  PendingVendor = 'pending_vendor',
  Disabled = 'disabled',
}

export const COUPON_STATUSES: readonly CouponStatus[] = [
  CouponStatus.Active,
  CouponStatus.PendingVendor,
  CouponStatus.Disabled,
];

export function isCouponStatus(value: string | null): value is CouponStatus {
  return value !== null && (COUPON_STATUSES as readonly string[]).includes(value);
}

export enum DiscountType {
  /** `value` in basis points: 1000 is 10%. */
  Percent = 'percent',
  /** `value` in paise. */
  Fixed = 'fixed',
}

export enum FundedBy {
  Marketplace = 'marketplace',
  Vendor = 'vendor',
  Split = 'split',
}

export const FUNDED_BY: readonly FundedBy[] = Object.values(FundedBy);

/** Whether a coupon charges a vendor, and so waits for the vendor's acceptance. */
export const chargesVendor = (fundedBy: FundedBy) => fundedBy !== FundedBy.Marketplace;

export const CouponSchema = z.object({
  id: z.string(),
  code: z.string(),
  status: z.enum(CouponStatus),
  discountType: z.enum(DiscountType),
  value: z.number().int(),
  maxDiscountPaise: z.number().int().nullable(),
  minCartPaise: z.number().int(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  usageLimit: z.number().int().nullable(),
  perUserLimit: z.number().int().nullable(),
  fundedBy: z.enum(FundedBy),
  vendorId: z.string().nullable(),
  marketplaceShareBps: z.number().int(),
  excludeSaleItems: z.boolean(),
  categoryIds: z.array(z.string()),
  productIds: z.array(z.string()),
  termsDigest: z.string(),
  maxExposurePaise: z.number().int().nullable(),
  vendorAcceptedAt: z.string().nullable(),
  requestId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  /** Only the list and the detail carry it; a change answers without it. */
  usage: z
    .object({
      held: z.number().int(),
      released: z.number().int(),
      remaining: z.number().int().nullable(),
      overLimitReclaims: z.number().int(),
    })
    .optional(),
});
export type Coupon = z.infer<typeof CouponSchema>;

/** The terms every coupon and coupon request has; who pays and the vendor's side are a coupon's. */
export type CouponTermsShape = Pick<
  Coupon,
  | 'discountType'
  | 'value'
  | 'maxDiscountPaise'
  | 'minCartPaise'
  | 'startsAt'
  | 'endsAt'
  | 'usageLimit'
  | 'perUserLimit'
  | 'excludeSaleItems'
  | 'categoryIds'
  | 'productIds'
> &
  Partial<
    Pick<
      Coupon,
      'fundedBy' | 'vendorId' | 'marketplaceShareBps' | 'maxExposurePaise' | 'vendorAcceptedAt'
    >
  >;

export const CouponPageSchema = pageOf(CouponSchema);

/** Request bodies, from the generated backend types (D7-02). The backend checks every field. */
export type CreateCouponBody = components['schemas']['CreateCouponDto'];
export type ChangeCouponBody = components['schemas']['UpdateCouponDto'];
export type CouponReasonBody = components['schemas']['ReasonDto'];
export type AcceptCouponBody = components['schemas']['AcceptCouponDto'];

/** The longest reason the backend takes for disabling a coupon. */
export const COUPON_REASON_MAX_LENGTH = 500;
/** The most categories and products one coupon can be limited to. */
export const COUPON_LIST_MAX = 50;

const ID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isIdShape = (value: string) => ID_SHAPE.test(value);

/** "10%" or "12.5%" from basis points. */
export function bpsToPercentText(bps: number): string {
  return String(bps / 100);
}

// ---- The staff's coupon form (Document 5, section 8.3). Only cheap, certain checks. ----

const text = z.string().trim();
const CODE = /^[A-Za-z0-9_-]{3,20}$/;
const PERCENT = /^\d{1,3}(\.\d{1,2})?$/;
const DATE_TIME_TEXT = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})?$/;

const optionalRupees = text.refine((value) => value === '' || rupeesToPaise(value) !== null, {
  message: 'validation.moneyShape',
});
const optionalWhole = text.regex(/^(\d{1,8})?$/, 'validation.wholeNumber');

export const CouponFormSchema = z
  .object({
    code: text.regex(CODE, 'validation.couponCode'),
    discountType: z.enum(DiscountType),
    value: text.min(1, 'validation.required'),
    maxDiscount: optionalRupees,
    minCart: optionalRupees,
    startsAt: text.regex(DATE_TIME_TEXT, 'validation.required'),
    endsAt: text.regex(DATE_TIME_TEXT, 'validation.required'),
    usageLimit: optionalWhole,
    perUserLimit: optionalWhole,
    excludeSaleItems: z.boolean(),
    fundedBy: z.enum(FundedBy),
    vendorId: text,
    marketplaceShare: text,
    categoryIds: z.array(z.string()),
    productIds: text,
  })
  .superRefine((values, context) => {
    const isPercent = values.discountType === DiscountType.Percent;
    if (isPercent ? !PERCENT.test(values.value) : rupeesToPaise(values.value) === null) {
      context.addIssue({
        code: 'custom',
        path: ['value'],
        message: isPercent ? 'validation.percentShape' : 'validation.moneyShape',
      });
    }
    if (chargesVendor(values.fundedBy) && !isIdShape(values.vendorId)) {
      context.addIssue({ code: 'custom', path: ['vendorId'], message: 'validation.idShape' });
    }
    if (
      values.fundedBy === FundedBy.Marketplace &&
      values.vendorId &&
      !isIdShape(values.vendorId)
    ) {
      context.addIssue({ code: 'custom', path: ['vendorId'], message: 'validation.idShape' });
    }
    if (values.fundedBy === FundedBy.Split && !PERCENT.test(values.marketplaceShare)) {
      context.addIssue({
        code: 'custom',
        path: ['marketplaceShare'],
        message: 'validation.percentShape',
      });
    }
    if (productIdsOf(values.productIds).some((id) => !isIdShape(id))) {
      context.addIssue({ code: 'custom', path: ['productIds'], message: 'validation.idShape' });
    }
  });
export type CouponFormInput = z.input<typeof CouponFormSchema>;
export type CouponFormValues = z.output<typeof CouponFormSchema>;

/** The product ids typed one per line (or separated by commas or spaces). */
export function productIdsOf(typed: string): string[] {
  return typed
    .split(/[\s,]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

const paiseOrNull = (rupees: string) => (rupees === '' ? null : (rupeesToPaise(rupees) ?? 0));
const wholeOrNull = (typed: string) => (typed === '' ? null : Number(typed));
const timeOrNull = (typed: string) => (typed === '' ? null : istToIso(typed));

/** Every term the form holds, as the backend names it, in its units. */
export function couponTerms(values: CouponFormValues) {
  const isPercent = values.discountType === DiscountType.Percent;
  return {
    discountType: values.discountType,
    value: isPercent ? Math.round(Number(values.value) * 100) : (rupeesToPaise(values.value) ?? 0),
    maxDiscountPaise: paiseOrNull(values.maxDiscount),
    minCartPaise: paiseOrNull(values.minCart) ?? 0,
    startsAt: timeOrNull(values.startsAt),
    endsAt: timeOrNull(values.endsAt),
    usageLimit: wholeOrNull(values.usageLimit),
    perUserLimit: wholeOrNull(values.perUserLimit),
    excludeSaleItems: values.excludeSaleItems,
    fundedBy: values.fundedBy,
    vendorId: values.vendorId === '' ? null : values.vendorId,
    marketplaceShareBps: Math.round(Number(values.marketplaceShare) * 100),
    categoryIds: values.categoryIds,
    productIds: productIdsOf(values.productIds),
  };
}

/**
 * A new coupon: empty optional terms are left out, so the backend's defaults apply. The share is
 * sent only for a split coupon, and a vendor only when one is typed.
 */
export function newCoupon(values: CouponFormValues): CreateCouponBody {
  const terms = couponTerms(values);
  const body: CreateCouponBody = {
    code: values.code.toUpperCase(),
    discountType: terms.discountType,
    value: terms.value,
    fundedBy: terms.fundedBy,
    minCartPaise: terms.minCartPaise,
    excludeSaleItems: terms.excludeSaleItems,
    categoryIds: terms.categoryIds,
    productIds: terms.productIds,
  };
  if (terms.maxDiscountPaise !== null) body.maxDiscountPaise = terms.maxDiscountPaise;
  if (terms.startsAt) body.startsAt = terms.startsAt;
  if (terms.endsAt) body.endsAt = terms.endsAt;
  if (terms.usageLimit !== null) body.usageLimit = terms.usageLimit;
  if (terms.perUserLimit !== null) body.perUserLimit = terms.perUserLimit;
  if (terms.vendorId) body.vendorId = terms.vendorId;
  if (terms.fundedBy === FundedBy.Split) body.marketplaceShareBps = terms.marketplaceShareBps;
  return body;
}

/** Which backend terms each form field fills. The code never changes after creation. */
const TERMS_OF_FIELD = {
  discountType: ['discountType', 'value'],
  value: ['value'],
  maxDiscount: ['maxDiscountPaise'],
  minCart: ['minCartPaise'],
  startsAt: ['startsAt'],
  endsAt: ['endsAt'],
  usageLimit: ['usageLimit'],
  perUserLimit: ['perUserLimit'],
  excludeSaleItems: ['excludeSaleItems'],
  fundedBy: ['fundedBy', 'vendorId', 'marketplaceShareBps'],
  vendorId: ['vendorId'],
  marketplaceShare: ['marketplaceShareBps'],
  categoryIds: ['categoryIds'],
  productIds: ['productIds'],
} as const satisfies Partial<Record<keyof CouponFormInput, readonly string[]>>;

/**
 * A change: only the terms whose fields changed (Document 7, 20.9). An emptied optional term is
 * sent as null, which removes it; the backend decides what may still change.
 */
export function changedCoupon(
  values: CouponFormValues,
  dirty: Partial<Record<keyof CouponFormInput, unknown>>,
): ChangeCouponBody {
  const terms = couponTerms(values);
  const sent = new Set<string>();
  for (const [field, names] of Object.entries(TERMS_OF_FIELD)) {
    if (dirty[field as keyof CouponFormInput]) for (const name of names) sent.add(name);
  }
  if (terms.fundedBy !== FundedBy.Split) sent.delete('marketplaceShareBps');
  return Object.fromEntries(
    Object.entries(terms).filter(([name]) => sent.has(name)),
  ) as ChangeCouponBody;
}

/** The form's starting values: empty for a new coupon, the coupon's terms for a change. */
export function couponFormDefaults(coupon?: Coupon): CouponFormInput {
  if (!coupon) {
    return {
      code: '',
      discountType: DiscountType.Percent,
      value: '',
      maxDiscount: '',
      minCart: '',
      startsAt: '',
      endsAt: '',
      usageLimit: '',
      perUserLimit: '',
      excludeSaleItems: false,
      fundedBy: FundedBy.Marketplace,
      vendorId: '',
      marketplaceShare: '',
      categoryIds: [],
      productIds: '',
    };
  }
  const isPercent = coupon.discountType === DiscountType.Percent;
  const rupeesOrEmpty = (paise: number | null) => (paise === null ? '' : paiseToRupees(paise));
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    value: isPercent ? bpsToPercentText(coupon.value) : paiseToRupees(coupon.value),
    maxDiscount: rupeesOrEmpty(coupon.maxDiscountPaise),
    minCart: coupon.minCartPaise === 0 ? '' : paiseToRupees(coupon.minCartPaise),
    startsAt: coupon.startsAt ? isoToIst(coupon.startsAt) : '',
    endsAt: coupon.endsAt ? isoToIst(coupon.endsAt) : '',
    usageLimit: coupon.usageLimit === null ? '' : String(coupon.usageLimit),
    perUserLimit: coupon.perUserLimit === null ? '' : String(coupon.perUserLimit),
    excludeSaleItems: coupon.excludeSaleItems,
    fundedBy: coupon.fundedBy,
    vendorId: coupon.vendorId ?? '',
    marketplaceShare:
      coupon.fundedBy === FundedBy.Split ? bpsToPercentText(coupon.marketplaceShareBps) : '',
    categoryIds: coupon.categoryIds,
    productIds: coupon.productIds.join('\n'),
  };
}

// ---- Coupon requests (Area 5, part 4): a vendor proposes a coupon it pays for; staff decide ----

export enum CouponRequestStatus {
  Draft = 'draft',
  Submitted = 'submitted',
  ChangesRequested = 'changes_requested',
  Approved = 'approved',
  Rejected = 'rejected',
  Withdrawn = 'withdrawn',
  Declined = 'declined',
}

export const COUPON_REQUEST_STATUSES: readonly CouponRequestStatus[] =
  Object.values(CouponRequestStatus);

export function isCouponRequestStatus(value: string | null): value is CouponRequestStatus {
  return value !== null && (COUPON_REQUEST_STATUSES as readonly string[]).includes(value);
}

/** The vendor edits and submits a draft, or a request whose changes were asked for. */
export const canEditRequest = (status: CouponRequestStatus) =>
  status === CouponRequestStatus.Draft || status === CouponRequestStatus.ChangesRequested;

/** A request can be withdrawn until it is decided. */
export const canWithdrawRequest = (status: CouponRequestStatus) =>
  canEditRequest(status) || status === CouponRequestStatus.Submitted;

/** Who took a step in a request's history. */
export enum RequestActor {
  Vendor = 'vendor',
  Staff = 'staff',
  System = 'system',
}

const RequestTermsSchema = z.object({
  discountType: z.enum(DiscountType),
  value: z.number().int(),
  maxDiscountPaise: z.number().int().nullable(),
  minCartPaise: z.number().int(),
  startsAt: z.string(),
  endsAt: z.string(),
  usageLimit: z.number().int(),
  perUserLimit: z.number().int(),
  excludeSaleItems: z.boolean(),
  categoryIds: z.array(z.string()),
  productIds: z.array(z.string()),
});

export const CouponRequestSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  status: z.enum(CouponRequestStatus),
  revision: z.number().int(),
  proposedCode: z.string().nullable(),
  note: z.string().nullable(),
  terms: RequestTermsSchema,
  maxExposurePaise: z.number().int().nullable(),
  submittedAt: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  feedback: z.string().nullable(),
  coupon: z.object({ id: z.string(), code: z.string(), status: z.enum(CouponStatus) }).nullable(),
  /** Only the staff's view carries it. */
  reviewedBy: z.string().nullable().optional(),
  requestedBy: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CouponRequest = z.infer<typeof CouponRequestSchema>;

export const CouponRequestStepSchema = z.object({
  id: z.string(),
  revision: z.number().int(),
  actorKind: z.enum(RequestActor),
  /** The backend's words for the step; new ones are shown as they come. */
  action: z.string(),
  toStatus: z.string(),
  note: z.string().nullable(),
  createdAt: z.string(),
});
export type CouponRequestStep = z.infer<typeof CouponRequestStepSchema>;

export const CouponRequestViewSchema = CouponRequestSchema.extend({
  timeline: z.array(CouponRequestStepSchema),
});
export type CouponRequestView = z.infer<typeof CouponRequestViewSchema>;

export const CouponRequestPageSchema = pageOf(CouponRequestSchema);

export type CreateCouponRequestBody = components['schemas']['CreateCouponRequestDto'];
export type ChangeCouponRequestBody = components['schemas']['UpdateCouponRequestDto'];
export type WithdrawCouponRequestBody = components['schemas']['OptionalReasonDto'];
export type ApproveCouponRequestBody = components['schemas']['ApproveCouponRequestDto'];
export type CouponRequestNoteBody = components['schemas']['RequestNoteDto'];

/** A staff decision on a submitted request, as the backend's address names it. */
export enum RequestDecision {
  Approve = 'approve',
  RequestChanges = 'request-changes',
  Reject = 'reject',
}

const REQUEST_DECISIONS: readonly string[] = Object.values(RequestDecision);

export const isRequestDecision = (value: string): value is RequestDecision =>
  REQUEST_DECISIONS.includes(value);

/** The longest note the backend takes with a request, and with a staff decision. */
export const REQUEST_NOTE_MAX_LENGTH = 2000;

/** A request's terms as the terms list shows them, with the most the vendor could pay. */
export const requestTermsShape = (request: CouponRequest): CouponTermsShape => ({
  ...request.terms,
  maxExposurePaise: request.maxExposurePaise,
});

// ---- The vendor's coupon request form. The vendor pays all of it, so there is no "who pays". ----

const DATE_TIME_REQUIRED = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const requiredWhole = text.regex(/^\d{1,8}$/, 'validation.wholeNumber');

export const RequestFormSchema = z
  .object({
    proposedCode: text.regex(/^([A-Za-z0-9_-]{3,20})?$/, 'validation.couponCode'),
    note: text.max(REQUEST_NOTE_MAX_LENGTH),
    discountType: z.enum(DiscountType),
    value: text.min(1, 'validation.required'),
    maxDiscount: optionalRupees,
    minCart: optionalRupees,
    startsAt: text.regex(DATE_TIME_REQUIRED, 'validation.required'),
    endsAt: text.regex(DATE_TIME_REQUIRED, 'validation.required'),
    usageLimit: requiredWhole,
    perUserLimit: requiredWhole,
    excludeSaleItems: z.boolean(),
    categoryIds: z.array(z.string()),
    productIds: z.array(z.string()),
  })
  .superRefine((values, context) => {
    const isPercent = values.discountType === DiscountType.Percent;
    if (isPercent ? !PERCENT.test(values.value) : rupeesToPaise(values.value) === null) {
      context.addIssue({
        code: 'custom',
        path: ['value'],
        message: isPercent ? 'validation.percentShape' : 'validation.moneyShape',
      });
    }
    // The backend needs a cap for a percentage (area-5-sales-cart-coupons.md, part 4, rules).
    if (isPercent && values.maxDiscount === '') {
      context.addIssue({ code: 'custom', path: ['maxDiscount'], message: 'validation.required' });
    }
  });
export type RequestFormInput = z.input<typeof RequestFormSchema>;
export type RequestFormValues = z.output<typeof RequestFormSchema>;

/** The request's terms in the backend's units. */
function requestTerms(values: RequestFormValues) {
  const isPercent = values.discountType === DiscountType.Percent;
  return {
    proposedCode: values.proposedCode === '' ? null : values.proposedCode.toUpperCase(),
    note: values.note === '' ? null : values.note,
    discountType: values.discountType,
    value: isPercent ? Math.round(Number(values.value) * 100) : (rupeesToPaise(values.value) ?? 0),
    maxDiscountPaise: isPercent ? paiseOrNull(values.maxDiscount) : null,
    minCartPaise: paiseOrNull(values.minCart) ?? 0,
    startsAt: istToIso(values.startsAt),
    endsAt: istToIso(values.endsAt),
    usageLimit: Number(values.usageLimit),
    perUserLimit: Number(values.perUserLimit),
    excludeSaleItems: values.excludeSaleItems,
    categoryIds: values.categoryIds,
    productIds: values.productIds,
  };
}

/** A new request, saved as a draft: an empty code or note, and a cap on a fixed amount, are left out. */
export function newCouponRequest(values: RequestFormValues): CreateCouponRequestBody {
  const { proposedCode, note, maxDiscountPaise, ...terms } = requestTerms(values);
  return {
    ...terms,
    ...(proposedCode ? { proposedCode } : {}),
    ...(note ? { note } : {}),
    ...(maxDiscountPaise === null ? {} : { maxDiscountPaise }),
  };
}

const REQUEST_TERMS_OF_FIELD = {
  proposedCode: ['proposedCode'],
  note: ['note'],
  discountType: ['discountType', 'value', 'maxDiscountPaise'],
  value: ['value'],
  maxDiscount: ['maxDiscountPaise'],
  minCart: ['minCartPaise'],
  startsAt: ['startsAt'],
  endsAt: ['endsAt'],
  usageLimit: ['usageLimit'],
  perUserLimit: ['perUserLimit'],
  excludeSaleItems: ['excludeSaleItems'],
  categoryIds: ['categoryIds'],
  productIds: ['productIds'],
} as const satisfies Record<keyof RequestFormInput, readonly string[]>;

/** A change: only the changed terms; an emptied code or note is sent as null, which clears it. */
export function changedCouponRequest(
  values: RequestFormValues,
  dirty: Partial<Record<keyof RequestFormInput, unknown>>,
): ChangeCouponRequestBody {
  const terms = requestTerms(values);
  const sent = new Set<string>();
  for (const [field, names] of Object.entries(REQUEST_TERMS_OF_FIELD)) {
    if (dirty[field as keyof RequestFormInput]) for (const name of names) sent.add(name);
  }
  return Object.fromEntries(
    Object.entries(terms).filter(([name]) => sent.has(name)),
  ) as ChangeCouponRequestBody;
}

/** The form's starting values: a new request starts in an hour, for a week; a change, as it is. */
export function requestFormDefaults(request?: CouponRequest, now = Date.now()): RequestFormInput {
  if (!request) {
    const hour = 3_600_000;
    const start = Math.ceil(now / hour) * hour + hour;
    return {
      proposedCode: '',
      note: '',
      discountType: DiscountType.Fixed,
      value: '',
      maxDiscount: '',
      minCart: '',
      startsAt: isoToIst(new Date(start).toISOString()),
      endsAt: isoToIst(new Date(start + 7 * 24 * hour).toISOString()),
      usageLimit: '',
      perUserLimit: '1',
      excludeSaleItems: false,
      categoryIds: [],
      productIds: [],
    };
  }
  const { terms } = request;
  const isPercent = terms.discountType === DiscountType.Percent;
  return {
    proposedCode: request.proposedCode ?? '',
    note: request.note ?? '',
    discountType: terms.discountType,
    value: isPercent ? bpsToPercentText(terms.value) : paiseToRupees(terms.value),
    maxDiscount: terms.maxDiscountPaise === null ? '' : paiseToRupees(terms.maxDiscountPaise),
    minCart: terms.minCartPaise === 0 ? '' : paiseToRupees(terms.minCartPaise),
    startsAt: isoToIst(terms.startsAt),
    endsAt: isoToIst(terms.endsAt),
    usageLimit: String(terms.usageLimit),
    perUserLimit: String(terms.perUserLimit),
    excludeSaleItems: terms.excludeSaleItems,
    categoryIds: terms.categoryIds,
    productIds: terms.productIds,
  };
}

/** The staff's approve form: a final code (the proposed one unless changed) and a note. */
export const ApproveFormSchema = z.object({
  code: text.regex(/^([A-Za-z0-9_-]{3,20})?$/, 'validation.couponCode'),
  note: text.max(REQUEST_NOTE_MAX_LENGTH),
});
export type ApproveFormInput = z.input<typeof ApproveFormSchema>;
export type ApproveFormValues = z.output<typeof ApproveFormSchema>;

/** The approve body: the code only when one is typed, the note only when written. */
export function approveBody(values: ApproveFormValues): ApproveCouponRequestBody {
  return {
    ...(values.code ? { code: values.code.toUpperCase() } : {}),
    ...(values.note ? { note: values.note } : {}),
  };
}
