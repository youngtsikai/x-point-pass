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
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

  constructor(private firestore: Firestore) {
    console.log('SecurityDashboardComponent initialized');
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
