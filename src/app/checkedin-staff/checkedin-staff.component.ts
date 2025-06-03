import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  query,
  getDocs,
  where,
  orderBy,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { SecurityHeaderComponent } from '../security-header/security-header.component';
import { SecuritySidebarComponent } from '../security-sidebar/security-sidebar.component';

interface CheckinRecord {
  id?: string;
  name: string;
  role: string;
  checkin_time: any | null;
  checkout_time: any | null;
  checkin_kiosk_id?: string | null;
  checkout_kiosk_id?: string | null;
  checkin_status?: boolean;
}

@Component({
  selector: 'app-checkedin-staff',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SecurityHeaderComponent,
    SecuritySidebarComponent,
  ],
  templateUrl: './checkedin-staff.component.html',
  styleUrl: './checkedin-staff.component.css',
})
export class CheckedinStaffComponent implements OnInit, OnDestroy {
  checkedInStaff: CheckinRecord[] = [];
  loading = true;
  error: string | null = null;

  private firestore: Firestore = inject(Firestore);
  private subscriptions: Subscription[] = []; // Good practice for cleaning up subscriptions (if using real-time)

  ngOnInit(): void {
    // Fetch data when the component initializes
    this.fetchCheckedInStaff();

    // Optional: Implement real-time updates if you want the list to update automatically
    // Use Firestore's onSnapshot here if needed, but manage the subscription
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  async fetchCheckedInStaff(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.checkedInStaff = []; // Clear the array before fetching

    try {
      const checkinsCollection = collection(this.firestore, 'checkins');

      // Step 1: Query Firestore for ALL records where checkin_status is NOT false.
      // This includes true, null, undefined, or missing checkin_status.
      // Firestore allows this query on its own: where('checkin_status', '!=', false)
      // BUT, we CANNOT add the role != 'visitor' filter here due to Firestore limitations.
      const q = query(
        checkinsCollection,
        where('checkin_status', '!=', false), // Fetch records where status is not explicitly false
        orderBy('checkin_time', 'desc') // Optional: Order by check-in time
      );

      const querySnapshot = await getDocs(q);
      console.log(
        'Firestore Query Results (Snapshot):',
        querySnapshot.docs.length,
        'documents found where status != false'
      );
      querySnapshot.docs.forEach((doc) =>
        console.log(' - Fetched Doc ID:', doc.id, 'Data:', doc.data())
      );
      const recordsNotFalseStatus: CheckinRecord[] = querySnapshot.docs.map(
        (doc) => {
          const data = doc.data() as CheckinRecord;

          return {
            id: doc.id,
            ...data,

            checkin_time: data.checkin_time
              ? (data.checkin_time as any).toDate()
              : null,
            checkout_time: data.checkout_time
              ? (data.checkout_time as any).toDate()
              : null,

            checkin_status: data.hasOwnProperty('checkin_status')
              ? data.checkin_status
              : undefined,
          };
        }
      );

      console.log(
        'After Mapping (recordsNotFalseStatus):',
        recordsNotFalseStatus.length,
        'records'
      );
      console.log('Records before client filter:', recordsNotFalseStatus);

      this.checkedInStaff = recordsNotFalseStatus.filter(
        (record) => record.role !== 'visitor'
      );

      this.loading = false;
      console.log(
        'After Client Filter (checkedInStaff):',
        this.checkedInStaff.length,
        'records'
      );
      console.log('Final records to display:', this.checkedInStaff);
    } catch (err: any) {
      console.error('Error fetching checked-in staff:', err);
      this.error = `Error fetching checked-in staff. Please check console for details.`;
      this.loading = false;
    }
  }

  async checkoutUser(recordId?: string): Promise<void> {
    if (!recordId) {
      console.error('Attempted to checkout a record with no ID.');
      this.error = 'Cannot checkout: Record ID is missing.';
      return;
    }
    this.error = null;

    const initialLength = this.checkedInStaff.length;
    this.checkedInStaff = this.checkedInStaff.filter(
      (record) => record.id !== recordId
    );
    const removedOptimistically = this.checkedInStaff.length < initialLength;

    try {
      const checkinDocRef = doc(this.firestore, 'checkins', recordId);
      await updateDoc(checkinDocRef, {
        checkout_time: new Date(),
        checkout_kiosk_id: 'ADMIN_PANEL_STAFF_LIST',
        checkin_status: false,
      });

      console.log(`Successfully checked out record ${recordId}`);
    } catch (err: any) {
      console.error(`Error checking out user ${recordId}:`, err);
      this.error = `Error checking out user: ${err.message}`;
      if (removedOptimistically) {
        this.fetchCheckedInStaff();
      }
    }
  }

  printCheckedInList(): void {
    window.print();
  }
}
