import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-year-to-date',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './year-to-date.component.html',
  styleUrl: './year-to-date.component.scss'
})
export class YearToDateComponent {
  isLoading: boolean = false;
  filters = { startDate: '', endDate: '' };
  errorMessage = '';
  private fb = inject(FormBuilder);

  ytdForm = this.fb.group({
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
  });

  ytdData = [
    {
      "consultant": "John Doe",
      "project": "Project Alpha",
      "revenue": 50000,
      "hoursBilled": 120
    },
    {
      "consultant": "Jane Smith",
      "project": "Project Beta",
      "revenue": 75000,
      "hoursBilled": 150
    }
  ]

  applyFilters(): void {
  }
  
}
