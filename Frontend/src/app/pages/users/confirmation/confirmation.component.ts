import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { UserLeaveComponent } from '../../admin-leave/user-leave/user-leave.component';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { User } from '../../../common/interfaces/users/user';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [MatIconModule, FormsModule, MatFormFieldModule, MatButtonModule, MatInputModule],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss'
})
export class ConfirmationComponent implements OnInit, OnDestroy{
  selectedEmployeeId: number | null = null;
  note: string = '';
  ngOnInit(): void {
    this.getProbationEmployees();
    this.getPermanentEmployees();
  }

  userService = inject(UsersService)
  probStaffSub!: Subscription
  probEmp: User[] = [];
  getProbationEmployees(){
    this.probStaffSub = this.userService.getProbationEmployees().subscribe((data) => {
      this.probEmp = data.filter(emp => emp.role.roleName !== 'Administrator' && emp.role.roleName !== 'HR Administrator' && emp.role.roleName !== 'Super Administrator');
    });
  }

  permanentStaffSub!: Subscription
  permanentEmp: User[] = [];
  getPermanentEmployees(){
    this.permanentStaffSub = this.userService.getConfirmedEmployees().subscribe((data) => {
      console.log(data);
      
      this.permanentEmp = data.filter(emp => emp.role.roleName !== 'Administrator' && emp.role.roleName !== 'HR Administrator' && emp.role.roleName !== 'Super Administrator');;
    });
  }

  onConfirmClick(id: number) {
    this.selectedEmployeeId = id;
    this.note = '';
  }

  cancelNote() {
    this.selectedEmployeeId = null;
    this.note = '';
  }

  snackBar = inject(MatSnackBar)
  confirmSub!: Subscription;
  confirmEmployee(id: number, name: string, note: string){
    this.confirmSub = this.userService.confirmEmployee(id, note).subscribe(() =>{
      this.snackBar.open(`${name} is confirmed`,"" ,{duration:3000})
      this.getProbationEmployees();
      this.getPermanentEmployees();
    })
  }

  dialog = inject(MatDialog);
  dialodSub!: Subscription;
  updateUserLeave(id: number, name: string){
      const dialogRef = this.dialog.open(UserLeaveComponent, {
        width: '450px',
        data: {id: id, name: name}
      });
      this.dialodSub = dialogRef.afterClosed().subscribe(() => {})
  }

  ngOnDestroy(): void {
    this.confirmSub?.unsubscribe();
    this.permanentStaffSub?.unsubscribe();
    this.probStaffSub?.unsubscribe();
    this.dialodSub?.unsubscribe();
  }
}
