import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {

  transform(value: string | Date): string {
    const now = new Date();
    const date = new Date(value);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(minutes / 1440);

    if (minutes < 60) {

      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    } else if (hours < 24) {

      const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return formattedTime;
    } else if (days < 7) {

      const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
      return date.toLocaleDateString(undefined, options);
    } else {

      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
      return date.toLocaleDateString(undefined, options); 
    }
  }
}
