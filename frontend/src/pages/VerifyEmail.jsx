import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import Button from '../components/Button';
import { CheckCircle, XCircle, ArrowsCounterClockwise } from 'phosphor-react';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying'); // verifying, success, error, expired
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState(''); // for resend
    const [isResending, setIsResending] = useState(false);
    const [resendStatus, setResendStatus] = useState(null);

    const token = searchParams.get('token');
    const hasCalled = React.useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }
        
        if (hasCalled.current) return;
        hasCalled.current = true;

        const verify = async () => {
            try {
                const response = await api.get(`/auth/verify?token=${token}`);
                setStatus('success');
                setMessage(response.data.message);
            } catch (err) {
                const errorMsg = err.response?.data?.message || '';
                if (errorMsg.includes('expired')) {
                    setStatus('expired');
                } else {
                    setStatus('error');
                }
                setMessage(errorMsg || 'Verification failed.');
            }
        };

        verify();
    }, [token]);

    const handleResend = async (e) => {
        e.preventDefault();
        if (!email) return;
        
        setIsResending(true);
        setResendStatus(null);
        try {
            await api.post('/auth/resend-verification', { email });
            setResendStatus('success');
        } catch (err) {
            setResendStatus('error');
            setMessage(err.response?.data?.message || 'Failed to resend email.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-gray-50 text-center space-y-8">
                {status === 'verifying' && (
                    <div className="space-y-4">
                        <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <h2 className="text-2xl font-bold">Verifying your account...</h2>
                        <p className="text-gray-500">Please wait a moment.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6">
                        <CheckCircle size={80} weight="fill" className="text-green-500 mx-auto" />
                        <h2 className="text-3xl font-black text-gray-900">Verified!</h2>
                        <p className="text-gray-600 font-medium">{message}</p>
                        <Link to="/login" className="block">
                            <Button className="w-full py-4 rounded-2xl">Go to Login</Button>
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6">
                        <XCircle size={80} weight="fill" className="text-red-500 mx-auto" />
                        <h2 className="text-3xl font-black text-gray-900">Verification Failed</h2>
                        <p className="text-gray-600 font-medium">{message}</p>
                        <Link to="/register" className="block">
                            <Button variant="outline" className="w-full py-4 rounded-2xl">Return to Registration</Button>
                        </Link>
                    </div>
                )}

                {status === 'expired' && (
                    <div className="space-y-6">
                        <div className="w-24 h-24 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto">
                            <ArrowsCounterClockwise size={48} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900">Link Expired</h2>
                        <p className="text-gray-600 font-medium">Your verification link has expired (24h limit). Please request a new one.</p>
                        
                        {resendStatus === 'success' ? (
                            <div className="bg-green-50 text-green-700 p-4 rounded-2xl border border-green-100 text-sm font-bold">
                                New verification email sent! Check your inbox.
                            </div>
                        ) : (
                            <form onSubmit={handleResend} className="space-y-4">
                                <input 
                                    type="email" 
                                    placeholder="Enter your email" 
                                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 outline-none font-bold"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <Button 
                                    type="submit" 
                                    className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
                                    disabled={isResending}
                                >
                                    {isResending ? 'Sending...' : 'Resend Activation Link'}
                                </Button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
