import { Component } from '@angular/core';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { StaffSidebarComponent } from '../staff-sidebar/staff-sidebar.component';
import { GuestListComponent } from '../guest-list/guest-list.component';

@Component({
  selector: 'app-staff-guests',
  imports: [StaffHeaderComponent, StaffSidebarComponent, GuestListComponent],
  templateUrl: './staff-guests.component.html',
  styleUrl: './staff-guests.component.css',
})
export class StaffGuestsComponent {}
