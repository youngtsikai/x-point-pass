import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { VisitorSidebarComponent } from '../visitor-sidebar/visitor-sidebar.component';

@Component({
  selector: 'app-flag-views',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    StaffHeaderComponent,
    VisitorSidebarComponent,
  ],
  templateUrl: './flag-views.component.html',
  styleUrl: './flag-views.component.css',
})
export class FlagViewsComponent {
  isVisibleHigh = true;
  isVisibleMedium = false;
  isVisibleLow = false;
  activeButton: string | null = 'high';

  toggleHigh() {
    this.isVisibleHigh = true;
    this.isVisibleMedium = false;
    this.isVisibleLow = false;
    this.activeButton = 'high';
  }

  toggleMedium() {
    this.isVisibleHigh = false;
    this.isVisibleMedium = true;
    this.isVisibleLow = false;
    this.activeButton = 'medium';
  }

  toggleLow() {
    this.isVisibleHigh = false;
    this.isVisibleMedium = false;
    this.isVisibleLow = true;
    this.activeButton = 'low';
  }
}
