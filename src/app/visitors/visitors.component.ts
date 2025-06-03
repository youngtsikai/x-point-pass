import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core'; // <--- ADD ChangeDetectorRef
import { CommonModule, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  getDoc,
  FirestoreError,
  DocumentData,
} from '@angular/fire/firestore';
import { AuthService } from '../auth.service';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Unsubscribe } from 'firebase/firestore';

// Define an interface for the visitor user data structure
interface VisitorUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  role: string;
  phoneNumber?: string | null;
  isBlacklisted?: boolean;
  [key: string]: any;
}

// MedicalDetails Interface for visitors (aligned with previous UMedical details)
interface MedicalDetails {
  allergies?: string[] | string | null;
  conditions?: string[] | string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  [key: string]: any;
}

@Component({
  selector: 'app-visitors',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminHeaderComponent,
    AdminSidebarComponent,
    MatSnackBarModule,
  ],
  templateUrl: './visitors.component.html',
  styleUrl: './visitors.component.css',
})
export class VisitorsComponent implements OnInit, OnDestroy {
  private firestore: Firestore = inject(Firestore);
  private authService: AuthService = inject(AuthService);
  private snackBar: MatSnackBar = inject(MatSnackBar);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef); // <--- INJECT ChangeDetectorRef

  visitors: VisitorUser[] = [];
  isLoading: boolean = true;
  error: string | null = null; // Assuming you added this in the last iteration for error display

  editingVisitorUid: string | null = null;
  tempEditVisitor: VisitorUser | null = null;

  private unsubscribeVisitors: Unsubscribe | undefined;

  constructor() {
    console.log('VisitorsComponent initialized');
  }

  ngOnInit(): void {
    console.log('VisitorsComponent ngOnInit called');
    this.setupVisitorsListener();
  }

  ngOnDestroy(): void {
    if (this.unsubscribeVisitors) {
      console.log('Unsubscribing from visitors listener.');
      this.unsubscribeVisitors();
    }
  }

  setupVisitorsListener(): void {
    this.isLoading = true;
    this.error = null;
    console.log('Setting up real-time visitors listener...');

    const usersCollection = collection(this.firestore, 'users');
    const q = query(usersCollection, where('role', '==', 'visitor'));

    this.unsubscribeVisitors = onSnapshot(
      q,
      (querySnapshot) => {
        this.visitors = querySnapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data() as DocumentData;
          return {
            uid: docSnapshot.id,
            displayName: (data['displayName'] as string) || null,
            email: (data['email'] as string) || null,
            role: (data['role'] as string) || 'visitor',
            phoneNumber: (data['phoneNumber'] as string) || null,
            isBlacklisted: (data['isBlacklisted'] as boolean) || false,
          };
        });

        this.isLoading = false;
        this.error = null;
        console.log('Visitors data updated in real-time:', this.visitors);
        this.cdr.detectChanges(); // <--- ADD THIS LINE TO FORCE CHANGE DETECTION
      },
      (error: any) => {
        console.error('Error listening to visitors:', error);
        this.snackBar.open(
          `Failed to load real-time visitors: ${this.getErrorMessage(error)}`,
          'Close',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
        this.isLoading = false;
        this.visitors = [];
        this.error = `Error loading data: ${this.getErrorMessage(error)}`;
        this.cdr.detectChanges(); // <--- ALSO ADD HERE FOR ERROR SCENARIOS
      }
    );
  }

  async viewDetails(visitor: VisitorUser): Promise<void> {
    console.log('View Details clicked for visitor:', visitor.uid, visitor);

    let medicalDetails: MedicalDetails | null = null;
    let detailsMessage = `Visitor Details:\n`;
    detailsMessage += `Name: ${visitor.displayName || 'N/A'}\n`;
    detailsMessage += `Email: ${visitor.email || 'N/A'}\n`;
    detailsMessage += `Phone: ${visitor.phoneNumber || 'N/A'}\n`;
    detailsMessage += `Role: ${visitor.role}\n`;
    detailsMessage += `Blacklisted: ${visitor.isBlacklisted ? 'Yes' : 'No'}\n`;

    if (visitor.uid) {
      try {
        const medicalDocRef = doc(this.firestore, 'UMedical', visitor.uid);
        const medicalDocSnap = await getDoc(medicalDocRef);

        if (medicalDocSnap.exists()) {
          medicalDetails = medicalDocSnap.data() as MedicalDetails;
          console.log('Fetched medical details (raw data):', medicalDetails);

          detailsMessage += `\nMedical Details:\n`;
          if (medicalDetails) {
            detailsMessage += `Allergies: ${
              Array.isArray(medicalDetails.allergies)
                ? medicalDetails.allergies.join(', ')
                : medicalDetails.allergies || 'None'
            }\n`;

            detailsMessage += `Conditions: ${
              Array.isArray(medicalDetails.conditions)
                ? medicalDetails.conditions.join(', ')
                : medicalDetails.conditions || 'None'
            }\n`;

            detailsMessage += `Emergency Contact Name: ${
              medicalDetails.emergencyContactName || 'N/A'
            }\n`;
            detailsMessage += `Emergency Contact Phone: ${
              medicalDetails.emergencyContactPhone || 'N/A'
            }\n`;
          }
        } else {
          detailsMessage += `\nNo medical details found for this visitor.`;
        }
      } catch (error: any) {
        console.error('Error fetching medical details:', error);
        detailsMessage += `\nError fetching medical details: ${this.getErrorMessage(
          error
        )}`;
        this.snackBar.open(
          `Error fetching medical details for ${
            visitor.displayName
          }: ${this.getErrorMessage(error)}`,
          'Close',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    } else {
      detailsMessage += `\nCannot fetch medical details: Visitor UID is missing.`;
      this.snackBar.open(
        `Cannot fetch medical details: Visitor UID is missing.`,
        'Close',
        { duration: 5000, panelClass: ['warning-snackbar'] }
      );
    }

    alert(detailsMessage);
  }

  editVisitor(visitor: VisitorUser): void {
    console.log('Edit clicked for visitor:', visitor.uid);
    this.editingVisitorUid = visitor.uid;
    this.tempEditVisitor = { ...visitor };
  }

  async updateVisitor(): Promise<void> {
    if (!this.tempEditVisitor || !this.tempEditVisitor.uid) {
      this.snackBar.open(
        'No visitor data to update or missing visitor UID.',
        'Close',
        {
          duration: 4000,
          panelClass: ['warning-snackbar'],
        }
      );
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to update ${
        this.tempEditVisitor.displayName || 'this visitor'
      }'s profile?`
    );

    if (confirmed) {
      try {
        const visitorDocRef = doc(
          this.firestore,
          'users',
          this.tempEditVisitor.uid
        );

        const dataToUpdate: { [key: string]: any } = {};
        if (this.tempEditVisitor.displayName !== undefined) {
          dataToUpdate['displayName'] = this.tempEditVisitor.displayName;
        }
        if (this.tempEditVisitor.phoneNumber !== undefined) {
          dataToUpdate['phoneNumber'] =
            this.tempEditVisitor.phoneNumber || null;
        }

        await updateDoc(visitorDocRef, dataToUpdate);
        console.log(
          'Visitor profile updated in Firestore for UID:',
          this.tempEditVisitor.uid
        );
        this.snackBar.open('Visitor profile updated successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.cancelEditVisitor();
        // REMOVED: this.fetchVisitors(); // No need to manually re-fetch, listener handles it
      } catch (error: any) {
        console.error('Error updating visitor profile:', error);
        this.snackBar.open(
          `Failed to update visitor profile: ${this.getErrorMessage(error)}`,
          'Close',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    } else {
      this.snackBar.open('Visitor update cancelled.', 'Close', {
        duration: 2000,
        panelClass: ['info-snackbar'],
      });
      console.log('Visitor update cancelled by user.');
    }
  }

  cancelEditVisitor(): void {
    this.editingVisitorUid = null;
    this.tempEditVisitor = null;
    console.log('Visitor edit cancelled.');
  }

  async blacklistVisitor(visitor: VisitorUser): Promise<void> {
    if (!visitor.uid) {
      console.error('Cannot blacklist visitor: missing UID', visitor);
      this.snackBar.open(
        'Cannot blacklist visitor: Missing identifier.',
        'Close',
        {
          duration: 3000,
          panelClass: ['error-snackbar'],
        }
      );
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to blacklist ${
        visitor.displayName || 'this visitor'
      }? They will be unable to access the system.`
    );

    if (confirmed) {
      const visitorDocRef = doc(this.firestore, 'users', visitor.uid);
      try {
        await updateDoc(visitorDocRef, { isBlacklisted: true });
        console.log(`Visitor ${visitor.uid} blacklisted successfully.`);
        this.snackBar.open(
          `${visitor.displayName || 'Visitor'} has been blacklisted.`,
          'Close',
          {
            duration: 3000,
            panelClass: ['success-snackbar'],
          }
        );
      } catch (error: any) {
        console.error('Error blacklisting visitor:', error);
        this.snackBar.open(
          `Failed to blacklist visitor: ${this.getErrorMessage(error)}`,
          'Close',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    } else {
      this.snackBar.open('Blacklisting cancelled.', 'Close', {
        duration: 2000,
        panelClass: ['info-snackbar'],
      });
      console.log('Blacklisting cancelled by user.');
    }
  }

  async unblacklistVisitor(visitor: VisitorUser): Promise<void> {
    if (!visitor.uid) {
      console.error('Cannot unblacklist visitor: missing UID', visitor);
      this.snackBar.open(
        'Cannot unblacklist visitor: Missing identifier.',
        'Close',
        {
          duration: 3000,
          panelClass: ['error-snackbar'],
        }
      );
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to unblacklist ${
        visitor.displayName || 'this visitor'
      }? They will regain access to the system.`
    );

    if (confirmed) {
      const visitorDocRef = doc(this.firestore, 'users', visitor.uid);
      try {
        await updateDoc(visitorDocRef, { isBlacklisted: false });
        console.log(`Visitor ${visitor.uid} unblacklisted successfully.`);
        this.snackBar.open(
          `${visitor.displayName || 'Visitor'} has been unblacklisted.`,
          'Close',
          {
            duration: 3000,
            panelClass: ['success-snackbar'],
          }
        );
      } catch (error: any) {
        console.error('Error unblacklisting visitor:', error);
        this.snackBar.open(
          `Failed to unblacklist visitor: ${this.getErrorMessage(error)}`,
          'Close',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    } else {
      this.snackBar.open('Unblacklisting cancelled.', 'Close', {
        duration: 2000,
        panelClass: ['info-snackbar'],
      });
      console.log('Unblacklisting cancelled by user.');
    }
  }

  async deleteVisitor(visitor: VisitorUser): Promise<void> {
    if (!visitor.uid) {
      console.error('Cannot delete visitor: missing UID', visitor);
      this.snackBar.open(
        'Cannot delete visitor: Missing identifier.',
        'Close',
        {
          duration: 3000,
          panelClass: ['error-snackbar'],
        }
      );
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete the record for ${
        visitor.displayName || 'this visitor'
      }? This action cannot be undone and will also remove their medical details.`
    );

    if (confirmed) {
      const visitorDocRef = doc(this.firestore, 'users', visitor.uid);
      try {
        await deleteDoc(visitorDocRef);
        console.log(`Visitor record ${visitor.uid} deleted successfully.`);

        const medicalDocRef = doc(this.firestore, 'UMedical', visitor.uid);
        try {
          await deleteDoc(medicalDocRef);
          console.log(
            `UMedical document deleted successfully for UID: ${visitor.uid}`
          );
        } catch (medicalDeleteError: any) {
          console.warn(
            `Warning: Could not delete UMedical document for UID ${visitor.uid}: ${medicalDeleteError.message}`
          );
          this.snackBar.open(
            `Warning: Visitor profile deleted, but medical data could not be deleted: ${this.getErrorMessage(
              medicalDeleteError
            )}`,
            'Close',
            { duration: 7000, panelClass: ['warning-snackbar'] }
          );
        }

        this.snackBar.open(
          `${visitor.displayName || 'Visitor'}'s record has been deleted.`,
          'Close',
          {
            duration: 3000,
            panelClass: ['success-snackbar'],
          }
        );
      } catch (error: any) {
        console.error('Error deleting visitor:', error);
        this.snackBar.open(
          `Failed to delete visitor record: ${this.getErrorMessage(error)}`,
          'Close',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    } else {
      this.snackBar.open('Deletion cancelled.', 'Close', {
        duration: 2000,
        panelClass: ['info-snackbar'],
      });
      console.log('Deletion cancelled by user.');
    }
  }

  private getErrorMessage(error: any): string {
    if (error instanceof FirestoreError) {
      return error.message;
    }
    if (error.code) {
      return error.message || 'An unknown error occurred.';
    }
    return error.message || 'An unknown error occurred.';
  }

  private capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}
