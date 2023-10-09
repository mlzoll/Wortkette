import { Component, Input, OnInit } from '@angular/core';
import { Game, GameState, joinGameResponse, gameResponse } from '../models/game';
import { Subscription } from 'rxjs';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import * as signalR from '@microsoft/signalr';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  game: Game = {
    id: "",
    subject: '',
    itemChain: [],
    pendingItem: '',
    state: GameState.Created,
    myPlayerId: "",
    opponentPlayerId: ""
  };

  loginfo:string [] =[];
  message: string = '';
  isMessageVisible: boolean = false;
  lastItem:string ='';
  itIsMyTurn: boolean = false;
  itIsJudgeState :boolean = false;
  isGameOngoing: boolean = false;
  private ParamSubscription: Subscription;
  private params: any;



  /*
try_files $uri $uri/ /index.html;

   server {
    .....
 
 location / {
     root /path_to_html;
     index index.html index.htm;
     try_files $uri $uri/ /index.html =404;
 }
 .......
 }


  */



  connection: signalR.HubConnection = new signalR.HubConnectionBuilder()
    // .configureLogging(signalR.LogLevel.Trace)
    .withUrl("https://wortkettebff.azurewebsites.net/GameHub")
    .build();
   // https://wortkette.pcfres-intra.dev.datev.de/

  constructor(private router: Router, private readonly route: ActivatedRoute,) {

    this.ParamSubscription = this.route.paramMap.subscribe(async (params: ParamMap) => {
      this.params = { ...params };
      this.params = this.params.params;
      if (!(this.params && this.params.gameid && this.params.playerid)) {
        this.showMessage('Es fehlen Daten (gameid und/oder playerid) um eine Verbindung zum Backend aufzubauen.');

      }
      else {
        this.game.id = this.params.gameid;
        this.game.myPlayerId = this.params.playerid;
        await this.connection.start();
        try {
          this.connection.on('WordPending', (word, currentPlayerId) => this.onWordPending(word, currentPlayerId));
          this.connection.on('PendingWordRejected', currentPlayerId => this.onWordRejected(currentPlayerId));
          this.connection.on('PendingWordAccepted', currentPlayerId => this.onWordAccepted(currentPlayerId));
          this.connection.on('GameClosed', playerId =>
          {
            this.onGameClosedBy(playerId)
          }
         
           )
          let joinGameTask = this.connection.invoke('JoinGame', this.game.id, this.game.myPlayerId)
          await joinGameTask.then(e => {

            console.log(e)
            var response = e as joinGameResponse;
            if (response) {
              this.game.state = GameState.OnGoing;
              this.isGameOngoing = true;
              this.game.subject = response.topic;
              this.game.itemChain = response.words;
              if (this.game.itemChain && this.game.itemChain.length > 0) {
                this.lastItem = this.game.itemChain[this.game.itemChain.length - 1]
              }
              this.checkIfItIsItMyTurn(response.currentPlayerId);
            }
          }

          );
        } catch (err) {
          console.log(err);
          this.showMessage('Oh noooo: ' + err);
        }
      }
    });

  }


  clearMessage(): void {
    this.isMessageVisible = false;
    this.message = '';
  }

  showMessage(message: string): void {
    this.isMessageVisible = true;
    this.message = message;
  }

  checkIfItIsItMyTurn(playerId: string) {
    this.itIsMyTurn = false;
    if (this.game.state !== GameState.OnGoing){
      this.isGameOngoing = false;
      return;
    }
   

    if (playerId === undefined || playerId === '') {
      return;
    }
    if (playerId === this.game.myPlayerId) {
      this.itIsMyTurn = true;
    }
    return;
  }


  async onEndGame(): Promise<void> {   
    this.clearMessage();
    debugger;
    let leaveGameTask = this.connection.invoke('CloseGame', this.game.id, this.game.myPlayerId);
    await leaveGameTask.then(e => {
      this.game.state = GameState.Stopped;   
      this.router.navigate(['/lobby'], { relativeTo: this.route });
    }, error => this.showMessage(error)
    );
  }

  async onSendWord(): Promise<void> {
    this.loginfo.push('onSendWord from '+this.game.myPlayerId);
    this.clearMessage();
    let sendWordTask = this.connection.invoke('SendPendingWord', this.game.id, this.game.myPlayerId, this.game.pendingItem);
    await sendWordTask.then(e => {
      var response = e as gameResponse;
    
      this.loginfo.push('currentPlayerId '+response.currentPlayerId);
      if (response && response.callAccepted) {
        this.checkIfItIsItMyTurn(response.currentPlayerId);
      } else {
        this.showMessage("Der Wort wurde technisch abgelehnt. Validation Failed.");
      }
    }, error => this.showMessage(error)
    );
  }


  async onAcceptWord(): Promise<void> {
    this.loginfo.push('onAcceptWord from '+this.game.myPlayerId);
    this.clearMessage();
    let acceptWordTask = this.connection.invoke('AcceptPendingWord', this.game.id, this.game.myPlayerId);
    await acceptWordTask.then(e => {    
     
      var response = e as gameResponse;
     debugger;
      if (response && response.callAccepted) {
       this.onWordAccepted(response.currentPlayerId);
        this.checkIfItIsItMyTurn(response.currentPlayerId);
      } else {
        this.showMessage("Der Wort wurde technisch abgelehnt. Validation Failed.");
      }}
    );
  }
  
  async onRejectWord(): Promise<void> {
    this.loginfo.push(' onRejectWord from '+this.game.myPlayerId);
    this.clearMessage();
    let rejectWordTask = this.connection.invoke('RejectPendingWord', this.game.id, this.game.myPlayerId);
    await rejectWordTask.then(e => {    
      var response = e as gameResponse;
      console.log(e)
      if (response && response.callAccepted) {
        this.checkIfItIsItMyTurn(response.currentPlayerId);
      } else {
        this.showMessage("Der Wort wurde technisch abgelehnt. Validation Failed.");
      }}
    );
  }


  ngOnInit(): void {
  }



  onGameClosedBy(playerId: any): any {
    this.loginfo.push('SIGNALR onGameClosedBy: '+playerId);
  

    this.game.state = GameState.Stopped;   
this.message = 'Game over. Game stopped by opponent.';
alert(this.message);
this.isMessageVisible = true;
    this.checkIfItIsItMyTurn(playerId);
   
  }


  onWordAccepted(currentPlayerId: any): any {

    this.loginfo.push(' SIGNALR onWordAccepted me: '+this.game.myPlayerId+' next: ' +currentPlayerId);
    // in das Array einhängen
    this.game.itemChain.push(this.game.pendingItem);
    this.lastItem = this.game.pendingItem;
    this.game.pendingItem = '';
    this.itIsJudgeState = false;
    this.checkIfItIsItMyTurn(currentPlayerId);
    this.showMessage('Word accepted :)');
  }





  onWordRejected(currentPlayerId: any): any {
    this.loginfo.push('SIGNALR onWordRejected me: '+this.game.myPlayerId+' next: ' +currentPlayerId);

    this.game.pendingItem = '';
    this.showMessage('Word rejected :(');
    this.itIsJudgeState = false;
    this.checkIfItIsItMyTurn(currentPlayerId);
  }




  onWordPending(word: any, currentPlayerId: any): any {
    this.loginfo.push('<br/> SIGNALR onWordPending me: '+this.game.myPlayerId+' next: ' +currentPlayerId);

    this.clearMessage();
    this.game.pendingItem = word;
    this.checkIfItIsItMyTurn(currentPlayerId);
    if(this.itIsMyTurn){
      this.itIsJudgeState = true;
    }else{
      this.itIsJudgeState = false;
    }
  }
}
