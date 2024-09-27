import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Settings, SettingsService } from '@services/settings.service';
import { Subscription } from 'rxjs';
import { InvoiceService } from '@services/invoice.service';
import { PerformaInvoice } from '../../../common/interfaces/performaInvoice';

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
  public colorScheme: any = {
    domain: ['#999']
  };
  public autoScale = true;
  @ViewChild('resizedDiv') resizedDiv: ElementRef;
  public previousWidthOfResizedDiv:number = 0;
  public settings: Settings;
  constructor(public settingsService: SettingsService) {
    this.settings = this.settingsService.settings;
  }

  user: number;
  ngOnInit(){
    const token: any = localStorage.getItem('token')
    let user = JSON.parse(token)

    this.user = user.id;

    let roleId = user.role
    this.getRoleById(roleId)
  }

  invoiceService = inject(InvoiceService)
  roleSub!: Subscription;
  roleName!: string;
  getRoleById(id: number){
    this.roleSub = this.invoiceService.getRoleById(id).subscribe(role => {
      this.roleName = role.roleName;   
      this.getPendingApprovals();
    })
  }

  ngOnDestroy(){
    this.roleSub?.unsubscribe();
  }

  ngAfterViewChecked() {
    if(this.previousWidthOfResizedDiv != this.resizedDiv.nativeElement.clientWidth){  }
    this.previousWidthOfResizedDiv = this.resizedDiv.nativeElement.clientWidth;
  }

  invoiceSubscriptions: Subscription;
  paCount: number;
  getPendingApprovals(){
    let apiCall;
    if (this.roleName === 'Sales Executive') {
      apiCall = this.invoiceService.getPIBySP('GENERATED');
    } else if (this.roleName === 'Team Lead') {
      apiCall = this.invoiceService.getPIBySP('GENERATED');
    } else if (this.roleName === 'Key Account Manager') {
      apiCall = this.invoiceService.getPIByKAM('GENERATED');
    } else if (this.roleName === 'Manager') {
      apiCall = this.invoiceService.getPIByAM('GENERATED');
    } else if (this.roleName === 'Accountant') {
      apiCall = this.invoiceService.getPIByMA('GENERATED');
    } else if (this.roleName === 'Administrator') {
      apiCall = this.invoiceService.getPIByAdmin('GENERATED');
    }

    if (apiCall) {
      this.invoiceSubscriptions = apiCall.subscribe((res: any) => {
        this.paCount = res.length;
        this.getKamApproved();
      })
    } 
  }

  kamVerCount!: number;
  getKamApproved(){
    let apiCall;
    
    if (this.roleName === 'Sales Executive') {
      apiCall = this.invoiceService.getPIBySP('KAM VERIFIED');
    } else if (this.roleName === 'Team Lead') {
      apiCall = this.invoiceService.getPIBySP('KAM VERIFIED');
    } else if (this.roleName === 'Key Account Manager') {
      apiCall = this.invoiceService.getPIByKAM('KAM VERIFIED');
    } else if (this.roleName === 'Manager') {
      apiCall = this.invoiceService.getPIByAM('KAM VERIFIED');
    } else if (this.roleName === 'Accountant') {
      apiCall = this.invoiceService.getPIByMA('KAM VERIFIED');
    } else if (this.roleName === 'Administrator') {
      apiCall = this.invoiceService.getPIByAdmin('KAM VERIFIED');
    }

    if (apiCall) {
      this.invoiceSubscriptions = apiCall.subscribe((res: any) => {
        this.getAmApproved()
        this.kamVerCount = res.length;
      })
    } 
  }

  amVerCount!: number;
  getAmApproved(){
    let apiCall;
    
    if (this.roleName === 'Sales Executive') {
      apiCall = this.invoiceService.getPIBySP('AM VERIFIED');
    } else if (this.roleName === 'Team Lead') {
      apiCall = this.invoiceService.getPIBySP('AM VERIFIED');
    } else if (this.roleName === 'Key Account Manager') {
      apiCall = this.invoiceService.getPIByKAM('AM VERIFIED');
    } else if (this.roleName === 'Manager') {
      apiCall = this.invoiceService.getPIByAM('AM VERIFIED');
    } else if (this.roleName === 'Accountant') {
      apiCall = this.invoiceService.getPIByMA('AM VERIFIED');
    } else if (this.roleName === 'Administrator') {
      apiCall = this.invoiceService.getPIByAdmin('AM VERIFIED');
    }

    if (apiCall) {
      this.invoiceSubscriptions = apiCall.subscribe((res: any) => {
        this.getKamRejected()
        this.amVerCount = res.length;
      })
    } 
  }

  kamRejCount: number = 0;
  getKamRejected(){
    let apiCall;
    
    if (this.roleName === 'Sales Executive') {
      apiCall = this.invoiceService.getPIBySP('KAM REJECTED');
    } else if (this.roleName === 'Team Lead') {
      apiCall = this.invoiceService.getPIBySP('KAM REJECTED');
    } else if (this.roleName === 'Key Account Manager') {
      apiCall = this.invoiceService.getPIByKAM('KAM REJECTED');
    } else if (this.roleName === 'Manager') {
      apiCall = this.invoiceService.getPIByAM('KAM REJECTED');
    } else if (this.roleName === 'Accountant') {
      apiCall = this.invoiceService.getPIByMA('KAM REJECTED');
    } else if (this.roleName === 'Administrator') {
      apiCall = this.invoiceService.getPIByAdmin('KAM REJECTED');
    }

    if (apiCall) {
      this.invoiceSubscriptions = apiCall.subscribe((res: any) => {
        this.getAmRejected()
        this.kamRejCount = res.length;
      })
    } 
  }

  amRejCount: number = 0;
  getAmRejected(){
    let apiCall;
    
    if (this.roleName === 'Sales Executive') {
      apiCall = this.invoiceService.getPIBySP('AM REJECTED');
    } else if (this.roleName === 'Team Lead') {
      apiCall = this.invoiceService.getPIBySP('AM REJECTED');
    } else if (this.roleName === 'Key Account Manager') {
      apiCall = this.invoiceService.getPIByKAM('AM REJECTED');
    } else if (this.roleName === 'Manager') {
      apiCall = this.invoiceService.getPIByAM('AM REJECTED');
    } else if (this.roleName === 'Accountant') {
      apiCall = this.invoiceService.getPIByMA('AM REJECTED');
    } else if (this.roleName === 'Administrator') {
      apiCall = this.invoiceService.getPIByAdmin('AM REJECTED');
    }

    if (apiCall) {
      this.invoiceSubscriptions = apiCall.subscribe((res: any) => {
        this.getCompleted()
        this.amRejCount = res.length;
      })
    } 
  }

  compCount: number = 0;
  getCompleted(){
    let apiCall;
    
    if (this.roleName === 'Sales Executive') {
      apiCall = this.invoiceService.getPIBySP('BANK SLIP ISSUED');
    } else if (this.roleName === 'Team Lead') {
      apiCall = this.invoiceService.getPIBySP('BANK SLIP ISSUED');
    } else if (this.roleName === 'Key Account Manager') {
      apiCall = this.invoiceService.getPIByKAM('BANK SLIP ISSUED');
    } else if (this.roleName === 'Manager') {
      apiCall = this.invoiceService.getPIByAM('BANK SLIP ISSUED');
    } else if (this.roleName === 'Accountant') {
      apiCall = this.invoiceService.getPIByMA('BANK SLIP ISSUED');
    } else if (this.roleName === 'Administrator') {
      apiCall = this.invoiceService.getPIByAdmin('BANK SLIP ISSUED');
    }

    if (apiCall) {
      this.invoiceSubscriptions = apiCall.subscribe((res: any) => {
        this.compCount = res.length;
      })
    } 
  }

}
