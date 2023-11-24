import { Hex, decodeFunctionData, toHex } from 'viem'
import fs from 'fs/promises'
import { Address } from '@ethereumjs/util'
import { evmtsContractFactory } from '@evmts/core'

export class Fs {
  public static readonly address = "0xf2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2"
  private static readonly ethjsAddress = Address.fromString(Fs.address)

  // TODO write this is as a solidity interface and import it instead of hardcoding the evmts contract
  // e.g. this should be `import { Fs } from '@evmts/precompiles/Fs.sol'` 
  public static readonly contract = evmtsContractFactory({
    humanReadableAbi: [
      "function readFile(string path) view returns (string data)",
      "function writeFile(string path, string data)"
    ] as const,
    name: 'Fs',
    bytecode: undefined,
    deployedBytecode: undefined,
  })

  public static readonly precompile = {
    address: Fs.ethjsAddress,
    function: async ({ data }: { data: Uint8Array }) => {
      return ({ returnValue: await Fs.call(toHex(data)), executionGasUsed: 0n })
    },
  }

  private static readonly call = async (data: Hex) => {
    const d = decodeFunctionData({
      abi: Fs.contract.abi,
      data: data,
    })
    if (d.functionName === 'readFile') {
      return Fs[d.functionName](...d.args)
    } else if (d.functionName === 'writeFile') {
      return Fs.writeFile(...d.args)
    } else {
      d satisfies never
      throw new Error('invalid function name')
    }
  }

  private static readonly readFile = (path: string) => {
    return fs.readFile(path, 'utf8')
  }

  private static writeFile = (path: string, data: string) => {
    return fs.writeFile(path, data, 'utf8')
  }
}

