import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, Observable } from 'rxjs';

// Import Firestore modules for direct database interaction
import {
  Firestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from '@angular/fire/firestore';

import { AuthService } from '../auth.service';
import { SecuritySidebarComponent } from '../security-sidebar/security-sidebar.component';
import { SecurityHeaderComponent } from '../security-header/security-header.component';

// Define the Visit interface directly in this component
export interface Visit {
  id?: string;
  name: string;
  phone: string;
  idnum: string;
  licenseplate?: string;
  purpose: string;
  host: string;
  visitDate: string; // e.g., 'YYYY-MM-DD'
  visitTime: string; // e.g., 'HH:MM'
  status: 'pending' | 'acknowledged' | 'checkedIn' | 'checkedOut' | 'cancelled';
  // Add any other fields that your 'visitors-preregistrations' documents contain
}

@Component({
  selector: 'app-security-guest-list',
  standalone: true,
  imports: [CommonModule, SecuritySidebarComponent, SecurityHeaderComponent],
  templateUrl: './security-guest-list.component.html', // Uses the HTML from previous response
  styleUrl: './security-guest-list.component.css', // Uses your existing CSS
})
export class SecurityGuestListComponent implements OnInit, OnDestroy {
  private firestore = inject(Firestore);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  visits: Visit[] = [];
  loading: boolean = true;
  errorMessage: string | null = null;

  private authSubscription: Subscription | undefined;
  private visitsSubscription: Subscription | undefined;

  constructor() {}

  ngOnInit(): void {
    this.authSubscription = this.authService.authStateReady$.subscribe(
      (ready) => {
        if (ready) {
          this.fetchAcknowledgedVisits();
        } else {
          this.loading = false;
          this.errorMessage =
            'Authentication state not ready. Please ensure you are logged in.';
          console.error(this.errorMessage);
          this.cdr.detectChanges();
        }
      }
    );
  }

  /**
   * Fetches all records from 'visitors-preregistrations' where status is 'acknowledged'
   * AND the visit date is today's date.
   * This method directly interacts with Firestore and sets up a real-time listener.
   */
  fetchAcknowledgedVisits(): void {
    this.loading = true;
    this.errorMessage = null;

    const collectionRef = collection(
      this.firestore,
      'visitor-preregistrations'
    );

    // Get today's date in 'YYYY-MM-DD' format for the query
    const now = new Date();
    const todayString = now.toISOString().slice(0, 10);

    // Construct the Firestore query:
    // 1. Filter by 'status' equal to 'acknowledged'
    // 2. Filter by 'visitDate' equal to today's date
    // 3. Order the results by 'visitTime' for consistent display
    const q = query(
      collectionRef,
      where('status', '==', 'acknowledged'),
      where('visitDate', '==', todayString), // <<< ADDED THIS LINE BACK
      orderBy('visitTime', 'asc') // Changed to orderBy('visitTime') as date is already filtered
    );

    // Subscribe to real-time updates from Firestore using onSnapshot.
    this.visitsSubscription = new Observable<Visit[]>((observer) => {
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedVisits = snapshot.docs.map((doc) => {
            return {
              id: doc.id,
              ...(doc.data() as Visit),
            };
          });
          observer.next(fetchedVisits);
        },
        (error) => {
          observer.error(error);
        }
      );
      return () => unsubscribe();
    }).subscribe({
      next: (fetchedVisits) => {
        console.log('Fetched acknowledged visits for today:', fetchedVisits);
        this.visits = fetchedVisits;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching acknowledged visits:', err);
        this.errorMessage = 'Failed to load acknowledged visits.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
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
