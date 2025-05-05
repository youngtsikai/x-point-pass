import { Component, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-visitor-signup',
  standalone: true,
  imports: [RouterModule, MainHeaderComponent, CommonModule, FormsModule],
  templateUrl: './visitor-signup.component.html',
  styleUrl: './visitor-signup.component.css',
})
export class VisitorSignupComponent {
  authservice = inject(AuthService);
  router = inject(Router);

  userData = {
    username: '',
    email: '',
    password: '',
    confirmpassword: '',
    role: 'visitor', // Set the default role here
  };

  onSubmit(): void {
    if (this.userData.password !== this.userData.confirmpassword) {
      alert('Passwords do not match!');
      return;
    }

    this.authservice
      .signup(
        this.userData.email,
        this.userData.username,
        this.userData.password,
        this.userData.role // Pass the default role
      )
      .then(() => {
        this.router.navigateByUrl('/visitor-dashboard');
      })
      .catch((error: any) => {
        // Explicitly type 'error' as 'any'
        console.error('Sign-up failed:', error);
        let errorMessage = 'Sign-up Failed. Please try again.';
        if (error?.message) {
          errorMessage = error.message;
        }
        alert(errorMessage);
      });
  }
}
