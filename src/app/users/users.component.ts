import { Component, OnInit, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  FirestoreError,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  QRCodeWriter,
  BarcodeFormat,
  BitMatrix,
  EncodeHintType,
} from '@zxing/library';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';

// Define the User interface - Confirmed from your 'users' collection screenshot
interface User {
  id?: string; // This is the document ID (which should match the uid)
  uid?: string; // Explicitly add uid field for internal document data
  name: string;
  email: string;
  role: string;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  accountCreated?: boolean;
  passwordSet?: boolean;
}

// NEW INTERFACE: Medical Details - UPDATED to match your Firestore 'UMedical' collection exactly
interface MedicalDetails {
  allergies?: string[] | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  preExistingConditions?: string[] | null;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminHeaderComponent,
    AdminSidebarComponent,
    MatSnackBarModule,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  users$: Observable<User[]>;
  firestore: Firestore = inject(Firestore);
  authService: AuthService = inject(AuthService);
  private snackBar: MatSnackBar = inject(MatSnackBar);

  qrCodeImage: string = '';
  private qrWriter = new QRCodeWriter();
  private qrSize: number = 250;
  private qrColorDark = '#1A5276';
  private qrColorLight = '#FFFFFF';

  newUser: {
    name: string;
    email: string;
    role: string;
    password?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    country?: string;
    accountCreated?: boolean;
    passwordSet?: boolean;
  } = {
    name: '',
    email: '',
    role: '',
    password: '',
    phoneNumber: '',
    address: '',
    city: '',
    country: '',
    accountCreated: false,
    passwordSet: false,
  };

  editingUserId: string | null = null;
  tempEditUser: User | null = null;

  constructor() {
    const usersCollection = collection(this.firestore, 'users');
    const usersQuery = query(
      usersCollection,
      where('role', '!=', 'visitor'),
      orderBy('name', 'asc')
    );

    this.users$ = collectionData(usersQuery, {
      idField: 'id',
    }) as Observable<User[]>;

    console.log('UsersComponent initialized. Querying for non-visitor users.');
  }

  ngOnInit(): void {
    console.log('UsersComponent ngOnInit called.');
  }

  // --- User Details, Create, Inline Edit, Delete Logic ---

  /**
   * Displays all details of a selected user, including their medical details, using a native alert.
   */
  async viewUserDetails(user: User): Promise<void> {
    console.log('View Details clicked for user:', user.id, user);

    let medicalDetails: MedicalDetails | null = null;
    let detailsMessage = `User Details:\n`;
    detailsMessage += `Name: ${user.name || 'N/A'}\n`;
    detailsMessage += `Email: ${user.email || 'N/A'}\n`;
    detailsMessage += `Role: ${user.role || 'N/A'}\n`;
    detailsMessage += `Phone: ${user.phoneNumber || 'N/A'}\n`;
    detailsMessage += `Address: ${user.address || 'N/A'}\n`;
    detailsMessage += `City: ${user.city || 'N/A'}\n`;
    detailsMessage += `Country: ${user.country || 'N/A'}\n`;
    detailsMessage += `Account Created: ${
      user.accountCreated ? 'Yes' : 'No'
    }\n`;
    detailsMessage += `Password Set: ${user.passwordSet ? 'Yes' : 'No'}\n`;

    if (user.id) {
      try {
        const medicalDocRef = doc(this.firestore, 'UMedical', user.id);
        const medicalDocSnap = await getDoc(medicalDocRef);

        if (medicalDocSnap.exists()) {
          medicalDetails = medicalDocSnap.data() as MedicalDetails;
          console.log('Fetched medical details:', medicalDetails);

          detailsMessage += `\nMedical Details:\n`;
          if (medicalDetails) {
            detailsMessage += `Emergency Contact Name: ${
              medicalDetails.emergencyContactName || 'N/A'
            }\n`;
            detailsMessage += `Emergency Contact Phone: ${
              medicalDetails.emergencyContactPhone || 'N/A'
            }\n`;

            // Defensive checks before calling .join()
            detailsMessage += `Allergies: ${
              Array.isArray(medicalDetails.allergies) &&
              medicalDetails.allergies.length > 0
                ? medicalDetails.allergies.join(', ')
                : 'None'
            }\n`;
            detailsMessage += `Pre-existing Conditions: ${
              Array.isArray(medicalDetails.preExistingConditions) &&
              medicalDetails.preExistingConditions.length > 0
                ? medicalDetails.preExistingConditions.join(', ')
                : 'None'
            }\n`;
          }
        } else {
          detailsMessage += `\nNo medical details found for this user.`;
        }
      } catch (error: any) {
        console.error('Error fetching medical details:', error);
        detailsMessage += `\nError fetching medical details: ${this.getErrorMessage(
          error
        )}`;
        this.snackBar.open(
          `Error fetching medical details for ${
            user.name
          }: ${this.getErrorMessage(error)}`,
          undefined,
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    } else {
      detailsMessage += `\nCannot fetch medical details: User ID is missing.`;
      this.snackBar.open(
        `Cannot fetch medical details: User ID is missing.`,
        undefined,
        { duration: 5000, panelClass: ['warning-snackbar'] }
      );
    }

    alert(detailsMessage); // Use native alert
  }

  async createUser() {
    if (
      !this.newUser.email ||
      !this.newUser.password ||
      !this.newUser.name ||
      !this.newUser.role ||
      !this.newUser.phoneNumber
    ) {
      console.warn('Please fill in all required fields for the new user.');
      this.snackBar.open(
        'Please fill in all required fields (Name, Email, Role, Phone Number, Password).', // Updated message
        undefined,
        {
          duration: 4000,
          panelClass: ['warning-snackbar'],
        }
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newUser.email)) {
      this.snackBar.open('Please enter a valid email address.', undefined, {
        duration: 3000,
        panelClass: ['warning-snackbar'],
      });
      return;
    }

    if (this.newUser.password.length < 6) {
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

    const phoneNumberRegex = /^\d{10}$/;
    if (
      !this.newUser.phoneNumber ||
      !phoneNumberRegex.test(this.newUser.phoneNumber)
    ) {
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

    try {
      console.log('Attempting to create user:', this.newUser.email);
      const roleToSave = this.newUser.role.toLowerCase();

      const userCredentialPromise = this.authService.signup(
        this.newUser.email,
        this.newUser.name,
        this.newUser.password,
        roleToSave,
        this.newUser.phoneNumber
      );
      const userCredential = await userCredentialPromise;

      if (userCredential?.user?.uid) {
        const uid = userCredential.user.uid;
        console.log('Firebase Auth user created:', uid);

        const usersCollection = collection(this.firestore, 'users');
        const newUserDocRef = doc(usersCollection, uid);

        await setDoc(newUserDocRef, {
          uid: uid,
          name: this.newUser.name,
          email: this.newUser.email,
          role: roleToSave,
          phoneNumber: this.newUser.phoneNumber,
          address: '',
          city: '',
          country: '',
          accountCreated: true,
          passwordSet: true,
        });
        console.log('User profile saved to Firestore for UID:', uid);

        const uMedicalDocRef = doc(this.firestore, 'UMedical', uid);
        await setDoc(uMedicalDocRef, {
          emergencyContactName: null,
          emergencyContactPhone: null,
          allergies: [], // Initialize as empty array for new users
          preExistingConditions: [], // Initialize as empty array for new users
        });
        console.log('Initial UMedical document created for UID:', uid);

        this.newUser = {
          name: '',
          email: '',
          role: '',
          password: '',
          phoneNumber: '',
          address: '',
          city: '',
          country: '',
          accountCreated: false,
          passwordSet: false,
        };
        this.snackBar.open('User account created successfully!', undefined, {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        console.log('Account created successfully and form reset.');
      } else {
        console.error(
          'Firebase Auth user was not created successfully (no UID).'
        );
        this.snackBar.open(
          'Failed to create user account in Authentication. No UID generated.',
          undefined,
          {
            duration: 5000,
            panelClass: ['error-snackbar'],
          }
        );
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      let userFacingMessage =
        'An unknown error occurred during account creation.';
      if (error instanceof FirestoreError || error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            userFacingMessage =
              'This email address is already registered. Please use a different email.';
            break;
          case 'auth/weak-password':
            userFacingMessage =
              'The password is too weak. Please choose a stronger one.';
            break;
          case 'auth/invalid-email':
            userFacingMessage =
              'The email address is invalid. Please enter a valid email.';
            break;
          case 'auth/network-request-failed':
            userFacingMessage =
              'Network error. Please check your internet connection.';
            break;
          default:
            userFacingMessage = `Error creating account: ${error.message}`;
            break;
        }
      }
      this.snackBar.open(userFacingMessage, undefined, {
        duration: 7000,
        panelClass: ['error-snackbar'],
      });
    }
  }

  editUser(user: User): void {
    console.log('Edit user clicked for:', user.id);
    this.editingUserId = user.id || null;
    this.tempEditUser = { ...user };
  }

  /**
   * Updates the selected user's profile in Firestore using the data from tempEditUser.
   * Uses native confirm dialog for confirmation.
   */
  async updateUser() {
    if (!this.tempEditUser || !this.tempEditUser.id) {
      this.snackBar.open(
        'No user data to update or missing user ID.',
        undefined,
        {
          duration: 4000,
          panelClass: ['warning-snackbar'],
        }
      );
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to update ${this.tempEditUser.name}'s profile?`
    );

    if (confirmed) {
      if (!this.tempEditUser || !this.tempEditUser.id) {
        this.snackBar.open(
          'User data became unavailable during update. Please try again.',
          undefined,
          {
            duration: 4000,
            panelClass: ['error-snackbar'],
          }
        );
        return;
      }

      // Ensure properties are not null or empty strings before proceeding
      if (
        !this.tempEditUser.name ||
        !this.tempEditUser.role ||
        !this.tempEditUser.phoneNumber
      ) {
        this.snackBar.open(
          'Name, Role, and Phone Number cannot be empty for an update.',
          undefined,
          {
            duration: 4000,
            panelClass: ['warning-snackbar'],
          }
        );
        return;
      }
      const phoneNumberRegex = /^\d{10}$/;
      if (!phoneNumberRegex.test(this.tempEditUser.phoneNumber)) {
        this.snackBar.open(
          'Please enter a valid 10-digit phone number for the user.',
          undefined,
          {
            duration: 3000,
            panelClass: ['warning-snackbar'],
          }
        );
        return;
      }

      try {
        const userDocRef = doc(this.firestore, 'users', this.tempEditUser.id!);
        const dataToUpdate: Partial<User> = {
          name: this.tempEditUser.name,
          role: this.tempEditUser.role.toLowerCase(),
          phoneNumber: this.tempEditUser.phoneNumber,
          address: this.tempEditUser.address || '',
          city: this.tempEditUser.city || '',
          country: this.tempEditUser.country || '',
          uid: this.tempEditUser.id,
          accountCreated: this.tempEditUser.accountCreated,
          passwordSet: this.tempEditUser.passwordSet,
        };

        await setDoc(userDocRef, dataToUpdate, { merge: true });
        console.log(
          'User profile updated in Firestore for UID:',
          this.tempEditUser.id
        );
        this.snackBar.open('User profile updated successfully!', undefined, {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.cancelEdit();
      } catch (error: any) {
        console.error('Error updating user profile:', error);
        let userFacingMessage =
          'Failed to update user profile. Please try again.';
        if (error instanceof FirestoreError || error.code) {
          userFacingMessage = `Failed to update user profile: ${error.message}`;
        }
        this.snackBar.open(userFacingMessage, undefined, {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      }
    } else {
      this.snackBar.open('User update cancelled.', undefined, {
        duration: 2000,
        panelClass: ['info-snackbar'],
      });
      console.log('User update cancelled by user.');
    }
  }

  cancelEdit(): void {
    this.editingUserId = null;
    this.tempEditUser = null;
    console.log('Edit cancelled.');
  }

  /**
   * Deletes a user's record from Firestore.
   * Uses native confirm dialog for confirmation.
   * Note: This does NOT delete the user from Firebase Authentication.
   */
  async deleteUser(userId: string | undefined) {
    console.log('Attempting to delete user with ID:', userId);

    if (!userId) {
      console.warn('Cannot delete user: Missing user ID.');
      this.snackBar.open('Cannot delete user: Missing ID.', undefined, {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    const confirmed = confirm(
      'Are you sure you want to delete this user? This action cannot be undone and will remove their Firestore profile and their medical details. Their Authentication account will need to be deleted separately.'
    );

    if (confirmed) {
      try {
        console.warn(
          'Deleting Firestore user document. Remember to also delete the Firebase Authentication user manually or via Cloud Function/Admin SDK for full removal.'
        );
        const userDocRef = doc(this.firestore, 'users', userId);
        await deleteDoc(userDocRef);
        console.log('User Firestore document deleted successfully!');

        const uMedicalDocRef = doc(this.firestore, 'UMedical', userId);
        try {
          await deleteDoc(uMedicalDocRef);
          console.log(
            'UMedical document deleted successfully for UID:',
            userId
          );
        } catch (medicalDeleteError: any) {
          console.warn(
            `Warning: Could not delete UMedical document for UID ${userId}: ${medicalDeleteError.message}`
          );
          this.snackBar.open(
            `Warning: User profile deleted, but medical data could not be deleted: ${medicalDeleteError.message}`,
            undefined,
            { duration: 7000, panelClass: ['warning-snackbar'] }
          );
        }

        this.snackBar.open(
          'User record deleted from Firestore and medical data (if present). Note: The associated Authentication account may still exist unless deleted separately.',
          undefined,
          { duration: 6000, panelClass: ['success-snackbar'] }
        );
      } catch (error: any) {
        console.error('Error deleting user:', error);
        let userFacingMessage =
          'Failed to delete user record. Please try again.';
        if (error instanceof FirestoreError || error.code) {
          userFacingMessage = `Failed to delete user: ${error.message}`;
        }
        this.snackBar.open(userFacingMessage, undefined, {
          duration: 7000,
          panelClass: ['error-snackbar'],
        });
      }
    } else {
      this.snackBar.open('User deletion cancelled.', undefined, {
        duration: 2000,
        panelClass: ['info-snackbar'],
      });
      console.log('Deletion cancelled by user.');
    }
  }

  // --- QR Code Generation & Management ---

  private async generateQrCodeDataUrl(user: User): Promise<string> {
    const qrData = JSON.stringify({
      uid: user.id || 'N/A', // Using user.id which should be the doc ID / UID
      name: user.name || 'N/A',
      role: user.role || 'N/A',
      phone: user.phoneNumber || 'N/A',
      address: user.address || 'N/A',
      city: user.city || 'N/A',
      country: user.country || 'N/A',
      // passwordSet is typically not included in public QR data
    });

    try {
      console.log('Generating QR code data for:', qrData);
      const hints = new Map<EncodeHintType, any>();
      hints.set(EncodeHintType.MARGIN, 1);

      const bitMatrix: BitMatrix = this.qrWriter.encode(
        qrData,
        BarcodeFormat.QR_CODE,
        this.qrSize,
        this.qrSize,
        hints
      );

      const canvas = document.createElement('canvas');
      canvas.width = this.qrSize;
      canvas.height = this.qrSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas rendering context.');
      }

      ctx.fillStyle = this.qrColorLight;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = this.qrColorDark;

      for (let x = 0; x < bitMatrix.getWidth(); x++) {
        for (let y = 0; y < bitMatrix.getHeight(); y++) {
          if (bitMatrix.get(x, y)) {
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
      return canvas.toDataURL('image/png');
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      let userMessage = 'Failed to generate QR code.';
      if (error.message && error.message.includes('WriterException')) {
        userMessage =
          'Error encoding data. Data might be too long for the selected QR code size or contain invalid characters.';
      } else if (error instanceof Error) {
        userMessage = `Failed to generate QR code: ${error.message}`;
      }
      this.snackBar.open(userMessage, undefined, {
        duration: 5000,
        panelClass: ['error-snackbar'],
      });
      throw new Error(userMessage);
    }
  }

  async downloadUserQRCode(user: User) {
    console.log(
      'Attempting to generate and download QR code for user:',
      user.id
    );
    if (!user.id) {
      console.warn('Cannot download QR code: User object is missing ID.', user);
      this.snackBar.open(
        'Cannot download QR code: User data is incomplete.',
        undefined,
        {
          duration: 3000,
          panelClass: ['error-snackbar'],
        }
      );
      return;
    }
    try {
      const qrCodeDataUrl = await this.generateQrCodeDataUrl(user);
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      const fileName = user.name ? user.name.replace(/\s+/g, '_') : user.id;
      link.download = `user_${fileName}_qrcode.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.snackBar.open('QR Code download initiated!', undefined, {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
      console.log('QR Code download initiated.');
    } catch (error: any) {
      console.error('Error generating/downloading QR code:', error);
      this.snackBar.open(
        `Failed to download QR code: ${error.message || 'Unknown error'}`,
        undefined,
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      );
    }
  }

  async printUserQRCode(user: User) {
    console.log('Attempting to generate and print QR code for user:', user.id);
    if (!user.id) {
      console.warn('Cannot print QR code: User object is missing ID.', user);
      this.snackBar.open(
        'Cannot print QR code: User data is incomplete.',
        undefined,
        {
          duration: 3000,
          panelClass: ['error-snackbar'],
        }
      );
      return;
    }
    try {
      const qrCodeDataUrl = await this.generateQrCodeDataUrl(user);
      const printWindow = window.open('', '_blank', 'width=400,height=400');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(`
           <html>
              <head>
                <title>Print User QR Code - ${user.name || user.id}</title>
                <style>
                  body {
                     display: flex;
                     justify-content: center;
                     align-items: center;
                     min-height: 100vh;
                     margin: 0;
                     background-color: ${this.qrColorLight};
                  }
                  img {
                     max-width: 90%;
                     max-height: 90vh;
                     object-fit: contain;
                  }
                  @media print {
                     body { background-color: white !important; }
                     img { max-width: 100%; max-height: none; }
                  }
                </style>
              </head>
              <body>
                <img src="${qrCodeDataUrl}" alt="User QR Code for ${
          user.name || user.id
        }">
                <script>
                  const img = document.querySelector('img');
                  if (img && img.complete) {
                     window.print();
                     window.onafterprint = function() { window.close(); }
                  } else if (img) {
                     img.onload = function() {
                       window.print();
                       window.onafterprint = function() { window.close(); }
                     }
                  } else {
                     window.print();
                     window.onafterprint = function() { window.close(); }
                  }
                </script>
              </body>
            </html>
          `);
        printWindow.document.close();
        this.snackBar.open('QR Code print initiated!', undefined, {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
      } else {
        this.snackBar.open(
          'Failed to open print window. Please check your browser settings and pop-up blockers.',
          undefined,
          {
            duration: 5000,
            panelClass: ['error-snackbar'],
          }
        );
      }
    } catch (error: any) {
      console.error('Error generating/printing QR code:', error);
      this.snackBar.open(
        `Failed to print QR code: ${error.message || 'Unknown error'}`,
        undefined,
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      );
    }
  }

  // Helper function to extract a user-friendly error message
  private getErrorMessage(error: any): string {
    if (error instanceof FirestoreError) {
      return error.message;
    }
    if (error.code) {
      return error.message || 'An unknown error occurred.';
    }
    return error.message || 'An unknown error occurred.';
  }

  // Helper to capitalize the first letter of a string
  private capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}
