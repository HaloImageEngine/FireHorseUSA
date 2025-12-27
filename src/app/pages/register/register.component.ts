import { Component, signal, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  // Full API URL - CORS must be enabled on the API server for production
  private readonly apiUrl = 'https://rapidcmsdemo.com/api/RapidCMS/login/create';

  form: FormGroup;
  showPassword = signal(false);
  submitting = signal(false);
  serverMsg = { text: '', type: '' };
  checkingAlias = signal(false);
  aliasMessage = signal<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });

  // Device detection
  deviceType: string = 'Unknown';
  isAndroid: boolean = false;
  isIOS: boolean = false;

  @ViewChild('userAliasInput') userAliasInput!: ElementRef<HTMLInputElement>;
  @ViewChild('emailInput') emailInput!: ElementRef<HTMLInputElement>;
  @ViewChild('passwordInput') passwordInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.pattern(/^[A-Za-z]+$/)]],
      middleInitial: ['', [Validators.pattern(/^[A-Za-z]$/)]],
      lastName: ['', [Validators.required, Validators.pattern(/^[A-Za-z]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      userAlias: ['', [Validators.required, this.aliasValidator]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      zip: ['', [this.zipValidator]],
      phoneNum: ['', [this.phoneValidator]]
    });
  }

  ngOnInit(): void {
    this.detectDevice();
  }

  private detectDevice(): void {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    // Check for iOS devices
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      this.deviceType = 'iOS';
      this.isIOS = true;
      this.isAndroid = false;
      console.log('iOS device detected - applying keyboard fixes');
    }
    // Check for Android devices
    else if (/android/i.test(userAgent)) {
      this.deviceType = 'Android';
      this.isAndroid = true;
      this.isIOS = false;
      console.log('Android device detected');
    }
    // Desktop or other devices
    else {
      this.deviceType = 'Desktop/Other';
      this.isAndroid = false;
      this.isIOS = false;
    }
  }

  get f() {
    return this.form.controls;
  }

  // Custom validators
  private aliasValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const value = control.value;
    if (value.length < 6) {
      return { alias: 'Alias must be at least 6 characters.' };
    }
    if (value.length > 20) {
      return { alias: 'Alias cannot exceed 20 characters.' };
    }
    if (/\s/.test(value)) {
      return { alias: 'Alias cannot contain spaces.' };
    }
    return null;
  }

  private zipValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    if (!/^\d{5}$/.test(control.value)) {
      return { zip: 'Zip must be exactly 5 digits.' };
    }
    return null;
  }

  private phoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const cleaned = control.value.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      return { phoneNum: 'Phone must be exactly 10 digits.' };
    }
    return null;
  }

  // Input handlers
  onFirstNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^A-Za-z]/g, '');
    this.form.patchValue({ firstName: input.value });
  }

  onMiddleInitialInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^A-Za-z]/g, '').slice(0, 1);
    this.form.patchValue({ middleInitial: input.value });
  }

  onLastNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^A-Za-z]/g, '');
    this.form.patchValue({ lastName: input.value });
  }

  onAliasInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\s/g, '').toUpperCase().slice(0, 20);
    this.form.patchValue({ userAlias: input.value });
    // Clear alias message when user types
    this.aliasMessage.set({ text: '', type: '' });
  }

  onAliasBlur(): void {
    const alias = this.form.value.userAlias;

    // Only check if alias meets basic validation requirements
    if (!alias || alias.length < 6) {
      this.aliasMessage.set({ text: '', type: '' });
      return;
    }

    this.checkAliasAvailability(alias);
  }

  private checkAliasAvailability(alias: string): void {
    this.checkingAlias.set(true);
    this.aliasMessage.set({ text: '', type: '' });

    const checkAliasUrl = 'https://rapidcmsdemo.com/api/RapidCMS/login/check-alias';
    const payload = { Alias: alias };

    this.http.post<{ ok: boolean; exists: boolean; message: string }>(checkAliasUrl, payload).subscribe({
      next: (response) => {
        this.checkingAlias.set(false);
        if (response.ok && !response.exists) {
          this.aliasMessage.set({ text: response.message, type: 'success' });
        } else if (response.exists) {
          this.aliasMessage.set({ text: response.message, type: 'error' });
          // Refocus the input field so user can retype
          setTimeout(() => {
            this.userAliasInput?.nativeElement.focus();
          }, 100);
        }
      },
      error: (error) => {
        this.checkingAlias.set(false);
        console.error('Alias check failed', error);
        this.aliasMessage.set({ text: 'Unable to check alias availability. Please try again.', type: 'error' });
      }
    });
  }

  onZipInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/\D/g, '').slice(0, 5);
    this.form.patchValue({ zip: input.value });
  }

  onEmailEnter(): void {
    // For iOS, explicitly focus the password field and trigger keyboard
    if (this.isIOS && this.passwordInput) {
      // Delay to ensure email field blur completes
      setTimeout(() => {
        const pwdElement = this.passwordInput.nativeElement;
        // Remove readonly if present
        pwdElement.removeAttribute('readonly');
        // Focus the field
        pwdElement.focus();
        // Trigger a touch event to ensure keyboard appears
        const touchEvent = new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        pwdElement.dispatchEvent(touchEvent);
      }, 150);
    } else if (this.passwordInput) {
      // For Android and desktop, standard focus
      this.passwordInput.nativeElement.focus();
    }
  }

  onPasswordFocus(): void {
    // Additional iOS keyboard trigger on focus
    if (this.isIOS && this.passwordInput) {
      const element = this.passwordInput.nativeElement;
      element.removeAttribute('readonly');
      // Small delay to ensure keyboard appears
      setTimeout(() => {
        element.click();
      }, 50);
    }
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = input.value.replace(/\D/g, '').slice(0, 10);
    if (cleaned.length === 10) {
      input.value = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else {
      input.value = cleaned;
    }
    this.form.patchValue({ phoneNum: input.value });
  }

  toggleShowPassword(): void {
    this.showPassword.update(v => !v);
  }

  closeServerMsg(): void {
    this.serverMsg = { text: '', type: '' };
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  onReset(): void {
    this.form.reset();
    this.serverMsg = { text: '', type: '' };
  }

  onSubmit(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.controls[key].markAsTouched();
      });
      return;
    }

    this.submitting.set(true);
    this.serverMsg = { text: '', type: '' };

    // Only include fields with values, don't send empty strings
    const payload: any = {
      FirstName: this.form.value.firstName,
      LastName: this.form.value.lastName,
      Email: this.form.value.email,
      UserAlias: this.form.value.userAlias,
      Password: this.form.value.password
    };

    // Only add optional fields if they have values
    if (this.form.value.middleInitial) {
      payload.MiddleInitial = this.form.value.middleInitial;
    }
    if (this.form.value.zip) {
      payload.Zip = this.form.value.zip;
    }
    if (this.form.value.phoneNum) {
      payload.PhoneNum = this.form.value.phoneNum.replace(/\D/g, '');
    }

    console.log('Sending registration payload:', payload);

    this.http.post(this.apiUrl, payload).subscribe({
      next: () => {
        this.serverMsg = { text: 'Account created successfully!', type: 'info' };
        this.form.reset();
        this.submitting.set(false);
        setTimeout(() => this.goToLogin(), 2000);
      },
      error: (error) => {
        console.error('Registration request failed', error);
        console.error('Error details:', error.error);
        console.error('Status:', error.status);

        let errorMessage = 'Registration failed. Please try again.';

        // Try to get more specific error message
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.Message) {
            errorMessage = error.error.Message;

            // Check for ModelState validation errors (ASP.NET Web API format)
            if (error.error.ModelState) {
              const modelStateErrors: string[] = [];
              Object.keys(error.error.ModelState).forEach(key => {
                const errors = error.error.ModelState[key];
                if (Array.isArray(errors)) {
                  modelStateErrors.push(...errors);
                } else {
                  modelStateErrors.push(errors);
                }
              });
              if (modelStateErrors.length > 0) {
                console.error('ModelState errors:', modelStateErrors);
                errorMessage = modelStateErrors.join('; ');
              }
            }
          } else if (error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error.errors) {
            // Handle validation errors (other format)
            const errors = Object.values(error.error.errors).flat();
            errorMessage = errors.join(', ');
          }
        }

        this.serverMsg = {
          text: errorMessage,
          type: 'error'
        };
        this.submitting.set(false);
      }
    });
  }
}
