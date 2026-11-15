import { describe, expect, it } from 'vitest';
import { changedAddress, newAddress } from '@/features/account/hooks/use-address-form';
import { changedProfile } from '@/features/account/hooks/use-profile-form';
import { AddressFormSchema, ProfileFormSchema } from '@/features/account/types';

const address = {
  label: '',
  name: 'Meera Nair',
  phone: '9444444444',
  line1: '12 Park Street',
  line2: '',
  city: 'Kolkata',
  state: 'West Bengal',
  pincode: '700016',
};

describe('what the account forms send (Document 7, 20.9)', () => {
  it('a profile change sends only the changed fields', () => {
    expect(changedProfile({ name: 'Asha', email: 'a@b.in' }, { email: true })).toEqual({
      email: 'a@b.in',
    });
    expect(changedProfile({ name: 'Asha', email: '' }, {})).toEqual({});
  });

  it('a new address leaves out an empty label and second line', () => {
    expect(newAddress(address)).toEqual({
      name: 'Meera Nair',
      phone: '9444444444',
      line1: '12 Park Street',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700016',
    });
    expect(newAddress({ ...address, label: 'Home', line2: 'Flat 2' })).toMatchObject({
      label: 'Home',
      line2: 'Flat 2',
    });
  });

  it('an address change sends only the changed fields, an emptied one as empty', () => {
    expect(changedAddress({ ...address, pincode: '700092' }, { pincode: true })).toEqual({
      pincode: '700092',
    });
    expect(changedAddress(address, { line2: true })).toEqual({ line2: '' });
  });
});

describe('the account forms catch what is plainly wrong', () => {
  it('an email must look like one, or be empty', () => {
    expect(ProfileFormSchema.safeParse({ name: '', email: '' }).success).toBe(true);
    expect(ProfileFormSchema.safeParse({ name: '', email: 'asha@example' }).success).toBe(false);
    expect(ProfileFormSchema.safeParse({ name: '', email: 'asha@example.com' }).success).toBe(true);
  });

  it('an address needs its required fields and a 6-digit pin code', () => {
    expect(AddressFormSchema.safeParse(address).success).toBe(true);
    expect(AddressFormSchema.safeParse({ ...address, pincode: '7000' }).success).toBe(false);
    expect(AddressFormSchema.safeParse({ ...address, name: ' ' }).success).toBe(false);
  });
});
