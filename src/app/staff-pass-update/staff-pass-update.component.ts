import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StaffSidebarComponent } from '../staff-sidebar/staff-sidebar.component';
import { StaffHeaderComponent } from '../staff-header/staff-header.component';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-staff-pass-update',
  imports: [
    RouterModule,
    FormsModule,
    CommonModule,
    StaffSidebarComponent,
    StaffHeaderComponent,
  ],
  templateUrl: './staff-pass-update.component.html',
  styleUrl: './staff-pass-update.component.css',
})
export class StaffPassUpdateComponent {
  auth = inject(AuthService);
  router = inject(Router);

  password = '';
  showPassword = false;

  updatePassword() {
    if (this.password) {
      this.auth
        .setNewUserPassword(this.password)
        .then(() => {
          alert('Password updated successfully! Please sign in again.');
          return this.auth.signout().toPromise();
        })
        .then(() => {
          this.router.navigate(['/staff-signin']);
        })
        .catch((error) => {
          console.error('Error during password update or signout:', error);
          alert('Failed to update password or sign out: ' + error.message);
        });
    } else {
      alert('Please enter a new password.');
    }
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }
}
