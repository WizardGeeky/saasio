"use client";

import React from "react";
import type { ResumeData, SectionType, FormatConfig } from "../types";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string): string {
  if (!d) return '';
  const [year, month] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function bulletSymbol(style: FormatConfig['bulletStyle']): string {
  return { dash: '–', dot: '•', arrow: '›', none: '' }[style];
}

// ─── Section Heading ────────────────────────────────────────────────────────────

function SectionHeading({
  title, fmt,
}: { title: string; fmt: FormatConfig }) {
  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{
          fontSize: `${fmt.fontSize.heading}rem`,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: fmt.colors.accent,
        }}>
          {title}
        </span>
        {fmt.showDividers && (
          <div style={{
            flex: 1,
            height: '1.5px',
            backgroundColor: fmt.colors.accent,
            opacity: 0.3,
          }} />
        )}
      </div>
    </div>
  );
}

// ─── Template ──────────────────────────────────────────────────────────────────

interface Props {
  resume: ResumeData;
  highlightKeywords?: string[];
}

function highlightText(text: string, keywords: string[], color: string): React.ReactNode {
  if (!keywords.length) return text;
  const pattern = new RegExp(`(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    pattern.test(part)
      ? <mark key={i} style={{ backgroundColor: `${color}30`, color: color, fontWeight: 600, borderRadius: '2px', padding: '0 1px' }}>{part}</mark>
      : part
  );
}

export default function ModernTemplate({ resume, highlightKeywords = [] }: Props) {
  const { header, summary, skills, experience, projects, education, sectionOrder, format: fmt } = resume;
  const { margins: m } = fmt;

  const renderSection = (section: SectionType): React.ReactNode => {
    switch (section) {
      // ── HEADER ──
      case 'header':
        if (!header.name && !header.email) return null;
        return (
          <div key="header" style={{
            textAlign: fmt.headerAlignment,
            marginBottom: `${fmt.sectionSpacing}px`,
            paddingBottom: `${fmt.sectionSpacing * 0.6}px`,
            borderBottom: fmt.showDividers ? `2px solid ${fmt.colors.accent}` : 'none',
          }}>
            {header.name && (
              <div style={{
                fontSize: `${fmt.fontSize.name}rem`,
                fontWeight: 800,
                color: fmt.colors.primary,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}>
                {header.name}
              </div>
            )}
            {header.title && (
              <div style={{
                fontSize: `${fmt.fontSize.body + 0.1}rem`,
                color: fmt.colors.accent,
                fontWeight: 500,
                marginTop: '2px',
              }}>
                {header.title}
              </div>
            )}
            {/* Contact line */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px 12px',
              fontSize: `${fmt.fontSize.small}rem`,
              color: fmt.colors.muted,
              marginTop: '6px',
              justifyContent: fmt.headerAlignment === 'center' ? 'center' : fmt.headerAlignment === 'right' ? 'flex-end' : 'flex-start',
            }}>
              {header.email && <span>{header.email}</span>}
              {header.phone && <span>{header.phone}</span>}
              {header.location && <span>{header.location}</span>}
              {header.linkedin && <span>{header.linkedin}</span>}
              {header.portfolio && <span>{header.portfolio}</span>}
            </div>
          </div>
        );

      // ── SUMMARY ──
      case 'summary':
        if (!summary) return null;
        return (
          <div key="summary" style={{ marginBottom: `${fmt.sectionSpacing}px` }}>
            <SectionHeading title="Summary" fmt={fmt} />
            <p style={{
              fontSize: `${fmt.fontSize.body}rem`,
              lineHeight: fmt.lineHeight,
              color: fmt.colors.text,
            }}>
              {highlightText(summary, highlightKeywords, fmt.colors.accent)}
            </p>
          </div>
        );

      // ── SKILLS ──
      case 'skills':
        if (!skills.some(c => c.skills.length > 0)) return null;
        return (
          <div key="skills" style={{ marginBottom: `${fmt.sectionSpacing}px` }}>
            <SectionHeading title="Skills" fmt={fmt} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {skills.filter(c => c.skills.length > 0).map(cat => (
                <div key={cat.id} style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: `${fmt.fontSize.small}rem`,
                    fontWeight: 600,
                    color: fmt.colors.text,
                    minWidth: '90px',
                    flexShrink: 0,
                    paddingTop: '1px',
                  }}>
                    {cat.name}:
                  </span>
                  <span style={{
                    fontSize: `${fmt.fontSize.small}rem`,
                    color: fmt.colors.text,
                    lineHeight: fmt.lineHeight,
                  }}>
                    {cat.skills.map((skill, i) => (
                      <React.Fragment key={skill}>
                        {highlightText(skill, highlightKeywords, fmt.colors.accent)}
                        {i < cat.skills.length - 1 ? ', ' : ''}
                      </React.Fragment>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      // ── EXPERIENCE ──
      case 'experience':
        if (!experience.length) return null;
        return (
          <div key="experience" style={{ marginBottom: `${fmt.sectionSpacing}px` }}>
            <SectionHeading title="Experience" fmt={fmt} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${fmt.sectionSpacing * 0.6}px` }}>
              {experience.map(exp => (
                <div key={exp.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2px' }}>
                    <div>
                      <span style={{ fontSize: `${fmt.fontSize.body}rem`, fontWeight: 600, color: fmt.colors.text }}>
                        {exp.role}
                      </span>
                      {exp.company && (
                        <span style={{ fontSize: `${fmt.fontSize.body}rem`, color: fmt.colors.accent, fontWeight: 500 }}>
                          {' '}· {exp.company}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: `${fmt.fontSize.small}rem`, color: fmt.colors.muted, textAlign: 'right', flexShrink: 0 }}>
                      {exp.location && <span>{exp.location} · </span>}
                      {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}
                    </div>
                  </div>
                  {exp.bullets.filter(Boolean).length > 0 && (
                    <ul style={{ marginTop: '3px', paddingLeft: '0', listStyle: 'none' }}>
                      {exp.bullets.filter(Boolean).map((b, i) => (
                        <li key={i} style={{
                          display: 'flex',
                          gap: '5px',
                          fontSize: `${fmt.fontSize.body}rem`,
                          lineHeight: fmt.lineHeight,
                          color: fmt.colors.text,
                          paddingTop: '1px',
                        }}>
                          <span style={{ color: fmt.colors.accent, flexShrink: 0, marginTop: '1px' }}>
                            {bulletSymbol(fmt.bulletStyle)}
                          </span>
                          <span>{highlightText(b, highlightKeywords, fmt.colors.accent)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      // ── PROJECTS ──
      case 'projects':
        if (!projects.length) return null;
        return (
          <div key="projects" style={{ marginBottom: `${fmt.sectionSpacing}px` }}>
            <SectionHeading title="Projects" fmt={fmt} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${fmt.sectionSpacing * 0.6}px` }}>
              {projects.map(proj => (
                <div key={proj.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2px' }}>
                    <span style={{ fontSize: `${fmt.fontSize.body}rem`, fontWeight: 600, color: fmt.colors.text }}>
                      {proj.title}
                    </span>
                    {(proj.link || proj.github) && (
                      <span style={{ fontSize: `${fmt.fontSize.small}rem`, color: fmt.colors.accent }}>
                        {proj.link || proj.github}
                      </span>
                    )}
                  </div>
                  {proj.techStack.length > 0 && (
                    <div style={{ fontSize: `${fmt.fontSize.small}rem`, color: fmt.colors.muted, marginTop: '1px' }}>
                      {proj.techStack.map((t, i) => (
                        <React.Fragment key={t}>
                          {highlightText(t, highlightKeywords, fmt.colors.accent)}
                          {i < proj.techStack.length - 1 ? ' · ' : ''}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                  {proj.description && (
                    <p style={{
                      fontSize: `${fmt.fontSize.body}rem`,
                      lineHeight: fmt.lineHeight,
                      color: fmt.colors.text,
                      marginTop: '2px',
                    }}>
                      {highlightText(proj.description, highlightKeywords, fmt.colors.accent)}
                    </p>
                  )}
                  {proj.bullets.filter(Boolean).length > 0 && (
                    <ul style={{ marginTop: '3px', paddingLeft: '0', listStyle: 'none' }}>
                      {proj.bullets.filter(Boolean).map((b, i) => (
                        <li key={i} style={{
                          display: 'flex',
                          gap: '5px',
                          fontSize: `${fmt.fontSize.body}rem`,
                          lineHeight: fmt.lineHeight,
                          color: fmt.colors.text,
                          paddingTop: '1px',
                        }}>
                          <span style={{ color: fmt.colors.accent, flexShrink: 0 }}>
                            {bulletSymbol(fmt.bulletStyle)}
                          </span>
                          <span>{highlightText(b, highlightKeywords, fmt.colors.accent)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      // ── EDUCATION ──
      case 'education':
        if (!education.length) return null;
        return (
          <div key="education" style={{ marginBottom: `${fmt.sectionSpacing}px` }}>
            <SectionHeading title="Education" fmt={fmt} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${fmt.sectionSpacing * 0.4}px` }}>
              {education.map(edu => (
                <div key={edu.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2px' }}>
                    <div>
                      <span style={{ fontSize: `${fmt.fontSize.body}rem`, fontWeight: 600, color: fmt.colors.text }}>
                        {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                      </span>
                      {edu.institution && (
                        <span style={{ fontSize: `${fmt.fontSize.body}rem`, color: fmt.colors.accent }}> · {edu.institution}</span>
                      )}
                    </div>
                    <div style={{ fontSize: `${fmt.fontSize.small}rem`, color: fmt.colors.muted, textAlign: 'right', flexShrink: 0 }}>
                      {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                      {edu.gpa ? ` · GPA: ${edu.gpa}` : ''}
                    </div>
                  </div>
                  {edu.achievements.length > 0 && (
                    <div style={{ fontSize: `${fmt.fontSize.small}rem`, color: fmt.colors.muted, marginTop: '2px' }}>
                      {edu.achievements.join(' · ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
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
        fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
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
