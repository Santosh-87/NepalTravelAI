import { useEffect } from 'react';
import { LogOut, X } from 'lucide-react';
import './LogoutModal.css';

/**
 * Shared logout confirmation modal.
 * Used in AdminLayout, VendorLayout, and Navigation.
 *
 * Props:
 *   onConfirm — called when user clicks "Sign Out"
 *   onCancel  — called when user cancels (backdrop click, X, Escape, Cancel btn)
 */
const LogoutModal = ({ onConfirm, onCancel }) => {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', onKey);
        // Prevent body scroll while modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onCancel]);

    return (
        <div className="lm-backdrop" onClick={onCancel} role="presentation">
            <div
                className="lm-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="lm-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button className="lm-close" onClick={onCancel} aria-label="Close">
                    <X size={16} />
                </button>

                <div className="lm-icon" aria-hidden="true">
                    <LogOut size={21} />
                </div>

                <h3 className="lm-title" id="lm-title">Sign out?</h3>
                <p className="lm-message">
                    You'll be signed out of your account and redirected to the login page.
                </p>

                <div className="lm-actions">
                    <button className="lm-btn lm-btn--cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="lm-btn lm-btn--confirm" onClick={onConfirm}>
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LogoutModal;
