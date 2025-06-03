import { Component, OnInit, inject, effect } from '@angular/core';
import { RouterModule } from '@angular/router';
import { VisitorHeaderComponent } from '../visitor-header/visitor-header.component';
import { VisitorSidebarComponent } from '../visitor-sidebar/visitor-sidebar.component';
import { DashboardService } from '../dashboard.service';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-visitor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    VisitorHeaderComponent,
    VisitorSidebarComponent,
  ],
  templateUrl: './visitor-dashboard.component.html',
  styleUrl: './visitor-dashboard.component.css',
})
export class VisitorDashboardComponent implements OnInit {
  authserv = inject(AuthService);

  constructor(public dashboardService: DashboardService) {
    console.log('VisitorDashboardComponent initialized');
  }

  ngOnInit() {
    this.dashboardService.ngOnInit();
  }
}
