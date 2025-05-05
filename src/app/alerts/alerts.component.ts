import { Component } from '@angular/core';

import { RouterModule } from '@angular/router';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alerts',
  imports: [RouterModule, CommonModule],
  templateUrl: './alerts.component.html',
  styleUrl: './alerts.component.css',
})
export class AlertsComponent {
  isVisibleEmergency = true;
  isVisibleGeneral = false;
  isVisibleTargeted = false;
  activeButton: string | null = 'emergency';

  toggleEmergency() {
    this.isVisibleEmergency = true;
    this.isVisibleGeneral = false;
    this.isVisibleTargeted = false;
    this.activeButton = 'emergency';
  }

  toggleGeneral() {
    this.isVisibleEmergency = false;
    this.isVisibleGeneral = true;
    this.isVisibleTargeted = false;
    this.activeButton = 'general';
  }

  toggleTargeted() {
    this.isVisibleEmergency = false;
    this.isVisibleGeneral = false;
    this.isVisibleTargeted = true;
    this.activeButton = 'targeted';
  }
}
