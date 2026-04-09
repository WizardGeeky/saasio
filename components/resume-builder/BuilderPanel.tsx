"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FiMenu, FiChevronDown, FiChevronUp, FiSettings,
  FiUser, FiFileText, FiStar, FiBriefcase, FiCode, FiBook,
} from "react-icons/fi";

import type { ResumeData, SectionType } from "./types";
import { SECTION_LABELS } from "./types";
import HeaderSection from "./sections/HeaderSection";
import SummarySection from "./sections/SummarySection";
import SkillsSection from "./sections/SkillsSection";
import ExperienceSection from "./sections/ExperienceSection";
import ProjectsSection from "./sections/ProjectsSection";
import EducationSection from "./sections/EducationSection";
import FormatPanel from "./FormatPanel";

// ─── Icons per section ─────────────────────────────────────────────────────────

const SECTION_ICONS: Record<SectionType, React.ReactNode> = {
  header:     <FiUser size={14} />,
  summary:    <FiFileText size={14} />,
  skills:     <FiStar size={14} />,
  experience: <FiBriefcase size={14} />,
  projects:   <FiCode size={14} />,
  education:  <FiBook size={14} />,
};

const SECTION_COLORS: Record<SectionType, string> = {
  header:     'bg-blue-100 text-blue-600',
  summary:    'bg-violet-100 text-violet-600',
  skills:     'bg-emerald-100 text-emerald-600',
  experience: 'bg-orange-100 text-orange-600',
  projects:   'bg-sky-100 text-sky-600',
  education:  'bg-purple-100 text-purple-600',
};

// ─── Sortable Item ─────────────────────────────────────────────────────────────

interface SortableItemProps {
  section: SectionType;
  resume: ResumeData;
  onChange: (resume: ResumeData) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

function SortableItem({ section, resume, onChange, isExpanded, onToggle }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const renderEditor = () => {
    switch (section) {
      case 'header':
        return <HeaderSection data={resume.header} onChange={header => onChange({ ...resume, header })} />;
      case 'summary':
        return <SummarySection value={resume.summary} onChange={summary => onChange({ ...resume, summary })} />;
      case 'skills':
        return <SkillsSection categories={resume.skills} onChange={skills => onChange({ ...resume, skills })} />;
      case 'experience':
        return <ExperienceSection items={resume.experience} onChange={experience => onChange({ ...resume, experience })} />;
      case 'projects':
        return <ProjectsSection items={resume.projects} onChange={projects => onChange({ ...resume, projects })} />;
      case 'education':
        return <EducationSection items={resume.education} onChange={education => onChange({ ...resume, education })} />;
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-shadow ${isDragging ? 'shadow-lg border-emerald-300' : 'border-gray-100 hover:border-gray-200'}`}>
        {/* Section Header */}
        <div className="flex items-center gap-2 px-3 py-3">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1 touch-none"
            title="Drag to reorder"
          >
            <FiMenu size={15} />
          </button>

          {/* Icon + Label */}
          <div className={`p-1.5 rounded-lg shrink-0 ${SECTION_COLORS[section]}`}>
            {SECTION_ICONS[section]}
          </div>
          <span
            className="flex-1 text-sm font-semibold text-gray-700 cursor-pointer select-none"
            onClick={onToggle}
          >
            {SECTION_LABELS[section]}
          </span>

          {/* Expand */}
          <button onClick={onToggle} className="text-gray-400 hover:text-gray-600 transition p-1">
            {isExpanded ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
          </button>
        </div>

        {/* Body */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-4 pt-1 border-t border-gray-50">
                {renderEditor()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Builder Panel ─────────────────────────────────────────────────────────────

interface Props {
  resume: ResumeData;
  onChange: (resume: ResumeData) => void;
}

export default function BuilderPanel({ resume, onChange }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ header: true });
  const [showFormat, setShowFormat] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = resume.sectionOrder.indexOf(active.id as SectionType);
      const newIdx = resume.sectionOrder.indexOf(over.id as SectionType);
      onChange({ ...resume, sectionOrder: arrayMove(resume.sectionOrder, oldIdx, newIdx) });
    }
  };

  const toggle = (section: SectionType) =>
    setExpanded(p => ({ ...p, [section]: !p[section] }));

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <div>
          <h2 className="text-sm font-bold text-gray-800">Resume Builder</h2>
          <p className="text-xs text-gray-400">Drag sections to reorder</p>
        </div>
        <button
          onClick={() => setShowFormat(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
            showFormat
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          <FiSettings size={13} />
          Format
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {showFormat ? (
            <motion.div
              key="format"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="p-4"
            >
              <FormatPanel
                format={resume.format}
                onChange={format => onChange({ ...resume, format })}
              />
            </motion.div>
          ) : (
            <motion.div
              key="sections"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="p-4 space-y-2.5"
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={resume.sectionOrder}
                  strategy={verticalListSortingStrategy}
                >
                  {resume.sectionOrder.map(section => (
                    <SortableItem
                      key={section}
                      section={section}
                      resume={resume}
                      onChange={onChange}
                      isExpanded={!!expanded[section]}
                      onToggle={() => toggle(section)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
