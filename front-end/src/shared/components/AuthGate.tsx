import { Spinner } from "../../components/ui/spinner";
import { useMe } from "../../hook/useMe";
import { useEffect, useState, type ReactNode } from "react";
import { useDelayedLoading } from "../../hook/useDelayedLoading";

export const AuthGate = ({ children }: { children: ReactNode }) => {
  const { isPending } = useMe();
  const [hasSettledOnce, setHasSettledOnce] = useState(false);
  const showSpinner = useDelayedLoading(isPending, 200);

  useEffect(() => {
    if (!isPending) setHasSettledOnce(true);
  }, [isPending]);

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
