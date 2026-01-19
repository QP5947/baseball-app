export const formatRate = (value: number): string => {
  if (value === null || value === undefined) return ".000";
  // 3桁固定にして先頭の0を消す
  return value.toFixed(3).replace(/^0/, "");
};
