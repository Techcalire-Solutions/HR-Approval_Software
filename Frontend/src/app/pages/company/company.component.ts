/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { Settings, SettingsService } from '../../services/settings.service';

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
import { UsersService } from '../../services/users.service';
import { MatTableModule } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { DeleteDialogueComponent } from '../../theme/components/delete-dialogue/delete-dialogue.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Company } from '../../common/interfaces/company';
import { CompanyService } from '@services/company.service';
import { Router } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { User } from '../../common/interfaces/users/user';
@Component({
  selector: 'app-company',
  standalone: true,
  imports: [
    MatTableModule,
    MatInputModule ,
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
    MatPaginatorModule
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
    });
  }

  public addTeam(user:User){
    this.companyService.addCompany(user).subscribe(_user => this.getCompany());
  }

  public openCompany(company: any) {
    this.router.navigateByUrl('/login/company/addCompany', {
      state: { company: company }
    });
  }



  delete!: Subscription;
  deleteCompany(id: number){
    const dialogRef = this.dialog.open(DeleteDialogueComponent, {});
    dialogRef.afterClosed().subscribe(res => {
      if(res){
        this.delete = this.companyService.deleteCompany(id).subscribe(() => {
          this._snackbar.open("Company deleted successfully...","" ,{duration:3000})
          this.getCompany()
        });
      }
    });
  }

}



