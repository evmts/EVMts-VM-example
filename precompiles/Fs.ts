import fs from 'fs/promises'
import { defineCall, definePrecompile } from './definePrecompile'

import { Fs } from './Fs.sol'
import { Abi, AbiParametersToPrimitiveTypes, ExtractAbiFunction, ExtractAbiFunctionNames } from 'abitype'

type Handler<TAbi extends Abi, TFunctionName extends ExtractAbiFunctionNames<TAbi>> = ((params: {
  gasLimit: bigint
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<TAbi, TFunctionName>['inputs']
  >
}) => Promise<{
  executionGasUsed: bigint,
  returnValue: AbiParametersToPrimitiveTypes<ExtractAbiFunction<TAbi, TFunctionName>['outputs']>[0],
  // TODO expose the ability to emit logs from precompiles
  // logs: ExtractEvetLogs<TAbi, TFunctionName>
}>)

export const fsPrecompile = definePrecompile({
  contract: Fs,
  address: "0xf2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2",
  call: defineCall(Fs.abi, {
    readFile: async ({ args }) => {
      return { returnValue: await fs.readFile(...args, 'utf8'), executionGasUsed: 0n }
    },
    writeFile: async ({ args }) => {
      await fs.writeFile(...args)
      return { returnValue: true, executionGasUsed: 0n }
    }
  })
})

