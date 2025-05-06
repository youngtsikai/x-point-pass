import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Firestore, setDoc, doc, collection } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';

// Define the interface for your Flag data
interface Flag {
  reportas: string;
  threat: string;
  location: string;
  badgecolour: string;
  attachment: null;
  involved: string;
  description: string;
  additional: string;
  reportedBy: string;
  reportedByUid: string | null;
  timestamp: Date;
  status: string; // Added status field
}

@Component({
  selector: 'app-flag',
  imports: [FormsModule, CommonModule],
  templateUrl: './flag.component.html',
  styleUrl: './flag.component.css',
})
export class FlagComponent implements AfterViewInit {
  formData = {
    reportas: '',
    threat: '',
    location: '',
    badgecolour: '',
    attachment: null,
    involved: '',
    description: '',
    additional: '',
  };

  @ViewChild('mainContainer', { static: false }) mainContainer!: ElementRef;
  @ViewChild('threat', { static: false }) threatSelect!: ElementRef;

  constructor(private firestore: Firestore, private auth: Auth) {}

  ngAfterViewInit() {
    if (this.threatSelect) {
      this.threatSelect.nativeElement.addEventListener('change', () => {
        this.updateBackgroundColor();
      });
      this.updateBackgroundColor();
    }
  }

  updateBackgroundColor() {
    if (this.mainContainer && this.threatSelect) {
      const threatValue = this.threatSelect.nativeElement.value;
      const mainContainerElement = this.mainContainer.nativeElement;

      switch (threatValue) {
        case 'High':
          mainContainerElement.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
          mainContainerElement.style.border = '2px solid red';
          break;
        case 'Medium':
          mainContainerElement.style.backgroundColor = 'rgba(255, 193, 7, 0.2)';
          mainContainerElement.style.border = '2px solid orange';
          break;
        case 'Low':
          mainContainerElement.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
          mainContainerElement.style.border = '2px solid green';
          break;
        case '':
          mainContainerElement.style.backgroundColor = '';
          mainContainerElement.style.border = 'none';
          break;
        default:
          mainContainerElement.style.backgroundColor = '';
          mainContainerElement.style.border = 'none';
          break;
      }
    }
  }

  async onSubmit() {
    if (
      !this.formData.reportas ||
      !this.formData.threat ||
      !this.formData.location ||
      !this.formData.involved ||
      !this.formData.description
    ) {
      alert('Please fill in all required fields.');
      return;
    }

    let reportedByName = 'Anonymous';
    let reportedByUid = null;

    if (this.formData.reportas === 'Name') {
      const user = this.auth.currentUser;
      if (user && user.displayName) {
        reportedByName = user.displayName;
        reportedByUid = user.uid;
      } else {
        alert(
          'Could not retrieve user name. Please report anonymously or ensure you are logged in.'
        );
        return;
      }
    } else {
      const user = this.auth.currentUser;
      if (user) {
        reportedByUid = user.uid;
      }
    }

    try {
      const docRef = doc(collection(this.firestore, 'Flags'));
      const flagData: Flag = {
        reportedBy: reportedByName,
        reportedByUid: reportedByUid,
        threat: this.formData.threat,
        location: this.formData.location,
        badgecolour: this.formData.badgecolour,
        involved: this.formData.involved,
        description: this.formData.description,
        additional: this.formData.additional,
        timestamp: new Date(),
        status: 'pending', // Set default status to 'pending'
        reportas: this.formData.reportas,
        attachment: this.formData.attachment,
      };
      await setDoc(docRef, flagData);

      alert('Report submitted successfully.');
      this.resetForm();
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    }
  }

  resetForm() {
    this.formData = {
      reportas: '',
      threat: '',
      location: '',
      badgecolour: '',
      attachment: null,
      involved: '',
      description: '',
      additional: '',
    };
  }
}
