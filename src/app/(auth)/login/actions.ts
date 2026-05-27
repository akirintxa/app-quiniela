'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import {
  consumePendingPoolInvite,
  getPendingPoolInviteCode,
  joinResultRedirectPath,
} from '@/lib/pool-invite'
import {
  clearPendingRecoveryEmail,
  clearPendingSignupEmail,
  clearPendingSignupPassword,
  getPendingRecoveryEmail,
  getPendingSignupEmail,
  getPendingSignupPassword,
  normalizeAuthEmail,
  setPendingRecoveryEmail,
  setPendingSignupEmail,
  setPendingSignupPassword,
} from '@/lib/auth-pending-email'
import { verifyEmailOtp } from '@/lib/verify-email-otp'
import { sendLoginOtpEmail } from '@/lib/send-auth-otp'

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
  if (msg.includes('confirmation_url_expired')) return 'El enlace de confirmación ha caducado.';
  if (msg.includes('user not found')) return 'Usuario no encontrado.';
  if (msg.includes('otp_expired')) return 'El código ha caducado. Solicita uno nuevo.';
  if (msg.includes('otp_disabled')) return 'El código no es válido. Comprueba los dígitos.';
  if (msg.includes('token has expired') || msg.includes('invalid token'))
    return 'Código incorrecto o caducado.';
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
  const email = (formData.get('email') as string)?.trim() ?? ''
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
      await setPendingSignupEmail(normalizeAuthEmail(email))
      await sendLoginOtpEmail(supabase, normalizeAuthEmail(email))
      redirect(
        loginQuery({
          status: 'awaiting_otp',
          email: normalizeAuthEmail(email),
          message: 'Confirma tu cuenta con el código del correo de acceso (Magic Link).',
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

  if (!email || !password) {
    redirect(loginQuery({ mode: 'signup', message: 'Email y contraseña son obligatorios.' }))
  }

  await setPendingSignupEmail(email)
  await clearPendingSignupPassword()

  // signUp dispara el correo "Confirm signup" (fiable con Confirm email ON)
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    redirect(
      loginQuery({
        mode: 'signup',
        message: translateError(signUpError.message),
        email,
      })
    )
  }

  if (data.user && data.user.identities && data.user.identities.length === 0) {
    redirect(loginQuery({ mode: 'login', error: 'already_registered', email }))
  }

  if (data.session) {
    await clearPendingSignupEmail()
    await redirectAfterAuth(supabase)
  }

  // Segundo correo: plantilla Magic Link (código que valida con type email)
  const { error: magicOtpError } = await sendLoginOtpEmail(supabase, email)

  if (magicOtpError) {
    console.error('sendLoginOtpEmail after signUp:', magicOtpError.message)
    redirect(
      loginQuery({
        mode: 'login',
        status: 'awaiting_otp',
        email,
        message:
          'Revisa tu correo (confirmación de cuenta). Si no llega nada en 2 min, pulsa Reenviar código.',
      })
    )
  }

  redirect(
    loginQuery({
      mode: 'login',
      status: 'awaiting_otp',
      email,
      message:
        'Te hemos enviado un código por correo. Si llegan dos emails, usa el de «Magic Link» / acceso.',
    })
  )
}

export async function verifySignupOtp(formData: FormData) {
  const supabase = await createClient()
  const cookieEmail = await getPendingSignupEmail()
  const formEmail = normalizeAuthEmail((formData.get('email') as string) ?? '')
  const email = cookieEmail || formEmail
  const token = ((formData.get('token') as string) ?? '').replace(/\D/g, '')

  if (!email || token.length < 6) {
    redirect(
      loginQuery({
        status: 'awaiting_otp',
        email,
        message: 'Introduce el código de 6 dígitos del correo.',
      })
    )
  }

  const result = await verifyEmailOtp(supabase, email, token, ['email', 'signup'])

  if (!result.ok) {
    redirect(
      loginQuery({
        status: 'awaiting_otp',
        email,
        message: translateError(result.message),
      })
    )
  }

  const pendingPassword = await getPendingSignupPassword()
  if (pendingPassword) {
    const { error: pwError } = await supabase.auth.updateUser({
      password: pendingPassword,
    })
    await clearPendingSignupPassword()
    if (pwError) {
      redirect(
        loginQuery({
          status: 'awaiting_otp',
          email,
          message: translateError(pwError.message),
        })
      )
    }
  }

  await clearPendingSignupEmail()
  await redirectAfterAuth(supabase)
}

export async function resendSignupOtp(formData: FormData) {
  const supabase = await createClient()
  const cookieEmail = await getPendingSignupEmail()
  const email = cookieEmail || normalizeAuthEmail((formData.get('email') as string) ?? '')

  if (!email) {
    redirect(loginQuery({ mode: 'signup', message: 'Indica tu correo electrónico.' }))
  }

  await setPendingSignupEmail(email)

  const { error: resendError } = await supabase.auth.resend({
    type: 'signup',
    email,
  })

  const { error: magicOtpError } = await sendLoginOtpEmail(supabase, email)

  if (resendError && magicOtpError) {
    redirect(
      loginQuery({
        status: 'awaiting_otp',
        email,
        message: translateError(resendError.message),
      })
    )
  }

  redirect(
    loginQuery({
      status: 'awaiting_otp',
      email,
      message: 'Código reenviado. Revisa el correo más reciente (Magic Link o confirmación).',
    })
  )
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()
  const email = normalizeAuthEmail((formData.get('email') as string) ?? '')

  const { error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) {
    redirect(
      `/forgot-password?error=${encodeURIComponent(translateError(error.message))}`
    )
  }

  await setPendingRecoveryEmail(email)
  redirect(
    `/forgot-password?status=sent&email=${encodeURIComponent(email)}`
  )
}

export async function verifyRecoveryOtp(formData: FormData) {
  const supabase = await createClient()
  const cookieEmail = await getPendingRecoveryEmail()
  const formEmail = normalizeAuthEmail((formData.get('email') as string) ?? '')
  const email = cookieEmail || formEmail
  const token = ((formData.get('token') as string) ?? '').replace(/\D/g, '')

  if (!email || token.length < 6) {
    redirect(
      `/forgot-password?status=sent&email=${encodeURIComponent(email)}&error=${encodeURIComponent('Introduce el código de 6 dígitos.')}`
    )
  }

  const result = await verifyEmailOtp(supabase, email, token, [
    'recovery',
    'email',
  ])

  if (!result.ok) {
    redirect(
      `/forgot-password?status=sent&email=${encodeURIComponent(email)}&error=${encodeURIComponent(translateError(result.message))}`
    )
  }

  await clearPendingRecoveryEmail()
  redirect('/update-password')
}

export async function resendRecoveryOtp(formData: FormData) {
  const supabase = await createClient()
  const cookieEmail = await getPendingRecoveryEmail()
  const email =
    cookieEmail || normalizeAuthEmail((formData.get('email') as string) ?? '')

  if (!email) {
    redirect('/forgot-password?error=' + encodeURIComponent('Indica tu correo.'))
  }

  await setPendingRecoveryEmail(email)

  const { error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) {
    redirect(
      `/forgot-password?status=sent&email=${encodeURIComponent(email)}&error=${encodeURIComponent(translateError(error.message))}`
    )
  }

  redirect(
    `/forgot-password?status=sent&email=${encodeURIComponent(email)}&message=${encodeURIComponent('Código nuevo enviado. Revisa tu correo.')}`
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
