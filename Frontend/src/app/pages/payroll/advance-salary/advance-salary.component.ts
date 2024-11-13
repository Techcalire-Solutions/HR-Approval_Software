/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxPaginationModule } from 'ngx-pagination';
import { PipesModule } from '../../../theme/pipes/pipes.module';
import { UserDialogComponent } from '../../users/user-dialog/user-dialog.component';
import { UsersService } from '@services/users.service';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { TeamDialogueComponent } from '../../team/team-dialogue/team-dialogue.component';
import { AdvanceSalary } from '../../../common/interfaces/payRoll/advanceSalary';
import { PayrollService } from '@services/payroll.service';
import { AddAdvanceSalaryComponent } from './add-advance-salary/add-advance-salary.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-advance-salary',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    FormsModule,
    FlexLayoutModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatSlideToggleModule,
    MatCardModule,
    NgxPaginationModule,
    PipesModule,
    DatePipe,
    UserDialogComponent,
    MatDividerModule
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
    this.salarySub = this.payrollService.getNotCompletedAdvanceSalary().subscribe((advanceSalary: any) =>{
      this.advanceSalaries = advanceSalary
    });
  }
  applyFilter() {
    // this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  // public addTeam(user:User){
  //   this.teamService.addTeam(user).subscribe(user => this.getAdvanceSalary());
  // }
  
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

  onToggleChange(event: any){
    console.log(event.checked);
    
  }

  ngOnDestroy(): void {
    this.salarySub?.unsubscribe();
  }

  // public onPageChanged(event: any){
  //   this.page = event;
  //   // this.getTeam();
  //   if(this.settings.fixedHeader){
  //       document.getElementById('main-content')!.scrollTop = 0;
  //   }
  //   else{
  //       document.getElementsByClassName('mat-drawer-content')[0].scrollTop = 0;
  //   }
  // }
  delete!: Subscription;
  deleteTeam(id: number){
    console.log(id);
    
    // let dialogRef = this.dialog.open(DeleteDialogueComponent, {});
    // dialogRef.afterClosed().subscribe(res => {
    //   if(res){
    //     this.delete = this.teamService.deleteTeam(id).subscribe(res => {
    //       this._snackbar.open("Team deleted successfully...","" ,{duration:3000})
    //       this.getAdvanceSalary()
    //     });
    //   }
    // });
  }

}


