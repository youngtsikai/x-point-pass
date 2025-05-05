import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import {
  Firestore,
  collection,
  query,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  where,
} from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

interface CheckinRecord {
  id?: string;
  name: string;
  role: string;
  checkin_time: any | null;
  checkout_time: Date | null;
  checkin_kiosk_id?: string | null;
  checkout_kiosk_id?: string | null;
}

@Component({
  selector: 'app-checkin-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkin-logs.component.html',
  styleUrl: './checkin-logs.component.css',
})
export class CheckinLogsComponent implements OnInit, OnDestroy {
  allCheckinLogs: CheckinRecord[] = [];
  filteredCheckinLogs: CheckinRecord[] = [];
  loading = true;
  error: string | null = null;
  private firestore: Firestore = inject(Firestore);
  private subscriptions: Subscription[] = [];
  selectedDate: string = ''; // For single date filtering

  ngOnInit(): void {
    this.fetchCheckinLogsForToday(); // Load today's logs by default
  }

  async fetchCheckinLogs(startDate?: Date, endDate?: Date): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const checkinsCollection = collection(this.firestore, 'checkin_records');
      let q = query(checkinsCollection, orderBy('checkin_time', 'desc')); // Default sort by check-in time

      if (startDate && endDate) {
        q = query(
          checkinsCollection,
          where('checkin_time', '>=', startDate),
          where('checkin_time', '<=', endDate),
          orderBy('checkin_time', 'desc')
        );
      } else if (startDate) {
        const endOfDay = new Date(startDate);
        endOfDay.setHours(23, 59, 59, 999);
        q = query(
          checkinsCollection,
          where('checkin_time', '>=', startDate),
          where('checkin_time', '<=', endOfDay),
          orderBy('checkin_time', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      this.allCheckinLogs = querySnapshot.docs.map((doc) => {
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
        };
      });
      this.filteredCheckinLogs = [...this.allCheckinLogs]; // Initially show all fetched logs
      this.loading = false;
    } catch (err: any) {
      this.error = `Error fetching check-in logs: ${err.message}`;
      this.loading = false;
    }
  }

  fetchCheckinLogsForToday(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.fetchCheckinLogs(today, tomorrow);
  }

  filterLogsByDate(): void {
    if (this.selectedDate) {
      const selectedDateObj = new Date(this.selectedDate);
      selectedDateObj.setHours(0, 0, 0, 0);
      const nextDay = new Date(selectedDateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      this.fetchCheckinLogs(selectedDateObj, nextDay);
    } else {
      this.filteredCheckinLogs = [...this.allCheckinLogs]; // Show all if no date selected
    }
  }

  showLastWeekLogs(): void {
    const today = new Date();
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);
    this.fetchCheckinLogs(lastWeekStart, nextDay);
  }

  showLastMonthLogs(): void {
    const today = new Date();
    const lastMonthStart = new Date(today);
    lastMonthStart.setDate(1);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setHours(0, 0, 0, 0);
    const nextMonthStart = new Date(today);
    nextMonthStart.setDate(1);
    nextMonthStart.setHours(0, 0, 0, 0);
    this.fetchCheckinLogs(lastMonthStart, nextMonthStart);
  }

  async checkoutUser(recordId: string): Promise<void> {
    this.error = null;
    try {
      const checkinDocRef = doc(this.firestore, 'checkin_records', recordId);
      await updateDoc(checkinDocRef, {
        checkout_time: new Date(),
        checkout_kiosk_id: 'ADMIN_PANEL_CLIENT', // Identify client-side checkout
      });

      // Update the local list immediately
      this.allCheckinLogs = this.allCheckinLogs.map((log) =>
        log.id === recordId ? { ...log, checkout_time: new Date() } : log
      );
      this.filteredCheckinLogs = this.filteredCheckinLogs.map((log) =>
        log.id === recordId ? { ...log, checkout_time: new Date() } : log
      );
    } catch (err: any) {
      this.error = `Error updating checkout time: ${err.message}`;
    }
  }

  printAllLogs(): void {
    window.print();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
