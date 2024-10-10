import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'camelCase',
  standalone: true
})
export class CamelCasePipe implements PipeTransform {

  transform(value: string): string {
    if (!value) return value; // Return value if it's empty

    // Capitalize the first letter of each word except the first one
    return value
      .toLowerCase() // Make the entire string lowercase first
      .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize the first letter of each word
  }
}
