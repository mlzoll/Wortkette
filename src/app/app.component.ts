import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'WordChainGame';


// Keep me Signed in
public doUnload(): void {
 console.log('end game notification');
}

// Keep me Signed in
public doBeforeUnload(): void {
  // Clear localStorage
  console.log('do before game end');
}

}

