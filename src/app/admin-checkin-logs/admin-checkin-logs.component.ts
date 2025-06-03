import { Component, inject, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  doc,
  writeBatch,
  FirestoreError,
  onSnapshot,
} from '@angular/fire/firestore';

// Define the CheckinRecord interface
interface CheckinRecord {
  id: string;
  name: string;
  role: string;
  checkin_time: Timestamp | null;
  checkout_time: Timestamp | null;
  checkin_kiosk_id?: string | null;
  checkout_kiosk_id?: string | null;
  checkin_status?: boolean;
  uid?: string;
  host?: string;
}

//FirestoreUser interface (used for fetching admins)
interface FirestoreUser {
  uid: string;
  role: string;
  displayName?: string;
  email?: string;
}

@Component({
  selector: 'app-admin-checkin-logs',
  standalone: true,
  imports: [
    AdminSidebarComponent,
    AdminHeaderComponent,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './admin-checkin-logs.component.html',
  styleUrl: './admin-checkin-logs.component.css',
})
export class AdminCheckinLogsComponent implements OnInit, OnDestroy {
  filteredCheckinLogs: CheckinRecord[] = [];
  loading = true;
  error: string | null = null;
  private firestore: Firestore = inject(Firestore);
  private ngZone: NgZone = inject(NgZone);
  private checkinLogsSubscription: Subscription | undefined;
  selectedDate: string = '';

  ngOnInit(): void {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
    this.fetchCheckinLogsForToday();
  }

  fetchCheckinLogs(startDate?: Date, endDate?: Date): void {
    this.loading = true;
    this.error = null;

    if (this.checkinLogsSubscription) {
      this.checkinLogsSubscription.unsubscribe();
    }

    const checkinsCollection = collection(this.firestore, 'checkins');
    let q = query(checkinsCollection, orderBy('checkin_time', 'desc'));

    if (startDate && endDate) {
      const startTimestamp = Timestamp.fromDate(startDate);
      const endTimestamp = Timestamp.fromDate(endDate);

      q = query(
        checkinsCollection,
        where('checkin_time', '>=', startTimestamp),
        where('checkin_time', '<=', endTimestamp),
        orderBy('checkin_time', 'desc')
      );
    } else if (startDate) {
      const startTimestamp = Timestamp.fromDate(startDate);
      const endOfDay = new Date(startDate);
      endOfDay.setHours(23, 59, 59, 999);
      const endOfDayTimestamp = Timestamp.fromDate(endOfDay);

      q = query(
        checkinsCollection,
        where('checkin_time', '>=', startTimestamp),
        where('checkin_time', '<=', endOfDayTimestamp),
        orderBy('checkin_time', 'desc')
      );
    }

    this.checkinLogsSubscription = new Subscription(
      onSnapshot(
        q,
        (querySnapshot) => {
          this.ngZone.run(() => {
            this.filteredCheckinLogs = querySnapshot.docs.map((doc) => {
              const data = doc.data() as any;
              return {
                id: doc.id,
                name: data['name'],
                role: data['role'],
                checkin_time:
                  data['checkin_time'] instanceof Timestamp
                    ? data['checkin_time']
                    : null,
                checkout_time:
                  data['checkout_time'] instanceof Timestamp
                    ? data['checkout_time']
                    : null,
                checkin_kiosk_id: data['checkin_kiosk_id'] ?? null,
                checkout_kiosk_id: data['checkout_kiosk_id'] ?? null,
                checkin_status: data['checkin_status'] ?? true,
                uid: data['uid'] ?? undefined,
                host: data['host'] ?? undefined,
              };
            });
            this.loading = false;
            console.log(
              'Real-time check-in logs updated:',
              this.filteredCheckinLogs
            );
          });
        },
        (err: FirestoreError) => {
          this.ngZone.run(() => {
            this.error = `Error fetching real-time check-in logs: ${err.message}`;
            console.error('Error fetching real-time check-in logs:', err);
            this.loading = false;
          });
        }
      )
    );
  }

  fetchCheckinLogsForToday(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    this.fetchCheckinLogs(today, endOfToday);
  }

  filterLogsByDate(): void {
    if (this.selectedDate) {
      const selectedDateObj = new Date(this.selectedDate);
      selectedDateObj.setHours(0, 0, 0, 0);

      const endOfSelectedDay = new Date(selectedDateObj);
      endOfSelectedDay.setHours(23, 59, 59, 999);

      this.fetchCheckinLogs(selectedDateObj, endOfSelectedDay);
    } else {
      console.log("Date filter cleared. Refetching today's logs.");
      this.fetchCheckinLogsForToday();
    }
  }

  showLastWeekLogs(): void {
    const today = new Date();
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 6);
    lastWeekStart.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    this.fetchCheckinLogs(lastWeekStart, endOfToday);
  }

  showLastMonthLogs(): void {
    const today = new Date();
    const lastMonthStart = new Date(today);
    lastMonthStart.setMonth(today.getMonth() - 1);
    lastMonthStart.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    this.fetchCheckinLogs(lastMonthStart, endOfToday);
  }

  async checkoutUser(recordId: string): Promise<void> {
    this.error = null;
    console.log('Attempting to check out record ID:', recordId);

    const checkedOutRecord = this.filteredCheckinLogs.find(
      (log) => log.id === recordId
    );

    if (!checkedOutRecord) {
      console.error(
        'Checkout failed: Could not find local record with ID:',
        recordId
      );
      this.error = 'Error: Record not found locally.';
      return;
    }

    if (
      checkedOutRecord.checkin_status === false ||
      checkedOutRecord.checkout_time !== null
    ) {
      console.warn(
        'Attempted to check out an already checked out record:',
        recordId
      );
      this.error = 'User is already checked out.';
      return;
    }

    const checkinDocRef = doc(this.firestore, 'checkins', recordId);

    try {
      const batch = writeBatch(this.firestore);

      const nowForCheckout = new Date();
      batch.update(checkinDocRef, {
        checkout_time: Timestamp.fromDate(nowForCheckout),
        checkout_kiosk_id: 'ADMIN_PANEL_CLIENT',
        checkin_status: false,
      });
      console.log(`Batch added update for record ${recordId} in checkins.`);

      const checkoutAlertsCollection = collection(
        this.firestore,
        'checkoutalerts'
      );
      const newCheckoutAlertRef = doc(checkoutAlertsCollection);

      const hours = nowForCheckout.getHours().toString().padStart(2, '0');
      const minutes = nowForCheckout.getMinutes().toString().padStart(2, '0');
      const checkoutTimeFormatted = `${hours}:${minutes}`;

      const checkoutAlertData = {
        name: checkedOutRecord.name,
        role: checkedOutRecord.role,
        uid: checkedOutRecord.uid ?? null,
        checkinRecordId: recordId,
        checkout_time: Timestamp.fromDate(nowForCheckout),
        time: checkoutTimeFormatted,
        read: false,
        host: checkedOutRecord.host ?? null,
      };
      batch.set(newCheckoutAlertRef, checkoutAlertData);
      console.log(
        `Batch added set for new checkout alert ${newCheckoutAlertRef.id} in checkoutalerts.`
      );

      const adminRecipients: { uid: string; role: string }[] = [];
      const usersCollection = collection(this.firestore, 'users');

      const adminUsersQuery = query(
        usersCollection,
        where('role', '==', 'admin')
      );
      const adminUsersSnapshot = await getDocs(adminUsersQuery);
      adminUsersSnapshot.docs.forEach((userDoc) => {
        const userData = userDoc.data() as FirestoreUser;
        adminRecipients.push({ uid: userData.uid, role: userData.role });
      });
      console.log(
        `Identified ${adminRecipients.length} admin recipients for checkout alert.`
      );

      const userAlertStatusCollection = collection(
        this.firestore,
        'userAlertStatus'
      );
      adminRecipients.forEach((recipient) => {
        const userStatusRef = doc(userAlertStatusCollection);
        batch.set(userStatusRef, {
          uid: recipient.uid,
          alertId: newCheckoutAlertRef.id,
          isRead: false,
          sentTimestamp: Timestamp.fromDate(nowForCheckout),
          alertCollection: 'checkoutalerts',
        });
      });
      console.log(
        `Batch added set operations for ${adminRecipients.length} admin user status records.`
      );

      await batch.commit();
      console.log(
        `Batch write committed: Checkout Update, Alert ${newCheckoutAlertRef.id} in checkoutalerts, and ${adminRecipients.length} admin user status records created.`
      );
    } catch (err: any) {
      this.error = `Error processing checkout: ${err.message}`;
      console.error('Error during checkout process:', err);
      if (err instanceof FirestoreError) {
        console.error(`Firestore Error Code: ${err.code}`);
        if (err.code === 'permission-denied') {
          this.error =
            'Permission denied to perform checkout. Check Firestore Security Rules.';
        } else if (err.code === 'unavailable') {
          this.error = 'Cannot connect to database. Check network connection.';
        }
      }
    }
  }

  printAllLogs(): void {
    window.print();
  }

  ngOnDestroy(): void {
    if (this.checkinLogsSubscription) {
      this.checkinLogsSubscription.unsubscribe();
    }
  }
}
