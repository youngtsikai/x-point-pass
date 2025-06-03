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
  selector: 'app-my-flags',
  imports: [CommonModule, RouterModule],
  templateUrl: './my-flags.component.html',
  styleUrl: './my-flags.component.css',
})
export class MyFlagsComponent {
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
    const user = await this.auth.currentUser;
    if (user && user.displayName) {
      const reportedByName = user.displayName;

      const flagsCollection = collection(this.firestore, 'Flags');

      const pendingFlagsQuery = query(
        flagsCollection,
        where('status', '==', 'pending'),
        where('reportedBy', '==', user.displayName),
        orderBy('timestamp', 'desc')
      );

      this.unsubscribeFromFlags = onSnapshot(
        pendingFlagsQuery,
        (snapshot) => {
          this.allFlags = snapshot.docs.map((doc) => {
            const data = doc.data() as any;

            if (data.timestamp && typeof data.timestamp.toDate === 'function') {
              data.formattedTimestamp = data.timestamp
                .toDate()
                .toLocaleString();
            }
            return {
              id: doc.id,
              ...data,
            };
          });
          console.log('Flags updated:', this.allFlags);
          this.cdr.detectChanges();
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
