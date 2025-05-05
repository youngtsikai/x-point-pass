import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterModule, CommonModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.css',
})
export class AdminSidebarComponent {
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
