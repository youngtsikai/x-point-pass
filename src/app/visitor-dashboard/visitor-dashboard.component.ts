import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { VisitorHeaderComponent } from '../visitor-header/visitor-header.component';
import { VisitorSidebarComponent } from '../visitor-sidebar/visitor-sidebar.component';

@Component({
  selector: 'app-visitor-dashboard',
  imports: [RouterModule, VisitorHeaderComponent, VisitorSidebarComponent],
  templateUrl: './visitor-dashboard.component.html',
  styleUrl: './visitor-dashboard.component.css',
})
export class VisitorDashboardComponent {}
