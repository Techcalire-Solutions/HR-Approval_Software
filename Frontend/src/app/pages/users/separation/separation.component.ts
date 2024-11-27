/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-separation',
  standalone: true,
  imports: [MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatButtonModule, CommonModule, MatNativeDateModule,
    MatDatepickerModule, MatToolbarModule, MatIconModule],
  templateUrl: './separation.component.html',
  styleUrl: './separation.component.scss',
  providers: [provideNativeDateAdapter()],
})
export class SeparationComponent implements OnInit, OnDestroy{
  ngOnDestroy(): void {
    this.empSub?.unsubscribe();
  }
  ngOnInit(): void {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];
    this.separationForm.get('separationDate')?.setValue(formattedDate);
    if(this.data.type === 'update'){
      this.getEMployee()
    }
  }

  empSub!: Subscription;
  private userService = inject(UsersService);
  getEMployee(){
    this.empSub = this.userService.getUserById(this.data.id).subscribe(res => {
      this.separationForm.patchValue({
        separationDate: res.separationDate, note: res.separationNote
      })
    })
  }

  private fb = inject(FormBuilder);
  public data = inject(MAT_DIALOG_DATA);

  separationForm = this.fb.group({
    note: ['', Validators.required],
    separationDate: <any>[]
  });

  private dialogRef = inject(MatDialogRef<SeparationComponent>)
  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  onConfirm(): void {
    if (this.separationForm.valid) {
      this.dialogRef.close({
        confirmed: true, note: this.separationForm.value.note, date: new Date()
      });
    }
  }

}
