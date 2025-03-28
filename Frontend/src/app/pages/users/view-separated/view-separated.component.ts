import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UsersService } from '@services/users.service';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { SeparationComponent } from '../separation/separation.component';
import { User } from '../../../common/interfaces/users/user';

@Component({
  selector: 'app-view-separated',
  standalone: true,
  imports: [MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatIconModule, MatPaginatorModule, CommonModule],
  templateUrl: './view-separated.component.html',
  styleUrl: './view-separated.component.scss'
})
export class ViewSeparatedComponent implements OnInit, OnDestroy{
  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.resignSub?.unsubscribe();
    this.dialogSub?.unsubscribe();
    this.noteSub?.unsubscribe();
  }
  ngOnInit(): void {
    this.getSeparatedUsers();
  }

  userSub!: Subscription;
  private userService = inject(UsersService);
  users: User[] = [];
  getSeparatedUsers(){
    this.userSub = this.userService.getSeparated().subscribe(users =>{
      this.users = users;
    });
  }

  private snackBar = inject(MatSnackBar);
  resignSub!: Subscription;
  employeeBack(id: number){
    const data = {
      confirmed: false,
      separationNote: ''
    }
    this.resignSub = this.userService.resignEmployee(id, data).subscribe(() => {

      this.getSeparatedUsers()
      this.snackBar.open('Employee successfully rejoined', '', { duration: 3000 });
    });
  }

  private dialog = inject(MatDialog);
  private usersService = inject(UsersService);
  noteSub!: Subscription;
  private snackbar = inject(MatSnackBar);
  dialogSub!: Subscription;
  editNote(id: number, empNo: string, name: string){
    const dialogRef = this.dialog.open(SeparationComponent, {
      width: '450px',
      data: {id: id, empNo: empNo, name: name, type: 'update'}
    });
    this.dialogSub = dialogRef.afterClosed().subscribe((res) => {
      this.noteSub = this.usersService.updateSeparationNote(id, res).subscribe(() => {
        this.snackbar.open(`Separation note updated`, "", { duration: 3000 });
        this.getSeparatedUsers()
      })
    })
  }

}
