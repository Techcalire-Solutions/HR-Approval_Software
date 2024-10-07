import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { User } from '../../../common/interfaces/user';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserLeaveComponent } from '../../leave/user-leave/user-leave.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [MatIconModule, CommonModule],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss'
})
export class ConfirmationComponent implements OnInit, OnDestroy{
  ngOnInit(): void {
    this.getProbationEmployees();
    this.getPermanentEmployees();
  }

  userService = inject(UsersService)
  probStaffSub!: Subscription
  probEmp: User[] = [];
  getProbationEmployees(){
    this.probStaffSub = this.userService.getProbationEmployees().subscribe((data) => {
      this.probEmp = data;
    });
  }

  permanentStaffSub!: Subscription
  permanentEmp: User[] = [];
  getPermanentEmployees(){
    this.permanentStaffSub = this.userService.getConfirmedEmployees().subscribe((data) => {
      this.permanentEmp = data;
    });
  }

  snackBar = inject(MatSnackBar)
  confirmSub!: Subscription;
  confirmEmployee(id: number, name: string){
    this.confirmSub = this.userService.confirmEmployee(id).subscribe(res =>{     
      this.snackBar.open(`${name} is confirmed`,"" ,{duration:3000})
      this.getProbationEmployees();
      this.getPermanentEmployees();
    })
  }

  dialog = inject(MatDialog);
  updateUserLeave(id: number, name: string){
      const dialogRef = this.dialog.open(UserLeaveComponent, {
        width: '450px',
        data: {id: id, name: name}
      });dialogRef.afterClosed().subscribe((result) => {
  
      })
  }

  ngOnDestroy(): void {
    this.confirmSub?.unsubscribe();
    this.permanentStaffSub?.unsubscribe();
    this.probStaffSub?.unsubscribe();
  }
}
