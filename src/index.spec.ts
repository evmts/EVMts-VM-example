import { expect, test } from 'bun:test'
import { EVMts } from '@evmts/vm'

import { ERC721 } from '@openzeppelin/contracts/token/ERC721/ERC721.sol'
import { fsPrecompile } from '@evmts/precompiles'
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

test('should run a script that is not deployed', async () => {
	const { AddNumbers } = await import('@/contracts/AddScript.s.sol')
	const vm = await EVMts.create({
		fork: {
			url: 'https://goerli.optimism.io'
		}
	})
	expect(await vm.runScript(AddNumbers.read.add(390n, 30n))).toEqual({
		data: 420n,
		gasUsed: 927n,
		logs: []
	})
})

test('Call precompile from TypeScript', async () => {
	const vm = await EVMts.create({
		customPrecompiles: [fsPrecompile.precompile()]
	})

	await vm.runContractCall({
		contractAddress: fsPrecompile.address,
		...fsPrecompile.contract.write.writeFile('test.txt', 'hello world')
	})

	expect(existsSync('test.txt')).toBe(true)
	expect(
		(await vm.runContractCall({
			contractAddress: fsPrecompile.address,
			...fsPrecompile.contract.read.readFile('test.txt')
		})).data
	).toBe('hello world')

	rmSync('test.txt')
})

test('Call precompile from solidity script', async () => {
	const { fsPrecompile } = await import("@evmts/precompiles")
	const { WriteHelloWorld } = await import("@/contracts/WriteHelloWorld.s.sol")

	const vm = await EVMts.create({
		customPrecompiles: [fsPrecompile.precompile()]
	})

	await vm.runScript(
		WriteHelloWorld.write.write(fsPrecompile.address)
	)

	expect(existsSync('test.txt')).toBe(true)

	rmSync('test.txt')
})

