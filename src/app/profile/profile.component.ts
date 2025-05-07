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

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  isVisibleContact = true;
  isVisibleMedical = false;
  isEditMode = false;
  isProfileComplete = false;
  activeButton: string | null = 'contact';
  medicalDataSaved = false;

  auth: Auth = inject(Auth);
  db: Firestore = inject(Firestore);
  user: User | null = null;

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
      alert('Error: User not logged in.');
      console.error('User not logged in.');
    }
  }

  async fetchContactData(uid: string) {
    try {
      const docRef = doc(this.db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        this.contactData = { ...docSnap.data() } as any;
        this.checkProfileCompleteness();
      } else {
        alert('Warning: Contact information not found.');
        console.log('No such document!');
      }
    } catch (error: any) {
      alert(`Error fetching contact data: ${error.message}`);
      console.error('Error fetching contact data:', error);
    }
  }

  async fetchMedicalData(uid: string) {
    try {
      const docRef = doc(this.db, 'UMedical', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        this.medicalData = { ...docSnap.data() } as any;
        this.medicalDataSaved = true;
      } else {
        console.log('No medical document yet.');
        this.medicalDataSaved = false;
      }
    } catch (error: any) {
      alert(`Error fetching medical data: ${error.message}`);
      console.error('Error fetching medical data:', error);
    }
  }

  toggleContact() {
    this.isVisibleContact = true;
    this.isVisibleMedical = false;
    this.activeButton = 'contact';
  }

  toggleMedical() {
    this.isVisibleMedical = true;
    this.isVisibleContact = false;
    this.activeButton = 'medical';
  }

  toggleEdit() {
    this.isEditMode = !this.isEditMode;
  }

  async saveContactData() {
    if (this.user) {
      try {
        const docRef = doc(this.db, 'users', this.user.uid);
        await updateDoc(docRef, { ...this.contactData });
        this.isEditMode = false;
        this.checkProfileCompleteness();
        alert('Contact information saved successfully!');
      } catch (error: any) {
        alert(`Error saving contact data: ${error.message}`);
        console.error('Error saving contact data:', error);
      }
    } else {
      alert('Error: User not logged in. Cannot save contact data.');
    }
  }

  async saveMedicalData() {
    if (this.user && this.hasMedicalData()) {
      try {
        const docRef = doc(this.db, 'UMedical', this.user.uid);
        await setDoc(docRef, { ...this.medicalData }, { merge: true });
        this.medicalDataSaved = true;
        alert('Medical data saved successfully!');
      } catch (error: any) {
        alert(`Error saving medical data: ${error.message}`);
        console.error('Error saving medical data:', error);
      }
    } else if (this.user && !this.hasMedicalData()) {
      alert('No medical data to save.');
    } else {
      alert('Error: User not logged in. Cannot save medical data.');
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
      alert(
        'Please complete all contact information fields to complete your profile.'
      );
    }
  }
}
