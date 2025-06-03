import { Component } from '@angular/core';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { AlertsComponent } from '../alerts/alerts.component';

@Component({
  selector: 'app-admin-view-alerts',
  imports: [AdminHeaderComponent, AdminSidebarComponent, AlertsComponent],
  templateUrl: './admin-view-alerts.component.html',
  styleUrl: './admin-view-alerts.component.css',
})
export class AdminViewAlertsComponent {}
