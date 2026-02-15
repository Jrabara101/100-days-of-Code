import React from 'react'
import ProfileCard from './components/ProfileCard'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-8">ProCard Engine</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Minimal Variant */}
          <ProfileCard variant="minimal" size="sm">
            <ProfileCard.Header src="https://via.placeholder.com/150" name="John Doe" />
            <ProfileCard.Body>
              <p className="text-gray-600 text-center">Software Engineer</p>
              <p className="text-sm text-gray-500 text-center">Building amazing things with code.</p>
            </ProfileCard.Body>
            <ProfileCard.Actions>
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Follow</button>
            </ProfileCard.Actions>
          </ProfileCard>

          {/* Glass Variant */}
          <ProfileCard variant="glass" size="sm" className="backdrop-blur-md">
            <ProfileCard.Header name="Jane Smith" />
            <ProfileCard.Body>
              <p className="text-gray-700 text-center">Designer</p>
              <p className="text-sm text-gray-600 text-center">Creating beautiful user experiences.</p>
            </ProfileCard.Body>
            <ProfileCard.Actions>
              <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">Connect</button>
            </ProfileCard.Actions>
          </ProfileCard>

          {/* Dark Variant */}
          <ProfileCard variant="dark" size="sm">
            <ProfileCard.Header src="https://via.placeholder.com/150" name="Alex Johnson" />
            <ProfileCard.Body>
              <p className="text-gray-300 text-center">Product Manager</p>
              <p className="text-sm text-gray-400 text-center">Driving product strategy and innovation.</p>
            </ProfileCard.Body>
            <ProfileCard.Actions>
              <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Message</button>
            </ProfileCard.Actions>
          </ProfileCard>
        </div>
      </div>
    </div>
  )
}

export default App
