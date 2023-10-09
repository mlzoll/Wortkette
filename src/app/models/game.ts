export interface Game {
    id: string;
    subject: string;
    pendingItem: string;
    itemChain: string [];
    state: GameState;
    myPlayerId: string;
    opponentPlayerId: string;
  }

  export interface newGameResponse{
    gameId : string;
    playerOneId: string;
    playerTwoId: string;
  }

  export interface gameResponse{
    callAccepted : boolean;
    currentPlayerId : string;
  }

  export interface joinGameResponse{
    currentPlayerId : string;
    topic: string;
    words: string [];
  }
 


  export enum GameState {
    New = 1,
    Created,
    OnGoing,
    Stopped
  }