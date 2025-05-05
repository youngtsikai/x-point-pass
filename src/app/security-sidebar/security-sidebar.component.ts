import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-security-sidebar',
  imports: [RouterModule, CommonModule],
  templateUrl: './security-sidebar.component.html',
  styleUrl: './security-sidebar.component.css',
})
export class SecuritySidebarComponent {
  isActivitiesOpen = false;
  isAlertsOpen = false;
  isCheckedinOpen = false;
  isFlagsOpen = false;

  toggleActivities() {
    this.isActivitiesOpen = !this.isActivitiesOpen;
  }

  toggleAlerts() {
    this.isAlertsOpen = !this.isAlertsOpen;
  }

  toggleCheckedin() {
    this.isCheckedinOpen = !this.isCheckedinOpen;
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
    if (!target.closest('.checkedin-drop')) {
      this.isCheckedinOpen = false;
    }
    if (!target.closest('.flags-drop')) {
      this.isFlagsOpen = false;
    }
  }
}
