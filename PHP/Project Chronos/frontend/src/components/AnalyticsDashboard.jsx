import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const AnalyticsDashboard = () => {
    const efficiencyData = {
        labels: ['Team A', 'Team B', 'Team C'],
        datasets: [
            {
                label: 'Efficiency Score',
                data: [1.2, 0.9, 1.05],
                backgroundColor: ['rgba(99, 102, 241, 0.6)', 'rgba(239, 68, 68, 0.6)', 'rgba(34, 197, 94, 0.6)'],
                borderColor: ['#6366f1', '#ef4444', '#22c55e'],
                borderWidth: 1,
            },
        ],
    };

    const tasksData = {
        labels: ['Completed', 'Pending', 'Overdue'],
        datasets: [
            {
                data: [12, 5, 2],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.7)',
                    'rgba(234, 179, 8, 0.7)',
                    'rgba(239, 68, 68, 0.7)',
                ],
                borderColor: [
                    '#22c55e',
                    '#eab308',
                    '#ef4444',
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#a3a3a3'
                }
            },
            title: {
                display: true,
                text: 'Team Efficiency',
                color: '#e5e5e5'
            },
        },
        scales: {
            y: {
                ticks: { color: '#a3a3a3' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
                ticks: { color: '#a3a3a3' },
                grid: { display: false }
            }
        }
    };

    return (
        <div className="glass-panel p-4 h-100">
            <h5 className="text-light mb-4">Real-time Analytics</h5>
            <div className="row g-4">
                <div className="col-12 col-xl-6">
                    <div className="mb-2 text-center text-muted small">Efficiency Index</div>
                    <Bar options={options} data={efficiencyData} />
                </div>
                <div className="col-12 col-xl-6">
                    <div className="mb-2 text-center text-muted small">Task Distribution</div>
                    <div style={{ maxWidth: '250px', margin: '0 auto' }}>
                        <Doughnut data={tasksData} options={{
                            plugins: { legend: { labels: { color: '#a3a3a3' } } },
                            elements: { arc: { borderWidth: 0 } }
                        }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
