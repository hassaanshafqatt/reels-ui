'use client';

import { useEffect, useState } from 'react';
import Message from './Message';

export default function ConnectNotification() {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const success = params.get('success');
      if (success === 'instagram_connected') {
        setMessage('Instagram account connected successfully');
        setShow(true);
        // remove the query param without reloading
        params.delete('success');
        const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}${location.hash || ''}`;
        window.history.replaceState({}, document.title, newUrl);
        // auto-dismiss after 4s
        const t = setTimeout(() => setShow(false), 4000);
        return () => clearTimeout(t);
      }
    } catch {
      // ignore
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[min(90%,600px)]">
      <Message
        type="success"
        message={message}
        onClose={() => setShow(false)}
      />
    </div>
  );
}
