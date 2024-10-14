import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UsersService } from '@services/users.service';
import { User } from '../../../common/interfaces/user';
import { Subscription } from 'rxjs';
import { LeaveService } from '@services/leave.service';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-combooff',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule],
  templateUrl: './add-combooff.component.html',
  styleUrl: './add-combooff.component.scss'
})
export class AddCombooffComponent implements OnInit, OnDestroy{
  ngOnInit(): void {
    let id = this.route.snapshot.params['id'];
    this.getHolidayById(id)
    this.getEmployees()
  }

  holidaySub!: Subscription;
  getHolidayById(id: number){

  }

  fb = inject(FormBuilder);
  userService = inject(UsersService);
  leaveService = inject(LeaveService);
  route = inject(ActivatedRoute);
  snackBar = inject(MatSnackBar);

  comboOffForm = this.fb.group({
    publicHoliday: ['', Validators.required],
    comboOffDate: ['', Validators.required],
    employees: this.fb.array([]),
  });

  employees: User[] = [];
  employeeSub: Subscription;
  getEmployees(){
    this.employeeSub = this.userService.getConfirmedEmployees().subscribe((data) => {
      this.employees = data;
      this.addEmployeeCheckboxes();
    });
  }

  private addEmployeeCheckboxes(): void {
    const employeesArray = this.comboOffForm.controls['employees'] as FormArray;
    this.employees.forEach(() => employeesArray.push(this.fb.control(false)));
  }

  selectedEmployeeIds: number[] = [];
  // This function handles checkbox selection and updates the selectedEmployeeIds array
  onCheckboxChange(event: any, employeeId: number) {
    if (event.target.checked) {
      this.selectedEmployeeIds.push(employeeId);
    } 
    else {
      const index = this.selectedEmployeeIds.indexOf(employeeId);
      if (index !== -1) {
        this.selectedEmployeeIds.splice(index, 1);
      }
    }
  }

  submit!: Subscription;
  onSubmit() {
    this.submit = this.leaveService.updateCompoOff(this.route.snapshot.params['id'], this.selectedEmployeeIds).subscribe((res: any) => {
      this.snackBar.open(res.message, 'Close', { duration: 3000 });
    })
  }
  ngOnDestroy(): void {
    this.employeeSub?.unsubscribe();
  }
}
