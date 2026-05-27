'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import {
  consumePendingPoolInvite,
  getPendingPoolInviteCode,
  joinResultRedirectPath,
} from '@/lib/pool-invite'
import { normalizeAuthEmail } from '@/lib/normalize-auth-email'

function authCallbackUrl(origin: string, withJoinComplete: boolean) {
  if (withJoinComplete) {
    return `${origin}/auth/callback?next=${encodeURIComponent('/join/complete')}`
  }
  return `${origin}/auth/callback`
}

async function redirectAfterAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }

  const pending = await consumePendingPoolInvite(supabase, user.id)
  revalidatePath('/', 'layout')
  revalidatePath('/groups')

  if (pending) {
    if (pending.ok) revalidatePath(`/groups/${pending.poolId}`)
    redirect(joinResultRedirectPath(pending))
  }

  redirect('/')
}

function translateError(message: string) {
  const msg = message.toLowerCase();
  if (msg.includes('invalid login credentials')) return 'Email o contraseña incorrectos.';
  if (msg.includes('user already registered')) return 'Este correo ya está registrado.';
  if (msg.includes('email rate limit exceeded')) return 'Demasiados intentos. Espera un minuto.';
  if (msg.includes('password is too short')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('invalid email')) return 'El formato del correo no es válido.';
  if (msg.includes('confirmation_url_expired')) return 'El enlace ha caducado. Pide otro correo de confirmación.';
  if (msg.includes('user not found')) return 'Usuario no encontrado.';
  return 'Ha ocurrido un error. Inténtalo de nuevo.';
}

function loginQuery(params: {
  mode?: 'login' | 'signup'
  error?: string
  status?: string
  email?: string
  message?: string
}) {
  const q = new URLSearchParams()
  if (params.mode) q.set('mode', params.mode)
  if (params.error) q.set('error', params.error)
  if (params.status) q.set('status', params.status)
  if (params.email) q.set('email', params.email)
  if (params.message) q.set('message', params.message)
  const s = q.toString()
  return s ? `/login?${s}` : '/login'
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = normalizeAuthEmail((formData.get('email') as string) ?? '')
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('invalid login credentials')) {
      redirect(
        loginQuery({ mode: 'login', error: 'invalid_credentials', email })
      )
    }
    if (msg.includes('email not confirmed')) {
      redirect(
        loginQuery({
          status: 'check_email',
          email,
          message:
            'Confirma tu cuenta con el enlace del último correo que te enviamos.',
        })
      )
    }
    redirect(
      loginQuery({
        mode: 'login',
        message: translateError(error.message),
        email,
      })
    )
  }

  await redirectAfterAuth(supabase)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = normalizeAuthEmail((formData.get('email') as string) ?? '')
  const password = formData.get('password') as string
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const pendingInvite = await getPendingPoolInviteCode()
  const emailRedirectTo = authCallbackUrl(origin, !!pendingInvite)

  if (!email || !password) {
    redirect(loginQuery({ mode: 'signup', message: 'Email y contraseña son obligatorios.' }))
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  })

  if (error) {
    redirect(
      loginQuery({
        mode: 'signup',
        message: translateError(error.message),
        email,
      })
    )
  }

  if (data.user && data.user.identities && data.user.identities.length === 0) {
    redirect(loginQuery({ mode: 'login', error: 'already_registered', email }))
  }

  if (data.session) {
    await redirectAfterAuth(supabase)
  }

  redirect(
    loginQuery({
      mode: 'login',
      status: 'check_email',
      email,
      message:
        'Revisa tu correo y haz clic en el enlace de confirmación para activar tu cuenta.',
    })
  )
}

/** Reenvía el correo de confirmación (enlace, no código). */
export async function resendConfirmationEmail(formData: FormData) {
  const supabase = await createClient()
  const email = normalizeAuthEmail((formData.get('email') as string) ?? '')

  if (!email) {
    redirect(loginQuery({ mode: 'signup', message: 'Indica tu correo electrónico.' }))
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })

  if (error) {
    redirect(
      loginQuery({
        status: 'check_email',
        email,
        message: translateError(error.message),
      })
    )
  }

  redirect(
    loginQuery({
      status: 'check_email',
      email,
      message: 'Correo reenviado. Haz clic en el enlace del mensaje más reciente.',
    })
  )
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()
  const email = normalizeAuthEmail((formData.get('email') as string) ?? '')
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  })

  if (error) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(translateError(error.message))}`
    )
  }

  redirect(
    `/forgot-password?status=sent&email=${encodeURIComponent(email)}`
  )
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return redirect(`/update-password?message=${encodeURIComponent(translateError(error.message))}`)
  }

  await redirectAfterAuth(supabase)
}
