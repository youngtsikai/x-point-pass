import { Component, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-visitor-signup',
  standalone: true,
  imports: [
    RouterModule,
    MainHeaderComponent,
    CommonModule,
    FormsModule,
    MatSnackBarModule,
  ],
  templateUrl: './visitor-signup.component.html',
  styleUrl: './visitor-signup.component.css',
})
export class VisitorSignupComponent {
  authservice = inject(AuthService);
  router = inject(Router);
  firestore: Firestore = inject(Firestore);
  private snackBar: MatSnackBar = inject(MatSnackBar);

  userData = {
    username: '',
    email: '',
    password: '',
    confirmpassword: '',
    role: 'visitor',
    phoneNumber: '',
  };

  onSubmit(): void {
    // 1. Client-side check for password mismatch
    if (this.userData.password !== this.userData.confirmpassword) {
      this.snackBar.open(
        'Passwords do not match. Please check your input.',
        undefined,
        {
          duration: 3000,
          panelClass: ['warning-snackbar'],
        }
      );
      return;
    }

    // 2. Client-side check for empty required fields
    if (
      !this.userData.username ||
      !this.userData.email ||
      !this.userData.password ||
      !this.userData.confirmpassword
    ) {
      this.snackBar.open(
        'Please fill in all required fields (Full Name, Email, Password, Confirm Password).',
        undefined,
        {
          duration: 3000,
          panelClass: ['warning-snackbar'],
        }
      );
      return;
    }

    // 3. Client-side check for phone number format (10 digits)
    // Only validate if a phone number is provided, as it's not 'required' in the HTML
    if (this.userData.phoneNumber) {
      const phoneNumberRegex = /^\d{10}$/; // Exactly 10 digits
      if (!phoneNumberRegex.test(this.userData.phoneNumber)) {
        this.snackBar.open(
          'Please enter a valid 10-digit phone number.',
          undefined,
          {
            duration: 3000,
            panelClass: ['warning-snackbar'],
          }
        );
        return;
      }
    }

    this.authservice
      .signup(
        this.userData.email,
        this.userData.username,
        this.userData.password,
        this.userData.role,
        this.userData.phoneNumber
      )
      .then(async (userCredential) => {
        if (userCredential?.user?.uid) {
          const uid = userCredential.user.uid;

          // Create an initial document in 'UMedical' collection for the visitor
          const uMedicalDocRef = doc(this.firestore, 'UMedical', uid);
          await setDoc(
            uMedicalDocRef,
            {
              emergencyContactName: null,
              emergencyContactPhone: null,
              allergies: null,
              preExistingConditions: null,
            },
            { merge: true }
          );
          console.log(
            'Initial UMedical document created for visitor UID:',
            uid
          );

          this.snackBar.open(
            'Account created successfully! Welcome.',
            undefined,
            {
              duration: 3000,
              panelClass: ['success-snackbar'],
            }
          );
          this.router.navigateByUrl('/visitor-dashboard');
        } else {
          console.error('User was not created successfully (no UID).');
          this.snackBar.open(
            'Account creation failed due to an unknown error. Please try again.',
            undefined,
            {
              duration: 5000,
              panelClass: ['error-snackbar'],
            }
          );
        }
      })
      .catch((error: any) => {
        console.error('Sign-up failed:', error);
        let userFacingMessage = 'An unexpected error occurred during sign-up.';

        if (error.code) {
          switch (error.code) {
            case 'auth/email-already-in-use':
              userFacingMessage =
                'This email address is already registered. Please use a different one or sign in.';
              break;
            case 'auth/invalid-email':
              userFacingMessage =
                'The email address is not valid. Please check the format.';
              break;
            case 'auth/weak-password':
              userFacingMessage =
                'The password is too weak. Please choose a stronger password (e.g., at least 6 characters).';
              break;
            case 'auth/network-request-failed':
              userFacingMessage =
                'Network error. Please check your internet connection.';
              break;
            case 'auth/missing-password':
              userFacingMessage =
                'Password is required. Please fill in the password field.';
              break;
            default:
              userFacingMessage = `Sign-up failed: Please try again.`;
              break;
          }
        } else if (error.message) {
          userFacingMessage = `Sign-up failed: ${error.message}`;
        }

        this.snackBar.open(userFacingMessage, undefined, {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      });
  }
}
