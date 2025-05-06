import { Component, OnInit } from '@angular/core';
import { SecurityHeaderComponent } from '../security-header/security-header.component';
import { SecuritySidebarComponent } from '../security-sidebar/security-sidebar.component';
import { RouterModule } from '@angular/router';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { Timestamp } from '@firebase/firestore'; // Import Timestamp

interface CheckinRecord {
  checkin_time: any;
  checkout_time: any;
  name: string;
  role: string;
  checkin_status?: boolean;
}

@Component({
  selector: 'app-security-dashboard',
  imports: [SecurityHeaderComponent, SecuritySidebarComponent, RouterModule],
  templateUrl: './security-dashboard.component.html',
  styleUrl: './security-dashboard.component.css',
})
export class SecurityDashboardComponent implements OnInit {
  staffCheckedInCount: number = 0;
  checkInsTodayCount: number = 0;
  checkOutsTodayCount: number = 0; // New property for today's check-outs
  private firestore: Firestore;

  constructor(firestore: Firestore) {
    this.firestore = firestore;
    console.log('SecurityDashboardComponent initialized');
  }

  async ngOnInit() {
    console.log('ngOnInit called');
    await this.fetchStaffCheckedInCount();
    await this.fetchCheckInsTodayCount();
    await this.fetchCheckOutsTodayCount(); // Call the new function
  }

  async fetchStaffCheckedInCount() {
    console.log('fetchStaffCheckedInCount started');
    const checkinCollection = collection(this.firestore, 'checkin_records');

    const q = query(
      checkinCollection,
      where('role', '!=', 'visitor'),
      where('checkin_status', '==', true)
    );

    try {
      const querySnapshot = await getDocs(q);
      this.staffCheckedInCount = querySnapshot.size;
      console.log(
        'Checked-in staff query successful. Count:',
        this.staffCheckedInCount
      );
    } catch (error) {
      console.error('Error fetching checked-in staff count:', error);
      this.staffCheckedInCount = 0;
      console.log('Checked-in staff count set to 0 due to error.');
    }
    console.log('fetchStaffCheckedInCount finished');
  }

  async fetchCheckInsTodayCount() {
    console.log('fetchCheckInsTodayCount started');
    const checkinCollection = collection(this.firestore, 'checkin_records');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const q = query(
      checkinCollection,
      where('checkin_time', '>=', todayStart),
      where('checkin_time', '<=', todayEnd)
    );

    try {
      const querySnapshot = await getDocs(q);
      this.checkInsTodayCount = querySnapshot.size;
      console.log('Check-ins today count:', this.checkInsTodayCount);
    } catch (error) {
      console.error('Error fetching check-ins today count:', error);
      this.checkInsTodayCount = 0;
      console.log('Check-ins today count set to 0 due to error.');
    }
    console.log('fetchCheckInsTodayCount finished');
  }

  async fetchCheckOutsTodayCount() {
    console.log('fetchCheckOutsTodayCount started');
    const checkinCollection = collection(this.firestore, 'checkin_records');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const q = query(
      checkinCollection,
      where('checkout_time', '>=', todayStart),
      where('checkout_time', '<=', todayEnd)
    );

    try {
      const querySnapshot = await getDocs(q);
      this.checkOutsTodayCount = querySnapshot.size;
      console.log('Check-outs today count:', this.checkOutsTodayCount);
    } catch (error) {
      console.error('Error fetching check-outs today count:', error);
      this.checkOutsTodayCount = 0;
      console.log('Check-outs today count set to 0 due to error.');
    }
    console.log('fetchCheckOutsTodayCount finished');
  }
}
