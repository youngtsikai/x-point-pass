import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';
import { inject } from '@angular/core';
import { getFirestore } from '@angular/fire/firestore';
import { getAuth } from '@angular/fire/auth';
import { VisitorHeaderComponent } from '../visitor-header/visitor-header.component';
import { VisitorSidebarComponent } from '../visitor-sidebar/visitor-sidebar.component';

@Component({
  selector: 'app-visitor-preregistraton',
  imports: [
    VisitorHeaderComponent,
    VisitorSidebarComponent,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './visitor-preregistraton.component.html',
  styleUrl: './visitor-preregistraton.component.css',
})
export class VisitorPreregistratonComponent {
  db: Firestore = inject(Firestore);
  auth: Auth = inject(Auth);
  user: User | null = null;

  formData = {
    name: '',
    phone: '',
    host: '',
    idnum: '',
    licenseplate: '',
    purpose: '',
    estimatedHours: '',
    visitDate: '',
    visitTime: '',
    visitorUid: '',
    status: 'active', // Set default status to 'active'
  };

  showErrorPopup = false;
  errorMessages: string[] = [];
  showSuccessPopup = false;

  constructor(private router: Router) {}

  ngOnInit() {
    console.log('ngOnInit: Starting auth state check.');
    onAuthStateChanged(getAuth(), (user) => {
      console.log('ngOnInit: Auth state changed.');
      if (user) {
        console.log('ngOnInit: User logged in:', user);
        console.log('ngOnInit: User display name:', user.displayName);
        this.user = user;
        this.formData.visitorUid = user.uid;
        this.formData.name = user.displayName || '';
      } else {
        console.log('ngOnInit: User not logged in.');
        this.errorMessages.push('User not logged in.');
        this.showErrorPopup = true;
        this.router.navigate(['/visitor-signin']);
      }
    });
    console.log('ngOnInit: Finished auth state check.');
  }

  async onSubmit() {
    this.showErrorPopup = false;
    this.showSuccessPopup = false;
    this.errorMessages = [];

    if (
      !this.formData.name ||
      !this.formData.phone ||
      !this.formData.host ||
      !this.formData.idnum ||
      !this.formData.licenseplate ||
      !this.formData.purpose ||
      !this.formData.estimatedHours ||
      !this.formData.visitDate ||
      !this.formData.visitTime
    ) {
      this.errorMessages.push('Please fill in all required fields.');
      this.showErrorPopup = true;
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(this.formData.phone)) {
      this.errorMessages.push('Please enter a valid 10-digit phone number.');
      this.showErrorPopup = true;
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(this.formData.visitDate)) {
      this.errorMessages.push('Please enter a valid date (YYYY-MM-DD).');
      this.showErrorPopup = true;
      return;
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(this.formData.visitTime)) {
      this.errorMessages.push('Please enter a valid time (HH:MM).');
      this.showErrorPopup = true;
      return;
    }

    try {
      const docRef = doc(
        getFirestore(),
        'visitor-preregistrations',
        Date.now().toString()
      );
      await setDoc(docRef, this.formData); // formData now includes status: 'active'
      this.showSuccessPopup = true;
      setTimeout(() => {
        this.router.navigate(['/visits']);
      }, 2000);
    } catch (error: any) {
      this.errorMessages.push('Error pre-registering visit: ' + error.message);
      this.showErrorPopup = true;
    }
  }
}
