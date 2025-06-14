// src/components/home/ContactForm.tsx
"use client";

import React, { useState } from 'react';
import Button from '@/components/ui/button';

// Definimos un tipo para manejar los diferentes estados del formulario
type FormStatus = 'idle' | 'sending' | 'success' | 'error';

export default function ContactForm() {
  // === LÓGICA AÑADIDA (PARTE 1): ESTADOS ===
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle'); // 'idle', 'sending', 'success', 'error'
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // === LÓGICA AÑADIDA (PARTE 2): GESTOR DE ENVÍO ===
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevenimos que la página se recargue
    setStatus('sending');
    setFeedbackMessage('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });

      if (!response.ok) {
        // Si la respuesta del servidor no es 2xx, lanzamos un error
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Something went wrong');
      }

      // Si todo fue bien
      setStatus('success');
      setFeedbackMessage('Message sent successfully! We will get back to you soon.');
      // Limpiamos el formulario
      setName('');
      setEmail('');
      setMessage('');

    } catch (error) {
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setFeedbackMessage(`Failed to send message. ${errorMessage}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-gray-800 shadow-xl rounded-lg">
      {/* El atributo onSubmit ahora llama a nuestra función handleSubmit */}
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
              required // Hacemos el campo requerido
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
              placeholder="Your Name"
              value={name} // Conectamos el input a nuestro estado
              onChange={(e) => setName(e.target.value)} // Actualizamos el estado al escribir
            />
          </div>
        </div>

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
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
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
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3"
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

        {/* === LÓGICA AÑADIDA (PARTE 3): MENSAJES DE FEEDBACK === */}
        {status === 'success' && (
          <p className="text-sm text-center text-green-600 dark:text-green-400 mt-4">{feedbackMessage}</p>
        )}
        {status === 'error' && (
          <p className="text-sm text-center text-red-600 dark:text-red-400 mt-4">{feedbackMessage}</p>
        )}
      </form>
    </div>
  );
}