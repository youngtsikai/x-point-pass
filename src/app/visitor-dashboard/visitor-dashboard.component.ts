import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { VisitorHeaderComponent } from '../visitor-header/visitor-header.component';
import { VisitorSidebarComponent } from '../visitor-sidebar/visitor-sidebar.component';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

interface Visit {
  id: string;
  name: string;
  phone: string;
  idnum: string;
  licenseplate: string;
  purpose: string;
  host: string;
  visitDate: string;
  visitTime: string;
  status: string;
  visitorUid: string;
}

@Component({
  selector: 'app-visitor-dashboard',
  imports: [RouterModule, VisitorHeaderComponent, VisitorSidebarComponent],
  templateUrl: './visitor-dashboard.component.html',
  styleUrl: './visitor-dashboard.component.css',
})
export class VisitorDashboardComponent implements OnInit {
  activeVisitCount: number = 0;
  db: Firestore = inject(Firestore);
  auth: Auth = inject(Auth);
  userName: string | null = null;

  ngOnInit(): void {
    this.loadActiveVisitCount();
    this.loadUserName();
  }

  async loadActiveVisitCount(): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      const visitsQuery = query(
        collection(this.db, 'visitor-preregistrations'),
        where('visitorUid', '==', user.uid),
        where('status', '==', 'active')
      );
      try {
        const querySnapshot = await getDocs(visitsQuery);
        this.activeVisitCount = querySnapshot.size;
      } catch (error) {
        console.error('Error fetching active visits count:', error);
        this.activeVisitCount = 0;
      }
    } else {
      this.activeVisitCount = 0;
    }
  }

  async loadUserName(): Promise<void> {
    const user = this.auth.currentUser;
    if (user) {
      const userDocRef = doc(this.db, 'users', user.uid); // Assuming your user data is stored in a 'users' collection
      try {
        const userDocSnapshot = await getDoc(userDocRef);
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          this.userName = userData['displayName'] || userData['name'] || null; // Adjust 'displayName' or 'name' to match your field
        } else {
          console.log('No user data found');
          this.userName = null;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        this.userName = null;
      }
    } else {
      this.userName = null;
    }
  }
}
