"use client";

import React from "react";
import type { ResumeData, SectionType, FormatConfig } from "../types";

function formatDate(d: string): string {
  if (!d) return '';
  const [year, month] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function bulletSymbol(style: FormatConfig['bulletStyle']): string {
  return { dash: '–', dot: '•', arrow: '›', none: '' }[style];
}

function highlightText(text: string, keywords: string[], color: string): React.ReactNode {
  if (!keywords.length) return text;
  const pattern = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part)
      ? <mark key={i} style={{ backgroundColor: `${color}20`, color: color, fontWeight: 600, padding: '0 1px', borderRadius: '2px' }}>{part}</mark>
      : part
  );
}

interface Props {
  resume: ResumeData;
  highlightKeywords?: string[];
}

export default function MinimalTemplate({ resume, highlightKeywords = [] }: Props) {
  const { header, summary, skills, experience, projects, education, sectionOrder, format: fmt } = resume;
  const { margins: m } = fmt;

  const SectionHeading = ({ title }: { title: string }) => (
    <div style={{ marginBottom: '5px' }}>
      <span style={{
        fontSize: `${fmt.fontSize.heading}rem`,
        fontWeight: 600,
        color: fmt.colors.text,
        letterSpacing: '0.04em',
      }}>
        {title.toUpperCase()}
      </span>
      {fmt.showDividers && (
        <div style={{ height: '1px', backgroundColor: '#e5e7eb', marginTop: '3px' }} />
      )}
    </div>
  );

  const renderSection = (section: SectionType): React.ReactNode => {
    switch (section) {
      case 'header':
        if (!header.name && !header.email) return null;
        return (
          <div key="header" style={{ marginBottom: `${fmt.sectionSpacing}px`, textAlign: fmt.headerAlignment }}>
            {header.name && (
              <div style={{ fontSize: `${fmt.fontSize.name}rem`, fontWeight: 700, color: fmt.colors.primary, lineHeight: 1.2 }}>
                {header.name}
              </div>
            )}
            {header.title && (
              <div style={{ fontSize: `${fmt.fontSize.body}rem`, color: fmt.colors.muted, marginTop: '2px' }}>{header.title}</div>
            )}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '3px 10px',
              fontSize: `${fmt.fontSize.small}rem`,
              color: fmt.colors.muted,
              marginTop: '5px',
              justifyContent: fmt.headerAlignment === 'center' ? 'center' : fmt.headerAlignment === 'right' ? 'flex-end' : 'flex-start',
            }}>
              {[header.email, header.phone, header.location, header.linkedin, header.portfolio].filter(Boolean).map((v, i, arr) => (
                <React.Fragment key={i}>
                  <span>{v}</span>
                  {i < arr.length - 1 && <span style={{ color: '#d1d5db' }}>|</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        );

      case 'summary':
        if (!summary) return null;
        return (
          <div key="summary" style={{ marginBottom: `${fmt.sectionSpacing}px` }}>
            <SectionHeading title="About" />
            <p style={{ fontSize: `${fmt.fontSize.body}rem`, lineHeight: fmt.lineHeight, color: fmt.colors.text }}>
              {highlightText(summary, highlightKeywords, fmt.colors.accent)}
            </p>
          </div>
        );

      case 'skills':
        if (!skills.some(c => c.skills.length > 0)) return null;
        return (
          <div key="skills" style={{ marginBottom: `${fmt.sectionSpacing}px` }}>
            <SectionHeading title="Skills" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {skills.flatMap(c => c.skills).map((skill, i) => (
                <span key={i} style={{
                  fontSize: `${fmt.fontSize.small}rem`,
                  color: fmt.colors.text,
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  padding: '1px 7px',
                }}>
                  {highlightText(skill, highlightKeywords, fmt.colors.accent)}
                </span>
              ))}
            </div>
          </div>
        );

      case 'experience':
        if (!experience.length) return null;
        return (
          <div key="experience" style={{ marginBottom: `${fmt.sectionSpacing}px` }}>
            <SectionHeading title="Experience" />
            {experience.map(exp => (
              <div key={exp.id} style={{ marginBottom: `${fmt.sectionSpacing * 0.6}px` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: `${fmt.fontSize.body}rem`, fontWeight: 600, color: fmt.colors.text }}>
                    {exp.role}{exp.company ? `, ${exp.company}` : ''}
                  </span>
                  <span style={{ fontSize: `${fmt.fontSize.small}rem`, color: fmt.colors.muted }}>
                    {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}
                  </span>
                </div>
                {exp.bullets.filter(Boolean).map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: '5px', fontSize: `${fmt.fontSize.body}rem`, lineHeight: fmt.lineHeight, color: fmt.colors.text, marginTop: '2px' }}>
                    <span style={{ flexShrink: 0, color: fmt.colors.muted }}>{bulletSymbol(fmt.bulletStyle)}</span>
                    <span>{highlightText(b, highlightKeywords, fmt.colors.accent)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );

      case 'projects':
        if (!projects.length) return null;
        return (
          <div key="projects" style={{ marginBottom: `${fmt.sectionSpacing}px` }}>
            <SectionHeading title="Projects" />
            {projects.map(proj => (
              <div key={proj.id} style={{ marginBottom: `${fmt.sectionSpacing * 0.5}px` }}>
                <span style={{ fontSize: `${fmt.fontSize.body}rem`, fontWeight: 600, color: fmt.colors.text }}>{proj.title}</span>
                {proj.techStack.length > 0 && (
                  <span style={{ fontSize: `${fmt.fontSize.small}rem`, color: fmt.colors.muted }}> — {proj.techStack.join(', ')}</span>
                )}
                {proj.description && (
                  <p style={{ fontSize: `${fmt.fontSize.body}rem`, lineHeight: fmt.lineHeight, color: fmt.colors.text, marginTop: '2px' }}>
                    {highlightText(proj.description, highlightKeywords, fmt.colors.accent)}
                  </p>
                )}
              </div>
            ))}
          </div>
        );

      case 'education':
        if (!education.length) return null;
        return (
          <div key="education" style={{ marginBottom: `${fmt.sectionSpacing}px` }}>
            <SectionHeading title="Education" />
            {education.map(edu => (
              <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '3px' }}>
                <span style={{ fontSize: `${fmt.fontSize.body}rem`, color: fmt.colors.text }}>
                  <strong>{edu.degree}{edu.field ? ` · ${edu.field}` : ''}</strong>
                  {edu.institution ? `, ${edu.institution}` : ''}
                </span>
                <span style={{ fontSize: `${fmt.fontSize.small}rem`, color: fmt.colors.muted }}>
                  {formatDate(edu.endDate)}{edu.gpa ? ` · ${edu.gpa}` : ''}
                </span>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      id="resume-preview-content"
      style={{
        width: '100%',
        backgroundColor: '#ffffff',
        fontFamily: '"Inter", system-ui, sans-serif',
        color: fmt.colors.text,
        paddingTop: `${m.top}px`,
        paddingBottom: `${m.bottom}px`,
        paddingLeft: `${m.left}px`,
        paddingRight: `${m.right}px`,
        boxSizing: 'border-box',
        minHeight: '100%',
        lineHeight: fmt.lineHeight,
      }}
    >
      {sectionOrder.map(s => renderSection(s))}
    </div>
  );
}
