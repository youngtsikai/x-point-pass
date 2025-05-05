import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-staff-sidebar',
  imports: [RouterModule, CommonModule],
  templateUrl: './staff-sidebar.component.html',
  styleUrl: './staff-sidebar.component.css'
})
export class StaffSidebarComponent {

  isActivitiesOpen = false;
  isAlertsOpen = false;
  isGuestsOpen = false;
  isFlagsOpen = false;

  toggleActivities() {
    this.isActivitiesOpen = !this.isActivitiesOpen;
  }

  toggleAlerts() {
    this.isAlertsOpen = !this.isAlertsOpen;
  }

  toggleGuests() {
    this.isGuestsOpen = !this.isGuestsOpen;
  }

  toggleflags() {
    this.isFlagsOpen = !this.isFlagsOpen;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.activities-drop')) {
      this.isActivitiesOpen = false;
    }
    if (!target.closest('.alerts-drop')) {
      this.isAlertsOpen = false;
    }
    if (!target.closest('.guests-drop')) {
      this.isGuestsOpen = false;
    }
    if (!target.closest('.flags-drop')) {
      this.isFlagsOpen = false;
    }
  }

}