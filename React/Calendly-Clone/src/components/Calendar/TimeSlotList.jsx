import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { getDayDifference, getRelativeDay } from '../../utils/time-math';

const TimeSlotList = ({ 
  slots, 
  selectedSlot, 
  onSlotSelect, 
  hostTimeZone, 
  visitorTimeZone,
  selectedDate 
}) => {
  // Get day difference between host and visitor for the selected date
  const dayDiff = getDayDifference(selectedDate, hostTimeZone, visitorTimeZone);
  
  // Get relative day for the visitor
  const relativeDay = getRelativeDay(selectedDate, visitorTimeZone);

  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-500">No available slots for this date</p>
        <p className="text-sm text-gray-400 mt-1">Please select another date</p>
      </div>
    );
  }

  return (
    <div className="time-slot-list">
      {/* Date header with timezone info */}
      <div className="mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 capitalize">{relativeDay}</p>
            <p className="text-sm text-gray-500">
              {formatInTimeZone(selectedDate, visitorTimeZone, 'MMMM d, yyyy')}
            </p>
          </div>
          {dayDiff !== 0 && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              dayDiff > 0 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {dayDiff > 0 ? `+${dayDiff} Day` : `${dayDiff} Day`}
            </span>
          )}
        </div>
        
        {/* Timezone info */}
        <div className="mt-2 text-xs text-gray-500">
          <span>Times shown in {visitorTimeZone}</span>
          {visitorTimeZone !== hostTimeZone && (
            <span className="ml-2">
              (Host: {hostTimeZone})
            </span>
          )}
        </div>
      </div>

      {/* Time slots grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-1">
        {slots.map((slot, index) => {
          const isSelected = selectedSlot?.utc === slot.utc;
          const hasDayIndicator = slot.isNextDay || slot.isPrevDay;

          return (
            <button
              key={index}
              onClick={() => onSlotSelect(slot)}
              className={`
                relative p-3 rounded-lg text-center transition-all duration-200
                ${isSelected 
                  ? 'bg-primary text-white shadow-md transform scale-105' 
                  : 'bg-gray-50 hover:bg-blue-50 hover:border-primary border border-transparent'
                }
              `}
            >
              <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                {slot.display}
              </span>
              
              {/* Day indicator badge */}
              {hasDayIndicator && (
                <span className={`
                  absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full
                  ${slot.isNextDay 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-orange-500 text-white'
                  }
                `}>
                  {slot.isNextDay ? '+1' : '-1'}
                </span>
              )}
              
              {/* Host time tooltip on hover */}
              {visitorTimeZone !== hostTimeZone && (
                <div className={`text-[10px] mt-1 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                  Host: {slot.hostTime}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Summary */}
      {selectedSlot && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Selected:</strong> {selectedSlot.display} on {selectedSlot.displayDate}
            {selectedSlot.isNextDay && <span className="ml-1 text-blue-600">(Next day for you)</span>}
            {selectedSlot.isPrevDay && <span className="ml-1 text-orange-600">(Previous day for you)</span>}
          </p>
        </div>
      )}
    </div>
  );
};

export default TimeSlotList;
