import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { Popup } from './components/Popup';

function App() {
  return (
    <div className="bg-background text-foreground min-h-screen font-sans antialiased">
      <Router>
        <Routes>
          <Route path="/" element={<PopupWrapper />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </div>
  );
}

// Wrapper to decide if we strictly show popup or redirect
const PopupWrapper = () => {
  // Logic: if we are in a full tab, maybe go to dashboard? 
  // For now, just show Popup which has a link to Dashboard.
  return <Popup />;
};

export default App;
