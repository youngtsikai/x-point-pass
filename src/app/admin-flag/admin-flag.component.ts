import { Component } from '@angular/core';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { FlagComponent } from '../flag/flag.component';

@Component({
  selector: 'app-admin-flag',
  imports: [AdminHeaderComponent, AdminSidebarComponent, FlagComponent],
  templateUrl: './admin-flag.component.html',
  styleUrl: './admin-flag.component.css',
})
export class AdminFlagComponent {}
