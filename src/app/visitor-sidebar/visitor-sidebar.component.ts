import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-visitor-sidebar',
  imports: [RouterModule, CommonModule],
  templateUrl: './visitor-sidebar.component.html',
  styleUrl: './visitor-sidebar.component.css',
})
export class VisitorSidebarComponent {
  isActivitiesOpen = false;
  isAlertsOpen = false;
  isVisitsOpen = false;
  isFlagsOpen = false;

  toggleActivities() {
    this.isActivitiesOpen = !this.isActivitiesOpen;
  }

  toggleAlerts() {
    this.isAlertsOpen = !this.isAlertsOpen;
  }

  toggleVisits() {
    this.isVisitsOpen = !this.isVisitsOpen;
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
    if (!target.closest('.visits-drop')) {
      this.isVisitsOpen = false;
    }
    if (!target.closest('.flags-drop')) {
      this.isFlagsOpen = false;
    }
  }
}
