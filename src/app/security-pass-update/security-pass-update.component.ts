import { Component, inject } from '@angular/core';
import { SecurityHeaderComponent } from '../security-header/security-header.component';
import { SecuritySidebarComponent } from '../security-sidebar/security-sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-security-pass-update',
  imports: [
    SecurityHeaderComponent,
    SecuritySidebarComponent,
    FormsModule,
    RouterModule,
    CommonModule,
  ],
  templateUrl: './security-pass-update.component.html',
  styleUrl: './security-pass-update.component.css',
})
export class SecurityPassUpdateComponent {
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
          this.router.navigate(['/security-signin']);
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
