'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

function translateError(message: string) {
  const msg = message.toLowerCase();
  if (msg.includes('invalid login credentials')) return 'Email o contraseña incorrectos.';
  if (msg.includes('user already registered')) return 'Este correo ya está registrado.';
  if (msg.includes('email rate limit exceeded')) return 'Demasiados intentos. Espera un minuto.';
  if (msg.includes('password is too short')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('invalid email')) return 'El formato del correo no es válido.';
  if (msg.includes('confirmation_url_expired')) return 'El enlace de confirmación ha caducado.';
  if (msg.includes('user not found')) return 'Usuario no encontrado.';
  return 'Ha ocurrido un error. Inténtalo de nuevo.';
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect(`/login?message=${encodeURIComponent(translateError(error.message))}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  // Si Supabase devuelve un error claro
  if (error) {
    return redirect(`/login?message=${encodeURIComponent(translateError(error.message))}`)
  }

  // Si el usuario ya existe pero no se ha confirmado, Supabase a veces devuelve data.user pero sin identidades nuevas
  // Para forzar el mensaje de "ya registrado" si la configuración de Supabase es estricta:
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return redirect(`/login?message=${encodeURIComponent('Este correo ya está registrado.')}`)
  }

  // Mensaje de éxito limpio sin caracteres especiales conflictivos
  return redirect('/login?message=' + encodeURIComponent('Registro casi listo. Revisa tu email para activar tu cuenta.'))
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  })

  if (error) {
    return redirect(`/forgot-password?message=${encodeURIComponent(translateError(error.message))}`)
  }

  return redirect('/forgot-password?message=' + encodeURIComponent('Revisa tu email para el enlace de recuperación.'))
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

  revalidatePath('/', 'layout')
  redirect('/')
}
