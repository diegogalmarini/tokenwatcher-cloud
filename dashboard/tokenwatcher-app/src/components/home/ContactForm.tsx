"use client";

import React, { useState } from 'react';
import Button from '@/components/ui/button';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

export default function ContactForm() {
    // ... (la lógica de estado y handleSubmit se mantiene igual)
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<FormStatus>('idle');
    const [feedbackMessage, setFeedbackMessage] = useState('');

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus('sending');
        setFeedbackMessage('');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    message,
                }),
            });

            if (response.ok) {
                setStatus('success');
                setFeedbackMessage('Thanks for your message! We\'ll get back to you soon.');
                // Reset form
                setName('');
                setEmail('');
                setMessage('');
            } else {
                const errorData = await response.json();
                setStatus('error');
                setFeedbackMessage(errorData.detail || 'Failed to send message. Please try again.');
            }
        } catch (error) {
            setStatus('error');
            setFeedbackMessage('Network error. Please check your connection and try again.');
        }
    };

  return (
    // CORREGIDO: dark:bg-[#404040]
    <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-[#404040] shadow-xl rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="name"
              id="name"
              autoComplete="name"
              required
              // CORREGIDO: dark:bg-[#525252] para los inputs
              className="block w-full rounded-md border-gray-300 dark:border-gray-500 dark:bg-[#525252] dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        {/* ... (resto de los inputs con la misma clase corregida) ... */}
         <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <div className="mt-1">
            <input
              type="email"
              name="email"
              id="email"
              autoComplete="email"
              required
              className="block w-full rounded-md border-gray-300 dark:border-gray-500 dark:bg-[#525252] dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Message
          </label>
          <div className="mt-1">
            <textarea
              id="message"
              name="message"
              rows={4}
              required
              className="block w-full rounded-md border-gray-300 dark:border-gray-500 dark:bg-[#525252] dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
              placeholder="How can we help you?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Button type="submit" intent="default" size="lg" className="w-full" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
        
        {/* Feedback messages */}
        {feedbackMessage && (
          <div className={`mt-4 p-4 rounded-md ${
            status === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          }`}>
            <p className="text-sm">{feedbackMessage}</p>
          </div>
        )}
      </form>
    </div>
  );
}