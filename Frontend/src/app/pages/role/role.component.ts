import { Component } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RoleService } from '@services/role.service';
import { TablesService, Element } from '@services/tables.service';
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
    MatInputModule    
  ],
  templateUrl: './role.component.html',
  providers: [
    TablesService
  ]
})
export class RoleComponent {
  displayedColumns: string[] = ['position', 'name'];
  dataSource = ELEMENT_DATA;

  // public displayedColumns = ['position', 'name'];
  // public dataSource: any; 
  constructor(private tablesService: TablesService,private roleService:RoleService) { 
    // this.dataSource = new MatTableDataSource<Element>(this.tablesService.getData());
  }
  
  ngOnInit(){
    this.roleService.getRole().subscribe((res)=>{
      console.log(res)
  })}


  applyFilter(filterValue: string) { 
    // this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
