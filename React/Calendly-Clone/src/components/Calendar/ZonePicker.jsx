import { useState, useEffect } from 'react';
import { getTimeZones, getCurrentTimeInZone, formatInZone } from '../../utils/time-math';

const ZonePicker = ({ value, onChange, hostTimeZone }) => {
  const [timeZones, setTimeZones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const zones = getTimeZones();
    setTimeZones(zones);
  }, []);

  const filteredZones = timeZones.filter(zone =>
    zone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentTime = value ? formatInZone(new Date(), value, 'h:mm a') : '';
  const currentDate = value ? formatInZone(new Date(), value, 'EEE, MMM d') : '';

  // Calculate time difference between host and visitor
  const getTimeDifference = () => {
    if (!value || !hostTimeZone) return null;
    
    const hostTime = new Date();
    const visitorTime = new Date();
    
    const hostOffset = getTimeZoneOffset(hostTime, hostTimeZone);
    const visitorOffset = getTimeZoneOffset(visitorTime, value);
    
    const diffHours = (visitorOffset - hostOffset) / 60;
    
    if (diffHours === 0) return null;
    
    const sign = diffHours > 0 ? '+' : '';
    return `${sign}${diffHours} hours`;
  };

  const getTimeZoneOffset = (date, timeZone) => {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
    return (tzDate - utcDate) / 60000;
  };

  const timeDiff = getTimeDifference();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Your Time Zone</h3>
          <p className="text-sm text-gray-500">
            Select your local time zone for accurate scheduling
          </p>
        </div>
        
        {value && (
          <div className="text-right">
            <p className="text-lg font-medium text-primary">{currentTime}</p>
            <p className="text-sm text-gray-500">{currentDate}</p>
          </div>
        )}
      </div>

      {/* Dropdown */}
      <div className="relative">
        <div className="flex">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search time zones..."
              className="w-full px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Detect button */}
          <button
            type="button"
            onClick={() => {
              const detectedZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              onChange(detectedZone);
              setSearchTerm('');
              setIsOpen(false);
            }}
            className="px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-r-lg hover:bg-gray-200 transition-colors"
          >
            Detect
          </button>
        </div>

        {/* Dropdown list */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {filteredZones.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 text-center">No time zones found</div>
            ) : (
              filteredZones.map((zone) => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => {
                    onChange(zone);
                    setSearchTerm('');
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                    value === zone ? 'bg-blue-50 text-primary font-medium' : 'text-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{zone}</span>
                    <span className="text-sm text-gray-500">
                      {formatInZone(new Date(), zone, 'GMTxxx')}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Time difference indicator */}
      {timeDiff && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            This is <strong>{timeDiff}</strong> from the host's time zone ({hostTimeZone})
          </span>
        </div>
      )}
    </div>
  );
};

export default ZonePicker;
