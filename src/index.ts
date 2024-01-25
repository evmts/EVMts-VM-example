// this contract is deployed to OP mainnet
// EVMts compiles bytecode to run scripts for .s.sol files that aren't deployed to a chain
import { ERC721 } from '@openzeppelin/contracts/token/ERC721/ERC721.sol'
import { AddNumbers } from '@/contracts/AddScript.s.sol'
import { createMemoryClient } from 'tevm'

// Create an instance of the EVM in js that runs in Node or the browser
const vm = await createMemoryClient({
	fork: {
		url: 'https://goerli.optimism.io'
	}
})

// runContractCall calls a contract method that is deployed to the forked chain
await vm.runContractCall(
	ERC721.withAddress("0x1df10ec981ac5871240be4a94f250dd238b77901").read.balanceOf('0x8f0ebdaa1cf7106be861753b0f9f5c0250fe0819'),
).then(console.log)

// A script is a contract that is not deployed
// run script will run the script in our local vm
// this is useful for many reasons including when you want to read data
// and no appropriate view function is deployed
await vm.script(
	AddNumbers.read.add(409n, 31n)
).then(console.log)
