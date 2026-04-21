import { useEffect } from 'react';
import { X } from 'lucide-react';
import './LogoutModal.css';

/**
 * Generic confirmation modal — reuses LogoutModal styles.
 *
 * Props:
 *   title        — dialog heading
 *   message      — body text
 *   confirmLabel — confirm button text (default: "Confirm")
 *   variant      — "danger" (red) | "primary" (green)  (default: "danger")
 *   icon         — JSX element shown in the icon circle
 *   onConfirm    — called when user confirms
 *   onCancel     — called when user cancels (backdrop, X, Escape)
 */
const ConfirmModal = ({
    title,
    message,
    confirmLabel = 'Confirm',
    variant = 'danger',
    icon,
    onConfirm,
    onCancel,
}) => {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', onKey);
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
                aria-labelledby="cm-title"
                onClick={(e) => e.stopPropagation()}
            >
                <button className="lm-close" onClick={onCancel} aria-label="Close">
                    <X size={16} />
                </button>

                {icon && (
                    <div className={`lm-icon ${variant === 'primary' ? 'lm-icon--primary' : ''}`}>
                        {icon}
                    </div>
                )}

                <h3 className="lm-title" id="cm-title">{title}</h3>
                <p className="lm-message">{message}</p>

                <div className="lm-actions">
                    <button className="lm-btn lm-btn--cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        className={`lm-btn ${variant === 'primary' ? 'lm-btn--confirm-primary' : 'lm-btn--confirm'}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
