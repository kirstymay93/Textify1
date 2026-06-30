import { useCallback, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';

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

export function useEditorInitializer() {
  const params = useParams<{ projectId?: string }>();
  const projectId = params.projectId ? Number.parseInt(params.projectId, 10) : undefined;
  const { loading: authLoading } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  // Placeholder project – replace with a real tRPC query once the backend is wired up
  const project = projectId
    ? { id: projectId, title: `Project ${projectId}`, originalImageUrl: '' }
    : null;
  const projectLoading = false;

  return { project, projectLoading, authLoading, containerRef };
}
