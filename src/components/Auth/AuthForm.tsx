import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const isSignUp = searchParams.get('mode') === 'signup';

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim()) {
          setError('Username is required');
          return;
        }
        const { error } = await signUp(email, password, username);
        if (error) {
          setError(error.message);
        } else {
          navigate('/');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {isSignUp ? 'Create your account' : 'Welcome back!'}
          </p>
        </div>

        {error && (
          <Message severity="error" text={error} className="mb-4 w-full" />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <InputText
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
              placeholder="Enter your email"
            />
          </div>

          {isSignUp && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Username
              </label>
              <InputText
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full"
                placeholder="Choose a username"
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <Password
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
              placeholder="Enter your password"
              toggleMask
            />
          </div>

          <Button
            type="submit"
            label={isSignUp ? 'Sign Up' : 'Sign In'}
            loading={loading}
            className="w-full"
          />
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => navigate(isSignUp ? '/auth' : '/auth?mode=signup')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AuthForm;