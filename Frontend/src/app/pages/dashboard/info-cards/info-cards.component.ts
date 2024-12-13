import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Settings, SettingsService } from '@services/settings.service';
import { Subscription } from 'rxjs';
import { InvoiceService } from '@services/invoice.service';

@Component({
  selector: 'app-info-cards',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    NgxChartsModule
  ],
  templateUrl: './info-cards.component.html',
  styleUrl: './info-cards.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class InfoCardsComponent implements OnInit, OnDestroy {
  user: number;
  ngOnInit(){
    const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)

    this.user = user.id;

    let roleId = user.role
    this.getRoleById(roleId)
    this.getPiCOunt()
  }

  invoiceService = inject(InvoiceService)
  roleSub!: Subscription;
  roleName!: string;
  getRoleById(id: number){
    this.roleSub = this.invoiceService.getRoleById(id).subscribe(role => {
      this.roleName = role.roleName;   
    })
  }

  ngOnDestroy(){
    this.roleSub?.unsubscribe();
  }

  counts: any;
  countSub!: Subscription;
  getPiCOunt(){
    this.countSub = this.invoiceService.getPICount().subscribe(res =>{
      this.counts = res.counts;
    })
  }

}
