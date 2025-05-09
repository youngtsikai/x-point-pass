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
import { AuthService } from '../auth.service';

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
  RaisedFlagsCount: number = 0;
  ActiveVisitsCount: number = 0;
  fire: Firestore = inject(Firestore);
  authserv = inject(AuthService);

  constructor() {
    console.log('AdminDashboardComponent initialized');
    this.getCurrentUser();
  }

  getCurrentUser() {
    const currentUser = this.authserv.user();
    if (currentUser) {
      console.log('User UID:', currentUser.uid);
      console.log('User Display Name:', currentUser.displayName);
    } else {
      console.log('No user is signed in!!!');
    }
  }

  async ngOnInit() {
    console.log('ngOnInit called');
    await this.fetchStaffCheckedInCount();
    await this.fetchRaisedFlagsCount();
    await this.fetchActiveVisitsCount();
  }

  async fetchStaffCheckedInCount() {
    console.log('fetchStaffCheckedInCount started');
    const checkinCollection = collection(this.fire, 'checkin_records');

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

  async fetchRaisedFlagsCount() {
    console.log('RaisedFlagsCount started');
    const flagsCollection = collection(this.fire, 'Flags');

    const f = query(flagsCollection, where('status', '==', 'pending'));

    try {
      console.log('Executing Firestore query for pending raised flags...');
      const querySnapshot = await getDocs(f);
      this.RaisedFlagsCount = querySnapshot.size;
      console.log(
        'Pending raised flags query successful. Count:',
        this.RaisedFlagsCount
      );
    } catch (error) {
      console.error('Error fetching pending raised flags count:', error);
      this.RaisedFlagsCount = 0;
      console.log('Pending  raised flags count set to 0 due to error');
    }
    console.log('fetchRaisedFlagsCount finished');
  }

  async fetchActiveVisitsCount() {
    console.log('fetchActiveVisitsCount started');
    const visitsCollection = collection(this.fire, 'visitor-preregistration');
    const currentUser = this.authserv.user();

    if (!currentUser || !currentUser.displayName) {
      console.log(
        'No signed-in user or displayName available to fetch active visits.'
      );
      this.ActiveVisitsCount = 0;
      console.log('fetchActiveVisitsCount finished (no user/displayName)');
      return;
    }

    const v = query(
      visitsCollection,
      where('host', '==', currentUser.displayName)
    );

    try {
      console.log('Executing query for Active visits count...');

      const querySnapshot = await getDocs(v);
      this.ActiveVisitsCount = querySnapshot.size;
      console.log(
        'Active visits count query successful. Count:',
        this.ActiveVisitsCount
      );
    } catch (error) {
      console.error('Error fetching active visits count:', error);
      this.ActiveVisitsCount = 0;
      console.log('Active visits count set to 0 due to error');
    }
    console.log('fetchActiveVisitsCount finished');
  }
}
