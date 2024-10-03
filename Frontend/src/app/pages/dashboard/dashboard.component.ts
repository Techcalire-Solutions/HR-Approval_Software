import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { InfoCardsComponent } from './info-cards/info-cards.component';
import { MatrixTableComponent } from "./matrix-table/matrix-table.component";
import { InvoiceService } from '@services/invoice.service';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    MatIconModule,
    InfoCardsComponent,
    MatrixTableComponent
],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  invoiceService = inject(InvoiceService)
  user: number;
ngOnInit(){
  const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)

    this.user = user.id;

    let roleId = user.role
    this.getRoleById(roleId)
}
roleSub!: Subscription;
  roleName!: string;
  hradmin: boolean = false;

  getRoleById(id: number){
    this.roleSub = this.invoiceService.getRoleById(id).subscribe(role => {
      this.roleName = role.roleName;

      if(this.roleName === 'HR Administrator' ||this.roleName==='HR') {
        this.hradmin = true;
      }

    })
  }
}
