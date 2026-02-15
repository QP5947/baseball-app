"use client";

import { useRouter } from "next/navigation";

interface YearSelectorProps {
  displayYear: number;
  displayMonth: number;
  availableYears: number[];
  primaryColor: string;
}

export default function YearSelector({
  displayYear,
  displayMonth,
  availableYears,
  primaryColor,
}: YearSelectorProps) {
  const router = useRouter();

  const handleYearChange = (year: number) => {
    router.push(`?year=${year}&month=${displayMonth}`);
  };

  return (
    <div className="relative inline-block">
      <select
        value={displayYear}
        onChange={(e) => handleYearChange(Number(e.target.value))}
        className="appearance-none bg-transparent text-2xl font-black cursor-pointer pr-8 focus:outline-none"
        style={{ color: primaryColor }}
      >
        {availableYears.map((year) => (
          <option key={year} value={year}>
            {year}年度
          </option>
        ))}
      </select>
      <span
        className="absolute right-0 top-1/2 -translate-y-1/2 font-black text-2xl pointer-events-none"
        style={{ color: primaryColor }}
      >
        ▼
      </span>
    </div>
  );
}
