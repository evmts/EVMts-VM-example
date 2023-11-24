import { expect, test } from 'bun:test'
import { EVMts } from '@evmts/vm'

import { AddNumbers } from '@/contracts/AddScript.s.sol'
import { ERC721 } from '@openzeppelin/contracts/token/ERC721/ERC721.sol'
import { Fs } from '@evmts/precompiles'
import { existsSync, rmSync } from 'fs'

test('should run a contract call', async () => {
	const vm = await EVMts.create({
		fork: {
			url: 'https://goerli.optimism.io'
		}
	})
	const balance = await vm.runContractCall({
		...ERC721.read.balanceOf('0x8f0ebdaa1cf7106be861753b0f9f5c0250fe0819'),
		contractAddress: "0x1df10ec981ac5871240be4a94f250dd238b77901"
	})
	expect(balance).toEqual({
		gasUsed: 2634n,
		data: 1n,
		logs: [],
	})
})

test('should run a contract call', async () => {
	const vm = await EVMts.create()
	const sum = await vm.runScript(
		AddNumbers.read.add(389n, 31n)
	)
	expect(sum).toEqual({
		gasUsed: 927n,
		data: 420n,
		logs: [],
	})
})

test('should be able to write to file system with Fs precompile', async () => {
	const vm = await EVMts.create({
		customPrecompiles: [Fs.precompile]
	})
	await vm.runContractCall({
		contractAddress: Fs.address,
		...Fs.contract.write.writeFile('test.txt', 'hello world')
	})
	expect(existsSync('test.txt')).toBe(true)
	rmSync('test.txt')
})
