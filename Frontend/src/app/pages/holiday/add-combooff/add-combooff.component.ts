/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CompoOff } from '../../../common/interfaces/leaves/compo-off';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../../common/interfaces/users/user';
import { HolidayService } from '@services/holiday.service';
import { NewLeaveService } from '@services/new-leave.service';

@Component({
  selector: 'app-add-combooff',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatIconModule],
  templateUrl: './add-combooff.component.html',
  styleUrl: './add-combooff.component.scss'
})
export class AddCombooffComponent implements OnInit, OnDestroy{
  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.getHolidayById(id)
    this.getEmployees()
    this.getComboOff()
  }

  holidaySub!: Subscription;
  getHolidayById(id: number){

  }

  fb = inject(FormBuilder);
  userService = inject(UsersService);
  leaveService = inject(NewLeaveService);
  route = inject(ActivatedRoute);
  snackBar = inject(MatSnackBar);

  comboOffForm = this.fb.group({
    publicHoliday: ['', Validators.required],
    comboOffDate: ['', Validators.required],
    employees: this.fb.array([]),
  });

  employees: any[] = [];
  employeeSub: Subscription;
  getEmployees(){
    this.employeeSub = this.userService.getConfirmedEmployees().subscribe((data) => {
      console.log(data);
      
      this.employees = data;
      this.addEmployeeCheckboxes();
    });
  }

  private addEmployeeCheckboxes(): void {
    const employeesArray = this.comboOffForm.controls['employees'] as FormArray;
    this.employees.forEach(() => employeesArray.push(this.fb.control(false)));
  }

  selectedEmployeeIds: number[] = [];
  deselectedEmployeeIds: number[] = [];
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
    if(this.co){
      this.deselectedEmployeeIds = this.getDeselectedUserIds();
    }
  }

  submit!: Subscription;
  private readonly holidayService = inject(HolidayService);
  onSubmit() {
    if(this.editStatus){
      this.removeAlreadySelectedIds();
      const data = {
        selectedEmployeeIds: this.selectedEmployeeIds,
        deselectedEmployeeIds: this.deselectedEmployeeIds
      }

      this.submit = this.holidayService.updateUpdatedCompoOff( this.route.snapshot.params['id'], data).subscribe((res: any) => {
        this.snackBar.open(res.message, 'Close', { duration: 3000 });
        history.back()
      })
    }else{
      this.submit = this.holidayService.updateCompoOff(this.route.snapshot.params['id'], this.selectedEmployeeIds).subscribe((res: any) => {
        this.snackBar.open(res.message, 'Close', { duration: 3000 });
        history.back()
      })
    }
  }

  removeAlreadySelectedIds(): void {
    if (this.co && this.co.userId) {
      this.selectedEmployeeIds = this.selectedEmployeeIds.filter(id => !this.co.userId.includes(id));
    }
  }

  comboOffSub!: Subscription;
  co: CompoOff;
  editStatus: boolean = false;
  getComboOff(){
    this.comboOffSub = this.holidayService.getCompoOff(this.route.snapshot.params['id']).subscribe(res => {
      this.co = res;
      if(this.co){
        this.editStatus = true;
        this.setInitialCheckboxes(this.co.userId);
      }
    })
  }

  private setInitialCheckboxes(selectedUserIds: number[]): void {
    const employeesArray = this.comboOffForm.controls['employees'] as FormArray;
    this.employees.forEach((employee, index) => {
      if (selectedUserIds.includes(employee.id)) {
        employeesArray.at(index).setValue(true); // Set checkbox to checked
        this.selectedEmployeeIds.push(employee.id); // Update selectedEmployeeIds array
      } else {
        employeesArray.at(index).setValue(false); // Set checkbox to unchecked
      }
    });
  }

  getDeselectedUserIds(): number[] {
    const allEmployeeIds = this.co.userId.map(employee => employee);

    return allEmployeeIds.filter(id => !this.selectedEmployeeIds.includes(id));
  }

  goBack() {
    // Logic to navigate back, for example:
    history.back();  // This requires importing Location from '@angular/common'
  }

  ngOnDestroy(): void {
    this.employeeSub?.unsubscribe();
    this.comboOffSub?.unsubscribe();
  }
}
