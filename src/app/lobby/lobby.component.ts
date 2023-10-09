import { Component, OnInit } from '@angular/core';
import { Game, GameState, newGameResponse } from '../models/game';
import { HttpClient as Http, HttpHeaders, HttpResponse } from '@angular/common/http';
import {firstValueFrom} from "rxjs";
import { ActivatedRoute, Router } from '@angular/router';
import {DomSanitizer, SafeHtml, SafeUrl} from '@angular/platform-browser'


@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.css']
})
export class LobbyComponent implements OnInit {

  constructor(private readonly http: Http,    private router: Router,
    private readonly route: ActivatedRoute,  private sanitizer: DomSanitizer) {
}


  
  isStartGameButtonVisible:boolean = false;
  isSendEmailButtonVisible:boolean = false;
  isJoinGameButtonVisible:boolean = false;

  game: Game = {
    id: "",
    subject: 'Tiere',
    itemChain:  [],
    pendingItem : 'Esel',
    state: GameState.New,
    myPlayerId: "",
    opponentPlayerId:""
  };



  async ngOnInit(): Promise<void> {
    this.checkButtonStates();
  }

checkButtonStates():void{
  this.isStartGameButtonVisible = (this.game.state == GameState.New);
  this.isSendEmailButtonVisible = (this.game.state == GameState.Created);
  this.isJoinGameButtonVisible = (this.game.state == GameState.Created);
}



  async onStartGame(): Promise<void> {

    const httpOptions = {
      headers: new HttpHeaders({ 
        'Access-Control-Allow-Origin':'*'
      })
    };

   var data = {
    firstWord : this.game.pendingItem,
    topic : this.game.subject
   };



   //https://wortkettebff.pcfres-intra.dev.datev.de/swagger/index.html

   let response = await firstValueFrom(this.http.post("https://wortkettebff.azurewebsites.net/Game", data, httpOptions)) as newGameResponse;
   this.game.id = response.gameId;
   this.game.myPlayerId = response.playerOneId;
   this.game.opponentPlayerId = response.playerTwoId;
   this.game.state = GameState.Created;
   this.checkButtonStates();
  }


  //https://wortkette.pcfres-intra.dev.datev.de/game/7b54c0dd-6745-4114-befe-fdff11302f1a/dc7ab36b-6715-4d3a-a664-995735e6cbd8
  
    get emailLink(): string {
      const subject = 'Lust auf ne Wortkette?';
      const body = 'https://happy-field-0b4ed2b03.3.azurestaticapps.net/#game/'+this.game.id+'/'+this.game.opponentPlayerId;
  
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return mailtoUrl;
    }


   onJoinGame(): void{
    this.router.navigate(['/game', this.game.id, this.game.myPlayerId ], { relativeTo: this.route });
  }


}

