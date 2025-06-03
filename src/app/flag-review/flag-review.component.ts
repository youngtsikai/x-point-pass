import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // Import ChangeDetectorRef
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  Firestore,
  collection,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  orderBy, // Import orderBy for sorting by time
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-flag-review',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './flag-review.component.html',
  styleUrl: './flag-review.component.css',
})
export class FlagReviewComponent implements OnInit, OnDestroy {
  allFlags: any[] = [];
  private unsubscribeFromFlags: Unsubscribe | undefined;

  // Inject ChangeDetectorRef
  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.setupFlagsListener();
  }

  ngOnDestroy(): void {
    if (this.unsubscribeFromFlags) {
      this.unsubscribeFromFlags();
    }
  }

  async setupFlagsListener() {
    const user = await this.auth.currentUser; // Await currentUser to ensure it's loaded
    if (user && user.displayName) {
      const reportedByName = user.displayName;

      const flagsCollection = collection(this.firestore, 'Flags');

      // Query to get all flags reported by the user AND with status 'pending'
      // Order by 'timestamp' (assuming you have a timestamp field)
      const pendingFlagsQuery = query(
        flagsCollection,
        where('status', '==', 'pending'),
        orderBy('timestamp', 'desc') // Order by timestamp, descending
      );

      this.unsubscribeFromFlags = onSnapshot(
        pendingFlagsQuery,
        (snapshot) => {
          this.allFlags = snapshot.docs.map((doc) => {
            const data = doc.data() as any;
            // Format timestamp if it exists and is a Firestore Timestamp
            if (data.timestamp && typeof data.timestamp.toDate === 'function') {
              data.formattedTimestamp = data.timestamp
                .toDate()
                .toLocaleString(); // Or use a more specific format
            }
            return {
              id: doc.id,
              ...data,
            };
          });
          console.log('Flags updated:', this.allFlags);
          this.cdr.detectChanges(); // Manually trigger change detection here
        },
        (error) => {
          console.error('Error listening to flags:', error);
        }
      );
    } else {
      console.warn(
        'User not logged in or display name not available. Cannot fetch flags.'
      );
    }
  }

  getThreatClass(threat: string): string {
    switch (threat) {
      case 'High':
        return 'high-threat-bg';
      case 'Medium':
        return 'medium-threat-bg';
      case 'Low':
        return 'low-threat-bg';
      default:
        return '';
    }
  }
}
