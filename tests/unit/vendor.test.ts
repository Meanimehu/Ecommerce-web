import { describe, expect, it } from 'vitest';
import { getMessages } from '@/lib/messages';
import { vendorNav } from '@/features/layout/menus';
import { changedProfileDetails } from '@/features/vendor/hooks/use-profile-details-form';
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
  ProfileDetailsFormSchema,
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

describe('the business profile (Document 5, section 8.2; Document 8, Slice 4 notes)', () => {
  it('sends only the shop name or email the person changed', () => {
    const values = { displayName: 'Asha Studio', contactEmail: 'shop@asha.example' };
    expect(changedProfileDetails(values, { displayName: true })).toEqual({
      displayName: 'Asha Studio',
    });
    expect(changedProfileDetails(values, { contactEmail: true })).toEqual({
      contactEmail: 'shop@asha.example',
    });
    expect(changedProfileDetails(values, {})).toEqual({});
  });

  it('checks the shop name and email before sending, and nothing else', () => {
    expect(
      ProfileDetailsFormSchema.safeParse({ displayName: ' ', contactEmail: 'a@b.in' }).success,
    ).toBe(false);
    expect(Object.keys(ProfileDetailsFormSchema.shape)).toEqual(['displayName', 'contactEmail']);
  });
});

describe('the Vendor area menu (approved screens)', () => {
  const messages = getMessages('en');

  it('a person with no vendor sees only the application', () => {
    expect(vendorNav('en', messages, false).map((item) => item.href)).toEqual(['/en/vendor/apply']);
  });

  it('a person with a vendor sees Home, Business profile, Products, Stock and Sales, and no Application', () => {
    expect(vendorNav('en', messages, true).map((item) => item.label)).toEqual([
      'Home',
      'Business profile',
      'Products',
      'Stock',
      'Sales',
    ]);
    expect(vendorNav('hi', getMessages('hi'), true).map((item) => item.href)).toEqual([
      '/hi/vendor',
      '/hi/vendor/profile',
      '/hi/vendor/products',
      '/hi/vendor/stock',
      '/hi/vendor/sales',
    ]);
  });
});
