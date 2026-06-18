import Cookies from 'js-cookie'
import { authApi } from './api'
import type { User } from '@/types'

export async function login(email: string, password: string): Promise<User> {
  const res = await authApi.login(email, password)
  Cookies.set('token', res.data.access_token, { expires: 1 })
  const me = await authApi.me()
  return me.data
}

export async function register(data: { email: string; username: string; password: string }): Promise<User> {
  await authApi.register(data)
  return login(data.email, data.password)
}

export function logout() {
  Cookies.remove('token')
  window.location.href = '/login'
}

export function getToken(): string | undefined {
  return Cookies.get('token')
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await authApi.me()
    return res.data
  } catch {
    return null
  }
}
