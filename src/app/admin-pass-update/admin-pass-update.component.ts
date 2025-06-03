import { Component, inject } from '@angular/core';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Import MatSnackBar and MatSnackBarModule

@Component({
  selector: 'app-admin-pass-update',
  standalone: true, // Assuming this is a standalone component
  imports: [
    AdminHeaderComponent,
    AdminSidebarComponent,
    RouterModule,
    FormsModule,
    MatSnackBarModule, // Add MatSnackBarModule here
  ],
  templateUrl: './admin-pass-update.component.html',
  styleUrl: './admin-pass-update.component.css',
})
export class AdminPassUpdateComponent {
  auth = inject(AuthService);
  router = inject(Router);
  private snackBar: MatSnackBar = inject(MatSnackBar); // Inject MatSnackBar

  password = '';
  showPassword = false;

  updatePassword() {
    if (!this.password) {
      // Check if password is empty
      this.snackBar.open('Please enter a new password.', undefined, {
        duration: 3000,
        panelClass: ['warning-snackbar'], // Use warning-snackbar for input issues
      });
      return; // Stop execution if password is empty
    }

    // Optional: Add password strength validation here if desired
    // Example: Minimum length check
    if (this.password.length < 6) {
      // Firebase default minimum is 6
      this.snackBar.open(
        'Password must be at least 6 characters long.',
        undefined,
        {
          duration: 3000,
          panelClass: ['warning-snackbar'],
        }
      );
      return;
    }

    this.auth
      .setNewUserPassword(this.password)
      .then(() => {
        this.snackBar.open(
          'Password updated successfully! Please sign in again.',
          undefined,
          {
            duration: 4000,
            panelClass: ['success-snackbar'], // Use success-snackbar for success messages
          }
        );
        // Proceed with signout
        return this.auth.signout().toPromise();
      })
      .then(() => {
        this.router.navigate(['/admin-signin']);
      })
      .catch((error) => {
        console.error('Error during password update or signout:', error);
        let userFacingMessage = 'Failed to update password. Please try again.';

        // Map common Firebase auth errors to user-friendly messages
        if (error.code) {
          switch (error.code) {
            case 'auth/requires-recent-login':
              userFacingMessage =
                'Please re-authenticate by logging in again before changing your password.';
              break;
            case 'auth/weak-password':
              userFacingMessage =
                'The new password is too weak. Please choose a stronger one.';
              break;
            case 'auth/network-request-failed':
              userFacingMessage =
                'Network error. Please check your internet connection.';
              break;
            // Add other specific Firebase error codes as needed
            default:
              // Fallback to Firebase message if no specific mapping, but keep it concise
              userFacingMessage = `Failed to update password: ${error.message}`;
              break;
          }
        }

        this.snackBar.open(userFacingMessage, undefined, {
          duration: 5000,
          panelClass: ['error-snackbar'], // Use error-snackbar for error messages
        });
      });
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }
}
