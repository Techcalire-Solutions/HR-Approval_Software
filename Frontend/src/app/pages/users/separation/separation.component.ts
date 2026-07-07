/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { UsersService } from '@services/users.service';
import { Subscription, combineLatest } from 'rxjs';
import { startWith } from 'rxjs/operators';
import moment from 'moment';

export const MY_FORMATS = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD/MM/YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-separation',
  standalone: true,
  imports: [MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatButtonModule, CommonModule, MatNativeDateModule,
    MatDatepickerModule, MatToolbarModule, MatIconModule],
  templateUrl: './separation.component.html',
  styleUrl: './separation.component.scss',
  providers: [provideMomentDateAdapter(MY_FORMATS), DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeparationComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  public data = inject(MAT_DIALOG_DATA);
  private userService = inject(UsersService);
  private dialogRef = inject(MatDialogRef<SeparationComponent>);
  private cdr = inject(ChangeDetectorRef); // Fixes OnPush view updates

  empSub!: Subscription;
  formSub!: Subscription;

  separationForm = this.fb.group({
    note: ['', Validators.required],
    noticeStartDate: [moment(), Validators.required],
    noticePeriod: [0, [Validators.required, Validators.min(0)]],
    separationDate: [moment(), Validators.required]
  });

  ngOnInit(): void {
    console.log('Separation dialog initialized');
    console.log(this.data);

    this.setupDateCalculation();

    if (this.data.type === 'update') {
      console.log('Calling getEmployee()');
      this.getEmployee();
    }
  }

  ngOnDestroy(): void {
    this.empSub?.unsubscribe();
    this.formSub?.unsubscribe();
  }

  getEmployee() {
    this.empSub = this.userService.getUserById(this.data.id).subscribe({
      next: (res) => {
        console.log('Backend Response:', res);

        this.separationForm.patchValue({
          note: res.separationNote || '',
          noticePeriod: res.noticePeriod !== undefined ? Number(res.noticePeriod) : 0,
          noticeStartDate: res.noticeStartDate ? moment(res.noticeStartDate, 'YYYY-MM-DD') : moment(),
          separationDate: res.separationDate ? moment(res.separationDate, 'YYYY-MM-DD') : moment()
        });

        // Tells Angular to refresh the view now that data has arrived asynchronously
        this.cdr.markForCheck();
      }
    });
  }

setupDateCalculation() {
  const startControl = this.separationForm.get('noticeStartDate');
  const periodControl = this.separationForm.get('noticePeriod');
  const separationControl = this.separationForm.get('separationDate');

  if (!startControl || !periodControl || !separationControl) return;

  // 1. Forward Calculation: Changing Notice Start or Notice Period updates Separation Date
  this.formSub = combineLatest([
    startControl.valueChanges.pipe(startWith(startControl.value)),
    periodControl.valueChanges.pipe(startWith(periodControl.value))
  ]).subscribe(([startDateValue, noticePeriodValue]) => {
    const startDate = moment(startDateValue);
    const daysToAdd = Number(noticePeriodValue);

    if (startDate.isValid() && !isNaN(daysToAdd) && daysToAdd >= 0) {
      const calculatedLWD = startDate.clone().add(daysToAdd, 'days');
      
      // Only update if it's actually different to avoid interrupting manual input
      if (!calculatedLWD.isSame(moment(separationControl.value), 'day')) {
        separationControl.setValue(calculatedLWD, { emitEvent: false });
        this.cdr.markForCheck();
      }
    }
  });

  // 2. Backward Calculation: Manually changing Separation Date updates Notice Period (Days)
  const separationSub = separationControl.valueChanges.subscribe((separationDateValue) => {
    const startDate = moment(startControl.value);
    const endDate = moment(separationDateValue);

    if (startDate.isValid() && endDate.isValid()) {
      // Calculate difference in days between LWD and Notice Start Date
      const diffDays = endDate.diff(startDate, 'days');
      
      // Update notice period with the calculated difference (ensure it doesn't go below 0)
      periodControl.setValue(diffDays >= 0 ? diffDays : 0, { emitEvent: false });
      this.cdr.markForCheck();
    }
  });

  // Add the new subscription to your clean-up tracking
  this.formSub.add(separationSub);
}

  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  onConfirm(): void {
    if (this.separationForm.valid) {
      const rawNoticeStart = this.separationForm.value.noticeStartDate;
      const rawSeparationDate = this.separationForm.value.separationDate;

      const formattedNoticeStart = moment.isMoment(rawNoticeStart) ? rawNoticeStart.format('YYYY-MM-DD') : null;
      const formattedSeparationDate = moment.isMoment(rawSeparationDate) ? rawSeparationDate.format('YYYY-MM-DD') : null;

      this.dialogRef.close({
        confirmed: true,
        note: this.separationForm.value.note,
        noticeStartDate: formattedNoticeStart,
        noticePeriod: this.separationForm.value.noticePeriod,
        separationDate: formattedSeparationDate // <-- Fixed name to match backend expectation
      });
    }
  }
}