import React, { useState } from 'react';
import { EventType, LocationType } from '../../types';

interface EventTypeManagerProps {
  eventTypes: EventType[];
  onToggleActive: (id: string) => void;
  onCreateEventType: (newType: Omit<EventType, 'id' | 'slug'>) => void;
  onSelectEventTypeToBook: (evt: EventType) => void;
}

export const EventTypeManager: React.FC<EventTypeManagerProps> = ({
  eventTypes,
  onToggleActive,
  onCreateEventType,
  onSelectEventTypeToBook,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [description, setDescription] = useState('');
  const [locationType, setLocationType] = useState<LocationType>('google-meet');
  const [locationDetails, setLocationDetails] = useState('');
  const [bufferBefore, setBufferBefore] = useState(10);
  const [bufferAfter, setBufferAfter] = useState(15);
  const [maxPerDay, setMaxPerDay] = useState(4);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateEventType({
      title,
      durationMinutes,
      description,
      locationType,
      locationDetails: locationDetails || (locationType === 'google-meet' ? 'meet.google.com/new-meeting' : 'Direct Link'),
      color: '#2563eb',
      isActive: true,
      bufferBeforeMinutes: bufferBefore,
      bufferAfterMinutes: bufferAfter,
      maxPerDay,
      noticeLeadHours: 4,
      horizonDays: 30,
    });

    setTitle('');
    setDescription('');
    setIsModalOpen(false);
  };

  const getLocationIcon = (type: LocationType) => {
    switch (type) {
      case 'google-meet':
        return 'videocam';
      case 'zoom':
        return 'video_camera_front';
      case 'phone':
        return 'call';
      case 'in-person':
        return 'pin_drop';
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-border-divider/70 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Event Types</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure meeting durations, dynamic video links, and custom buffer boundaries.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto px-4 py-2 bg-primary-container hover:bg-primary-hover active:scale-95 text-on-primary font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Event Type</span>
        </button>
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {eventTypes.map((evt) => (
          <div
            key={evt.id}
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
              evt.isActive
                ? 'bg-surface-container-lowest border-border-divider/80 shadow-xs'
                : 'bg-surface-neutral/50 border-border-divider/50 opacity-75'
            }`}
          >
            <div>
              {/* Card Top: Duration Pill + Toggle */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-bold text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {evt.durationMinutes}m
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-neutral text-text-secondary font-medium text-[11px] flex items-center gap-1 capitalize">
                    <span className="material-symbols-outlined text-[13px]">{getLocationIcon(evt.locationType)}</span>
                    {evt.locationType.replace('-', ' ')}
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={evt.isActive}
                    onChange={() => onToggleActive(evt.id)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-container"></div>
                </label>
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-bold text-text-primary">{evt.title}</h3>
              <p className="text-xs text-text-secondary line-clamp-2 mt-1 leading-relaxed">
                {evt.description}
              </p>

              {/* Boundary Protections summary */}
              <div className="mt-3 pt-3 border-t border-border-divider/50 grid grid-cols-3 gap-2 text-center text-[10px] text-text-secondary">
                <div className="p-1.5 rounded-lg bg-surface-neutral">
                  <span className="font-semibold text-text-primary block">
                    {evt.bufferBeforeMinutes}m / {evt.bufferAfterMinutes}m
                  </span>
                  <span>Buffers</span>
                </div>
                <div className="p-1.5 rounded-lg bg-surface-neutral">
                  <span className="font-semibold text-text-primary block">{evt.maxPerDay} calls</span>
                  <span>Daily Cap</span>
                </div>
                <div className="p-1.5 rounded-lg bg-surface-neutral">
                  <span className="font-semibold text-text-primary block">{evt.noticeLeadHours}h min</span>
                  <span>Lead Time</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-3 border-t border-border-divider/40 flex items-center justify-between">
              <span className="text-[11px] text-text-secondary font-mono">
                /alex-rivera/{evt.slug}
              </span>
              <button
                onClick={() => onSelectEventTypeToBook(evt)}
                className="px-3 py-1.5 rounded-xl bg-surface-variant hover:bg-surface-variant/80 text-primary text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
              >
                <span>Preview Flow</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Event Type Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-text-primary/40 backdrop-blur-xs" />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-border-divider/70 p-5 z-50 animate-slide-up space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-divider/50 pb-3">
              <h3 className="text-base font-bold text-text-primary">Create New Event Type</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-neutral text-text-secondary hover:text-text-primary flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 45 Min Sprint Review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface border border-border-divider text-xs focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Duration (minutes)</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                    className="w-full h-10 px-3 rounded-xl bg-surface border border-border-divider text-xs focus:border-primary outline-none"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1">Location</label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value as LocationType)}
                    className="w-full h-10 px-3 rounded-xl bg-surface border border-border-divider text-xs focus:border-primary outline-none"
                  >
                    <option value="google-meet">Google Meet (Auto-generated)</option>
                    <option value="zoom">Zoom Video</option>
                    <option value="phone">Phone Call</option>
                    <option value="in-person">In-Person Meeting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="A brief overview of what this meeting covers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface border border-border-divider text-xs focus:border-primary outline-none"
                />
              </div>

              {/* Host Burnout Boundaries */}
              <div className="p-3 bg-surface-neutral rounded-xl border border-border-divider/50 space-y-2">
                <span className="text-xs font-bold text-text-primary block">
                  Intelligent Buffer & Fatigue Boundaries
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-text-secondary mb-0.5">Buffer Before</label>
                    <select
                      value={bufferBefore}
                      onChange={(e) => setBufferBefore(parseInt(e.target.value, 10))}
                      className="w-full h-8 px-2 rounded-lg bg-surface border border-border-divider text-xs"
                    >
                      <option value={0}>0 min</option>
                      <option value={5}>5 mins</option>
                      <option value={10}>10 mins</option>
                      <option value={15}>15 mins</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-text-secondary mb-0.5">Buffer After</label>
                    <select
                      value={bufferAfter}
                      onChange={(e) => setBufferAfter(parseInt(e.target.value, 10))}
                      className="w-full h-8 px-2 rounded-lg bg-surface border border-border-divider text-xs"
                    >
                      <option value={0}>0 min</option>
                      <option value={10}>10 mins</option>
                      <option value={15}>15 mins</option>
                      <option value={30}>30 mins</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-text-secondary mb-0.5">Max Calls / Day</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={maxPerDay}
                      onChange={(e) => setMaxPerDay(parseInt(e.target.value, 10))}
                      className="w-full h-8 px-2 rounded-lg bg-surface border border-border-divider text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-neutral text-text-secondary hover:text-text-primary text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-container text-on-primary hover:bg-primary-hover active:scale-95 text-xs font-bold shadow-xs transition-all"
                >
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
