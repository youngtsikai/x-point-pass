import { Component } from '@angular/core';
import { VisitorHeaderComponent } from '../visitor-header/visitor-header.component';
import { VisitorSidebarComponent } from '../visitor-sidebar/visitor-sidebar.component';
import { ProfileComponent } from '../profile/profile.component';

@Component({
  selector: 'app-visitor-profile',
  imports: [VisitorHeaderComponent, VisitorSidebarComponent, ProfileComponent],
  templateUrl: './visitor-profile.component.html',
  styleUrl: './visitor-profile.component.css',
})
export class VisitorProfileComponent {}
