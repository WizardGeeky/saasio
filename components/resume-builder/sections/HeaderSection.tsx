"use client";

import React from "react";
import type { HeaderData } from "../types";

interface Props {
  data: HeaderData;
  onChange: (data: HeaderData) => void;
}

const fields: { key: keyof HeaderData; label: string; placeholder: string; type?: string }[] = [
  { key: "name",      label: "Full Name",       placeholder: "John Doe" },
  { key: "title",     label: "Job Title",        placeholder: "Software Engineer" },
  { key: "email",     label: "Email",            placeholder: "john@example.com", type: "email" },
  { key: "phone",     label: "Phone",            placeholder: "+1 (555) 123-4567", type: "tel" },
  { key: "location",  label: "Location",         placeholder: "San Francisco, CA" },
  { key: "linkedin",  label: "LinkedIn",         placeholder: "linkedin.com/in/johndoe" },
  { key: "portfolio", label: "Portfolio / GitHub", placeholder: "github.com/johndoe" },
];

export default function HeaderSection({ data, onChange }: Props) {
  const set = (key: keyof HeaderData, val: string) =>
    onChange({ ...data, [key]: val });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields.map(f => (
        <div key={f.key} className={f.key === "name" || f.key === "title" ? "sm:col-span-2" : ""}>
          <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
          <input
            type={f.type || "text"}
            value={data[f.key]}
            onChange={e => set(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white placeholder:text-gray-300 transition"
          />
        </div>
      ))}
    </div>
  );
}
