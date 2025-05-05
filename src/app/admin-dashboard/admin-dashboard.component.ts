import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';

interface CheckinRecord {
  checkin_time: any;
  checkout_time: any;
  name: string;
  role: string;
  checkin_status?: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    RouterModule,
    CommonModule,
    AdminHeaderComponent,
    AdminSidebarComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  staffCheckedInCount: number = 0;
  private firestore: Firestore = inject(Firestore);

  constructor() {
    console.log('AdminDashboardComponent initialized');
  }

  async ngOnInit() {
    console.log('ngOnInit called');
    await this.fetchStaffCheckedInCount();
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
      console.log('Executing Firestore query for checked-in staff...');
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
}
