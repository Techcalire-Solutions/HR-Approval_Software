/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UsersService } from '@services/users.service';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AdvanceSalary } from '../../../common/interfaces/payRoll/advanceSalary';
import { PayrollService } from '@services/payroll.service';
import { AddAdvanceSalaryComponent } from './add-advance-salary/add-advance-salary.component';
import { Router } from '@angular/router';
import { CloseAdvanceComponent } from './close-advance/close-advance.component';
import { DeleteDialogueComponent } from '../../../theme/components/delete-dialogue/delete-dialogue.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'app-advance-salary',
  standalone: true,
  imports: [MatButtonToggleModule, MatIconModule, MatSlideToggleModule, CommonModule, MatFormFieldModule, MatInputModule, 
    MatPaginatorModule
  ],
  templateUrl: './advance-salary.component.html',
  styleUrl: './advance-salary.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [UsersService]
})
export class AdvanceSalaryComponent implements OnInit , OnDestroy{
  ngOnInit() {
    this.getAdvanceSalary();
  }

  private payrollService = inject(PayrollService);
  advanceSalaries: AdvanceSalary[] = [];
  salarySub!: Subscription;
  public getAdvanceSalary(): void {
    this.salarySub = this.payrollService.getNotCompletedAdvanceSalary(this.searchText, this.currentPage, this.pageSize).subscribe((advanceSalary: any) =>{     
      this.advanceSalaries = advanceSalary.items;
      this.totalItems = advanceSalary.count;
    });
  }
  
  private dialog = inject(MatDialog);
  public openAdvanceDialog(salary?: any){
    const dialogRef = this.dialog.open(AddAdvanceSalaryComponent, {
      data: {salary: salary}
    });
    dialogRef.afterClosed().subscribe(() => {
      this.getAdvanceSalary()
    });
  }

  private router = inject(Router);
  openAdvanceLog(){
      this.router.navigateByUrl('/login/payroll/advance-salary/viewlogs')
  }

  onToggleChange(event: any, id: number){
    console.log(event.checked);
    const dialogRef = this.dialog.open(CloseAdvanceComponent, {
      data: {id: id}
    });
    dialogRef.afterClosed().subscribe(() => {
      this.getAdvanceSalary()
    });
  }

  public searchText!: string;
  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim()
    this.getAdvanceSalary()
  }


  ngOnDestroy(): void {
    this.salarySub?.unsubscribe();
  }

  delete!: Subscription;
  private snackBar = inject(MatSnackBar);
  deleteTeam(id: number){
    console.log(id);
    
    const dialogRef = this.dialog.open(DeleteDialogueComponent, {});
    dialogRef.afterClosed().subscribe(res => {
      if(res){
        this.delete = this.payrollService.deleteAdvanceSalary(id).subscribe(() => {
          this.snackBar.open("Advance Salary deleted successfully...","" ,{duration:3000})
          this.getAdvanceSalary()
        });
      }
    });
  }

  pageSize = 10;
  currentPage = 1;
  totalItems = 0;
  public onPageChanged(event: any){
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getAdvanceSalary()
  }

}


