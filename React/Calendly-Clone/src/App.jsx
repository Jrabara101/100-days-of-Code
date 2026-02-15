import { useState, useEffect } from 'react'
import { generateSlots, getTimeZones, convertTimeZone } from './utils/time-math'
import ZonePicker from './components/Calendar/ZonePicker'
import MonthView from './components/Calendar/MonthView'
import TimeSlotList from './components/Calendar/TimeSlotList'
import BookingForm from './components/BookingForm'

function App() {
  // Host configuration (in a real app, this would come from user settings)
  const [hostTimeZone, setHostTimeZone] = useState('America/New_York')
  
  // Visitor configuration
  const [visitorTimeZone, setVisitorTimeZone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  )
  
  // Selected date
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  // Available slots
  const [slots, setSlots] = useState([])
  
  // Selected slot for booking
  const [selectedSlot, setSelectedSlot] = useState(null)
  
  // Booking form visibility
  const [showBookingForm, setShowBookingForm] = useState(false)

  // Generate slots when date or timezone changes
  useEffect(() => {
    const generatedSlots = generateSlots(
      selectedDate,
      hostTimeZone,
      visitorTimeZone,
      9, // startHour
      17 // endHour
    )
    setSlots(generatedSlots)
  }, [selectedDate, hostTimeZone, visitorTimeZone])

  // Handle timezone change
  const handleTimeZoneChange = (newZone) => {
    setVisitorTimeZone(newZone)
  }

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    setShowBookingForm(false)
  }

  // Handle slot selection
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot)
    setShowBookingForm(true)
  }

  // Handle booking confirmed
  const handleBookingConfirmed = (bookingDetails) => {
    console.log('Booking confirmed:', bookingDetails)
    setShowBookingForm(false)
    setSelectedSlot(null)
    alert('Booking confirmed! (Demo only - no actual calendar integration)')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ChronosSync</h1>
          <p className="text-gray-600">Time-Zone Intelligent Scheduling Platform</p>
        </header>

        {/* Time Zone Picker */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <ZonePicker
            value={visitorTimeZone}
            onChange={handleTimeZoneChange}
            hostTimeZone={hostTimeZone}
          />
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar View */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Select a Date</h2>
            <MonthView
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              hostTimeZone={hostTimeZone}
              visitorTimeZone={visitorTimeZone}
            />
          </div>

          {/* Time Slots */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Available Times
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({visitorTimeZone})
              </span>
            </h2>
            <TimeSlotList
              slots={slots}
              selectedSlot={selectedSlot}
              onSlotSelect={handleSlotSelect}
              hostTimeZone={hostTimeZone}
              visitorTimeZone={visitorTimeZone}
              selectedDate={selectedDate}
            />
          </div>
        </div>

        {/* Booking Form Modal */}
        {showBookingForm && selectedSlot && (
          <BookingForm
            slot={selectedSlot}
            hostTimeZone={hostTimeZone}
            visitorTimeZone={visitorTimeZone}
            onConfirm={handleBookingConfirmed}
            onCancel={() => {
              setShowBookingForm(false)
              setSelectedSlot(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default App
