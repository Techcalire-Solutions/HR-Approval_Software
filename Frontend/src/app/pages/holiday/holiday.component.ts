/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { HolidayService } from '@services/holiday.service';
import { Subscription } from 'rxjs';
import { Holidays } from '../../common/interfaces/leaves/holidays';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { DeleteDialogueComponent } from '../../theme/components/delete-dialogue/delete-dialogue.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddHolidayComponent } from './add-holiday/add-holiday.component';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MY_FORMATS } from '../users/personal-details/personal-details.component';
import { DeleteConfirmationComponent } from './delete-confirmation/delete-confirmation.component';

@Component({
  selector: 'app-holiday',
  standalone: true,
  imports: [MatButtonToggleModule, MatFormFieldModule, MatPaginatorModule, CommonModule, MatIconModule, MatInputModule,
    MatSelectModule, MatDatepickerModule
  ],
  templateUrl: './holiday.component.html',
  styleUrl: './holiday.component.scss',
    providers: [provideMomentDateAdapter(MY_FORMATS), DatePipe],
})
export class HolidayComponent implements OnInit, OnDestroy{
  yearList: number[] = [];
  currentYear: number | null;
  selectedDate: Date | null = null;
  searchText : string = '';

  ngOnInit(): void {
    this.getHolidays();

    this.currentYear = new Date().getFullYear();
    // Generate a list of years, e.g., from 2000 to the current year
    for (let year = this.currentYear; year >= 2000; year--) {
      this.yearList.push(year);
    }
  }

  holidaySub!: Subscription;
  private readonly holidayService = inject(HolidayService);
  holidays: Holidays[] = [];
  getHolidays(){
    this.holidaySub = this.holidayService.getAllHolidays().subscribe((holidays: any) => {
      this.holidays = holidays;
    });
  }

  openDialog(data: any | null){
    const dialogRef = this.dialog.open(AddHolidayComponent, {
      data: data
    });
    dialogRef.afterClosed().subscribe(() => {
      this.getHolidays()
    });
  }

  private deleteSub: Subscription;
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private dialogSub!: Subscription;
  delete(id: number){
    const dialogRef = this.dialog.open(DeleteDialogueComponent, {});
    this.dialogSub = dialogRef.afterClosed().subscribe(res => {
      if(res){
        this.deleteSub = this.holidayService.deleteHolidays(id).subscribe(() => {
          this.getHolidays();
          this.snackBar.open("Holiday deleted successfully...","" ,{duration:3000})
        })
      }
    });
  }

  search(event: Event){
    this.currentYear = null;
    this.selectedDate = null;
    const searchText = (event.target as HTMLInputElement).value.trim()
    this.holidaySub = this.holidayService.getHolidayByName(searchText).subscribe((holidays: any) => {
      this.holidays = holidays;
    });
  }

  filterSub!: Subscription;
  private readonly datePipe = inject(DatePipe);
  onDateChange(event: any) {
    this.currentYear = null;
    this.searchText = '';
    
    const convertedDate = this.datePipe.transform(event, 'yyyy-MM-dd');
    this.holidaySub = this.holidayService.getHolidayByDate(convertedDate).subscribe(res => {
      this.holidays = res
    });
  }

  onYearChange(event: any) {
    this.selectedDate = null;
    this.searchText = '';
    const selectedYear = event.value;
    this.holidaySub = this.holidayService.getHolidayByYear(selectedYear).subscribe(res => {
      this.holidays = res
    });
  }

  deleteAll(){
    console.log(this.holidays);
    const ids = this.holidays.map(holiday => holiday.id);
    const dialogRef = this.dialog.open(DeleteConfirmationComponent, {
      data: {
        holidays: this.holidays
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteSub = this.holidayService.deleteHolidaysByYear(ids).subscribe(() => {
          this.snackBar.open("Holidays deleted successfully...","" ,{duration:3000})
          this.getHolidays();
        });
      }else {
        alert('Deletion canceled');
      }
    });
  } 

  ngOnDestroy(): void {
    this.holidaySub?.unsubscribe();
    this.deleteSub?.unsubscribe();
  }

}
