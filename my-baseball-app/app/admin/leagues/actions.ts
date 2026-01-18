'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// 新規
export async function saveLeague(formData: FormData) {
    const supabase = await createClient()

    // ログイン者のチームIDを取得
    const { data: myTeamId, error: rpcError } = await supabase.rpc('get_my_team_id');
    if (rpcError || !myTeamId) {
        console.error('チームIDの取得に失敗しました:', rpcError);
        return;
    }

    // 新規登録時は、ソート順を最小にする
    let sort = formData.get('sort');
    if (!sort || sort === "") {
        const { data: maxSortData } = await supabase
            .from('leagues')
            .select('sort')
            .order('sort', { ascending: true })
            .limit(1)
            .single();
        const minSort = maxSortData ? maxSortData.sort - 1 : -1;
        sort = minSort.toString();
    }

    // 登録・更新データ
    const leagueData = {
        team_id: myTeamId,
        id: formData.get('id') || undefined,
        name: formData.get('name'),
        show_flg: formData.get('show_flg') === 'on',
        sort: sort,
    }

    const { error } = await supabase
        .from('leagues')
        .upsert(leagueData)

    if (error) {
        console.error('Error creating league:', error.message)
        // 実際はここでエラーを呼び出し元に返して表示させるのが理想ですが、
        // まずは最小実装で進めます
        return
    }

    // 一覧画面のデータを最新の状態に更新（キャッシュクリア）
    revalidatePath('/admin/leagues')
    
    // 一覧画面へリダイレクト
    redirect('/admin/leagues')
}

// 削除
export async function deleteLeague(formData: FormData) {

      // TODO: 試合とかに使われてないかチェック or 削除してみてエラーで判断
    const id = formData.get('id')
    const supabase = await createClient()
    await supabase.from('leagues').delete().eq('id', id)

    revalidatePath('/admin/leagues')
}

// ソート順を一括更新する
export async function updateSortOrder(ids: string[]) {
  const supabase = await createClient();

  // 各IDに対して、現在の配列のインデックスを 'sort' 値として更新
  // Promise.all で並列実行して高速化します
  const updates = ids.map((id, index) =>
    supabase
      .from("leagues")
      .update({ sort: index })
      .eq("id", id)
  );

  const results = await Promise.all(updates);

  // エラーチェック
  const firstError = results.find(r => r.error);
  if (firstError) {
    console.error("並び替えの保存に失敗しました:", firstError.error);
    return;
  }

  revalidatePath("/admin/leagues");
  return;
}