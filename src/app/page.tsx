'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';

export default function Home() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { data: session } = authClient.useSession();

  const onSignUp = () => {
    authClient.signUp.email(
      { name, email, password },
      {
        onError: () => {
          window.alert('Error creating user');
        },
        onSuccess: () => {
          window.alert('User created successfully');
        }
      }
    );
  };

  const onSignIn = () => {
    authClient.signIn.email(
      { email, password },
      {
        onError: () => {
          window.alert('Error signing in user');
        },
        onSuccess: () => {
          window.alert('User signed in successfully');
        }
      }
    );
  };

  if (session) {
    return (
      <div className='flex flex-col p-4 gap-y-4'>
        <p>Logged in as {session.user?.name}</p>

        <Button onClick={() => authClient.signOut()}>Sign Out</Button>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-y-10'>
      <div className='p-4 flex flex-col gap-y-4'>
        <Input
          placeholder='Name'
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button onClick={onSignUp}>Sign Up</Button>
      </div>

      <div className='p-4 flex flex-col gap-y-4'>
        <Input
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type='password'
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button onClick={onSignIn}>Sign In</Button>
      </div>
    </div>
  );
}
