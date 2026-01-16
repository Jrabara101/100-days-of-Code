import React from 'react';

const TimelineSidebar = () => {
    // Mock schedule data
    const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 5 PM

    const schedule = [
        { id: 101, time: 9, title: 'Standup Meeting', duration: 1, type: 'event' },
        { id: 102, time: 10, title: 'Deep Work: Backend API', duration: 2, type: 'task' },
        { id: 103, time: 14, title: 'Client Review', duration: 1, type: 'event' },
    ];

    const getEventAtHour = (hour) => schedule.find(s => s.time === hour || (s.time < hour && s.time + s.duration > hour));

    return (
        <div className="glass-panel p-3 h-100 d-flex flex-column">
            <h6 className="text-light text-uppercase ls-1 mb-4 border-bottom border-secondary pb-2">Daily Schedule</h6>
            <div className="flex-grow-1 overflow-auto" style={{ maxHeight: '80vh' }}>
                {hours.map(hour => {
                    const event = getEventAtHour(hour);
                    const isStart = event && event.time === hour;
                    const isActive = event;

                    return (
                        <div key={hour} className="d-flex mb-2 position-relative">
                            <div className="text-muted small me-3" style={{ width: '50px', textAlign: 'right' }}>
                                {hour}:00
                            </div>
                            <div className="flex-grow-1 position-relative">
                                {/* Time slot line */}
                                <div style={{
                                    borderTop: '1px dashed rgba(255,255,255,0.1)',
                                    position: 'absolute',
                                    width: '100%',
                                    top: '10px'
                                }}></div>

                                {isActive && isStart && (
                                    <div className={`
                                        p-2 rounded fontSize-sm text-white shadow-sm
                                        ${event.type === 'event' ? 'bg-primary' : 'bg-success'}
                                    `} style={{
                                            position: 'absolute',
                                            top: '0',
                                            left: '10px',
                                            right: '0',
                                            zIndex: 10,
                                            height: `${event.duration * 40}px` // Rough height scaling
                                        }}>
                                        <div className="fw-bold">{event.title}</div>
                                        <div className="small opacity-75">{event.time}:00 - {event.time + event.duration}:00</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TimelineSidebar;
