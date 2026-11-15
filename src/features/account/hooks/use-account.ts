'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, remove, send } from '@/lib/http';
import type { User } from '@/features/auth/types';
import type {
  AddAddressBody,
  Address,
  UpdateAddressBody,
  UpdateProfileBody,
} from '@/features/account/types';

/**
 * The calls of `account`, one hook per call, to our own /api/me endpoints (D3-03). The addresses
 * arrive drawn on the server and are read again after every change.
 */
const PROFILE_PATH = '/api/me';
const ADDRESSES_PATH = '/api/me/addresses';
const addressPath = (id: string) => `${ADDRESSES_PATH}/${encodeURIComponent(id)}`;

export const accountKeys = {
  addresses: ['account', 'addresses'] as const,
};

/** The saved addresses, default first, starting from what the server drew. */
export const useAddresses = (drawn: Address[]) =>
  useQuery({
    queryKey: accountKeys.addresses,
    queryFn: () => get<Address[]>(ADDRESSES_PATH),
    initialData: drawn,
  });

function useReloadAddresses() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: accountKeys.addresses });
}

export const useUpdateProfile = () =>
  useMutation({ mutationFn: (body: UpdateProfileBody) => patch<User>(PROFILE_PATH, body) });

export function useAddAddress() {
  const reloadAddresses = useReloadAddresses();
  return useMutation({
    mutationFn: (body: AddAddressBody) => send<Address>(ADDRESSES_PATH, body),
    onSettled: reloadAddresses,
  });
}

export function useUpdateAddress() {
  const reloadAddresses = useReloadAddresses();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAddressBody }) =>
      patch<Address>(addressPath(id), body),
    onSettled: reloadAddresses,
  });
}

export function useRemoveAddress() {
  const reloadAddresses = useReloadAddresses();
  return useMutation({
    mutationFn: (id: string) => remove(addressPath(id)),
    onSettled: reloadAddresses,
  });
}

export function useMakeDefaultAddress() {
  const reloadAddresses = useReloadAddresses();
  return useMutation({
    mutationFn: (id: string) => send<Address>(`${addressPath(id)}/default`),
    onSettled: reloadAddresses,
  });
}
