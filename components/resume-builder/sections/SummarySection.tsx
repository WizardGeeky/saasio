"use client";

import React from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function SummarySection({ value, onChange }: Props) {
  const count = value.trim().length;
  const good = count >= 100;

  return (
    <div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={4}
        placeholder="Experienced software engineer with 5+ years building scalable web applications. Passionate about clean architecture and delivering measurable business impact."
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white placeholder:text-gray-300 resize-none transition"
      />
      <p className={`text-xs mt-1 ${good ? "text-emerald-600" : "text-gray-400"}`}>
        {count} characters{!good && count > 0 ? " — aim for 100+" : good ? " — great!" : ""}
      </p>
    </div>
  );
}
