'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// 新規・更新
export async function saveGame(formData: FormData) {

  // ログイン者のチームIDを取得
  const supabase = await createClient()
  const { data: myTeamId, error: rpcError } = await supabase.rpc('get_my_team_id');
  if (rpcError || !myTeamId) {
    console.error('チームIDの取得に失敗しました:', rpcError);
    return;
  }
  
  // フォームデータの抽出
  const gameData = {
    team_id: myTeamId,
    id: formData.get('id') || undefined,
    start_datetime: `${formData.get('start_datetime')}:00+09:00`,
    league_id: formData.get('league_id'),
    ground_id: formData.get('ground_id'),
    vsteam_id: formData.get('vsteam_id'),
    remarks: formData.get('remarks'),
    sum_flg: formData.get('sum_flg') === 'on',
  }

  const { error } = await supabase
    .from('games')
    .upsert(gameData)

  if (error) {
    console.error('Error creating game:', error.message)
    // 実際はここでエラーを呼び出し元に返して表示させるのが理想ですが、
    // まずは最小実装で進めます
    return
  }

  // 一覧画面のデータを最新の状態に更新（キャッシュクリア）
  revalidatePath('/admin/games')
  
  // 一覧画面へリダイレクト
  redirect('/admin/games')
}

// 削除
export async function deleteGame(formData: FormData) {

  const id = formData.get('id')
  const supabase = await createClient()
  await supabase.from('games').delete().eq('id', id)
  
  revalidatePath('/admin/games')
}
