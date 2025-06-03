import { Component } from '@angular/core';
import { VisitorSidebarComponent } from '../visitor-sidebar/visitor-sidebar.component';
import { EmergencyInformationComponent } from '../emergency-information/emergency-information.component';
import { VisitorHeaderComponent } from '../visitor-header/visitor-header.component';

@Component({
  selector: 'app-visitor-emergency',
  imports: [
    VisitorSidebarComponent,
    EmergencyInformationComponent,
    VisitorHeaderComponent,
  ],
  templateUrl: './visitor-emergency.component.html',
  styleUrl: './visitor-emergency.component.css',
})
export class VisitorEmergencyComponent {}
