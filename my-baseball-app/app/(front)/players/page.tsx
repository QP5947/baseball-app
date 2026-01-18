"use client";

import React from "react";
import FrontMenu from "../components/FrontMenu";
import Footer from "../components/Footer";
import Link from "next/link";

export default function PlayersPage() {
  const teamSettings = {
    primaryColor: "#3b82f6",
    teamName: "森野クマサンズ",
  };

  const themeStyle = {
    "--team-color": teamSettings.primaryColor,
  } as React.CSSProperties;

  const players = [
    {
      id: 1,
      number: "18",
      name: "近藤 健太",
      role: "投手",
      img: "https://cdn-icons-png.flaticon.com/512/3177/3177142.png",
    },
    {
      id: 2,
      number: "10",
      name: "山下 剛",
      role: "捕手",
      img: "https://cdn-icons-png.flaticon.com/512/3177/3177142.png",
    },
    {
      id: 3,
      number: "6",
      name: "櫛田 亮",
      role: "内野手",
      img: "https://cdn-icons-png.flaticon.com/512/3177/3177142.png",
    },
    {
      id: 4,
      number: "51",
      name: "市橋 翼",
      role: "外野手",
      img: "https://cdn-icons-png.flaticon.com/512/3177/3177142.png",
    },
    {
      id: 5,
      number: "1",
      name: "三浦 翔",
      role: "外野手",
      img: "https://cdn-icons-png.flaticon.com/512/3177/3177142.png",
    },
    {
      id: 6,
      number: "0",
      name: "佐藤 大介",
      role: "内野手",
      img: "https://cdn-icons-png.flaticon.com/512/3177/3177142.png",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800" style={themeStyle}>
      <FrontMenu teamName={teamSettings.teamName} />

      <main className="pt-40 md:pt-48 max-w-6xl mx-auto px-6 pb-20">
        <div className="flex items-center gap-4">
          <span className="w-2 h-10 bg-(--team-color) rounded-full"></span>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">
            選手一覧
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10 mt-5">
          {players.map((player) => (
            <Link
              href={`/players/${player.id}`}
              key={player.id}
              className="group relative bg-white rounded-[2.5rem] overflow-hidden border-2 border-slate-100 shadow-sm hover:border-(--team-color) hover:shadow-2xl transition-all duration-300"
            >
              {/* 背景の大きな背番号（左上に配置・色を濃いめに調整） */}
              <div className="absolute top-4 left-6 z-0 pointer-events-none">
                <span className="text-4xl md:text-5xl font-black italic text-slate-300 group-hover:text-(--team-color)/20 transition-colors duration-300">
                  {player.number}
                </span>
              </div>

              {/* 選手画像エリア */}
              <div className="relative aspect-square flex items-center justify-center p-8 overflow-hidden">
                <img
                  src={player.img}
                  alt={player.name}
                  className="relative z-10 w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              {/* 氏名・詳細エリア */}
              <div className="p-6 text-center bg-white relative z-10">
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-sm font-black text-(--team-color) italic tracking-widest">
                    #{player.number} / {player.role}
                  </span>
                  <h4 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                    {player.name}
                  </h4>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
