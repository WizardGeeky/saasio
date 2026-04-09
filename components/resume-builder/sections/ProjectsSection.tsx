"use client";

import React, { useState } from "react";
import { FiPlus, FiTrash2, FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";
import type { ProjectItem } from "../types";
import { nanoid } from "../utils/nanoid";

interface Props {
  items: ProjectItem[];
  onChange: (items: ProjectItem[]) => void;
}

const empty = (): ProjectItem => ({
  id: nanoid(),
  title: '', description: '', techStack: [],
  link: '', github: '', bullets: [''],
});

export default function ProjectsSection({ items, onChange }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [techInput, setTechInput] = useState<Record<string, string>>({});

  const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));
  const set = (id: string, key: keyof ProjectItem, val: unknown) =>
    onChange(items.map(i => i.id === id ? { ...i, [key]: val } : i));
  const remove = (id: string) => onChange(items.filter(i => i.id !== id));
  const add = () => {
    const item = empty();
    onChange([...items, item]);
    setExpanded(p => ({ ...p, [item.id]: true }));
  };

  const addTech = (id: string) => {
    const val = (techInput[id] || '').trim();
    if (!val) return;
    const item = items.find(i => i.id === id)!;
    if (!item.techStack.includes(val)) {
      set(id, 'techStack', [...item.techStack, val]);
    }
    setTechInput(p => ({ ...p, [id]: '' }));
  };

  const setBullet = (id: string, idx: number, val: string) => {
    const item = items.find(i => i.id === id)!;
    const bullets = [...item.bullets];
    bullets[idx] = val;
    set(id, 'bullets', bullets);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="border border-gray-100 rounded-xl bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 transition"
               onClick={() => toggle(item.id)}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {item.title || `Project ${index + 1}`}
              </p>
              {item.techStack.length > 0 && (
                <p className="text-xs text-gray-400 truncate">{item.techStack.slice(0, 4).join(', ')}</p>
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
                  ['title', 'Project Title', 'E-Commerce Platform'],
                  ['description', 'Short Description', 'Full-stack app with payments and real-time updates'],
                  ['link', 'Live Demo URL', 'https://myproject.com'],
                  ['github', 'GitHub URL', 'https://github.com/user/repo'],
                ] as const).map(([key, label, ph]) => (
                  <div key={key} className={key === 'description' ? 'sm:col-span-2' : ''}>
                    <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                    <input
                      value={(item[key as keyof ProjectItem] as string) || ''}
                      onChange={e => set(item.id, key as keyof ProjectItem, e.target.value)}
                      placeholder={ph}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white placeholder:text-gray-300"
                    />
                  </div>
                ))}
              </div>

              {/* Tech Stack */}
              <div>
                <label className="text-xs text-gray-500 mb-2 block font-medium">Tech Stack</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {item.techStack.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-medium">
                      {t}
                      <button onClick={() => set(item.id, 'techStack', item.techStack.filter(x => x !== t))} className="hover:text-red-500 transition">
                        <FiX size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={techInput[item.id] || ''}
                    onChange={e => setTechInput(p => ({ ...p, [item.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech(item.id))}
                    placeholder="Add tech and press Enter"
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white placeholder:text-gray-300"
                  />
                  <button onClick={() => addTech(item.id)} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-xs">
                    <FiPlus size={14} />
                  </button>
                </div>
              </div>

              {/* Bullets */}
              <div>
                <label className="text-xs text-gray-500 mb-2 block font-medium">Highlights (optional)</label>
                {item.bullets.map((b, bi) => (
                  <div key={bi} className="flex gap-2 items-start mb-2">
                    <span className="text-gray-400 mt-2.5 shrink-0">•</span>
                    <textarea
                      value={b}
                      onChange={e => setBullet(item.id, bi, e.target.value)}
                      rows={2}
                      placeholder="Implemented payment gateway processing $50k+ monthly transactions..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white placeholder:text-gray-300 resize-none"
                    />
                    {item.bullets.length > 1 && (
                      <button onClick={() => set(item.id, 'bullets', item.bullets.filter((_, i) => i !== bi))} className="text-gray-300 hover:text-red-400 mt-2 transition">
                        <FiX size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => set(item.id, 'bullets', [...item.bullets, ''])} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 transition">
                  <FiPlus size={13} /> Add bullet
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={add} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition font-medium">
        <FiPlus size={15} /> Add Project
      </button>
    </div>
  );
}
