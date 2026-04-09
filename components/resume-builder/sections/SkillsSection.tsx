"use client";

import React, { useState } from "react";
import { FiPlus, FiTrash2, FiX } from "react-icons/fi";
import type { SkillCategory } from "../types";
import { nanoid } from "../utils/nanoid";

interface Props {
  categories: SkillCategory[];
  onChange: (cats: SkillCategory[]) => void;
}

export default function SkillsSection({ categories, onChange }: Props) {
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const setCatProp = (id: string, key: keyof SkillCategory, val: string) =>
    onChange(categories.map(c => c.id === id ? { ...c, [key]: val } : c));

  const addCat = () =>
    onChange([...categories, { id: nanoid(), name: 'New Category', skills: [] }]);

  const removeCat = (id: string) =>
    onChange(categories.filter(c => c.id !== id));

  const addSkill = (catId: string) => {
    const val = (inputs[catId] || '').trim();
    if (!val) return;
    onChange(categories.map(c =>
      c.id === catId && !c.skills.includes(val)
        ? { ...c, skills: [...c.skills, val] }
        : c
    ));
    setInputs(prev => ({ ...prev, [catId]: '' }));
  };

  const removeSkill = (catId: string, skill: string) =>
    onChange(categories.map(c =>
      c.id === catId ? { ...c, skills: c.skills.filter(s => s !== skill) } : c
    ));

  return (
    <div className="space-y-4">
      {categories.map(cat => (
        <div key={cat.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <input
              value={cat.name}
              onChange={e => setCatProp(cat.id, 'name', e.target.value)}
              className="flex-1 text-sm font-medium border-0 bg-transparent focus:outline-none focus:ring-0 text-gray-700"
              placeholder="Category name"
            />
            {categories.length > 1 && (
              <button
                onClick={() => removeCat(cat.id)}
                className="text-gray-400 hover:text-red-500 transition"
                title="Remove category"
              >
                <FiTrash2 size={14} />
              </button>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {cat.skills.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-emerald-200 text-emerald-700 rounded-full text-xs font-medium"
              >
                {skill}
                <button
                  onClick={() => removeSkill(cat.id, skill)}
                  className="hover:text-red-500 transition"
                >
                  <FiX size={10} />
                </button>
              </span>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              value={inputs[cat.id] || ''}
              onChange={e => setInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(cat.id))}
              placeholder="Add skill and press Enter"
              className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white placeholder:text-gray-300"
            />
            <button
              onClick={() => addSkill(cat.id)}
              className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition text-xs"
            >
              <FiPlus size={14} />
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={addCat}
        className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition"
      >
        <FiPlus size={14} /> Add Category
      </button>
    </div>
  );
}
