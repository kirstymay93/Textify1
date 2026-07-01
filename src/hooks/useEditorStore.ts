import { useCallback, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';

export function useEditorInitializer() {
  const { loading: authLoading } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  return {
    projectLoading: false,
    project: null as { originalImageUrl: string; title: string | null } | null,
    authLoading,
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
