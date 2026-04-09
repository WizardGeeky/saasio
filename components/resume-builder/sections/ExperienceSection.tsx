"use client";

import React, { useState } from "react";
import { FiPlus, FiTrash2, FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";
import type { ExperienceItem } from "../types";
import { nanoid } from "../utils/nanoid";

interface Props {
  items: ExperienceItem[];
  onChange: (items: ExperienceItem[]) => void;
}

const empty = (): ExperienceItem => ({
  id: nanoid(),
  company: '', role: '', location: '',
  startDate: '', endDate: '', current: false,
  bullets: [''], link: '',
});

export default function ExperienceSection({ items, onChange }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const set = (id: string, key: keyof ExperienceItem, val: unknown) =>
    onChange(items.map(i => i.id === id ? { ...i, [key]: val } : i));
  const remove = (id: string) => onChange(items.filter(i => i.id !== id));
  const add = () => {
    const item = empty();
    onChange([...items, item]);
    setExpanded(p => ({ ...p, [item.id]: true }));
  };

  const setBullet = (id: string, idx: number, val: string) => {
    const item = items.find(i => i.id === id)!;
    const bullets = [...item.bullets];
    bullets[idx] = val;
    set(id, 'bullets', bullets);
  };
  const addBullet = (id: string) => {
    const item = items.find(i => i.id === id)!;
    set(id, 'bullets', [...item.bullets, '']);
  };
  const removeBullet = (id: string, idx: number) => {
    const item = items.find(i => i.id === id)!;
    set(id, 'bullets', item.bullets.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="border border-gray-100 rounded-xl bg-white shadow-sm overflow-hidden">
          {/* Header row */}
          <div className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 transition"
               onClick={() => toggle(item.id)}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {item.role || `Experience ${index + 1}`}
              </p>
              {item.company && (
                <p className="text-xs text-gray-500 truncate">{item.company}</p>
              )}
            </div>
            <button
              onClick={e => { e.stopPropagation(); remove(item.id); }}
              className="text-gray-400 hover:text-red-500 transition p-1"
            >
              <FiTrash2 size={14} />
            </button>
            {expanded[item.id] ? <FiChevronUp size={16} className="text-gray-400" /> : <FiChevronDown size={16} className="text-gray-400" />}
          </div>

          {/* Body */}
          {expanded[item.id] && (
            <div className="p-3 pt-0 space-y-3 border-t border-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                {([
                  ['company', 'Company', 'Google Inc.'],
                  ['role', 'Job Title', 'Senior Software Engineer'],
                  ['location', 'Location', 'Remote / San Francisco'],
                  ['link', 'Company Link (optional)', 'https://...'],
                ] as const).map(([key, label, ph]) => (
                  <div key={key}>
                    <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                    <input
                      value={(item[key as keyof ExperienceItem] as string) || ''}
                      onChange={e => set(item.id, key as keyof ExperienceItem, e.target.value)}
                      placeholder={ph}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white placeholder:text-gray-300"
                    />
                  </div>
                ))}

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                  <input
                    type="month"
                    value={item.startDate}
                    onChange={e => set(item.id, 'startDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                  <div className="space-y-1.5">
                    <input
                      type="month"
                      value={item.endDate}
                      disabled={item.current}
                      onChange={e => set(item.id, 'endDate', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.current}
                        onChange={e => set(item.id, 'current', e.target.checked)}
                        className="accent-emerald-500"
                      />
                      Currently working here
                    </label>
                  </div>
                </div>
              </div>

              {/* Bullets */}
              <div>
                <label className="text-xs text-gray-500 mb-2 block font-medium">Key Achievements / Responsibilities</label>
                <div className="space-y-2">
                  {item.bullets.map((bullet, bi) => (
                    <div key={bi} className="flex gap-2 items-start">
                      <span className="text-gray-400 mt-2.5 shrink-0">•</span>
                      <textarea
                        value={bullet}
                        onChange={e => setBullet(item.id, bi, e.target.value)}
                        rows={2}
                        placeholder="Built and deployed scalable REST APIs serving 100k+ daily requests..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white placeholder:text-gray-300 resize-none"
                      />
                      {item.bullets.length > 1 && (
                        <button
                          onClick={() => removeBullet(item.id, bi)}
                          className="text-gray-300 hover:text-red-400 mt-2 transition"
                        >
                          <FiX size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addBullet(item.id)}
                    className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition mt-1"
                  >
                    <FiPlus size={13} /> Add bullet point
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={add}
        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition font-medium"
      >
        <FiPlus size={15} /> Add Experience
      </button>
    </div>
  );
}
