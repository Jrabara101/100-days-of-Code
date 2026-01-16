import React, { useState } from 'react';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';

const TaskModal = ({ show, handleClose }) => {
    const [subtasks, setSubtasks] = useState(['']);
    const [classification, setClassification] = useState('Secondary');

    const addSubtask = () => setSubtasks([...subtasks, '']);
    const updateSubtask = (index, value) => {
        const newSubtasks = [...subtasks];
        newSubtasks[index] = value;
        setSubtasks(newSubtasks);
    };

    return (
        <Modal show={show} onHide={handleClose} centered contentClassName="glass-panel text-white">
            <Modal.Header closeButton closeVariant="white" className="border-secondary">
                <Modal.Title>Create New Task</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Task Name</Form.Label>
                        <Form.Control type="text" placeholder="Enter task title" className="bg-dark text-white border-secondary" autoFocus />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Classification</Form.Label>
                        <Form.Select
                            value={classification}
                            onChange={(e) => setClassification(e.target.value)}
                            className="bg-dark text-white border-secondary"
                        >
                            <option>Primary</option>
                            <option>Secondary</option>
                            <option>Tertiary</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="d-flex justify-content-between">
                            Subtasks
                            <Button variant="link" size="sm" onClick={addSubtask} className="text-decoration-none p-0">+ Add</Button>
                        </Form.Label>
                        {subtasks.map((st, idx) => (
                            <InputGroup className="mb-2" key={idx}>
                                <InputGroup.Text className="bg-dark border-secondary text-muted">•</InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    value={st}
                                    onChange={(e) => updateSubtask(idx, e.target.value)}
                                    className="bg-dark text-white border-secondary"
                                    placeholder="Subtask detail..."
                                />
                            </InputGroup>
                        ))}
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Due Date & Reminder</Form.Label>
                        <Form.Control type="datetime-local" className="bg-dark text-white border-secondary" />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer className="border-secondary">
                <Button variant="outline-light" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={handleClose}>
                    Create Task
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default TaskModal;
