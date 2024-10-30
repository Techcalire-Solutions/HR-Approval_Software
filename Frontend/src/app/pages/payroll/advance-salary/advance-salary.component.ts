import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { Settings, SettingsService } from '@services/settings.service';
import { Subscription } from 'rxjs';
import { TeamDialogueComponent } from '../../team/team-dialogue/team-dialogue.component';
import { AdvanceSalary } from '../../../common/interfaces/advanceSalary';
import { PayrollService } from '@services/payroll.service';
import { Router } from '@angular/router';
import { AddAdvanceSalaryComponent } from './add-advance-salary/add-advance-salary.component';

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
export class AdvanceSalaryComponent {


  public advanceSalaries: AdvanceSalary[] | null;
  public searchText: string;
  public page:any;
  public settings: Settings;
  router = inject(Router)
  _snackbar=inject(MatSnackBar)
  settingsService=inject(SettingsService)
  dialog=inject(MatDialog)
  payrollService=inject(PayrollService)
 

  dataSource : AdvanceSalary[]=[]
  ngOnInit() {
    this.settings = this.settingsService.settings;
    this.getAdvanceSalary();
    this.payrollService.getAdvanceSalary().subscribe((res)=>{
      this.dataSource = res;
    })
  }
  openAddAdvanceLeave(){
    this.router.navigate(['/login/payroll/advance-salary/add'])
  }
  
  public getAdvanceSalary(): void {
    this.payrollService.getAdvanceSalary().subscribe((advanceSalary: any) =>{
      this.advanceSalaries = advanceSalary
      console.log('this.advanceSalaries',this.advanceSalaries);
      
    });
  }
  applyFilter(filterValue: string) {
    // this.dataSource.filter = filterValue.trim().toLowerCase();
  }
  // public addTeam(user:User){
  //   this.teamService.addTeam(user).subscribe(user => this.getAdvanceSalary());
  // }
  
  public openRoleDialog(salary: any){
    console.log(salary);
    
    let dialogRef = this.dialog.open(AddAdvanceSalaryComponent, {
      data: {salary: salary}
    });
    dialogRef.afterClosed().subscribe(user => {
      this.getAdvanceSalary()
    });
  }

  public onPageChanged(event: any){
    this.page = event;
    // this.getTeam();
    if(this.settings.fixedHeader){
        document.getElementById('main-content')!.scrollTop = 0;
    }
    else{
        document.getElementsByClassName('mat-drawer-content')[0].scrollTop = 0;
    }
  }

  public openUserDialog(user: any){
    let dialogRef = this.dialog.open(TeamDialogueComponent, {
      data: user
    });
    dialogRef.afterClosed().subscribe(user => {
      // if(user){
      //     (user.id) ? this.updateUser(user) : this.addUser(user);
      // }
    });
  }

  delete!: Subscription;
  deleteTeam(id: number){
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


