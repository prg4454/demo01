import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    loginData = {
        email: '',
        password: '',
        rememberMe: false
    };

    errorMessage = '';
    successMessage = '';
    isSubmitting = false;

    onSubmit(): void {
        this.errorMessage = '';
        this.successMessage = '';

        if (!this.loginData.email || !this.loginData.password) {
            this.errorMessage = 'Please enter both email and password.';
            return;
        }

        this.isSubmitting = true;

        // Simulate login request delay
        setTimeout(() => {
            this.isSubmitting = false;
            // Simulated validation
            if (this.loginData.email === 'admin@example.com' && this.loginData.password === 'password123') {
                this.successMessage = 'Login successful! Welcome back.';
            } else {
                this.errorMessage = 'Invalid email or password. Hint: admin@example.com / password123';
            }
        }, 1200);
    }
}

