import 'server-only';
import { callBackend } from '@/api/client';
import { UserSchema } from '@/features/auth/types';
import {
  AddressListSchema,
  AddressSchema,
  type AddAddressBody,
  type UpdateAddressBody,
  type UpdateProfileBody,
} from '@/features/account/types';

/**
 * Backend Area 1, the person's own profile and saved addresses (area-1-accounts.md, sections 2 and
 * 3), always as that person. Another person's address is "not found", never "forbidden".
 */
const addressPath = (id: string) => `/me/addresses/${encodeURIComponent(id)}`;

/** Name and email only; send only what changes. The phone is never changed here. */
export const updateProfile = (token: string, body: UpdateProfileBody) =>
  callBackend({ method: 'PATCH', path: '/me', kind: 'save', token, body, schema: UserSchema });

/** The saved addresses, default first. */
export const listAddresses = (token: string) =>
  callBackend({
    method: 'GET',
    path: '/me/addresses',
    kind: 'view',
    token,
    schema: AddressListSchema,
  });

export const addAddress = (token: string, body: AddAddressBody) =>
  callBackend({
    method: 'POST',
    path: '/me/addresses',
    kind: 'save',
    token,
    body,
    schema: AddressSchema,
  });

export const updateAddress = (token: string, id: string, body: UpdateAddressBody) =>
  callBackend({
    method: 'PATCH',
    path: addressPath(id),
    kind: 'save',
    token,
    body,
    schema: AddressSchema,
  });

export const removeAddress = (token: string, id: string) =>
  callBackend({ method: 'DELETE', path: addressPath(id), kind: 'save', token, schema: null });

/** Makes this address the default; the one before stops being it. */
export const makeDefaultAddress = (token: string, id: string) =>
  callBackend({
    method: 'POST',
    path: `${addressPath(id)}/default`,
    kind: 'save',
    token,
    schema: AddressSchema,
  });
