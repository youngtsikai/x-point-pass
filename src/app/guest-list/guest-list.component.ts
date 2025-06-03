import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, FirestoreUser } from '../auth.service';
import { VisitsService, Visit } from '../visits.service'; // Make sure Visit interface is exported and imported
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-guest-list',
  templateUrl: './guest-list.component.html',
  styleUrls: ['./guest-list.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class GuestListComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private visitsService = inject(VisitsService);
  private cdr = inject(ChangeDetectorRef); // Inject ChangeDetectorRef

  activeVisits: Visit[] = [];
  loading: boolean = true;
  errorMessage: string | null = null;
  currentUser: FirestoreUser | null = null;
  private authSubscription: Subscription | undefined;
  private visitsSubscription: Subscription | undefined;

  constructor() {}

  ngOnInit(): void {
    this.authSubscription = this.authService.authStateReady$.subscribe(
      async (ready) => {
        if (ready) {
          this.currentUser = await this.authService.getCurrentUser();
          if (this.currentUser && this.currentUser.displayName) {
            console.log(
              'GuestListComponent: User authenticated:',
              this.currentUser.displayName,
              this.currentUser.uid
            );
            console.log(
              'GuestListComponent: Querying for host:',
              this.currentUser.displayName
            );
            console.log(
              'GuestListComponent: Current User Display Name:',
              this.currentUser.displayName
            );
            this.listenForActiveVisits(this.currentUser.displayName);
          } else {
            this.loading = false;
            this.errorMessage =
              'No authenticated user found or display name is missing.';
            console.error(this.errorMessage);
            this.cdr.detectChanges();
          }
        }
      }
    );
  }

  listenForActiveVisits(hostDisplayName: string): void {
    this.loading = true;
    this.visitsSubscription = this.visitsService
      .listenForActiveVisits(hostDisplayName)
      .subscribe({
        next: (visits) => {
          console.log(
            'GuestListComponent: Raw Visits from Firestore (before client-side filtering):',
            visits
          );

          const now = new Date();
          // Reset time components for accurate date comparison
          const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );

          // Ensure filteredVisits is correctly declared here within the 'next' scope
          const filteredVisits = visits.filter((visit: Visit) => {
            // Explicitly type 'visit' here too
            const visitDateTime = new Date(
              `${visit.visitDate}T${visit.visitTime}`
            );
            // Reset time components for accurate date comparison
            const visitDay = new Date(
              visitDateTime.getFullYear(),
              visitDateTime.getMonth(),
              visitDateTime.getDate()
            );

            const isToday = visitDay.getTime() === today.getTime(); // Compare dates only
            const isActiveStatus = visit.status === 'acknowledged'; // Active now means 'acknowledged'

            return isToday && isActiveStatus; // Only show visits for today with an 'acknowledged' status
          });

          // Type 'a' and 'b' as Visit objects in the sort function
          this.activeVisits = filteredVisits.sort((a: Visit, b: Visit) => {
            const dateA = new Date(`${a.visitDate}T${a.visitTime}`);
            const dateB = new Date(`${b.visitDate}T${b.visitTime}`);
            return dateA.getTime() - dateB.getTime();
          });

          console.log(
            'GuestListComponent: Active visits loaded and sorted (after client-side filtering):',
            this.activeVisits
          );
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(
            'GuestListComponent: Error listening for active visits:',
            err
          );
          this.errorMessage = 'Failed to load active visits.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  /**
   * Helper method to return a user-friendly status string for display.
   */
  getDisplayStatus(visit: Visit): string {
    switch (visit.status) {
      case 'pending':
        return 'Pending Acknowledgment';
      case 'acknowledged':
        return 'Acknowledged';
      case 'checkedIn':
        return 'Checked In';
      case 'checkedOut':
        return 'Checked Out';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown Status';
    }
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.visitsSubscription) {
      this.visitsSubscription.unsubscribe();
    }
  }
}
