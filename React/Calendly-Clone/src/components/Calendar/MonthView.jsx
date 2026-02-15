import { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  isBefore,
  startOfDay
} from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { getDayDifference } from '../../utils/time-math';

const MonthView = ({ selectedDate, onDateSelect, hostTimeZone, visitorTimeZone }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate calendar days for the current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 }); // Saturday

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Check if a day is a weekend
  const isWeekend = (day) => {
    const dayOfWeek = day.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  // Check if a day is in the past
  const isPast = (day) => {
    const today = startOfDay(new Date());
    return isBefore(day, today);
  };

  // Get day info for the visitor's timezone
  const getDayInfo = (day) => {
    const dayDiff = getDayDifference(day, hostTimeZone, visitorTimeZone);
    
    if (dayDiff > 0) return { label: `+${dayDiff} day`, className: 'text-blue-600 bg-blue-50' };
    if (dayDiff < 0) return { label: `${dayDiff} day`, className: 'text-red-600 bg-red-50' };
    return null;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="month-view">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isDayToday = isToday(day);
          const isDayWeekend = isWeekend(day);
          const isDayPast = isPast(day);
          const dayInfo = getDayInfo(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => !isDayPast && !isDayWeekend && onDateSelect(day)}
              disabled={isDayPast || isDayWeekend}
              className={`
                relative p-2 text-center rounded-lg transition-all
                ${!isCurrentMonth ? 'text-gray-300' : ''}
                ${isDayPast ? 'text-gray-300 cursor-not-allowed' : ''}
                ${isDayWeekend ? 'text-gray-300 cursor-not-allowed' : ''}
                ${isSelected ? 'bg-primary text-white shadow-md' : ''}
                ${isDayToday && !isSelected ? 'border-2 border-primary' : ''}
                ${!isDayPast && !isDayWeekend && isCurrentMonth && !isSelected ? 'hover:bg-gray-100' : ''}
              `}
            >
              <span className="text-sm font-medium">{format(day, 'd')}</span>
              
              {/* Today indicator */}
              {isDayToday && !isSelected && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full"></span>
              )}
              
              {/* Day difference badge */}
              {dayInfo && !isSelected && isCurrentMonth && !isDayPast && (
                <span className={`absolute bottom-0.5 left-0 right-0 text-[8px] font-medium ${dayInfo.className} rounded`}>
                  {dayInfo.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 border-2 border-primary rounded"></span>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-primary rounded"></span>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-gray-200 rounded"></span>
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
};

export default MonthView;
