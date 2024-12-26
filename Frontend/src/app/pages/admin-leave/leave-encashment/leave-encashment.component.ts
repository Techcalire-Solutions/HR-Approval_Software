import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LeaveService } from '@services/leave.service';

@Component({
  selector: 'app-leave-encashment',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './leave-encashment.component.html',
  styleUrl: './leave-encashment.component.scss'
})
export class LeaveEncashmentComponent {
  encashForm: FormGroup;
  message: string | null = null;

  constructor(private fb: FormBuilder, private encashmentService: LeaveService) {
    this.encashForm = this.fb.group({
      userId: ['', Validators.required],
      leaveTypeId: ['', Validators.required],
      encashedDays: ['', [Validators.required, Validators.min(0.5)]],
      amount: ['', [Validators.required, Validators.min(1)]],
    });
  }

  onEncash() {
    if (this.encashForm.valid) {
      this.encashmentService.encashLeave(this.encashForm.value).subscribe({
        next: (response) => {
          this.message = response.message;
        },
        error: (error) => {
          this.message = error.error.message || 'Failed to encash leave';
        }
      });
    }
  }
}
