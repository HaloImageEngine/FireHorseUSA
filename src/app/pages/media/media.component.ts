import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-media',
  imports: [NgIf],
  templateUrl: './media.component.html',
  styleUrl: './media.component.scss',
})
export class MediaComponent implements OnInit {
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isUploading = false;
  statusMessage = '';
  isLoggedIn = false;
  userId: string | null = null;
  userAlias: string | null = null;

  private readonly uploadUrl = 'https://rapidcmsdemo.com/api/CMSDemoImageLoad';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkLoginStatus();
  }

  private checkLoginStatus(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.userId = this.authService.getUserId() || this.authService.getUserIdFromCookie();
    this.userAlias = this.authService.getUserAlias() || this.authService.getUserAliasFromCookie();

    if (!this.isLoggedIn) {
      this.statusMessage = 'You must be logged in to upload images. Please log in first.';
    }
  }

  private createUniqueFileName(userId: number, fileName: string): string {
    // 1) Prefix
    const prefix = 'I';

    // 2) User ID padded to 6 digits
    const paddedUser = userId.toString().padStart(6, '0');

    // 3) Date YYmmdd
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');
    const datePart = `${yy}${mm}${dd}`;

    // 4) Time part: HHmmssfff (hours, minutes, seconds, milliseconds)
    const HH = now.getHours().toString().padStart(2, '0');
    const MM = now.getMinutes().toString().padStart(2, '0');
    const ss = now.getSeconds().toString().padStart(2, '0');
    const fff = now.getMilliseconds().toString().padStart(3, '0');
    const timePart = `${HH}${MM}${ss}${fff}`;

    // 5) File extension
    const extension = fileName.includes('.')
      ? fileName.substring(fileName.lastIndexOf('.'))
      : '';

    // Combine
    return `${prefix}${paddedUser}${datePart}${timePart}${extension}`;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedFile = null;
      this.previewUrl = null;
      return;
    }

    const file = input.files[0];
    this.selectedFile = file;
    this.statusMessage = '';

    // Create a local preview URL
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  uploadImage(): void {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.statusMessage = 'You must be logged in to upload images. Please log in first.';
      return;
    }

    if (!this.selectedFile) {
      this.statusMessage = 'Please select an image first.';
      return;
    }

    if (!this.previewUrl) {
      this.statusMessage = 'Image is still loading. Please wait.';
      return;
    }

    // Get user information from auth service
    const userId = this.authService.getUserId() || this.authService.getUserIdFromCookie();
    const userAlias = this.authService.getUserAlias() || this.authService.getUserAliasFromCookie();

    if (!userId || !userAlias) {
      this.statusMessage = 'Unable to retrieve user information. Please log in again.';
      return;
    }

    // Generate unique filename
    const uniqueFileName = this.createUniqueFileName(parseInt(userId, 10), this.selectedFile.name);

    // Prepare the JSON payload with userId, userAlias, and imageBase64
    const payload = {
      userId: parseInt(userId, 10),
      userAlias: userAlias,
      imageBase64: this.previewUrl, // Already in base64 format from FileReader
      imageFileName: uniqueFileName,
      imageMimeType: this.selectedFile.type
    };

    this.isUploading = true;
    this.statusMessage = '';

    this.http.post(this.uploadUrl, payload).subscribe({
      next: (response) => {
        this.isUploading = false;
        this.statusMessage = 'Image uploaded successfully.';
        console.log('Upload response:', response);
      },
      error: (error) => {
        this.isUploading = false;
        this.statusMessage = 'Failed to upload image. Please try again.';
        console.error('Upload error:', error);
      },
    });
  }

}
