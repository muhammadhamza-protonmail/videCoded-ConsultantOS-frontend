"use client";

import { ReactNode, useEffect } from "react";
import { RoleProvider, useRole } from "@/components/RoleContext";
import { AuthProvider, useAuth } from "@/components/AuthContext";

function InnerBridge({ children }: { children: ReactNode }) {
  const { setRole, role: currentUIRole } = useRole();
  const { user } = useAuth();

  // Sync the role from the Auth session into the Sidebar/Role context
  // only when there is a mismatch.
  useEffect(() => {
    if (user?.role && user.role !== currentUIRole) {
      console.log(`[Bridge] Syncing role: ${currentUIRole} -> ${user.role}`);
      setRole(user.role);
    }
  }, [user?.role, currentUIRole, setRole]);

  return <>{children}</>;
}

export function AuthRoleBridgeClient({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      <AuthProvider>
        <InnerBridge>
          {children}
        </InnerBridge>
      </AuthProvider>
    </RoleProvider>
  );
}
