import toast from "react-hot-toast";

export type ActionResult = {
  success: boolean;
  message: string;
};

/**
 * Server Actionの結果をトースト表示
 * @param result ActionResult - サーバーアクションの戻り値
 */
export function showActionToast(result: ActionResult | undefined) {
  if (!result) return;

  if (result.success) {
    toast.success(result.message);
  } else {
    toast.error(result.message);
  }
}

/**
 * 成功トーストを表示
 * @param message - メッセージ
 */
export function showSuccessToast(message: string) {
  toast.success(message);
}

/**
 * エラートーストを表示
 * @param message - メッセージ
 */
export function showErrorToast(message: string) {
  toast.error(message);
}
