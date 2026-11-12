import 'server-only';
import type { components } from '@/types/generated/backend-api';
import {
  LoginResultSchema,
  OtpRequestResultSchema,
  RefreshResultSchema,
  UserSchema,
} from '@/types/auth';
import { callBackend } from './client';

/**
 * Backend Area 1: login and session calls. Request bodies are the generated backend types (D7-02).
 */
type RequestOtpBody = components['schemas']['RequestOtpDto'];
type VerifyOtpBody = components['schemas']['VerifyOtpDto'];
type RefreshBody = components['schemas']['RefreshTokenDto'];

export const requestLoginCode = (body: RequestOtpBody) =>
  callBackend({
    method: 'POST',
    path: '/auth/otp/request',
    kind: 'loginCode',
    body,
    schema: OtpRequestResultSchema,
  });

export const verifyLoginCode = (body: VerifyOtpBody) =>
  callBackend({
    method: 'POST',
    path: '/auth/otp/verify',
    kind: 'loginCode',
    body,
    schema: LoginResultSchema,
  });

export const refreshTokens = (body: RefreshBody) =>
  callBackend({
    method: 'POST',
    path: '/auth/refresh',
    kind: 'refresh',
    body,
    schema: RefreshResultSchema,
  });

export const logout = (token: string) =>
  callBackend({ method: 'POST', path: '/auth/logout', kind: 'save', token, schema: null });

export const logoutEverywhere = (token: string) =>
  callBackend({ method: 'POST', path: '/auth/logout-all', kind: 'save', token, schema: null });

export const getMe = (token: string) =>
  callBackend({ method: 'GET', path: '/me', kind: 'view', token, schema: UserSchema });
