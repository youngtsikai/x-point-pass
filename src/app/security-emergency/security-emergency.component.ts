import { Component } from '@angular/core';
import { SecurityHeaderComponent } from '../security-header/security-header.component';
import { EmergencyInformationComponent } from '../emergency-information/emergency-information.component';
import { SecuritySidebarComponent } from '../security-sidebar/security-sidebar.component';

@Component({
  selector: 'app-security-emergency',
  imports: [
    SecurityHeaderComponent,
    EmergencyInformationComponent,
    SecuritySidebarComponent,
  ],
  templateUrl: './security-emergency.component.html',
  styleUrl: './security-emergency.component.css',
})
export class SecurityEmergencyComponent {}
