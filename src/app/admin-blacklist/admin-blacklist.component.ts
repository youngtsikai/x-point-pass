import { Component } from '@angular/core';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { BlacklistComponent } from '../blacklist/blacklist.component';

@Component({
  selector: 'app-admin-blacklist',
  imports: [AdminHeaderComponent, AdminSidebarComponent, BlacklistComponent],
  templateUrl: './admin-blacklist.component.html',
  styleUrl: './admin-blacklist.component.css',
})
export class AdminBlacklistComponent {}
