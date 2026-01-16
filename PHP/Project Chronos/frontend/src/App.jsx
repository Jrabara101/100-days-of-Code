import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import KanbanBoard from './components/KanbanBoard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import TimelineSidebar from './components/TimelineSidebar';
import TaskModal from './components/TaskModal';

function App() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="container-fluid vh-100 overflow-hidden d-flex flex-column">
      {/* Header */}
      <header className="p-3 border-bottom border-secondary d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <h3 className="m-0 fw-bold text-white ls-1">CHRONOS</h3>
          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary">Enterprise</span>
        </div>
        <button className="btn btn-primary shadow-sm" onClick={() => setShowModal(true)}>
          + New Task
        </button>
      </header>

      {/* Main Layout */}
      <div className="row flex-grow-1 overflow-hidden g-0">

        {/* Main Workspace */}
        <div className="col-12 col-lg-9 col-xl-10 d-flex flex-column h-100 overflow-auto p-3 p-xl-4 scroll-styled">

          {/* Analytics Section */}
          <section className="mb-4" style={{ minHeight: '300px' }}>
            <AnalyticsDashboard />
          </section>

          {/* Kanban Section */}
          <section className="flex-grow-1">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="text-white">Active Sprints</h4>
              <div className="text-muted small">Updated just now</div>
            </div>
            <KanbanBoard />
          </section>

        </div>

        {/* Sidebar */}
        <div className="col-12 col-lg-3 col-xl-2 border-start border-secondary h-100 d-none d-lg-block p-0">
          <TimelineSidebar />
        </div>

      </div>

      <TaskModal show={showModal} handleClose={() => setShowModal(false)} />
    </div>
  );
}

export default App;
