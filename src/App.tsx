import { useEffect } from 'react';
import { useLocation } from 'wouter';
import Editor from '@/components/Editor';

export default function App() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (location === '/') {
      setLocation('/1');
    }
  }, [location, setLocation]);

  return <Editor />;
}
