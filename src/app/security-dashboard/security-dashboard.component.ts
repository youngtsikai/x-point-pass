import { Component } from '@angular/core';
import { SecurityHeaderComponent } from '../security-header/security-header.component';
import { SecuritySidebarComponent } from '../security-sidebar/security-sidebar.component';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../dashboard.service';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-security-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SecurityHeaderComponent,
    SecuritySidebarComponent,
    RouterModule,
  ],
  templateUrl: './security-dashboard.component.html',
  styleUrls: ['./security-dashboard.component.css'],
})
export class SecurityDashboardComponent {
  constructor(public dashboardService: DashboardService) {}

  async ngOnInit() {
    this.dashboardService.ngOnInit();
  }
}
