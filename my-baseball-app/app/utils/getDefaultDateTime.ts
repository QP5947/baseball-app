// 現在時刻をデフォルト値の形式に変換する
export const getDefaultDateTime = (dateInput?: Date | string | null) => {
  const date = dateInput ? new Date(dateInput) : new Date();

  // 日本時間に調整
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

  // "2024-05-20T10:30:00.000Z" から先頭16文字を切り出す
  return date.toISOString().slice(0, 16);
};
