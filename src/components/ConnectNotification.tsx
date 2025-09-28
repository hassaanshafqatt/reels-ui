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
      const error = params.get('error');
      const detail = params.get('detail');
      if (success === 'instagram_connected') {
        setMessage('Instagram account connected successfully');
        setShow(true);
      }
      if (success === 'youtube_connected') {
        setMessage('YouTube account connected successfully');
        setShow(true);
        // remove the query param without reloading
        params.delete('success');
        const newUrlY = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}${location.hash || ''}`;
        window.history.replaceState({}, document.title, newUrlY);
        const tY = setTimeout(() => setShow(false), 4000);
        return () => clearTimeout(tY);
      }
      if (success === 'tiktok_connected') {
        setMessage('TikTok account connected successfully');
        setShow(true);
        // remove the query param without reloading
        params.delete('success');
        const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}${location.hash || ''}`;
        window.history.replaceState({}, document.title, newUrl);
        // auto-dismiss after 4s
        const t = setTimeout(() => setShow(false), 4000);
        return () => clearTimeout(t);
      }

      if (error) {
        let msg = 'Failed to connect account';
        if (
          (error === 'tiktok_token_exchange_failed' ||
            error === 'youtube_token_exchange_failed') &&
          detail
        ) {
          try {
            const decoded = atob(detail);
            msg = `TikTok token exchange failed: ${decoded.slice(0, 200)}`;
          } catch {
            msg = `${error} token exchange failed (see console)`;
          }
        } else if (error) {
          msg = `${error}`;
        }
        setMessage(msg);
        setShow(true);
        // remove error params
        params.delete('error');
        params.delete('detail');
        const newUrl2 = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}${location.hash || ''}`;
        window.history.replaceState({}, document.title, newUrl2);
        const t2 = setTimeout(() => setShow(false), 6000);
        return () => clearTimeout(t2);
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
