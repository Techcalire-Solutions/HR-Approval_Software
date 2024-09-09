import { Pipe, PipeTransform } from '@angular/core';
import { User } from '../../../common/interfaces/user';

@Pipe({ name: 'UserSearchPipe', pure: false })
export class UserSearchPipe implements PipeTransform {
  transform(value: User[] | null, args?: any): any {
    let searchText = new RegExp(args, 'ig');
    if (value) {
      console.log(value);

      return value.filter(user => {
        if (user.name) {
          return user.name.search(searchText) !== -1;
        }
        else{
          return user.name.search(searchText) !== -1;
        }
      });
    }
  }
}
