# ewf-coo-matcher

This is the reference implementation of a matcher for the certificate of origin. 

## install
For install simply run <code>npm install</code>. If there is an error during the installation with web3 simply run the <code>npm install</code> command again and it should be working afterwards.

## usage
The matcher gets started with the <code>npm start COO-CONTRACT-ADDRESS</code> command where COO-CONTRACT-ADDRESS is the address of the CoO.sol contract in the chain. The CoO-contract for event horizon 2018 is at 0x3f02292B92158CA38fF77E6eE945747daD36921a on Tobalaba. Otherwise insert the CoO-address you got from your truffle migrate command (see ewf-coo-ui) for more details on how to deploy it on a private network. 