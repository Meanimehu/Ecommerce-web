import { describe, expect, it } from 'vitest';
import {
  auditQuery,
  AuditRowSchema,
  badFilters,
  changedNames,
  istDayEnd,
  istDayStart,
  type AuditFilters,
} from '@/features/audit/types';

/** The audit log's filters and rows (area-1-accounts.md, section 5; Document 8, Slice 5 notes). */
const NO_FILTERS: AuditFilters = {
  action: '',
  entityType: '',
  entityId: '',
  actorId: '',
  from: '',
  to: '',
};
const AN_ID = '01a1a123-c189-7809-91b9-1822ed334dc2';

describe('the audit log', () => {
  it('turns a day in IST into the whole of that day, as ISO times', () => {
    expect(istDayStart('2026-11-21')).toBe('2026-11-20T18:30:00.000Z');
    expect(istDayEnd('2026-11-21')).toBe('2026-11-21T18:30:00.000Z');
  });

  it('sends only the filters that are set, and leaves out an unknown kind of record', () => {
    expect(auditQuery(NO_FILTERS)).toEqual({
      action: undefined,
      entityType: undefined,
      entityId: undefined,
      actorId: undefined,
      from: undefined,
      to: undefined,
    });
    expect(
      auditQuery({
        ...NO_FILTERS,
        action: ' user.block ',
        entityType: 'nonsense',
        entityId: AN_ID,
      }),
    ).toMatchObject({ action: 'user.block', entityType: undefined, entityId: AN_ID });
    expect(auditQuery({ ...NO_FILTERS, entityType: 'user', from: '2026-11-21' })).toMatchObject({
      entityType: 'user',
      from: '2026-11-20T18:30:00.000Z',
    });
  });

  it('marks ids and days with the wrong shape, so nothing is asked', () => {
    expect(badFilters(NO_FILTERS)).toEqual([]);
    expect(
      badFilters({
        ...NO_FILTERS,
        entityId: '01a1',
        actorId: AN_ID,
        from: '21-11-2026',
        to: '2026-11-21',
      }),
    ).toEqual(['entityId', 'from']);
  });

  it('lists every value a row changed, once', () => {
    const row = AuditRowSchema.parse({
      id: 'r1',
      createdAt: '2026-11-03T11:20:53.801Z',
      actorId: AN_ID,
      actorRole: 'admin',
      action: 'user.block',
      entityType: 'user',
      entityId: AN_ID,
      before: { status: 'active' },
      after: { status: 'blocked', blockedAt: 'x' },
      reason: 'Repeated fake orders',
      requestId: 'q1',
    });
    expect(changedNames(row)).toEqual(['status', 'blockedAt']);
  });
});
