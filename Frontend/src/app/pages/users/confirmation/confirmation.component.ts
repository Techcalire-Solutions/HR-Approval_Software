import { Component, inject, OnInit } from '@angular/core';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { User } from '../../../common/interfaces/user';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [MatIconModule, CommonModule],
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss'
})
export class ConfirmationComponent implements OnInit{
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
      console.log(this.probEmp);
      
    });
  }

  permanentStaffSub!: Subscription
  permanentEmp: User[] = [];
  getPermanentEmployees(){
    this.permanentStaffSub = this.userService.getConfirmedEmployees().subscribe((data) => {
      this.permanentEmp = data;
      console.log(this.permanentEmp);
      
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
}
