import { Component } from '@angular/core';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { StaffSidebarComponent } from '../staff-sidebar/staff-sidebar.component';
import { AlertsComponent } from '../alerts/alerts.component';

@Component({
  selector: 'app-staff-view-alerts',
  imports: [StaffHeaderComponent, StaffSidebarComponent, AlertsComponent],
  templateUrl: './staff-view-alerts.component.html',
  styleUrl: './staff-view-alerts.component.css',
})
export class StaffViewAlertsComponent {}
