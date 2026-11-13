import { describe, expect, it } from 'vitest';
import { addressBody } from '@/features/vendor/hooks/use-vendor-address-form';
import { changedDetails, newApplication } from '@/features/vendor/hooks/use-vendor-details-form';
import {
  AddressType,
  ApplyStep,
  isApplyStep,
  isDocumentDecision,
  isEditable,
  isSellerType,
  isVendorDecision,
  MissingItem,
  SellerType,
  stepFor,
  VendorStatus,
  type Vendor,
} from '@/features/vendor/types';

const details = {
  legalName: 'Asha Textiles Pvt Ltd',
  displayName: 'Asha Textiles',
  gstin: '',
  sellerType: SellerType.PrivateLimited,
  contactEmail: 'hello@asha.example',
};

describe('vendor application (Document 5, section 7.1)', () => {
  it('links each missing item to the step that fixes it', () => {
    expect(stepFor(MissingItem.SellerType)).toBe(ApplyStep.Details);
    expect(stepFor(MissingItem.ContactEmail)).toBe(ApplyStep.Details);
    expect(stepFor(MissingItem.PickupAddress)).toBe(ApplyStep.Address);
    expect(stepFor(MissingItem.PanDocument)).toBe(ApplyStep.Documents);
    expect(stepFor('document:address_proof')).toBe(ApplyStep.Documents);
  });

  it('lets the owner change only a draft or a rejected application', () => {
    expect(isEditable(VendorStatus.Draft)).toBe(true);
    expect(isEditable(VendorStatus.Rejected)).toBe(true);
    expect(isEditable(VendorStatus.Submitted)).toBe(false);
    expect(isEditable(VendorStatus.Approved)).toBe(false);
    expect(isEditable(VendorStatus.Suspended)).toBe(false);
  });

  it('accepts only known steps, seller types and decisions from addresses and requests', () => {
    expect(isApplyStep('address')).toBe(true);
    expect(isApplyStep('payment')).toBe(false);
    expect(isApplyStep(null)).toBe(false);
    expect(isSellerType('llp')).toBe(true);
    expect(isSellerType('')).toBe(false);
    expect(isVendorDecision('unsuspend')).toBe(true);
    expect(isVendorDecision('delete')).toBe(false);
    expect(isDocumentDecision('reject')).toBe(true);
    expect(isDocumentDecision('suspend')).toBe(false);
  });
});

describe('what the details step sends', () => {
  it('a new application sends every detail and leaves out an empty GSTIN', () => {
    expect(newApplication(details)).toEqual({
      legalName: 'Asha Textiles Pvt Ltd',
      displayName: 'Asha Textiles',
      sellerType: 'private_limited',
      contactEmail: 'hello@asha.example',
    });
    expect(newApplication({ ...details, gstin: '29ABCDE1234F1Z5' }).gstin).toBe('29ABCDE1234F1Z5');
  });

  it('an existing application sends only the changed fields', () => {
    const vendor = { gstin: null } as Vendor;
    expect(changedDetails(details, vendor, { displayName: true })).toEqual({
      displayName: 'Asha Textiles',
    });
    expect(changedDetails(details, vendor, {})).toEqual({});
  });

  it('an emptied GSTIN is removed with null, and only if there was one', () => {
    expect(
      changedDetails(details, { gstin: '29ABCDE1234F1Z5' } as Vendor, { gstin: true }),
    ).toEqual({ gstin: null });
    expect(changedDetails(details, { gstin: null } as Vendor, { gstin: true })).toEqual({});
  });
});

describe('what the address form sends', () => {
  const address = {
    type: AddressType.Pickup,
    line1: '12 MG Road',
    line2: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    contactPhone: '9876543210',
  };

  it('leaves out an empty second line, and keeps a filled one', () => {
    expect(addressBody(address)).not.toHaveProperty('line2');
    expect(addressBody({ ...address, line2: 'Near the metro' }).line2).toBe('Near the metro');
  });
});
