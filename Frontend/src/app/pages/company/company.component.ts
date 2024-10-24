import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { Settings, SettingsService } from '../../services/settings.service';

import { UserDialogComponent } from '../users/user-dialog/user-dialog.component';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxPaginationModule } from 'ngx-pagination';
import { PipesModule } from '../../theme/pipes/pipes.module';
import { UsersService } from '../../services/users.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TeamService } from '@services/team.service';
import { Team } from '../../common/interfaces/team';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
// import { TeamDialogueComponent } from './team-dialogue/team-dialogue.component';
import { User } from '../../common/interfaces/user';
import { Subscription } from 'rxjs';
import { DeleteDialogueComponent } from '../../theme/components/delete-dialogue/delete-dialogue.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Company } from '../../common/interfaces/company';
import { CompanyService } from '@services/company.service';
import { AddCompanyComponent } from './add-company/add-company.component';
import { Router } from '@angular/router';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
@Component({
  selector: 'app-company',
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
    NgxPaginationModule,
    MatSlideToggleModule,
    MatCardModule,
    NgxPaginationModule,
    PipesModule,
    DatePipe,
    UserDialogComponent,
    MatDividerModule,
    MatPaginatorModule,
    MatPaginator
  ],
  templateUrl: './company.component.html',
  styleUrl: './company.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [UsersService]
})
export class CompanyComponent {
  displayedColumns: string[] = ['position', 'Name', 'Supplier', 'Customer', 'action'];
  router=inject(Router)
  public companies: Company[] | null;
  public supplierCompanies: Company[] | null;
  public customerCompanies: Company[] | null;
  public searchText: string;
  public page:any;
  public settings: Settings;
  _snackbar=inject(MatSnackBar)
  settingsService=inject(SettingsService)
  dialog=inject(MatDialog)
  companyService=inject(CompanyService)


  
  dataSource : Company[]=[]
  ngOnInit() {
    this.settings = this.settingsService.settings;
    this.getCompany();

  }
goToCompany(companyId: number) {
  console.log('companyId', companyId);
  
    this.router.navigate(['/login/company/viewCompany/', companyId.toString()]);
  }
  pageSize = 10;
  currentPage = 1;
  totalItems = 0;
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.getCompany();
  }

  search(event: Event){
    this.searchText = (event.target as HTMLInputElement).value.trim()
    this.getCompany()
  }

  public getCompany(): void {
   
    this.companyService.getCompany(this.searchText, this.currentPage, this.pageSize).subscribe((res: any) =>{
      this.companies = res.items
      this.totalItems = res.count;
      console.log(this.companies);
      
    });
  }

  applyFilter(filterValue: string) {

  }
  public addTeam(user:User){
    this.companyService.addCompany(user).subscribe(user => this.getCompany());
  }

  public openCompany(company: any) {
    this.router.navigateByUrl('/login/company/addCompany', {
      state: { company: company }
    });
  }



  delete!: Subscription;
  deleteCompany(id: number){
    let dialogRef = this.dialog.open(DeleteDialogueComponent, {});
    dialogRef.afterClosed().subscribe(res => {
      if(res){
        this.delete = this.companyService.deleteCompany(id).subscribe(res => {
          this._snackbar.open("Company deleted successfully...","" ,{duration:3000})
          this.getCompany()
        });
      }
    });
  }

}



