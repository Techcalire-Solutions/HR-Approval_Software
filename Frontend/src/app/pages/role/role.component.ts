import { Component, ViewEncapsulation } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RoleService } from '@services/role.service';
import { TablesService, Element } from '@services/tables.service';
import { Role } from '../../common/interfaces/role';
import { User } from '../../common/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { Settings, SettingsService } from '@services/settings.service';
import { UsersService } from '@services/users.service';
import { UserDialogComponent } from '../users/user-dialog/user-dialog.component';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxPaginationModule } from 'ngx-pagination';
import { PipesModule } from '../../theme/pipes/pipes.module';
export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {position: 1, name: 'Sales Executive', weight: 1.0079, symbol: 'H'},
  {position: 2, name: 'Key Account Manger', weight: 4.0026, symbol: 'He'},
  {position: 3, name: 'Authorizer Manger', weight: 6.941, symbol: 'Li'},
  {position: 4, name: 'Finance Executive', weight: 9.0122, symbol: 'Be'},
 
];
@Component({
  selector: 'app-role',
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
    PipesModule,
    DatePipe,
    UserDialogComponent  
  ],
  templateUrl: './role.component.html',
  encapsulation: ViewEncapsulation.None,
  providers: [

    TablesService,
    UsersService
  ]
})
export class RoleComponent {
  public users: User[] | null;
  public searchText: string;
  public page:any;
  public settings: Settings;
  displayedColumns: string[] = ['position', 'name'];
  

  constructor(private tablesService: TablesService,private roleService:RoleService,public settingsService: SettingsService,
    public dialog: MatDialog,
    public usersService: UsersService){
this.settings = this.settingsService.settings;
}

  dataSource : Role[]=[]
  ngOnInit(){
    this.getUsers();
    this.roleService.getRole().subscribe((res)=>{
       this.dataSource = res;
  })}
  public getUsers(): void {
    this.users = null; //for show spinner each time
    this.usersService.getUser().subscribe((users: any) =>{
      console.log(users);

      this.users = users
    });
  }
  public addUser(user:User){
    this.usersService.addUser(user).subscribe(user => this.getUsers());
  }
  public updateUser(user:User){
    this.usersService.updateUser(user).subscribe(user => this.getUsers());
  }
  public deleteUser(user:User){
    this.usersService.deleteUser(user.id).subscribe(user => this.getUsers());
  }


  public onPageChanged(event: any){
    this.page = event;
    this.getUsers();
    if(this.settings.fixedHeader){
        document.getElementById('main-content')!.scrollTop = 0;
    }
    else{
        document.getElementsByClassName('mat-drawer-content')[0].scrollTop = 0;
    }
  }

  public openUserDialog(user: any){
    let dialogRef = this.dialog.open(UserDialogComponent, {
      data: user
    });
    dialogRef.afterClosed().subscribe(user => {
      if(user){
          (user.id) ? this.updateUser(user) : this.addUser(user);
      }
    });
  }



  applyFilter(filterValue: string) { 
    // this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
