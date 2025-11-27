import { useState, useEffect } from 'react';
import './Toast.css';

let toastId = 0;

const Toast = ({ toasts, removeToast }) => {
    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`toast toast-${toast.type} animate-slideInRight`}
                >
                    <div className="toast-icon">
                        {toast.type === 'success' && (
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                            </svg>
                        )}
                        {toast.type === 'error' && (
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                            </svg>
                        )}
                        {toast.type === 'info' && (
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                            </svg>
                        )}
                        {toast.type === 'warning' && (
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                            </svg>
                        )}
                    </div>
                    <div className="toast-content">
                        {toast.title && <div className="toast-title">{toast.title}</div>}
                        <div className="toast-message">{toast.message}</div>
                    </div>
                    <button
                        className="toast-close"
                        onClick={() => removeToast(toast.id)}
                        aria-label="Close"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
};

// Hook to use toast
export const useToast = () => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'info', title = '', duration = 5000) => {
        const id = toastId++;
        const toast = { id, message, type, title };

        setToasts((prev) => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const success = (message, title = 'Success') => addToast(message, 'success', title);
    const error = (message, title = 'Error') => addToast(message, 'error', title);
    const info = (message, title = '') => addToast(message, 'info', title);
    const warning = (message, title = 'Warning') => addToast(message, 'warning', title);

    return {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        info,
        warning,
        ToastContainer: () => <Toast toasts={toasts} removeToast={removeToast} />
    };
};

export default Toast;
