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
      ? <mark key={i} style={{ backgroundColor: `${color}25`, color: color, fontWeight: 600, borderRadius: '2px', padding: '0 1px' }}>{part}</mark>
      : part
  );
}

interface Props {
  resume: ResumeData;
  highlightKeywords?: string[];
}

export default function ClassicTemplate({ resume, highlightKeywords = [] }: Props) {
  const { header, summary, skills, experience, projects, education, sectionOrder, format: fmt } = resume;
  const { margins: m } = fmt;

  const SectionHeading = ({ title }: { title: string }) => (
    <div style={{
      borderBottom: `1.5px solid ${fmt.colors.primary}`,
      marginBottom: '6px',
      paddingBottom: '2px',
    }}>
      <span style={{
        fontSize: `${fmt.fontSize.heading}rem`,
        fontWeight: 700,
        color: fmt.colors.primary,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>
        {title}
      </span>
    </div>
  );

  const renderSection = (section: SectionType): React.ReactNode => {
    switch (section) {
      case 'header':
        if (!header.name && !header.email) return null;
        return (
          <div key="header" style={{ textAlign: fmt.headerAlignment, marginBottom: `${fmt.sectionSpacing}px` }}>
            {header.name && (
              <div style={{
                fontSize: `${fmt.fontSize.name}rem`,
                fontWeight: 800,
                color: fmt.colors.primary,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                lineHeight: 1.1,
              }}>
                {header.name}
              </div>
            )}
            {header.title && (
              <div style={{
                fontSize: `${fmt.fontSize.body}rem`,
                color: fmt.colors.muted,
                marginTop: '3px',
                fontStyle: 'italic',
              }}>
                {header.title}
              </div>
            )}
            {fmt.showDividers && (
              <div style={{ height: '2px', backgroundColor: fmt.colors.primary, margin: '8px auto', width: fmt.headerAlignment === 'center' ? '60px' : '100%' }} />
            )}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px 16px',
              fontSize: `${fmt.fontSize.small}rem`,
              color: fmt.colors.muted,
              justifyContent: fmt.headerAlignment === 'center' ? 'center' : fmt.headerAlignment === 'right' ? 'flex-end' : 'flex-start',
            }}>
              {[header.email, header.phone, header.location, header.linkedin, header.portfolio].filter(Boolean).map((v, i) => (
                <span key={i}>{v}</span>
              ))}
            </div>
          </div>
        );

      case 'summary':
        if (!summary) return null;
        return (
          <div key="summary" style={{ marginBottom: `${fmt.sectionSpacing}px` }}>
            <SectionHeading title="Professional Summary" />
            <p style={{ fontSize: `${fmt.fontSize.body}rem`, lineHeight: fmt.lineHeight, color: fmt.colors.text, fontStyle: 'italic' }}>
              {highlightText(summary, highlightKeywords, fmt.colors.accent)}
            </p>
          </div>
        );

      case 'skills':
        if (!skills.some(c => c.skills.length > 0)) return null;
        return (
          <div key="skills" style={{ marginBottom: `${fmt.sectionSpacing}px` }}>
            <SectionHeading title="Core Competencies" />
            <div style={{ columns: 2, columnGap: '16px' }}>
              {skills.flatMap(c => c.skills).map((skill, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: `${fmt.fontSize.small}rem`,
                  color: fmt.colors.text,
                  paddingTop: '2px',
                  breakInside: 'avoid',
                }}>
                  <span style={{ color: fmt.colors.accent, fontWeight: 600 }}>▸</span>
                  {highlightText(skill, highlightKeywords, fmt.colors.accent)}
                </div>
              ))}
            </div>
          </div>
        );

      case 'experience':
        if (!experience.length) return null;
        return (
          <div key="experience" style={{ marginBottom: `${fmt.sectionSpacing}px` }}>
            <SectionHeading title="Professional Experience" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${fmt.sectionSpacing * 0.7}px` }}>
              {experience.map(exp => (
                <div key={exp.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2px' }}>
                    <div>
                      <span style={{ fontSize: `${fmt.fontSize.body}rem`, fontWeight: 700, color: fmt.colors.primary }}>{exp.role}</span>
                      {exp.company && <span style={{ fontSize: `${fmt.fontSize.body}rem`, color: fmt.colors.text }}>{', '}{exp.company}</span>}
                    </div>
                    <span style={{ fontSize: `${fmt.fontSize.small}rem`, color: fmt.colors.muted, fontStyle: 'italic' }}>
                      {exp.location ? `${exp.location} | ` : ''}{formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}
                    </span>
                  </div>
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <div key={i} style={{ display: 'flex', gap: '6px', fontSize: `${fmt.fontSize.body}rem`, lineHeight: fmt.lineHeight, color: fmt.colors.text, marginTop: '2px' }}>
                      <span style={{ color: fmt.colors.accent, flexShrink: 0 }}>{bulletSymbol(fmt.bulletStyle)}</span>
                      <span>{highlightText(b, highlightKeywords, fmt.colors.accent)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );

      case 'projects':
        if (!projects.length) return null;
        return (
          <div key="projects" style={{ marginBottom: `${fmt.sectionSpacing}px` }}>
            <SectionHeading title="Projects" />
            {projects.map(proj => (
              <div key={proj.id} style={{ marginBottom: `${fmt.sectionSpacing * 0.5}px` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: `${fmt.fontSize.body}rem`, fontWeight: 700, color: fmt.colors.primary }}>{proj.title}</span>
                  {proj.techStack.length > 0 && (
                    <span style={{ fontSize: `${fmt.fontSize.small}rem`, color: fmt.colors.muted, fontStyle: 'italic' }}>
                      {proj.techStack.slice(0, 5).join(', ')}
                    </span>
                  )}
                </div>
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
              <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '4px' }}>
                <div>
                  <span style={{ fontSize: `${fmt.fontSize.body}rem`, fontWeight: 700, color: fmt.colors.primary }}>{edu.degree}{edu.field ? ` — ${edu.field}` : ''}</span>
                  {edu.institution && <span style={{ fontSize: `${fmt.fontSize.body}rem`, color: fmt.colors.text }}>{', '}{edu.institution}</span>}
                </div>
                <span style={{ fontSize: `${fmt.fontSize.small}rem`, color: fmt.colors.muted, fontStyle: 'italic' }}>
                  {formatDate(edu.startDate)} – {formatDate(edu.endDate)}{edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
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
        fontFamily: '"Georgia", "Times New Roman", serif',
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
