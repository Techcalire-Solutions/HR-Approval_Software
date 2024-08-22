import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { analytics } from '@data/dashboard-data';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    FlexLayoutModule,
    MatCardModule,
    NgxChartsModule
  ],
  templateUrl: './analytics.component.html'
})
export class AnalyticsComponent implements OnInit {
  public analytics: any[];
  public showXAxis = true;
  public showYAxis = true;
  public gradient = false;
  public showLegend = false;
  public showXAxisLabel = false;
  public xAxisLabel = 'Year';
  public showYAxisLabel = false;
  public yAxisLabel = 'Profit';
  public colorScheme: any = {
    domain: ['#283593', '#039BE5', '#FF5252']
  }; 
  public autoScale = true;
  public roundDomains = true;
  @ViewChild('resizedDiv') resizedDiv: ElementRef;
  public previousWidthOfResizedDiv:number = 0; 

  constructor() { }

  ngOnInit() {
    this.analytics = analytics; 
  }

  onSelect(event: any) {
    console.log(event);
  }

  ngAfterViewChecked() {    
    if(this.previousWidthOfResizedDiv != this.resizedDiv.nativeElement.clientWidth){
      this.analytics = [...analytics];
    }
    this.previousWidthOfResizedDiv = this.resizedDiv.nativeElement.clientWidth;
  }

}