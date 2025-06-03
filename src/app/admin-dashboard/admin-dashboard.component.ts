import { Component, OnInit, inject, computed } from '@angular/core';
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
  Timestamp,
  orderBy,
  doc,
  getDoc,
  limit,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { AuthService } from '../auth.service';
import { forkJoin, from, map, Observable, mergeMap } from 'rxjs';
import { DashboardService } from '../dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
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
  ActiveVisitsCount: number = 0;
  PendingVACount: number = 0;

  fire: Firestore = inject(Firestore);
  authserv = inject(AuthService);

  currentUserData = this.authserv.currentUserData;

  constructor(public dashboardService: DashboardService) {
    console.log('AdminDashboardComponent initialized');
  }

  ngOnInit() {
    this.dashboardService.ngOnInit();
  }
}
