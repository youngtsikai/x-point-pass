import { Component } from '@angular/core';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { EmergencyInformationComponent } from '../emergency-information/emergency-information.component';

@Component({
  selector: 'app-main-emergency',
  imports: [MainHeaderComponent, EmergencyInformationComponent],
  templateUrl: './main-emergency.component.html',
  styleUrl: './main-emergency.component.css',
})
export class MainEmergencyComponent {}
