import { Component, ElementRef, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { Settings, SettingsService } from '@services/settings.service';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { orders, products, customers, refunds } from '../../../common/dashboard-data';
import { LeaveService } from '@services/leave.service';

@Component({
  selector: 'app-leave-count-cards',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    NgxChartsModule

  ],
  templateUrl: './leave-count-cards.component.html',
  styleUrl: './leave-count-cards.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class LeaveCountCardsComponent {
  public orders: any[];
  public products: any[];
  public customers: any[];
  public refunds: any[];
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
  leaveService = inject(LeaveService)

  leaveCounts: any[] = [];
  userId:number
  ngOnInit(){
    const token: any = localStorage.getItem('token');
    let user = JSON.parse(token);
    const userId = user.id;

    this.leaveService.getLeaveCounts(userId).subscribe(
      (res) => {
        // Check if the response has any leave counts
        if (res && res.length > 0) {
          this.leaveCounts = res; // Use the received leave counts
        } else {
          this.leaveCounts = []; // Set to an empty array if no leaves
        }
      },
      (error) => {
        console.error('Error fetching leave counts:', error);
        this.leaveCounts = []; // Set to an empty array on error
      }
    );
  


    this.orders = orders;
    this.products = products;
    this.customers = customers;
    this.refunds = refunds;
    this.orders = this.addRandomValue('orders');
    this.customers = this.addRandomValue('customers');
  }

  public onSelect(event: any) {
    console.log(event);
  }

  public addRandomValue(param: any) {
    switch(param) {
      case 'orders':
        for (let i = 1; i < 30; i++) {
          this.orders[0].series.push({"name": 1980+i, "value": Math.ceil(Math.random() * 1000000)});
        }
        return this.orders;
      case 'customers':
        for (let i = 1; i < 15; i++) {
          this.customers[0].series.push({"name": 2000+i, "value": Math.ceil(Math.random() * 1000000)});
        }
        return this.customers;
      default:
        return this.orders;
    }
  }

  ngOnDestroy(){
    this.orders[0].series.length = 0;
    this.customers[0].series.length = 0;
  }

  ngAfterViewChecked() {
    if(this.previousWidthOfResizedDiv != this.resizedDiv.nativeElement.clientWidth){
      setTimeout(() => this.orders = [...orders] );
      setTimeout(() => this.products = [...products] );
      setTimeout(() => this.customers = [...customers] );
      setTimeout(() => this.refunds = [...refunds] );
    }
    this.previousWidthOfResizedDiv = this.resizedDiv.nativeElement.clientWidth;
  }

}


