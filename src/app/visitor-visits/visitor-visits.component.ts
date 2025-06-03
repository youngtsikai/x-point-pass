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
  onSnapshot,
  orderBy,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { AuthService, FirestoreUser } from '../auth.service';
import { VisitorSidebarComponent } from '../visitor-sidebar/visitor-sidebar.component';
import { VisitorHeaderComponent } from '../visitor-header/visitor-header.component';
import { VisitQrCodeService } from '../visitqrcode.service';

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
  selector: 'app-visitor-visits',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSnackBarModule,
    VisitorSidebarComponent,
    VisitorHeaderComponent,
  ],
  templateUrl: './visitor-visits.component.html',
  styleUrl: './visitor-visits.component.css',
  providers: [DatePipe],
})
export class VisitorVisitsComponent implements OnInit, OnDestroy {
  allVisits: Visit[] = [];
  db: Firestore = inject(Firestore);
  firebaseAuth: Auth = inject(Auth);
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);
  private qrCodeService = inject(VisitQrCodeService);
  loading: boolean = true;

  private visitsSubscription: Subscription | undefined;
  private currentUserUid: string | null = null;
  private currentUserName: string | null = null;

  constructor(private _snackBar: MatSnackBar) {}

  ngOnInit() {
    console.log('VisitorVisitsComponent: ngOnInit triggered.');
    this.authService.getCurrentUser().then((user) => {
      if (user) {
        this.currentUserUid = user.uid;
        this.currentUserName = user.displayName;
        console.log(
          `VisitorVisitsComponent: Current User - UID: ${this.currentUserUid}, DisplayName: ${this.currentUserName}`
        );
        this.listenForVisits();
      } else {
        this.loading = false;
        console.error(
          'VisitorVisitsComponent: No authenticated user found in ngOnInit.'
        );
        this._snackBar.open(
          'Authentication error. Please re-login.',
          'Dismiss',
          {
            duration: 5000,
            panelClass: ['snackbar-error'],
          }
        );
      }
    });
  }

  ngOnDestroy() {
    console.log('VisitorVisitsComponent: ngOnDestroy triggered.');
    if (this.visitsSubscription) {
      this.visitsSubscription.unsubscribe();
      console.log('VisitorVisitsComponent: visitsSubscription unsubscribed.');
    }
  }

  listenForVisits() {
    this.loading = true;
    console.log('VisitorVisitsComponent: listenForVisits started.');

    if (!this.currentUserUid && !this.currentUserName) {
      this.loading = false;
      console.error(
        'VisitorVisitsComponent: User UID is missing when trying to fetch visits.'
      );
      this._snackBar.open(
        'User information missing. Cannot load visits.',
        'Dismiss',
        {
          duration: 5000,
          panelClass: ['error-snackbar'],
        }
      );
      return;
    }

    if (this.visitsSubscription) {
      this.visitsSubscription.unsubscribe();
      console.log(
        'VisitorVisitsComponent: Existing visitsSubscription unsubscribed before creating new one.'
      );
    }

    const visitorVisitsQuery = query(
      collection(this.db, 'visitor-preregistrations'),
      where('visitorUid', '==', this.currentUserUid),
      orderBy('visitDate', 'desc'),
      orderBy('visitTime', 'desc')
    );
    console.log(
      `VisitorVisitsComponent: Firestore query set for host: "${this.currentUserName}"`
    );

    this.visitsSubscription = new Subscription(
      onSnapshot(
        visitorVisitsQuery,
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
              const dateTimeString = `${visit.visitDate}T${visit.visitTime}:00`; // Adding :00 for seconds to make it full ISO-like
              const visitDateTime = new Date(dateTimeString);

              const currentDateTime = new Date();

              console.groupCollapsed(
                `Checking Visit: ${visit.id} (Host: ${visit.host}, Purpose: ${visit.purpose})`
              );
              console.log(
                `  Stored visitDate: ${visit.visitDate}, visitTime: ${visit.visitTime}`
              );
              console.log(`  Constructed dateTimeString: ${dateTimeString}`);
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
              console.log(`  Current Visit Status: ${visit.status}`);
              console.log(
                `  Condition met: ${
                  visitDateTime < currentDateTime && visit.status === 'pending'
                }`
              );
              console.groupEnd();

              // Auto-cancel past pending visits for the host's view
              if (
                visitDateTime < currentDateTime &&
                visit.status === 'pending'
              ) {
                console.warn(
                  `  >>> AUTO-CANCELLATION CANDIDATE: Visit ID ${visit.id} is past due and pending. Attempting to update.`
                );
                updatePromises.push(
                  updateDoc(docSnap.ref, { status: 'cancelled' })
                    .then(() => {
                      visit.status = 'cancelled';
                      console.log(
                        `  --- SUCCESSFULLY updated local status for ${visit.id} to 'cancelled'.`
                      );
                      return Promise.resolve();
                    })
                    .catch((error) => {
                      console.error(
                        `  --- ERROR: Failed to update visit status for ${visit.id} in Firestore:`,
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

            // Sorting logic for display
            fetchedVisits.sort((a, b) => {
              if (a.status === 'pending' && b.status !== 'pending') {
                return -1;
              }
              if (a.status !== 'pending' && b.status === 'pending') {
                return 1;
              }

              // Use the consistent ISO-like string for sorting as well
              const dateA = new Date(`${a.visitDate}T${a.visitTime}:00`);
              const dateB = new Date(`${b.visitDate}T${b.visitTime}:00`);
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
            console.error(
              'VisitorVisitsComponent: Error listening for visits:',
              error
            );
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

  // --- Helper Methods (Also need date parsing fix) ---
  isVisitPast(visit: Visit): boolean {
    const dateTimeString = `${visit.visitDate}T${visit.visitTime}:00`;
    const visitDateTime = new Date(dateTimeString);
    return visitDateTime < new Date();
  }

  getVisitRowClass(visit: Visit): string {
    if (visit.status === 'acknowledged') {
      return 'acknowledged-visit';
    } else if (visit.status === 'cancelled' || this.isVisitPast(visit)) {
      // The isVisitPast(visit) here is mainly for visual representation
      // The actual Firestore update happens in listenForVisits
      return 'cancelled-visit';
    }
    return '';
  }

  getDisplayStatus(visit: Visit): string {
    if (this.isVisitPast(visit) && visit.status === 'pending') {
      return 'Expired'; // Visually mark as expired even if Firestore update is pending
    }
    switch (visit.status) {
      case 'acknowledged':
        return 'Acknowledged';
      case 'cancelled':
        return 'Expired';
      case 'pending':
        return 'Pending';
      case 'disacknowledged':
        return 'Disacknowledged';
      default:
        return 'Unknown';
    }
  }

  // Method to download QR code for a specific visit using the dedicated service method
  downloadQrCodeForVisit(visit: Visit) {
    // We pass the entire visit object directly to the new service method
    // as it aligns with the new VisitQrData interface
    this.qrCodeService.downloadVisitQrCode(visit);
  }
}
