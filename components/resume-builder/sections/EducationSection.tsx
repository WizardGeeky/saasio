"use client";

import React, { useState } from "react";
import { FiPlus, FiTrash2, FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";
import type { EducationItem } from "../types";
import { nanoid } from "../utils/nanoid";

interface Props {
  items: EducationItem[];
  onChange: (items: EducationItem[]) => void;
}

const empty = (): EducationItem => ({
  id: nanoid(),
  institution: '', degree: '', field: '',
  startDate: '', endDate: '', gpa: '', achievements: [],
});

export default function EducationSection({ items, onChange }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [achInput, setAchInput] = useState<Record<string, string>>({});

  const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const set = (id: string, key: keyof EducationItem, val: unknown) =>
    onChange(items.map(i => i.id === id ? { ...i, [key]: val } : i));
  const remove = (id: string) => onChange(items.filter(i => i.id !== id));
  const add = () => {
    const item = empty();
    onChange([...items, item]);
    setExpanded(p => ({ ...p, [item.id]: true }));
  };

  const addAchievement = (id: string) => {
    const val = (achInput[id] || '').trim();
    if (!val) return;
    const item = items.find(i => i.id === id)!;
    set(id, 'achievements', [...item.achievements, val]);
    setAchInput(p => ({ ...p, [id]: '' }));
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="border border-gray-100 rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 transition"
               onClick={() => toggle(item.id)}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {item.degree || `Education ${index + 1}`}
              </p>
              {item.institution && (
                <p className="text-xs text-gray-500 truncate">{item.institution}</p>
              )}
            </div>
            <button onClick={e => { e.stopPropagation(); remove(item.id); }} className="text-gray-400 hover:text-red-500 transition p-1">
              <FiTrash2 size={14} />
            </button>
            {expanded[item.id] ? <FiChevronUp size={16} className="text-gray-400" /> : <FiChevronDown size={16} className="text-gray-400" />}
          </div>

          {expanded[item.id] && (
            <div className="p-3 pt-0 space-y-3 border-t border-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                {([
                  ['institution', 'Institution', 'MIT', 'sm:col-span-2'],
                  ['degree', 'Degree', "Bachelor's / Master's / PhD"],
                  ['field', 'Field of Study', 'Computer Science'],
                  ['gpa', 'GPA (optional)', '3.8/4.0'],
                ] as const).map(([key, label, ph, col]) => (
                  <div key={key} className={col || ''}>
                    <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                    <input
                      value={(item[key as keyof EducationItem] as string) || ''}
                      onChange={e => set(item.id, key as keyof EducationItem, e.target.value)}
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
                  <input
                    type="month"
                    value={item.endDate}
                    onChange={e => set(item.id, 'endDate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                  />
                </div>
              </div>

              {/* Achievements */}
              <div>
                <label className="text-xs text-gray-500 mb-2 block font-medium">Achievements / Honors (optional)</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {item.achievements.map((a, ai) => (
                    <span key={ai} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-xs">
                      {a}
                      <button onClick={() => set(item.id, 'achievements', item.achievements.filter((_, i) => i !== ai))} className="hover:text-red-500 transition">
                        <FiX size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={achInput[item.id] || ''}
                    onChange={e => setAchInput(p => ({ ...p, [item.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAchievement(item.id))}
                    placeholder="Dean's List, Valedictorian..."
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white placeholder:text-gray-300"
                  />
                  <button onClick={() => addAchievement(item.id)} className="px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-xs">
                    <FiPlus size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={add} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-purple-300 hover:text-purple-600 transition font-medium">
        <FiPlus size={15} /> Add Education
      </button>
    </div>
  );
}
