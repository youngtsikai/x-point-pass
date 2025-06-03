import { Component } from '@angular/core';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { StaffSidebarComponent } from '../staff-sidebar/staff-sidebar.component';
import { VisitsComponent } from '../visits/visits.component';

@Component({
  selector: 'app-staff-visits',
  imports: [StaffHeaderComponent, StaffSidebarComponent, VisitsComponent],
  templateUrl: './staff-visits.component.html',
  styleUrl: './staff-visits.component.css',
})
export class StaffVisitsComponent {}
