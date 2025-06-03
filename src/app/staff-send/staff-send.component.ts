import { Component } from '@angular/core';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { StaffSidebarComponent } from '../staff-sidebar/staff-sidebar.component';
import { SendComponent } from '../send/send.component';

@Component({
  selector: 'app-staff-send',
  imports: [StaffHeaderComponent, StaffSidebarComponent, SendComponent],
  templateUrl: './staff-send.component.html',
  styleUrl: './staff-send.component.css',
})
export class StaffSendComponent {}
