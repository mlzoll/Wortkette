import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LobbyComponent } from './lobby/lobby.component';
import { GameComponent } from './game/game.component';


const routes: Routes = [
  {
    // Standardroute: Umleitung auf '/lobby'
    path: '',
    redirectTo: 'lobby',
    pathMatch: 'full'
},
{ path: 'lobby', component: LobbyComponent  },
 { path: 'game/:gameid/:playerid', component: GameComponent },
 {path: "**", component: LobbyComponent},
];



@NgModule({
  imports: [RouterModule.forRoot(routes,{
    useHash: true
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
