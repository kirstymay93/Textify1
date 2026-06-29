import { useCallback } from 'react';
import { useLocation } from 'wouter';

export function useEditorStore() {
  const [, navigate] = useLocation();

  const goToProject = useCallback((projectId: number) => {
    navigate(`/${projectId}`);
  }, [navigate]);

  const goHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return {
    navigate,
    goToProject,
    goHome,
  };
}
