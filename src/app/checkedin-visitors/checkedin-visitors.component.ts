import { Component, inject, OnInit } from '@angular/core';
import { SecurityHeaderComponent } from '../security-header/security-header.component';
import { SecuritySidebarComponent } from '../security-sidebar/security-sidebar.component';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import {
  Firestore,
  collection,
  getDocs,
  doc,
  query,
  where,
  orderBy,
  updateDoc,
} from '@angular/fire/firestore';

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
  selector: 'app-checkedin-visitors',
  imports: [SecurityHeaderComponent, SecuritySidebarComponent, CommonModule],
  templateUrl: './checkedin-visitors.component.html',
  styleUrl: './checkedin-visitors.component.css',
})
export class CheckedinVisitorsComponent implements OnInit {
  checkedInVisitors: CheckinRecord[] = [];
  loading = true;
  error: string | null = null;

  private firestore: Firestore = inject(Firestore);
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.fetchCheckedInVisitors();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  async fetchCheckedInVisitors(): Promise<void> {
    this.loading = true;
    this.error = null;
    this.checkedInVisitors = [];

    try {
      const checkinsCollection = collection(this.firestore, 'checkins');

      const q = query(
        checkinsCollection,
        where('checkin_status', '!=', false),
        orderBy('checkin_time', 'desc')
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
      this.checkedInVisitors = recordsNotFalseStatus.filter(
        (record) => record.role == 'visitor'
      );

      this.loading = false;

      console.log(
        'After Client Filter (checkedInVisitors):',
        this.checkedInVisitors.length,
        'records'
      );
      console.log('Final records to display:', this.checkedInVisitors);
    } catch (err: any) {
      console.error('Error fetching checked-in Visitors:', err);
      this.error = `Error fetching checked-in Visitors.`;
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
    const initialLength = this.checkedInVisitors.length;
    this.checkedInVisitors = this.checkedInVisitors.filter(
      (record) => record.id !== recordId
    );
    const removedOptimistically = this.checkedInVisitors.length < initialLength;

    try {
      const checkinDocRef = doc(this.firestore, 'checkins', recordId);
      await updateDoc(checkinDocRef, {
        checkout_time: new Date(),
        checkout_kiosk_id: 'ADMIN_PANEL_Visitors_LIST',
        checkin_status: false,
      });

      console.log(`Successfully checked out record ${recordId}`);
    } catch (err: any) {
      console.error(`Error checking out user ${recordId}:`, err);
      this.error = `Error checking out user: ${err.message}`;
      if (removedOptimistically) {
        this.fetchCheckedInVisitors();
      }
    }
  }

  printCheckedInList(): void {
    window.print();
  }
}
