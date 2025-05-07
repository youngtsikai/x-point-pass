import { Component } from '@angular/core';
import { FlagComponent } from '../flag/flag.component';
import { StaffFlagComponent } from '../staff-flag/staff-flag.component';
import { VisitorHeaderComponent } from '../visitor-header/visitor-header.component';
import { VisitorSidebarComponent } from '../visitor-sidebar/visitor-sidebar.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-visitor-flag',
  imports: [
    FlagComponent,
    VisitorHeaderComponent,
    VisitorSidebarComponent,
    RouterModule,
  ],
  templateUrl: './visitor-flag.component.html',
  styleUrl: './visitor-flag.component.css',
})
export class VisitorFlagComponent {}
