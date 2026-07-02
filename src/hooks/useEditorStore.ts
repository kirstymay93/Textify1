import { useCallback, useRef } from 'react';
import { useLocation } from 'wouter';

export function useEditorInitializer() {
  const containerRef = useRef<HTMLDivElement>(null);

  return {
    projectLoading: false,
    authLoading: false,
    project: {
      title: 'Untitled Project',
      originalImageUrl: '',
    },
    containerRef,
  };
}

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
