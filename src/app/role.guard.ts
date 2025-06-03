import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService, FirestoreUser } from './auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    console.log(
      `Role Guard: Executing for route: ${
        state.url
      } with allowed roles: ${allowedRoles.join(', ')}`
    );

    let currentUserData: FirestoreUser | null = null;

    try {
      // Use the async getCurrentUser method from AuthService directly.
      // This method now *internally waits* for Firebase Auth state to be ready
      // before fetching Firestore user data, preventing the race condition.
      currentUserData = await authService.getCurrentUser();
      console.log(
        'Role Guard: Successfully fetched currentUserData:',
        currentUserData ? currentUserData.uid : 'null'
      );
    } catch (error) {
      console.error('Role Guard: Error fetching current user data:', error);
      // If there's an error during the fetch, deny access and redirect.
      router.navigate(['/locked']); // Ensure you have a '/locked' route defined
      return false;
    }

    // After `await authService.getCurrentUser()`, the `isAuthenticated` signal
    // in AuthService will also be in its stable, correct state.
    if (!authService.isAuthenticated()) {
      console.warn(
        'Role Guard: Access denied. User is not authenticated (after auth state settled). Redirecting to /locked.'
      );
      router.navigate(['/locked']); // Redirect to a page indicating access denied without login
      return false;
    }

    // Now, if authenticated, check if we have valid user data and a role.
    if (!currentUserData || typeof currentUserData.role !== 'string') {
      console.warn(
        'Role Guard: Access denied. Authenticated user data or role information is missing or invalid.'
      );
      alert(
        'Authentication error: Missing role information for authenticated user. Please try logging in again.'
      );
      router.navigate(['/locked']); // Or '/login' or '/profile-setup' if you have a setup flow
      return false;
    }

    const userRole = currentUserData.role.toLowerCase(); // Ensure role comparison is case-insensitive
    if (allowedRoles.includes(userRole)) {
      console.log(
        `Role Guard: Access granted. User role '${userRole}' is in allowed roles: ${allowedRoles.join(
          ', '
        )}`
      );
      return true;
    } else {
      console.warn(
        `Role Guard: Access denied. User role '${userRole}' not authorized for this route.`
      );
      // Optionally redirect to a role-specific access denied page
      const redirectPath = `/${userRole}-access-denied`;
      router.navigate([redirectPath]);
      return false;
    }
  };
};
