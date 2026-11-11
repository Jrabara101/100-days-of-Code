import React, { useState } from 'react';
import { Car, Plane, Clock, MapPin, Users, Plus, CheckCircle2, MessageSquare } from 'lucide-react';

export function RideshareBoard({ event, currentGuest }) {
  const [rides, setRides] = useState([
    {
      id: 'r-1',
      author: 'Liam Takahashi',
      origin: 'SFO International (Terminal 3)',
      destination: 'MacArthur Place Hotel, Sonoma',
      timeWindow: 'Friday, Nov 13 • 1:30 PM – 2:00 PM',
      spotsAvailable: 2,
      note: 'Landing on United from Tokyo! Happy to split an Uber XL or minivan up to Sonoma.',
      contact: 'liam.t@example.com'
    },
    {
      id: 'r-2',
      author: 'Devon Park',
      origin: 'Oakland International (OAK)',
      destination: 'The Lodge at Sonoma Resort',
      timeWindow: 'Friday, Nov 13 • 3:00 PM',
      spotsAvailable: 3,
      note: 'Rented an SUV from Hertz at Oakland. Have trunk space for 3 suitcases and room for 3 guests!',
      contact: 'devon.p@example.com'
    },
    {
      id: 'r-3',
      author: 'Dr. Elena Rostova',
      origin: 'SFO International',
      destination: 'The Proper Hotel, San Francisco',
      timeWindow: 'Wednesday, Oct 14 • 4:30 PM',
      spotsAvailable: 1,
      note: 'Arriving on Swiss air. Grabbing a Waymo autonomous cab into downtown.',
      contact: 'elena.rostova@research.org'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [origin, setOrigin] = useState('SFO Airport');
  const [destination, setDestination] = useState('Sonoma Valley Hotel');
  const [timeWindow, setTimeWindow] = useState('Friday 2:00 PM');
  const [spots, setSpots] = useState(2);
  const [note, setNote] = useState('');
  const [coordinatedId, setCoordinatedId] = useState(null);

  const handlePostRide = (e) => {
    e.preventDefault();
    setRides([
      {
        id: `r-${Date.now()}`,
        author: currentGuest.primaryName,
        origin,
        destination,
        timeWindow,
        spotsAvailable: parseInt(spots, 10),
        note: note || 'Heading to the estate/hotel, let’s travel together!',
        contact: currentGuest.email || 'guest@example.com'
      },
      ...rides
    ]);
    setShowModal(false);
    setNote('');
  };

  return (
    <section id="rideshare" className="w-full mt-14 pt-8 border-t border-theme-border">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-theme-gold font-semibold mb-1">
            <Car className="w-3.5 h-3.5" />
            <span>Community Transit & Carpool Board</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-theme-primary font-normal">
            Guest Ride-Share & Airport Coordinator
          </h2>
          <p className="text-xs sm:text-sm text-theme-secondary max-w-xl mt-1">
            Landing at the same airport window? Coordinate a shared cab, split an SUV, or grab a morning airport coffee together.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-theme-accent text-white text-xs font-medium hover:brightness-110 transition shadow-sm self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Offer / Request Shared Ride</span>
        </button>
      </div>

      {/* Ride Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rides.map((ride) => (
          <div
            key={ride.id}
            className="p-5 rounded-2xl bg-theme-card border border-theme-border shadow-sm flex flex-col justify-between"
          >
            <div>
              {/* Header with author & spots */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-serif font-semibold text-theme-primary text-sm">
                  {ride.author}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-medium">
                  {ride.spotsAvailable} spot{ride.spotsAvailable > 1 ? 's' : ''} open
                </span>
              </div>

              {/* Transit Details */}
              <div className="space-y-1.5 text-xs text-theme-secondary mb-3">
                <div className="flex items-start gap-2">
                  <Plane className="w-3.5 h-3.5 text-theme-accent flex-shrink-0 mt-0.5" />
                  <span className="truncate">{ride.origin}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="truncate">{ride.destination}</span>
                </div>
                <div className="flex items-start gap-2 text-theme-muted font-mono text-[11px]">
                  <Clock className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>{ride.timeWindow}</span>
                </div>
              </div>

              {/* Note */}
              <p className="text-xs text-theme-secondary italic p-2.5 rounded-xl bg-theme-inset border border-theme-border/60 mb-4">
                "{ride.note}"
              </p>
            </div>

            {/* Action */}
            <div className="pt-3 border-t border-theme-border flex items-center justify-between">
              <span className="text-[10px] text-theme-muted">
                Contact: {ride.contact}
              </span>
              <button
                onClick={() => setCoordinatedId(ride.id)}
                className="px-3 py-1.5 rounded-xl bg-theme-inset hover:bg-theme-card border border-theme-border text-xs font-medium text-theme-primary hover:text-theme-accent transition"
              >
                {coordinatedId === ride.id ? 'Connected!' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-theme-card border border-theme-foil p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-xl font-serif font-bold text-theme-primary mb-2">
              Post an Airport / Hotel Ride
            </h3>
            <p className="text-xs text-theme-secondary mb-4">
              Help out-of-town guests split cabs or carpool directly to the venue.
            </p>

            <form onSubmit={handlePostRide} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-theme-muted uppercase mb-1">
                  Departure Point / Airport:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., SFO Terminal 2"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-theme-border bg-theme-inset text-theme-primary text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-theme-muted uppercase mb-1">
                  Destination Hotel:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., MacArthur Place Hotel"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-theme-border bg-theme-inset text-theme-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-theme-muted uppercase mb-1">
                    Flight / Time Window:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Fri 1:30 PM"
                    value={timeWindow}
                    onChange={(e) => setTimeWindow(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-theme-border bg-theme-inset text-theme-primary text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-theme-muted uppercase mb-1">
                    Seats Available:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={spots}
                    onChange={(e) => setSpots(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-theme-border bg-theme-inset text-theme-primary text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-theme-muted uppercase mb-1">
                  Message / Details:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Have a large Uber XL booked, space for 2 with bags!"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-theme-border bg-theme-inset text-theme-primary text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-theme-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-theme-border text-xs text-theme-muted hover:text-theme-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-theme-accent text-white font-medium text-xs hover:brightness-110"
                >
                  Publish Ride Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}

