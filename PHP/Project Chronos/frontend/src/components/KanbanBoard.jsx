import React, { useState } from 'react';
import { Card, Badge, Dropdown } from 'react-bootstrap';

const KanbanBoard = () => {
    const [tasks, setTasks] = useState([
        { id: 1, title: 'Define Ledger Model', status: 'Draft', priority: 'High', dueDate: '2026-01-10' },
        { id: 2, title: 'Setup Laravel Scheduler', status: 'In Progress', priority: 'Critical', dueDate: '2026-01-08' },
        { id: 3, title: 'Frontend Efficiency Chart', status: 'Editing', priority: 'Medium', dueDate: '2026-01-12' },
        { id: 4, title: 'Project Initiation', status: 'Done', priority: 'Low', dueDate: '2026-01-01' },
    ]);

    const columns = ['Draft', 'In Progress', 'Editing', 'Done'];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Draft': return 'secondary';
            case 'In Progress': return 'primary';
            case 'Editing': return 'warning';
            case 'Done': return 'success';
            default: return 'light';
        }
    };

    return (
        <div className="container-fluid py-4">
            <div className="row g-4">
                {columns.map(col => (
                    <div key={col} className="col-12 col-md-6 col-xl-3">
                        <div className="glass-panel p-3 h-100">
                            <h5 className="text-uppercase fw-bold mb-3 fs-6 d-flex justify-content-between align-items-center">
                                {col}
                                <Badge bg="dark" className="text-light">{tasks.filter(t => t.status === col).length}</Badge>
                            </h5>

                            <div className="d-flex flex-column gap-3">
                                {tasks.filter(t => t.status === col).map(task => (
                                    <Card key={task.id} className="bg-dark border-secondary text-light shadow-sm">
                                        <Card.Body className="p-3">
                                            <div className="d-flex justify-content-between mb-2">
                                                <Badge bg={task.priority === 'Critical' ? 'danger' : 'info'}>{task.priority}</Badge>
                                                <small className="text-muted"><i className="bi bi-clock"></i> {task.dueDate}</small>
                                            </div>
                                            <Card.Title className="fs-6 mb-1">{task.title}</Card.Title>
                                            <Card.Text className="small text-muted text-truncate">
                                                Task descriptions would go here.
                                            </Card.Text>
                                            {/* Placeholder for actions */}
                                            <div className="d-flex justify-content-end mt-2">
                                                <button className="btn btn-sm btn-outline-secondary py-0 px-2">Edit</button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KanbanBoard;
