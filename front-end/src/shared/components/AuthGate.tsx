import { useEffect, useState, type ReactNode } from 'react';
import { Spinner } from '../../components/ui/spinner';
import { useDelayedLoading } from '../../hook/useDelayedLoading';
import { useMe } from '../../hook/useMe';

export const AuthGate = ({ children }: { children: ReactNode }) => {
  const { isPending } = useMe();
  const [hasSettledOnce, setHasSettledOnce] = useState(false);
  const showSpinner = useDelayedLoading(isPending, 200);

  // useEffect só roda uma vez para marcar que o carregamento inicial e terminou
  useEffect(() => {
    if (!isPending && !hasSettledOnce) {
      queueMicrotask(() => setHasSettledOnce(true));
    }
  }, [isPending, hasSettledOnce]);

  if (!hasSettledOnce) {
    if (!showSpinner) return null;

    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner className="text-primary size-8" />
      </div>
    );
  }

  return <>{children}</>;
};
