import { Component } from '@angular/core';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { StaffSidebarComponent } from '../staff-sidebar/staff-sidebar.component';
import { EmergencyInformationComponent } from '../emergency-information/emergency-information.component';

@Component({
  selector: 'app-staff-emergency',
  imports: [
    StaffHeaderComponent,
    StaffSidebarComponent,
    EmergencyInformationComponent,
  ],
  templateUrl: './staff-emergency.component.html',
  styleUrl: './staff-emergency.component.css',
})
export class StaffEmergencyComponent {}
