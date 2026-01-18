"use client";
import { useRouter } from "next/navigation";

export default function YearSelector({
  selectedYear,
  paramMinYear,
  paramMaxYear,
}: {
  selectedYear?: number;
  paramMinYear: number;
  paramMaxYear: number;
}) {
  // 年度リストボックス用配列の生成
  const years = [];
  const minYear = paramMinYear || paramMaxYear;
  for (let y = paramMaxYear; y >= minYear; y--) {
    years.push(y);
  }

  // 年度を変更する
  const router = useRouter();
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value) {
      router.push(`?year=${value}`);
    }
  };

  return (
    <select
      name="selected_year"
      className="border p-2 rounded text-gray-800"
      value={selectedYear}
      onChange={handleChange}
    >
      {years.map((year) => (
        <option key={year} value={year}>
          {year}年度
        </option>
      ))}
    </select>
  );
}
