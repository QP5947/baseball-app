import { createClient } from '@supabase/supabase-js';

// .env.localに書いた情報を読み込む
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabaseと通信するための「クライアント」を作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);