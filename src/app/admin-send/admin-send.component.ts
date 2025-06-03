import { Component } from '@angular/core';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { SendComponent } from '../send/send.component';

@Component({
  selector: 'app-admin-send',
  imports: [AdminHeaderComponent, AdminSidebarComponent, SendComponent],
  templateUrl: './admin-send.component.html',
  styleUrl: './admin-send.component.css',
})
export class AdminSendComponent {}
