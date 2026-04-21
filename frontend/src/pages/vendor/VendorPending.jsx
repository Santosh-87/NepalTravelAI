import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ShieldCheck, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import Navigation from '../../components/shared/Navigation';
import { useAuth } from '../../context/AuthContext';

const VendorPending = () => {
    const { user } = useAuth();
    const isRejected = user?.is_vendor_rejected;

    if (isRejected) {
        return (
            <div style={{ minHeight: '100vh', background: '#faf8f5' }}>
                <Navigation />

                <div style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    padding: '6rem 2rem',
                    textAlign: 'center'
                }}>
                    <XCircle size={64} style={{ color: '#b91c1c', marginBottom: '2rem' }} />

                    <h1 style={{
                        fontSize: '2.5rem',
                        color: '#1a4d6f',
                        marginBottom: '1rem',
                        fontFamily: 'Playfair Display, serif'
                    }}>
                        Application Not Approved
                    </h1>

                    <p style={{
                        fontSize: '1.125rem',
                        color: '#4a4a4a',
                        marginBottom: '2rem',
                        lineHeight: '1.7'
                    }}>
                        Unfortunately, your vendor application did not meet our current requirements.
                        Please review the information below and contact us if you believe this is a mistake.
                    </p>

                    <div style={{
                        background: '#fef2f2',
                        padding: '2rem',
                        border: '2px solid #fecaca',
                        borderRadius: '8px',
                        marginBottom: '2rem',
                        textAlign: 'left'
                    }}>
                        <h3 style={{
                            fontSize: '1.25rem',
                            color: '#b91c1c',
                            marginBottom: '1rem'
                        }}>
                            Common reasons for rejection
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <XCircle size={22} style={{ color: '#b91c1c', flexShrink: 0, marginTop: '2px' }} />
                                <p style={{ color: '#7a7a7a', fontSize: '0.95rem', margin: 0 }}>
                                    Invalid or unverifiable NATTA license number
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <XCircle size={22} style={{ color: '#b91c1c', flexShrink: 0, marginTop: '2px' }} />
                                <p style={{ color: '#7a7a7a', fontSize: '0.95rem', margin: 0 }}>
                                    Incomplete or incorrect business information
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <XCircle size={22} style={{ color: '#b91c1c', flexShrink: 0, marginTop: '2px' }} />
                                <p style={{ color: '#7a7a7a', fontSize: '0.95rem', margin: 0 }}>
                                    PAN number does not match registered business
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                        <Link
                            to="/profile/edit"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '1rem 2rem',
                                background: '#1a4d6f',
                                color: 'white',
                                textDecoration: 'none',
                                fontWeight: '600',
                                borderRadius: '6px',
                            }}
                        >
                            <RefreshCw size={18} />
                            Update My Information
                        </Link>

                        <Link
                            to="/"
                            style={{
                                display: 'inline-block',
                                padding: '0.75rem 2rem',
                                background: 'transparent',
                                color: '#1a4d6f',
                                textDecoration: 'none',
                                fontWeight: '600',
                                border: '2px solid #1a4d6f',
                                borderRadius: '6px',
                            }}
                        >
                            Return to Homepage
                        </Link>
                    </div>

                    <p style={{ fontSize: '0.95rem', color: '#7a7a7a', marginTop: '2rem' }}>
                        Questions? Contact us at{' '}
                        <a href="mailto:support@nepaltravelai.com" style={{ color: '#d4734b' }}>
                            support@nepaltravelai.com
                        </a>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#faf8f5' }}>
            <Navigation />

            <div style={{
                maxWidth: '600px',
                margin: '0 auto',
                padding: '6rem 2rem',
                textAlign: 'center'
            }}>
                <Clock size={64} style={{ color: '#d4734b', marginBottom: '2rem' }} />

                <h1 style={{
                    fontSize: '2.5rem',
                    color: '#1a4d6f',
                    marginBottom: '1rem',
                    fontFamily: 'Playfair Display, serif'
                }}>
                    Vendor Account Pending Approval
                </h1>

                <p style={{
                    fontSize: '1.125rem',
                    color: '#4a4a4a',
                    marginBottom: '2rem',
                    lineHeight: '1.7'
                }}>
                    Thank you for registering as a vehicle vendor! Our team is currently
                    reviewing your NATTA license and business information.
                </p>

                <div style={{
                    background: 'white',
                    padding: '2rem',
                    border: '2px solid #e0d9cf',
                    marginBottom: '2rem',
                    textAlign: 'left'
                }}>
                    <h3 style={{
                        fontSize: '1.25rem',
                        color: '#1a4d6f',
                        marginBottom: '1rem'
                    }}>
                        What happens next?
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <CheckCircle size={24} style={{ color: '#d4734b', flexShrink: 0 }} />
                            <div>
                                <strong>Verification Process (1-3 business days)</strong>
                                <p style={{ color: '#7a7a7a', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                                    We'll verify your NATTA license and business details
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <ShieldCheck size={24} style={{ color: '#d4734b', flexShrink: 0 }} />
                            <div>
                                <strong>Account Activation</strong>
                                <p style={{ color: '#7a7a7a', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                                    Your vendor dashboard will unlock automatically once approved — simply sign in again to check status.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <CheckCircle size={24} style={{ color: '#d4734b', flexShrink: 0 }} />
                            <div>
                                <strong>Dashboard Access</strong>
                                <p style={{ color: '#7a7a7a', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                                    Once approved, you can list vehicles and manage bookings
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <Link
                    to="/"
                    style={{
                        display: 'inline-block',
                        padding: '1rem 2rem',
                        background: '#1a4d6f',
                        color: 'white',
                        textDecoration: 'none',
                        fontWeight: '600',
                        marginBottom: '1rem'
                    }}
                >
                    Return to Homepage
                </Link>

                <p style={{ fontSize: '0.95rem', color: '#7a7a7a' }}>
                    Questions? Contact us at{' '}
                    <a href="mailto:support@nepaltravelai.com" style={{ color: '#d4734b' }}>
                        support@nepaltravelai.com
                    </a>
                </p>
            </div>
        </div>
    );
};

export default VendorPending;
