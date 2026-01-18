'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // フォームから入力値を取得
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Supabase Authでログイン
  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // 実際にはエラーメッセージをトースト等で出すのが望ましいです
    console.error('Login error:', error.message)
    redirect('/error')
  }

  // キャッシュを更新して管理画面などへリダイレクト
  revalidatePath('/', 'layout')
  redirect('/admin/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Supabase Authで新規登録
  const { error } = await supabase.auth.signUp(data)

  if (error) {
    console.error('Signup error:', error.message)
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  // 新規登録後は確認メールが飛ぶ設定の場合、案内ページなどへ飛ばすと親切です
  redirect('/login?message=Check email to continue')
}

export async function logout() {
  const supabase = await createClient()

  // Supabaseのセッションを終了
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error.message)
    // エラーでも一旦ログイン画面へ飛ばすのが一般的です
  }

  // ログイン画面へリダイレクト
  redirect('/admin/login')
}
