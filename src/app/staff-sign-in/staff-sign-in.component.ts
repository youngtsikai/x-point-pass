import { Component, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-staff-sign-in',
  imports: [MainHeaderComponent, RouterModule, CommonModule, FormsModule],
  templateUrl: './staff-sign-in.component.html',
  styleUrl: './staff-sign-in.component.css',
})
export class StaffSignInComponent {
  private authserv = inject(AuthService);
  private rout = inject(Router);

  userData = {
    email: '',
    password: '',
  };

  onSubmit(): void {
    this.authserv
      .signin(this.userData.email, this.userData.password)
      .subscribe({
        next: () => {
          const userId = this.rout.navigateByUrl('/staff-dashboard');
        },
        error: (error) => {
          console.error('Sign-in failed:', error);
          let errorMessage = 'Sign-in Failed. Please try again.';
          if (error & error.message) {
            errorMessage = error.message;
          }
          alert(errorMessage);
        },
      });
  }
}
