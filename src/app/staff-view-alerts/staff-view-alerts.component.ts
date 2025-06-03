import { Component } from '@angular/core';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { StaffSidebarComponent } from '../staff-sidebar/staff-sidebar.component';
import { MyAlertsComponent } from '../my-alerts/my-alerts.component';

@Component({
  selector: 'app-staff-view-alerts',
  imports: [StaffHeaderComponent, StaffSidebarComponent, MyAlertsComponent],
  templateUrl: './staff-view-alerts.component.html',
  styleUrl: './staff-view-alerts.component.css',
})
export class StaffViewAlertsComponent {}
