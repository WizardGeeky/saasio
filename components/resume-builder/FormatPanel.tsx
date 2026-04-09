"use client";

import React from "react";
import type { FormatConfig } from "./types";

interface Props {
  format: FormatConfig;
  onChange: (f: FormatConfig) => void;
}

const TEMPLATES: { id: FormatConfig['template']; label: string; desc: string }[] = [
  { id: 'modern',  label: 'Modern',  desc: 'Clean with accent color headings' },
  { id: 'classic', label: 'Classic', desc: 'Traditional professional layout' },
  { id: 'minimal', label: 'Minimal', desc: 'Ultra-clean, no frills' },
];

const BULLET_STYLES: { id: FormatConfig['bulletStyle']; symbol: string }[] = [
  { id: 'dash',  symbol: '–' },
  { id: 'dot',   symbol: '•' },
  { id: 'arrow', symbol: '›' },
  { id: 'none',  symbol: ' ' },
];

const ALIGN_OPTIONS: { id: FormatConfig['headerAlignment']; label: string }[] = [
  { id: 'left',   label: 'Left' },
  { id: 'center', label: 'Center' },
  { id: 'right',  label: 'Right' },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-600 shrink-0 w-32">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Slider({
  value, min, max, step = 0.05,
  onChange, display,
}: {
  value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; display: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range" min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-emerald-500"
      />
      <span className="text-xs text-gray-500 w-10 text-right tabular-nums">{display}</span>
    </div>
  );
}

export default function FormatPanel({ format, onChange }: Props) {
  const set = <K extends keyof FormatConfig>(key: K, val: FormatConfig[K]) =>
    onChange({ ...format, [key]: val });

  const setFs = (k: keyof FormatConfig['fontSize'], v: number) =>
    set('fontSize', { ...format.fontSize, [k]: v });

  const setMargin = (k: keyof FormatConfig['margins'], v: number) =>
    set('margins', { ...format.margins, [k]: v });

  const setColor = (k: keyof FormatConfig['colors'], v: string) =>
    set('colors', { ...format.colors, [k]: v });

  return (
    <div className="space-y-5">
      {/* Template */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Template</p>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => set('template', t.id)}
              className={`p-2.5 rounded-xl border-2 text-left transition ${
                format.template === t.id
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-gray-100 hover:border-gray-200 bg-white'
              }`}
            >
              <p className="text-xs font-semibold text-gray-800">{t.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Typography</p>
        <div className="bg-gray-50 rounded-xl p-3 space-y-0.5">
          <Row label="Name size">
            <Slider value={format.fontSize.name} min={1.2} max={2.8} step={0.05}
              onChange={v => setFs('name', v)} display={`${format.fontSize.name.toFixed(2)}rem`} />
          </Row>
          <Row label="Headings">
            <Slider value={format.fontSize.heading} min={0.6} max={1.2} step={0.02}
              onChange={v => setFs('heading', v)} display={`${format.fontSize.heading.toFixed(2)}rem`} />
          </Row>
          <Row label="Body text">
            <Slider value={format.fontSize.body} min={0.65} max={1.1} step={0.02}
              onChange={v => setFs('body', v)} display={`${format.fontSize.body.toFixed(2)}rem`} />
          </Row>
          <Row label="Small text">
            <Slider value={format.fontSize.small} min={0.55} max={0.9} step={0.02}
              onChange={v => setFs('small', v)} display={`${format.fontSize.small.toFixed(2)}rem`} />
          </Row>
          <Row label="Line height">
            <Slider value={format.lineHeight} min={1.2} max={2.0} step={0.05}
              onChange={v => set('lineHeight', v)} display={format.lineHeight.toFixed(2)} />
          </Row>
        </div>
      </div>

      {/* Margins */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Margins (px)</p>
        <div className="bg-gray-50 rounded-xl p-3 space-y-0.5">
          {(['top', 'bottom', 'left', 'right'] as const).map(side => (
            <Row key={side} label={side.charAt(0).toUpperCase() + side.slice(1)}>
              <Slider value={format.margins[side]} min={12} max={72} step={2}
                onChange={v => setMargin(side, v)} display={`${format.margins[side]}px`} />
            </Row>
          ))}
          <Row label="Section gap">
            <Slider value={format.sectionSpacing} min={6} max={36} step={2}
              onChange={v => set('sectionSpacing', v)} display={`${format.sectionSpacing}px`} />
          </Row>
        </div>
      </div>

      {/* Header Alignment */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Header Alignment</p>
        <div className="flex gap-2">
          {ALIGN_OPTIONS.map(a => (
            <button
              key={a.id}
              onClick={() => set('headerAlignment', a.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${
                format.headerAlignment === a.id
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bullet Style */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bullet Style</p>
        <div className="flex gap-2">
          {BULLET_STYLES.map(b => (
            <button
              key={b.id}
              onClick={() => set('bulletStyle', b.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                format.bulletStyle === b.id
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {b.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Colors</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            ['primary', 'Name / Title'],
            ['accent',  'Headings / Dividers'],
            ['text',    'Body Text'],
            ['muted',   'Dates / Labels'],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
              <input
                type="color"
                value={format.colors[key]}
                onChange={e => setColor(key, e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border border-gray-200 shrink-0"
              />
              <span className="text-xs text-gray-600 leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dividers Toggle */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
        <span className="text-xs font-medium text-gray-600">Show section dividers</span>
        <button
          onClick={() => set('showDividers', !format.showDividers)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
            format.showDividers ? 'bg-emerald-500' : 'bg-gray-200'
          }`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${
            format.showDividers ? 'translate-x-4' : 'translate-x-1'
          }`} />
        </button>
      </div>
    </div>
  );
}
