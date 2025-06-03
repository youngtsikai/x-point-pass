import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Auth, User } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar'; // Import MatSnackBar and MatSnackBarModule

@Component({
  selector: 'app-profile',
  standalone: true, // Make sure this is true for standalone components
  imports: [CommonModule, FormsModule, MatSnackBarModule], // Add MatSnackBarModule here
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  isVisibleContact = true;
  isVisibleMedical = false;
  isEditMode = false; // For contact info
  isMedicalEditMode = false; // ADDED: For medical info
  isProfileComplete = false;
  activeButton: string | null = 'contact';
  medicalDataSaved = false;

  auth: Auth = inject(Auth);
  db: Firestore = inject(Firestore);
  user: User | null = null;
  private snackBar: MatSnackBar = inject(MatSnackBar); // Inject MatSnackBar

  contactData = {
    name: '',
    email: '',
    phoneNumber: '',
    address: '',
    city: '',
    country: '',
  };

  medicalData = {
    emergencyContactName: '',
    emergencyContactPhone: '',
    allergies: '',
    preExistingConditions: '',
  };

  constructor() {}

  ngOnInit(): void {
    this.user = this.auth.currentUser;
    if (this.user) {
      this.fetchContactData(this.user.uid);
      this.fetchMedicalData(this.user.uid);
    } else {
      // Use MatSnackBar instead of alert
      this.snackBar.open(
        'You are not logged in. Please log in to view your profile.',
        undefined, // No dismiss button
        {
          duration: 5000,
          panelClass: ['error-snackbar'], // Use a panelClass for styling
        }
      );
      // Consider redirecting to login page if user is not logged in
      // this.router.navigateByUrl('/login'); // If you have a router injected
      console.error('User not logged in.');
    }
  }

  async fetchContactData(uid: string) {
    try {
      const docRef = doc(this.db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        this.contactData = { ...docSnap.data() } as any; // Cast to 'any' might be risky, consider type interface
        this.checkProfileCompleteness();
      } else {
        // Use MatSnackBar instead of alert
        this.snackBar.open(
          'No contact information found. Please fill in your details.',
          undefined,
          {
            duration: 5000,
            panelClass: ['warning-snackbar'],
          }
        );
        console.log('No such document for contact data!');
      }
    } catch (error: any) {
      // Use MatSnackBar instead of alert
      this.snackBar.open(
        `Error fetching contact data: ${error.message}`,
        undefined,
        {
          duration: 7000, // Longer duration for error messages
          panelClass: ['error-snackbar'],
        }
      );
      console.error('Error fetching contact data:', error);
    }
  }

  async fetchMedicalData(uid: string) {
    try {
      const docRef = doc(this.db, 'UMedical', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        this.medicalData = { ...docSnap.data() } as any; // Cast to 'any' might be risky, consider type interface
        this.medicalDataSaved = true;
      } else {
        this.snackBar.open(
          'No medical data found. You can add it now.',
          undefined,
          {
            duration: 3000,
            panelClass: ['warning-snackbar'],
          }
        );
        console.log('No medical document yet.');
        this.medicalDataSaved = false;
        this.medicalData = {
          emergencyContactName: '',
          emergencyContactPhone: '',
          allergies: '',
          preExistingConditions: '',
        };
      }
    } catch (error: any) {
      this.snackBar.open(
        `Error fetching medical data: ${error.message}`,
        undefined,
        {
          duration: 7000,
          panelClass: ['error-snackbar'],
        }
      );
      console.error('Error fetching medical data:', error);
    }
  }

  toggleContact() {
    this.isVisibleContact = true;
    this.isVisibleMedical = false;
    this.activeButton = 'contact';
    this.isEditMode = false;
    this.isMedicalEditMode = false;
  }

  toggleMedical() {
    this.isVisibleMedical = true;
    this.isVisibleContact = false;
    this.activeButton = 'medical';
    this.isEditMode = false;
    this.isMedicalEditMode = false;
  }

  toggleEdit() {
    this.isEditMode = !this.isEditMode;
  }

  toggleMedicalEdit() {
    this.isMedicalEditMode = !this.isMedicalEditMode;
  }

  async saveContactData() {
    if (!this.user) {
      this.snackBar.open(
        'Error: User not logged in. Cannot save contact data.',
        undefined,
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      );
      return;
    }

    // Basic validation before saving contact data
    if (
      !this.contactData.name ||
      !this.contactData.email ||
      !this.contactData.phoneNumber ||
      !this.contactData.address ||
      !this.contactData.city ||
      !this.contactData.country
    ) {
      this.snackBar.open(
        'Please fill in all contact information fields before saving.',
        undefined,
        {
          duration: 5000,
          panelClass: ['warning-snackbar'],
        }
      );
      return;
    }

    // Add email format validation for contact data
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.contactData.email)) {
      this.snackBar.open(
        'Please enter a valid email address for contact.',
        undefined,
        {
          duration: 3000,
          panelClass: ['warning-snackbar'],
        }
      );
      return;
    }

    // Add phone number validation for contact data (10 digits)
    const phoneNumberRegex = /^\d{10}$/;
    if (!phoneNumberRegex.test(this.contactData.phoneNumber)) {
      this.snackBar.open(
        'Please enter a valid 10-digit phone number for contact.',
        undefined,
        {
          duration: 3000,
          panelClass: ['warning-snackbar'],
        }
      );
      return;
    }

    try {
      const docRef = doc(this.db, 'users', this.user.uid);
      await updateDoc(docRef, { ...this.contactData });
      this.isEditMode = false;
      this.checkProfileCompleteness();
      this.snackBar.open('Contact information saved successfully!', undefined, {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
    } catch (error: any) {
      this.snackBar.open(
        `Error saving contact data: ${error.message}`,
        undefined,
        {
          duration: 7000,
          panelClass: ['error-snackbar'],
        }
      );
      console.error('Error saving contact data:', error);
    }
  }

  async saveMedicalData() {
    if (!this.user) {
      this.snackBar.open(
        'Error: User not logged in. Cannot save medical data.',
        undefined,
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      );
      return;
    }

    // Optional: Add validation for medical data fields if needed.
    // For example, if emergencyContactPhone must be 10 digits
    if (this.medicalData.emergencyContactPhone) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(this.medicalData.emergencyContactPhone)) {
        this.snackBar.open(
          'Please enter a valid 10-digit emergency contact phone number.',
          undefined,
          {
            duration: 5000,
            panelClass: ['warning-snackbar'],
          }
        );
        return;
      }
    }

    try {
      const docRef = doc(this.db, 'UMedical', this.user.uid);
      await setDoc(docRef, { ...this.medicalData }, { merge: true });
      this.medicalDataSaved = true;
      this.isMedicalEditMode = false;
      this.snackBar.open('Medical data saved successfully!', undefined, {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
    } catch (error: any) {
      this.snackBar.open(
        `Error saving medical data: ${error.message}`,
        undefined,
        {
          duration: 7000,
          panelClass: ['error-snackbar'],
        }
      );
      console.error('Error saving medical data:', error);
    }
  }

  hasMedicalData(): boolean {
    return !!(
      this.medicalData.emergencyContactName ||
      this.medicalData.emergencyContactPhone ||
      this.medicalData.allergies ||
      this.medicalData.preExistingConditions
    );
  }

  checkProfileCompleteness() {
    this.isProfileComplete = !!(
      this.contactData.name &&
      this.contactData.email &&
      this.contactData.phoneNumber &&
      this.contactData.address &&
      this.contactData.city &&
      this.contactData.country
    );
    if (!this.isProfileComplete) {
      this.snackBar.open(
        'Please complete all contact information fields to complete your profile.',
        undefined,
        {
          duration: 5000,
          panelClass: ['warning-snackbar'],
        }
      );
    } else {
      this.snackBar.open('Your contact profile is now complete!', undefined, {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
    }
  }
}
