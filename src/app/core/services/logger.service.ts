import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  log(...args: any[]): void {
    console.log(...args);
  }

  warn(...args: any[]): void {
    console.warn(...args);
  }

  error(...args: any[]): void {
    console.error(...args);
  }
}
