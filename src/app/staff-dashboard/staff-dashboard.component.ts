import { Component, inject, OnInit, effect, OnDestroy } from '@angular/core';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { StaffSidebarComponent } from '../staff-sidebar/staff-sidebar.component';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../dashboard.service';
import {
  Firestore,
  getDocs,
  collection,
  query,
  where,
  Timestamp,
  orderBy,
  or,
  updateDoc,
  doc,
  limit, // Import limit
  getDoc, // Import getDoc
  FirestoreError, // Import FirestoreError
} from '@angular/fire/firestore';

// Updated Interface for unread alerts fetched for the staff user
// Aligning with the ActivityAlert structure used in the Security Dashboard for consistency
interface ActivityAlert {
  id?: string; // Document ID of the original alert
  statusId?: string; // Document ID in userAlertStatus (for this user's status for this alert)
  timestamp: Timestamp; // Original alert timestamp for sorting
  time?: string; // HH:mm format (derived from timestamp)
  read: boolean; // Read status for the *current user* (from userAlertStatus)

  // Fields from 'alerts' collection (sent alerts)
  alertType?: string; // e.g., 'Emergency', 'Notice', 'Targeted'
  subject?: string; // Subject field from sent alerts
  message: string; // The full message string
  sender?: string; // Sender's display name (mapped from senderName)
  senderId?: string; // Sender's UID
  senderName?: string; // Sender's name (actual field name)
  senderRole?: string; // Sender's role (assuming stored in alert or user doc)
  code?: string; // e.g., 'medical', 'hazard' (mapped from alertType)

  // Type to distinguish the source (though on staff dash alerts are only 'sent-alert')
  type: 'sent-alert'; // Explicitly set type for clarity
}

// Define a simple interface for the user object from AuthService
// Ensure this matches the structure provided by your AuthService, especially if it includes 'role'
interface AppUser {
  uid: string;
  displayName: string | null;
  role?: string; // Make role optional if it's not guaranteed or fetched separately
  email: string;
  phoneNumber?: string;
  // ... other user properties
}

@Component({
  selector: 'app-staff-dashboard',
  standalone: true, // Assuming standalone is true
  imports: [
    CommonModule,
    StaffHeaderComponent,
    StaffSidebarComponent,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './staff-dashboard.component.html',
  styleUrl: './staff-dashboard.component.css', // Use styleUrl for single file
})
export class StaffDashboardComponent implements OnInit, OnDestroy {
  authserv = inject(AuthService);
  fire = inject(Firestore);

  ActiveVisitsCount: number = 0;
  PendingVACount: number = 0;
  RaisedFlagsCount: number = 0;
  UnreadAlertsCount: number = 0; // Property for the count

  weeklyActivity: { date: string; activity: string; timestamp: Timestamp }[] =
    [];
  // This array will now hold unread alerts specific to the logged-in staff user
  myUnreadAlerts: ActivityAlert[] = [];

  // Effect to fetch data when the authenticated user changes
  private userDependentDataEffect = effect(() => {
    console.log('User signal changed, triggering user-dependent fetches...');
    const currentUser = this.authserv.user() as AppUser | null;

    const currentUserName = currentUser?.displayName;
    const currentUserUID = currentUser?.uid;

    if (currentUserName && currentUserUID) {
      console.log(
        'User is signed in with displayName and UID, fetching user-dependent data.'
      );

      // Fetch weekly activity for this user
      this.fetchWeeklyActivity(currentUserName);
    } else {
      console.log(
        'No signed-in user, displayName, or UID. Resetting user-dependent counts/data'
      );
      this.weeklyActivity = [];
    }
  });

  // Private property to hold the effect cleanup function if needed later
  // private userEffectCleanup: (() => void) | undefined;

  constructor(public dashboardService: DashboardService) {
    console.log('StaffDashboardComponent initialized');
  }

  ngOnInit() {
    console.log('ngOnit called');
    this.dashboardService.ngOnInit();
  }

  ngOnDestroy(): void {
    // If using effect() which returns a cleanup function, call it here
    // if (this.userEffectCleanup) {
    //     this.userEffectCleanup();
    // }
    // Clean up any manual subscriptions if you add them later (e.g., from RxJS observables not managed by signals)
    console.log('StaffDashboardComponent destroyed.');
  }

  getUserRole(user: any): string | undefined {
    // Check if user exists, is an object, and has a 'role' property
    if (user && typeof user === 'object' && 'role' in user) {
      // Return the role property, casting to string for type safety in TypeScript
      return user.role as string;
    }
    // If you need the role from the ActivityAlert sender, access alert.senderRole directly
    if (user && typeof user === 'object' && 'senderRole' in user) {
      return user.senderRole as string;
    }
    return undefined; // Return undefined if user or role is not available
  }

  private getDateRangeForWeek(): { start: Date; end: Date } {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    return { start, end };
  }

  // Fetch weekly check-ins and check-outs for the signed-in user (by name)
  async fetchWeeklyActivity(userName: string): Promise<void> {
    console.log('fetchWeeklyActivity started for user:', userName);
    const checkinCollection = collection(this.fire, 'checkins');
    const { start, end } = this.getDateRangeForWeek();

    try {
      const checkinQuery = query(
        checkinCollection,
        where('name', '==', userName),
        where('checkin_time', '>=', start),
        where('checkin_time', '<=', end),
        orderBy('checkin_time', 'asc')
      );
      const checkinSnapshot = await getDocs(checkinQuery);

      const checkoutQuery = query(
        checkinCollection,
        where('name', '==', userName),
        where('checkout_time', '>=', start),
        where('checkout_time', '<=', end),
        orderBy('checkout_time', 'asc')
      );
      const checkoutSnapshot = await getDocs(checkoutQuery);

      const activity: {
        date: string;
        activity: string;
        timestamp: Timestamp;
      }[] = [];
      const dateFormatter = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
      });

      checkinSnapshot.docs.forEach((doc) => {
        const data = doc.data() as any;
        if (data.checkin_time instanceof Timestamp) {
          const date = data.checkin_time.toDate();
          const formattedDate = dateFormatter.format(date);
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          activity.push({
            date: formattedDate,
            activity: `checked in at ${hours}:${minutes}`,
            timestamp: data.checkin_time,
          });
        }
      });

      checkoutSnapshot.docs.forEach((doc) => {
        const data = doc.data() as any;
        if (data.checkout_time instanceof Timestamp) {
          const date = data.checkout_time.toDate();
          const formattedDate = dateFormatter.format(date);
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          activity.push({
            date: formattedDate,
            activity: `checked out at ${hours}:${minutes}`,
            timestamp: data.checkout_time,
          });
        }
      });

      this.weeklyActivity = activity.sort(
        (a, b) =>
          a.timestamp.toDate().getTime() - b.timestamp.toDate().getTime()
      );

      console.log(
        'Weekly activity fetched and processed:',
        this.weeklyActivity
      );
    } catch (error) {
      console.error('Error fetching weekly activity:', error);
      this.weeklyActivity = [];
      console.log('Weekly activity set to empty due to error');
    }
    console.log('fetchWeeklyActivity finished');
  }

  // Helper to get today's date range (reuse from dashboard if possible)
  private getDateRangeForToday(): { start: Date; end: Date } {
    const date = new Date();
    date.setHours(0, 0, 0, 0); // Set to the beginning of today
    const start = new Date(date);
    date.setHours(23, 59, 59, 999); // Set to the end of today
    const end = new Date(date);
    return { start, end };
  }
}
