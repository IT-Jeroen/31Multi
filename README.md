# 31Multi
Multiplayer version of 31 Single Card Game. Using Peer-JS for P2P data transfer.


[![button_play](https://github.com/IT-Jeroen/31Single/assets/55962983/302318c4-8570-4a8b-8f07-74cda87b6c4f)](https://it-jeroen.github.io/31Multi/) 


Load index.html into your browser(s).
Enter a name into the input field and click next to enter the waiting room
After searching for the hardcode hostName, it will either find a host and make you a client
or it will not find a host and make you the host (And print a Peer-JS error to the console).
The waiting room will show the names of the host and all connected players.
Only the host will have a start game button
The start game button will setup the game. It will create the playfield (table), and deal cards to each player. Each non auto player will be able to interact with the open cards on the table within the browser



