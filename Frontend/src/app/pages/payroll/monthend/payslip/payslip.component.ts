/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PayrollService } from '@services/payroll.service';
import { CommonModule } from '@angular/common';
import { MonthlyPayroll } from '../../../../common/interfaces/payRoll/monthlyPayroll';
import { Payroll } from '../../../../common/interfaces/payRoll/payroll';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-payslip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payslip.component.html',
  styleUrl: './payslip.component.scss'
})
export class PayslipComponent implements OnInit, OnDestroy{
  ngOnDestroy(): void {
    this.paySlipSub?.unsubscribe();
    this.payrollSub?.unsubscribe();
  }
  ngOnInit(): void {
    this.getPaySlip();
  }

  logo = 'img/OAC.jpg';
  private payroleService = inject(PayrollService);
  private route = inject(ActivatedRoute);
  payroll: MonthlyPayroll;
  workingDays: number;
  paySlipSub!: Subscription;
  getPaySlip(){
    this.paySlipSub = this.payroleService.getMonthlyPayrollById(this.route.snapshot.params['id']).subscribe(payroll => {
      this.workingDays = payroll.daysInMonth - payroll.leaveDays
      this.payroll = payroll;
      this.getPayroll();
    })
  }

  fullValue: Payroll;
  payrollSub!: Subscription;
  getPayroll(){
    this.payrollSub = this.payroleService.getPayrollDetailsByUserId(this.payroll.userId).subscribe(payroll =>{
      this.fullValue = payroll;
    });
  }

  private toNumber(value: string | number): number {
    return Number(value) || 0;
  }

  calculateTotalEarnings(): number {
    return (
        this.toNumber(this.payroll.basic) +
        this.toNumber(this.payroll.hra) +
        this.toNumber(this.payroll.specialAllowance) +
        this.toNumber(this.payroll.conveyanceAllowance) +
        this.toNumber(this.payroll.lta) +
        this.toNumber(this.payroll.ot) +
        this.toNumber(this.payroll.incentiveDeduction) +
        this.toNumber(this.payroll.payOut)
    );
  }

  calculateTotalDeductions(): number {
      return (
          this.toNumber(this.payroll.pfDeduction) +
          this.toNumber(this.payroll.tds) +
          this.toNumber(this.payroll.advanceAmount) +
          this.toNumber(this.payroll.leaveDeduction) +
          this.toNumber(this.payroll.esi) +
          this.toNumber(this.payroll.incentiveDeduction)
      );
  }
  
  downloadPDF() {
    const element: HTMLElement = document.querySelector('.payroll-container')!;
    const logoElement = document.querySelector('.logo') as HTMLElement;
    const headerElement = document.querySelector('.address') as HTMLElement;
    if (logoElement) {
      logoElement.style.width = '200px'; 
    }
  
    if (headerElement) {
      headerElement.style.textAlign = 'center'; 
    }
  
    const excludedElements = document.querySelectorAll('.exclude-from-pdf');
    excludedElements.forEach((el) => {
      (el as HTMLElement).style.display = 'none';
    });
  
    element.classList.add('increase-font-size');
  
    html2canvas(element).then((canvas: any) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
  
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`Payslip_${this.payroll.user.name}_${this.payroll.payedFor}.pdf`);
  
      excludedElements.forEach((el) => {
        (el as HTMLElement).style.display = '';
      });
  
      element.classList.remove('increase-font-size');

      if (logoElement) {
        logoElement.style.width = '';
      }
  
      if (headerElement) {
        headerElement.style.textAlign = '';
      }
    });
  }
  
  getAmountInWords(): string {
    return this.convertNumberToWords(this.payroll.toPay);
  }

  convertNumberToWords(amount: any): string {
    if (isNaN(amount) || amount === null || amount === undefined) {
        return "Invalid amount";
    }

    amount = Number(amount); // Ensure the amount is a number

    if (amount === 0) return "zero";

    const words = [
        "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
        "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
        "seventeen", "eighteen", "nineteen"
    ];
    const tens = [
        "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"
    ];
    const scales = ["", "thousand", "million", "billion"];

    let word = "";

    function getWord(n: number, scale: string): string {
        let res = "";
        if (n > 99) {
            res += words[Math.floor(n / 100)] + " hundred ";
            n %= 100;
        }
        if (n > 19) {
            res += tens[Math.floor(n / 10)] + " ";
            n %= 10;
        }
        if (n > 0) {
            res += words[n] + " ";
        }
        return res.trim() + (scale ? " " + scale : "");
    }

    const [integerPart, fractionalPart] = amount.toFixed(2).split('.').map(Number);

    // Convert integer part
    let scaleIndex = 0;
    let integerWord = "";
    let tempIntPart = integerPart;

    while (tempIntPart > 0) {
        const chunk = tempIntPart % 1000;
        if (chunk > 0) {
            integerWord = getWord(chunk, scales[scaleIndex]) + " " + integerWord;
        }
        tempIntPart = Math.floor(tempIntPart / 1000);
        scaleIndex++;
    }

    // Convert fractional part
    let fractionalWord = "";
    if (fractionalPart > 0) {
        fractionalWord = getWord(fractionalPart, "") + " paise";
    }

    // Combine integer and fractional parts
    word = integerWord.trim();
    if (fractionalWord) {
        word += " and " + fractionalWord;
    }

    return word.trim();
  }

  
}
