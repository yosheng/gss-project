'use client';

import {useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faUser, faLock} from '@fortawesome/free-solid-svg-icons';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {signInWithEmail, signInWithEnvCredentials} from '@/lib/auth';

interface LoginProps {
    onLoginSuccess: () => void;
}

export default function Login({onLoginSuccess}: LoginProps) {
    const [account, setAccount] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const {data, error} = await signInWithEnvCredentials(account, password);

            if (error) {
                setError(error.message);
            } else if (data.user) {
                onLoginSuccess();
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl border-0">
                <CardHeader className="space-y-4 pb-8">
                    <div className="w-16 h-16 mx-auto bg-blue-600 rounded-full flex items-center justify-center">
                        <FontAwesomeIcon icon={faUser} className="text-2xl text-white"/>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center text-gray-800">
                        Employee Management
                    </CardTitle>
                    <CardDescription className="text-center text-gray-600">
                        Sign in to access the employee database
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="account" className="text-sm font-medium text-gray-700">
                                Account
                            </Label>
                            <div className="relative">
                                <FontAwesomeIcon
                                    icon={faUser}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                />
                                <Input
                                    id="account"
                                    value={account}
                                    onChange={(e) => setAccount(e.target.value)}
                                    placeholder="Enter your account"
                                    className="pl-10 h-12"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                Password
                            </Label>
                            <div className="relative">
                                <FontAwesomeIcon
                                    icon={faLock}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                />
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="pl-10 h-12"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center">
                                    <div
                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Signing in...
                                </div>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}