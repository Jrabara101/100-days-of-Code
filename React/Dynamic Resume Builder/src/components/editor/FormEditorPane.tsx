import React, { useState } from 'react';
import { useResumeStore } from '../../store/useResumeStore';

export const FormEditorPane: React.FC = () => {
  const {
    present,
    updateHeader,
    updateSection,
    updateExperienceItem,
    addExperienceItem,
    deleteExperienceItem,
    updateBullet,
    addBullet,
    deleteBullet,
    setActiveSectionId,
    applyAutoTune,
  } = useResumeStore();

  const [expandedSection, setExpandedSection] = useState<string>('sec-experience');
  const [activeTab, setActiveTab] = useState<'content' | 'ai' | 'revisions'>('content');

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? '' : id);
    setActiveSectionId(id);
  };

  const experienceSection = present.sections.find((s) => s.type === 'experience');
  const summarySection = present.sections.find((s) => s.type === 'summary');
  const capabilitiesSection = present.sections.find((s) => s.type === 'capabilities');
  const educationSection = present.sections.find((s) => s.type === 'education');
  const patentsSection = present.sections.find((s) => s.type === 'patents');

  const insertActionVerb = (secId: string, itemId: string, bulletIdx: number, currentText: string, verb: string) => {
    // If text already has words, prepend or replace first word
    const words = currentText.trim().split(' ');
    let newText = `${verb} ${currentText}`;
    if (words.length > 0 && /^[a-z]+ed\b/i.test(words[0])) {
      words[0] = verb;
      newText = words.join(' ');
    }
    updateBullet(secId, itemId, bulletIdx, newText);
  };

  return (
    <section
      aria-label="Resume Content Editor"
      className="w-96 min-w-[360px] max-w-[400px] bg-surface-container-low/95 backdrop-blur-xl flex flex-col h-full shrink-0 shadow-[2px_0_12px_rgba(0,0,0,0.5)] z-20 no-print border-r border-outline-variant/20"
    >
      {/* Top Sub-Header & Navigation Tabs */}
      <div className="p-space-md bg-surface-container-lowest/80 flex flex-col gap-space-sm border-b border-outline-variant/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-title text-title text-on-surface font-bold tracking-tight">Structured Content</span>
          </div>
          <span className="px-space-xs py-0.5 rounded bg-surface-container font-code-metric text-code-metric text-on-surface-variant">
            ⌘K to jump
          </span>
        </div>

        {/* Mode Switches */}
        <div className="grid grid-cols-3 bg-surface-container-low p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`py-1 rounded text-center font-label-md text-label-md flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'content'
                ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">edit_note</span> Content
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`py-1 rounded text-center font-label-md text-label-md flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'ai'
                ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span> AI Co-pilot
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('revisions')}
            className={`py-1 rounded text-center font-label-md text-label-md flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'revisions'
                ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">history</span> Revisions
          </button>
        </div>
      </div>

      {/* Accordion Stack Scroll Area */}
      <div className="flex-1 overflow-y-auto px-space-md py-space-sm space-y-space-sm">
        {/* ========================================================================= */}
        {/* SECTION 1: Personal Details                                               */}
        {/* ========================================================================= */}
        <div className="bg-surface-container rounded-xl overflow-hidden shadow-sm transition-all">
          <div
            onClick={() => toggleSection('sec-personal')}
            className="p-space-sm flex items-center justify-between cursor-pointer hover:bg-surface-container-high/80 transition-colors"
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-outline text-[18px]">badge</span>
              <div>
                <span className="font-title text-title text-on-surface font-semibold block">Personal Details</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {present.header.fullName} • {present.header.location}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                {expandedSection === 'sec-personal' ? 'expand_less' : 'expand_more'}
              </span>
            </div>
          </div>

          {expandedSection === 'sec-personal' && (
            <div className="p-space-md space-y-space-sm bg-surface-container-low/50 border-t border-outline-variant/10">
              <div className="grid grid-cols-2 gap-space-xs">
                <div className="flex flex-col gap-0.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">Full Name</label>
                  <input
                    type="text"
                    value={present.header.fullName}
                    onChange={(e) => updateHeader({ fullName: e.target.value })}
                    className="bg-surface-container-lowest px-space-xs py-1 rounded text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">Role Title</label>
                  <input
                    type="text"
                    value={present.header.roleTitle}
                    onChange={(e) => updateHeader({ roleTitle: e.target.value })}
                    className="bg-surface-container-lowest px-space-xs py-1 rounded text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-space-xs">
                <div className="flex flex-col gap-0.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">Secondary Role / Specialization</label>
                  <input
                    type="text"
                    value={present.header.secondaryTitle}
                    onChange={(e) => updateHeader({ secondaryTitle: e.target.value })}
                    className="bg-surface-container-lowest px-space-xs py-1 rounded text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">Location</label>
                  <input
                    type="text"
                    value={present.header.location}
                    onChange={(e) => updateHeader({ location: e.target.value })}
                    className="bg-surface-container-lowest px-space-xs py-1 rounded text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-space-xs">
                <div className="flex flex-col gap-0.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">Email</label>
                  <input
                    type="email"
                    value={present.header.email}
                    onChange={(e) => updateHeader({ email: e.target.value })}
                    className="bg-surface-container-lowest px-space-xs py-1 rounded text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">Phone</label>
                  <input
                    type="text"
                    value={present.header.phone}
                    onChange={(e) => updateHeader({ phone: e.target.value })}
                    className="bg-surface-container-lowest px-space-xs py-1 rounded text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant">GitHub / Portfolio URL</label>
                <input
                  type="text"
                  value={present.header.github}
                  onChange={(e) => updateHeader({ github: e.target.value })}
                  className="bg-surface-container-lowest px-space-xs py-1 rounded text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: Work Experience                                                */}
        {/* ========================================================================= */}
        {experienceSection && (
          <div className="bg-surface-container rounded-xl overflow-hidden shadow-md">
            <div className="p-space-sm bg-surface-container-high flex items-center justify-between">
              <div
                className="flex items-center gap-space-sm cursor-pointer"
                onClick={() => toggleSection(experienceSection.id)}
              >
                <span className="material-symbols-outlined text-primary text-[18px]">work</span>
                <div className="flex items-center gap-space-xs">
                  <span className="font-title text-title text-on-surface font-semibold">
                    {experienceSection.title}
                  </span>
                  <span className="bg-primary-container text-on-primary-container px-1.5 py-0.5 rounded font-label-sm text-label-sm">
                    {experienceSection.content.items?.length || 0} Roles
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-space-xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addExperienceItem(experienceSection.id);
                  }}
                  className="w-6 h-6 rounded bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                  title="Add Experience Role"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
                <span
                  onClick={() => toggleSection(experienceSection.id)}
                  className="material-symbols-outlined text-primary text-[18px] cursor-pointer"
                >
                  {expandedSection === experienceSection.id ? 'expand_less' : 'expand_more'}
                </span>
              </div>
            </div>

            {expandedSection === experienceSection.id && (
              <div className="p-space-md space-y-space-md bg-surface-container">
                {experienceSection.content.items?.map((item, itemIdx) => (
                  <div
                    key={item.id}
                    className="bg-surface-container-low p-space-sm rounded-lg shadow-sm space-y-space-sm border border-outline-variant/10"
                  >
                    {/* Item Header */}
                    <div className="flex items-center justify-between pb-1 border-b border-outline-variant/10">
                      <div className="flex items-center gap-space-xs">
                        <span className={`w-2 h-2 rounded-full ${itemIdx === 0 ? 'bg-primary' : 'bg-outline'}`}></span>
                        <span className="font-label-md text-label-md text-primary uppercase tracking-wide font-semibold">
                          {item.company || `Role #${itemIdx + 1}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteExperienceItem(experienceSection.id, item.id)}
                          className="text-on-surface-variant hover:text-error text-[14px] p-0.5 rounded transition-colors"
                          title="Delete Role"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-space-xs">
                      <div className="flex flex-col gap-0.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant">Role Title</label>
                        <input
                          type="text"
                          value={item.role}
                          onChange={(e) =>
                            updateExperienceItem(experienceSection.id, item.id, { role: e.target.value })
                          }
                          className="bg-surface-container-lowest px-space-xs py-1 rounded text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant">Organization</label>
                        <input
                          type="text"
                          value={item.company}
                          onChange={(e) =>
                            updateExperienceItem(experienceSection.id, item.id, { company: e.target.value })
                          }
                          className="bg-surface-container-lowest px-space-xs py-1 rounded text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-space-xs">
                      <div className="flex flex-col gap-0.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant">Date Range</label>
                        <input
                          type="text"
                          value={`${item.startDate} — ${item.endDate}`}
                          onChange={(e) => {
                            const [start, end] = e.target.value.split('—');
                            updateExperienceItem(experienceSection.id, item.id, {
                              startDate: start ? start.trim() : item.startDate,
                              endDate: end ? end.trim() : item.endDate,
                            });
                          }}
                          className="bg-surface-container-lowest px-space-xs py-1 rounded text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="font-label-sm text-label-sm text-on-surface-variant">Location</label>
                        <input
                          type="text"
                          value={item.location}
                          onChange={(e) =>
                            updateExperienceItem(experienceSection.id, item.id, { location: e.target.value })
                          }
                          className="bg-surface-container-lowest px-space-xs py-1 rounded text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {/* Bullets & Achievements */}
                    <div className="flex flex-col gap-1 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="font-label-sm text-label-sm text-on-surface-variant">
                          Achievements & Metrics ({item.bullets.length})
                        </label>
                        <button
                          onClick={() => addBullet(experienceSection.id, item.id)}
                          className="text-secondary font-label-sm text-label-sm flex items-center gap-0.5 hover:underline"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[13px]">add</span> Add Bullet
                        </button>
                      </div>

                      {item.bullets.map((bullet, bulletIdx) => (
                        <div key={bulletIdx} className="space-y-1 bg-surface-container-lowest p-2 rounded">
                          <div className="flex items-start gap-1">
                            <textarea
                              rows={2}
                              value={bullet}
                              onChange={(e) =>
                                updateBullet(experienceSection.id, item.id, bulletIdx, e.target.value)
                              }
                              className="w-full bg-transparent text-on-surface font-body-sm text-body-sm focus:outline-none leading-relaxed resize-none"
                            />
                            {item.bullets.length > 1 && (
                              <button
                                onClick={() => deleteBullet(experienceSection.id, item.id, bulletIdx)}
                                className="text-on-surface-variant hover:text-error p-0.5"
                                title="Remove Bullet"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                              </button>
                            )}
                          </div>

                          {/* Action Verb Recommendation Pills */}
                          {bulletIdx === 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-outline-variant/10">
                              <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                                Suggestions:
                              </span>
                              <button
                                onClick={() =>
                                  insertActionVerb(experienceSection.id, item.id, bulletIdx, bullet, 'Orchestrated')
                                }
                                className="px-1.5 py-0.5 rounded bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary font-code-metric text-code-metric transition-colors"
                                type="button"
                              >
                                + Orchestrated
                              </button>
                              <button
                                onClick={() =>
                                  insertActionVerb(experienceSection.id, item.id, bulletIdx, bullet, 'Accelerated')
                                }
                                className="px-1.5 py-0.5 rounded bg-surface-container-high text-secondary hover:bg-secondary hover:text-on-secondary font-code-metric text-code-metric transition-colors"
                                type="button"
                              >
                                + Accelerated
                              </button>
                              <button
                                onClick={() =>
                                  insertActionVerb(experienceSection.id, item.id, bulletIdx, bullet, 'Spearheaded')
                                }
                                className="px-1.5 py-0.5 rounded bg-surface-container-high text-tertiary hover:bg-tertiary hover:text-on-tertiary font-code-metric text-code-metric transition-colors"
                                type="button"
                              >
                                + Spearheaded
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: Executive Summary                                              */}
        {/* ========================================================================= */}
        {summarySection && (
          <div className="bg-surface-container rounded-xl overflow-hidden shadow-sm">
            <div
              onClick={() => toggleSection(summarySection.id)}
              className="p-space-sm flex items-center justify-between cursor-pointer hover:bg-surface-container-high/80 transition-colors"
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-outline text-[18px]">subject</span>
                <span className="font-title text-title text-on-surface font-semibold">{summarySection.title}</span>
              </div>
              <div className="flex items-center gap-space-xs">
                <span className="px-1.5 py-0.5 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-label-sm">
                  {summarySection.content.text?.split(/\s+/).filter(Boolean).length || 0} words
                </span>
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                  {expandedSection === summarySection.id ? 'expand_less' : 'expand_more'}
                </span>
              </div>
            </div>

            {expandedSection === summarySection.id && (
              <div className="p-space-md bg-surface-container-low/50 border-t border-outline-variant/10">
                <textarea
                  rows={4}
                  value={summarySection.content.text || ''}
                  onChange={(e) =>
                    updateSection(summarySection.id, {
                      content: { ...summarySection.content, text: e.target.value },
                    })
                  }
                  className="w-full bg-surface-container-lowest p-space-xs rounded text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-none"
                  placeholder="Enter executive professional summary..."
                />
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: Technical Capabilities / Skills                                */}
        {/* ========================================================================= */}
        {capabilitiesSection && (
          <div className="bg-surface-container rounded-xl overflow-hidden shadow-sm p-space-sm">
            <div
              onClick={() => toggleSection(capabilitiesSection.id)}
              className="flex items-center justify-between pb-space-xs cursor-pointer"
            >
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-outline text-[18px]">psychology</span>
                <span className="font-title text-title text-on-surface font-semibold">
                  {capabilitiesSection.title}
                </span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                {expandedSection === capabilitiesSection.id ? 'expand_less' : 'expand_more'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {capabilitiesSection.content.capabilities?.map((cat) =>
                cat.skills.map((skill, sIdx) => (
                  <span
                    key={`${cat.id}-${sIdx}`}
                    className="px-2 py-1 rounded bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1"
                  >
                    {skill.name}{' '}
                    {skill.proficiency && (
                      <span className="text-secondary font-code-metric">{skill.proficiency}%</span>
                    )}
                  </span>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: Education                                                      */}
        {/* ========================================================================= */}
        {educationSection && (
          <div className="bg-surface-container rounded-xl overflow-hidden shadow-sm p-space-sm flex items-center justify-between cursor-pointer hover:bg-surface-container-high/80 transition-colors">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-outline text-[18px]">school</span>
              <div>
                <span className="font-title text-title text-on-surface font-semibold block">Education</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {educationSection.content.education?.[0]?.institution || 'University'} •{' '}
                  {educationSection.content.education?.[0]?.graduationYear || '2020'}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">expand_more</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 6: Patents & Publications                                         */}
        {/* ========================================================================= */}
        {patentsSection && (
          <div className="bg-surface-container rounded-xl overflow-hidden shadow-sm p-space-sm flex items-center justify-between cursor-pointer hover:bg-surface-container-high/80 transition-colors">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-outline text-[18px]">workspace_premium</span>
              <div>
                <span className="font-title text-title text-on-surface font-semibold block">Patents & Open Source</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {patentsSection.content.patents?.length || 0} Entries
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">expand_more</span>
          </div>
        )}
      </div>

      {/* Bottom Form Actions */}
      <div className="p-space-md bg-surface-container-lowest flex items-center justify-between shadow-[0_-2px_8px_rgba(0,0,0,0.3)] border-t border-outline-variant/10">
        <button
          onClick={() => applyAutoTune()}
          className="flex items-center gap-1.5 px-space-sm py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-primary text-[18px]">auto_fix_high</span> Auto-Tune Text
        </button>

        <div className="flex items-center gap-space-xs">
          <span className="font-label-sm text-label-sm text-on-surface-variant">AI Active</span>
          <div className="w-2 h-2 rounded-full bg-secondary animate-ping"></div>
        </div>
      </div>
    </section>
  );
};
