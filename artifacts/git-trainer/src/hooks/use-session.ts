import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'git_trainer_session_id';

export function useSession() {
  const [sessionId, setSessionId] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let storedId = localStorage.getItem(SESSION_KEY);
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem(SESSION_KEY, storedId);
    }
    setSessionId(storedId);
    setIsReady(true);
  }, []);

  const resetSession = () => {
    const newId = uuidv4();
    localStorage.setItem(SESSION_KEY, newId);
    setSessionId(newId);
  };

  return { sessionId, isReady, resetSession };
}
