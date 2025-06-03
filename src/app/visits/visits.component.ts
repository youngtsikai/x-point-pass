import { Component, OnInit, OnDestroy, inject, NgZone } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { AuthService, FirestoreUser } from '../auth.service';

interface Visit {
  id: string;
  name: string;
  phone: string;
  idnum: string;
  licenseplate: string;
  purpose: string;
  host: string;
  visitDate: string;
  visitTime: string;
  status: 'pending' | 'acknowledged' | 'cancelled' | 'disacknowledged';
  visitorUid: string;
}

@Component({
  selector: 'app-visits',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, MatSnackBarModule],
  templateUrl: './visits.component.html',
  styleUrl: './visits.component.css',
})
export class VisitsComponent implements OnInit, OnDestroy {
  allVisits: Visit[] = [];
  db: Firestore = inject(Firestore);
  firebaseAuth: Auth = inject(Auth);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  loading: boolean = true;

  private visitsSubscription: Subscription | undefined;
  private authStateSubscription: Subscription | undefined;

  constructor(private _snackBar: MatSnackBar) {}

  ngOnInit() {
    this.authStateSubscription = this.authService.authStateReady$.subscribe(
      async (ready) => {
        if (ready) {
          this.listenForVisits();
        } else {
          const user = await this.authService.getCurrentUser();
          if (!user) {
            this.loading = false;
            this._snackBar.open(
              'You must be logged in to view visits.',
              'Dismiss',
              {
                duration: 5000,
                panelClass: ['snackbar-info'],
              }
            );
          }
        }
      }
    );
  }

  ngOnDestroy() {
    if (this.visitsSubscription) {
      this.visitsSubscription.unsubscribe();
    }
    if (this.authStateSubscription) {
      this.authStateSubscription.unsubscribe();
    }
  }

  listenForVisits() {
    this.loading = true;
    const user = this.firebaseAuth.currentUser;

    if (!user || !user.displayName) {
      this.loading = false;
      this._snackBar.open(
        'User not logged in or display name missing.',
        'Dismiss',
        {
          duration: 5000,
          panelClass: ['snackbar-info'],
        }
      );
      if (this.visitsSubscription) {
        this.visitsSubscription.unsubscribe();
        this.visitsSubscription = undefined;
      }
      return;
    }

    if (this.visitsSubscription) {
      this.visitsSubscription.unsubscribe();
    }

    const visitsQuery = query(
      collection(this.db, 'visitor-preregistrations'),
      where('host', '==', user.displayName)
    );

    this.visitsSubscription = new Subscription(
      onSnapshot(
        visitsQuery,
        async (querySnapshot) => {
          this.ngZone.run(async () => {
            console.log(
              'VisitorVisitsComponent: onSnapshot callback triggered (inside ngZone.run).'
            );
            let fetchedVisits: Visit[] = [];
            const updatePromises: Promise<any>[] = [];

            console.log(
              `VisitorVisitsComponent: Found ${querySnapshot.size} documents in snapshot.`
            );

            querySnapshot.forEach((docSnap) => {
              const visitData = docSnap.data() as Visit;
              const visit: Visit = { ...visitData, id: docSnap.id };

              console.log(
                `--- Processing Visit: ${visit.id} (Host: ${visit.host}, Purpose: ${visit.purpose}) ---`
              );
              console.log(
                `  Initial Status from Firestore Snapshot: ${visit.status}`
              );
              console.log(
                `  Stored visitDate: ${visit.visitDate}, visitTime: ${visit.visitTime}`
              );

              // --- CORRECTED DATE PARSING ---
              // Assuming visitDate is YYYY-MM-DD and visitTime is HH:MM
              const visitDateTime = new Date(
                `${visit.visitDate}T${visit.visitTime}`
              );
              // Using template literal for direct ISO-like string parsing, which is robust.
              // Alternatively, if you prefer explicit component parsing for YYYY-MM-DD:
              // const [year, month, day] = visit.visitDate.split('-').map(Number);
              // const [hours, minutes] = visit.visitTime.split(':').map(Number);
              // const visitDateTime = new Date(year, month - 1, day, hours, minutes);
              // --- END CORRECTED DATE PARSING ---

              const currentDateTime = new Date();

              console.log(
                `  Parsed visitDateTime: ${visitDateTime.toLocaleString()}`
              );
              console.log(
                `  Current DateTime: ${currentDateTime.toLocaleString()}`
              );
              console.log(
                `  Is visitDateTime < currentDateTime? ${
                  visitDateTime < currentDateTime
                }`
              );
              console.log(
                `  Is visit.status === 'pending'? ${visit.status === 'pending'}`
              );
              console.log(
                `  Full auto-cancel condition result: ${
                  visitDateTime < currentDateTime && visit.status === 'pending'
                }`
              );

              if (
                visitDateTime < currentDateTime &&
                visit.status === 'pending'
              ) {
                console.warn(
                  `  !!! AUTO-CANCELLING Visit ${visit.id} because it's past due and PENDING. !!!`
                );
                updatePromises.push(
                  updateDoc(docSnap.ref, { status: 'cancelled' })
                    .then(() => {
                      visit.status = 'cancelled';
                      if (visit.visitorUid) {
                        return this.createAlert(
                          visit.visitorUid,
                          'visitCancelledByPastDate',
                          `Your scheduled visit on ${visit.visitDate} at ${visit.visitTime} has expired and is now cancelled.`,
                          visit.id,
                          'visitor-preregistrations',
                          'system',
                          'System'
                        );
                      }
                      return Promise.resolve();
                    })
                    .catch((error) => {
                      console.error(
                        `Error updating visit status for ${visit.id} or creating alert:`,
                        error
                      );
                    })
                );
              }

              fetchedVisits.push(visit);
            });

            console.log(
              `VisitorVisitsComponent: Waiting for ${updatePromises.length} update promises to settle.`
            );
            await Promise.allSettled(updatePromises);
            console.log('VisitorVisitsComponent: All update promises settled.');

            fetchedVisits.sort((a, b) => {
              if (a.status === 'pending' && b.status !== 'pending') {
                return -1;
              }
              if (a.status !== 'pending' && b.status === 'pending') {
                return 1;
              }

              // Ensure date parsing for sorting is robust: YYYY-MM-DD
              const dateA = new Date(`${a.visitDate}T${a.visitTime}`); // Use the same robust parsing here
              const dateB = new Date(`${b.visitDate}T${b.visitTime}`); // Use the same robust parsing here

              // Handle Invalid Dates in sorting by pushing them to the end, or similar logic
              if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
              if (isNaN(dateA.getTime())) return 1;
              if (isNaN(dateB.getTime())) return -1;

              return dateA.getTime() - dateB.getTime();
            });

            this.allVisits = fetchedVisits;
            this.loading = false;
            console.log(
              'VisitorVisitsComponent: allVisits updated and loading set to false.'
            );
          });
        },
        (error) => {
          this.ngZone.run(() => {
            console.error('Error listening for visits:', error);
            this.loading = false;
            this._snackBar.open(
              'Error loading visits. Please refresh the page.',
              'Dismiss',
              {
                duration: 5000,
                panelClass: ['snackbar-error'],
              }
            );
          });
        }
      )
    );
  }

  // --- Helper Methods (Updated with correct parsing) ---

  isVisitPast(visit: Visit): boolean {
    // Corrected date parsing for consistency
    const visitDateTime = new Date(`${visit.visitDate}T${visit.visitTime}`);
    // Check if the date is valid before comparison
    if (isNaN(visitDateTime.getTime())) {
      console.warn(
        `Invalid visit date/time for visit ${visit.id}: ${visit.visitDate} ${visit.visitTime}`
      );
      return false; // Or handle as an error, but returning false won't mark it past due
    }
    return visitDateTime < new Date();
  }

  // --- Remaining methods are unchanged ---

  getVisitRowClass(visit: Visit): string {
    if (visit.status === 'acknowledged') {
      return 'acknowledged-visit';
    } else if (visit.status === 'cancelled' || this.isVisitPast(visit)) {
      // isVisitPast will now work
      return 'cancelled-visit';
    }
    return '';
  }

  getDisplayStatus(visit: Visit): string {
    // This will now correctly show 'Expired' for pending, truly past visits
    if (this.isVisitPast(visit) && visit.status === 'pending') {
      return 'Expired';
    }
    switch (visit.status) {
      case 'acknowledged':
        return 'Acknowledged';
      case 'disacknowledged':
        return 'Disacknowledged';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Expired';
      default:
        return 'Unknown';
    }
  }

  async acknowledgeVisit(visitId: string) {
    try {
      const visitDocRef = doc(this.db, 'visitor-preregistrations', visitId);
      await updateDoc(visitDocRef, { status: 'acknowledged' });

      const acknowledgedVisit = this.allVisits.find((v) => v.id === visitId);

      if (acknowledgedVisit && acknowledgedVisit.visitorUid) {
        await this.createAlert(
          acknowledgedVisit.visitorUid,
          'visitAcknowledged',
          `Your visit to ${
            this.firebaseAuth.currentUser?.displayName || 'a host'
          } on ${acknowledgedVisit.visitDate} at ${
            acknowledgedVisit.visitTime
          } has been acknowledged.`,
          acknowledgedVisit.id,
          'visitor-preregistrations',
          'host',
          this.firebaseAuth.currentUser?.displayName || 'Unknown Host'
        );
      }
      this._snackBar.open('Visit acknowledged successfully!', '', {
        duration: 3000,
        panelClass: ['success-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    } catch (error) {
      console.error('Error acknowledging visit:', error);
      this._snackBar.open(
        'Failed to acknowledge visit. Please try again.',
        '',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        }
      );
    }
  }

  async disacknowledgeVisit(visitId: string) {
    try {
      const visitDocRef = doc(this.db, 'visitor-preregistrations', visitId);
      await updateDoc(visitDocRef, { status: 'disacknowledged' });

      const disacknowledgedVisit = this.allVisits.find((v) => v.id === visitId);

      if (disacknowledgedVisit && disacknowledgedVisit.visitorUid) {
        await this.createAlert(
          disacknowledgedVisit.visitorUid,
          'visitDisacknowledged',
          `Your visit to ${
            this.firebaseAuth.currentUser?.displayName || 'a host'
          } on ${disacknowledgedVisit.visitDate} at ${
            disacknowledgedVisit.visitTime
          } has been disacknowledged.`,
          disacknowledgedVisit.id,
          'visitor-preregistrations',
          'host',
          this.firebaseAuth.currentUser?.displayName || 'Unknown Host'
        );
      }
      this._snackBar.open('Visit disacknowledged.', '', {
        duration: 3000,
        panelClass: ['snackbar-info'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    } catch (error) {
      console.error('Error disacknowledging visit:', error);
      this._snackBar.open(
        'Failed to disacknowledge visit. Please try again.',
        '',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        }
      );
    }
  }

  private async createAlert(
    recipientUid: string,
    type: string,
    message: string,
    relatedDocId: string,
    relatedCollection: string,
    senderRole: 'host' | 'system',
    senderName?: string
  ) {
    try {
      await addDoc(collection(this.db, 'visitoralerts'), {
        recipientUid: recipientUid,
        type: type,
        message: message,
        relatedDocId: relatedDocId,
        relatedCollection: relatedCollection,
        timestamp: serverTimestamp(),
        read: false,
        senderRole: senderRole,
        senderName: senderName || null,
      });
      console.log('Alert created successfully in visitoralerts collection!');
    } catch (error) {
      console.error('Error creating alert in visitoralerts:', error);
    }
  }
}
