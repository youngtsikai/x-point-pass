import { Component } from '@angular/core';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { EmergencyInformationComponent } from '../emergency-information/emergency-information.component';

@Component({
  selector: 'app-admin-emergency',
  imports: [
    AdminHeaderComponent,
    AdminSidebarComponent,
    EmergencyInformationComponent,
  ],
  templateUrl: './admin-emergency.component.html',
  styleUrl: './admin-emergency.component.css',
})
export class AdminEmergencyComponent {}
