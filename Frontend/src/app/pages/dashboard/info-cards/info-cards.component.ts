import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxChartsModule } from '@swimlane/ngx-charts'; 
import { Settings, SettingsService } from '@services/settings.service';
import { customers, orders, products, refunds } from '@data/dashboard-data';

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
export class InfoCardsComponent implements OnInit {
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

  ngOnInit(){
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
